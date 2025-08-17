import { ServerWebSocket } from 'bun';
import { Database, SQLQueryBindings } from 'bun:sqlite';
import crypto from 'crypto';
import { Core_Console_Error } from './lib/ericchase/Core_Console_Error.js';
import { Core_Console_Log } from './lib/ericchase/Core_Console_Log.js';
import { NODE_PATH } from './lib/ericchase/NodePlatform.js';
import { Async_NodePlatform_Path_Is_Directory } from './lib/ericchase/NodePlatform_Path_Is_Directory.js';
import { NodePlatform_PathObject_Relative_Class } from './lib/ericchase/NodePlatform_PathObject_Relative_Class.js';
import { PairRequestBody } from './lib/TokenAPI.js';

const HOMEPAGE: string = '/authenticated/index.html';

interface WebSocketData {}

const PREFERRED_PORT: number = Number.parseInt(process.env.PORT ?? '54321');
Bun.env.PORT = `${PREFERRED_PORT}`;
class SERVER {
  static CreateServer(port: number): Bun.Server {
    const server = Bun.serve({
      hostname: '127.0.0.1',
      port,
      routes: {
        '/': Response.redirect(HOMEPAGE),
        '/api/authentication/pair': {
          async POST(req) {
            return HOOK_RES.Async_CatchInternalServerError(() => HOOK_REQ.Async_PairWithClient(req));
          },
        },
        '/api/authentication/unpair': {
          async POST(req) {
            return HOOK_RES.Async_CatchInternalServerError(() => HOOK_REQ.Async_AuthenticateAccessToken(req, () => HOOK_REQ.Async_UnpairAllClients(req)));
          },
        },
        '/api/authentication/verify': {
          async POST(req) {
            return HOOK_RES.Async_CatchInternalServerError(() => HOOK_REQ.Async_AuthenticateAccessToken(req));
          },
        },
        '/api/websockets/reload': {
          async POST(req, server) {
            return HOOK_RES.Async_CatchInternalServerError(() => {
              server.publish('ws', 'reload');
              return RES.OK();
            });
          },
        },
        '/authenticated/*': (req) => {
          return HOOK_RES.Async_CatchInternalServerError(() =>
            HOOK_REQ.Async_AuthenticateAccessToken(
              req,
              () => SERVER.Async_GetResource(req),
              () => Response.redirect('/pairing.html'),
            ),
          );
        },
        '/*': (req, server) => {
          // websockets upgrade
          if (server.upgrade(req) === true) {
            return undefined;
          }
          return HOOK_RES.Async_CatchInternalServerError(() => {
            return SERVER.Async_GetResource(req);
          });
        },
      },
      fetch() {
        return HOOK_RES.Async_CatchInternalServerError(() => RES.NoContent());
      },
      websocket: {
        close(ws: ServerWebSocket<WebSocketData>, code: number, reason: string) {
          ws.unsubscribe('ws');
        },
        message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
          // server.publish('chat', 'Hello everyone!');
        },
        open(ws: ServerWebSocket<WebSocketData>) {
          ws.subscribe('ws');
        },
        perMessageDeflate: false,
      },
    });
    return server;
  }

  static async Async_GetResource(req: Request): Promise<Response> {
    const req_url = new URL(req.url);
    // Core_Console_Log(`${req.method}      ${req_url.pathname}`);

    const resource_dir_path = NODE_PATH.join('.');
    const request_pathobject = NodePlatform_PathObject_Relative_Class('.', decodeURIComponent(req_url.pathname));
    const resolved_request_path = NODE_PATH.resolve(NODE_PATH.join(resource_dir_path, request_pathobject.join()));

    if (resolved_request_path.startsWith(NODE_PATH.resolve(resource_dir_path)) !== true) {
      // Core_Console_Log('Requested path outside of resource folder.');
      return RES.NotFound();
    }

    if ((await Async_NodePlatform_Path_Is_Directory(resolved_request_path)) === true) {
      return Response.redirect(`${req_url.pathname}${req_url.pathname.endsWith('/') ? '' : '/'}index.html`);
    }

    const file = Bun.file(resolved_request_path);

    if ((await file.exists()) !== true) {
      // Core_Console_Log('Requested path does not exist.');
      return RES.NotFound();
    }

    return HOOK_RES.SetCSP(new Response(file));
  }
  static async Async_StartServer(port: number) {
    try {
      const server = SERVER.CreateServer(port);
      Core_Console_Log('Serving at', `http://127.0.0.1:${server.port}/`);
      Core_Console_Log();
    } catch (error) {
      let code: 'EADDRINUSE' | undefined = undefined;
      if (error !== null && typeof error === 'object') {
        if ('code' in error && error.code === 'EADDRINUSE') code = 'EADDRINUSE';
        if ('message' in error && error.message === `Failed to start server. Is port ${port} in use?`) code = 'EADDRINUSE';
      }
      if (code === 'EADDRINUSE') {
        Core_Console_Log(`%c${code}: %cFailed to start server. Is port ${port} in use?`, 'color:red', 'color:gray');
        Core_Console_Log(`Trying port ${port + 1} next.`);
        setTimeout(() => SERVER.Async_StartServer(port + 1), 0);
        return;
      }
      Core_Console_Log(error);
    }
  }
}

const database = new Database(NODE_PATH.join(import.meta.dir, 'auth.db'), { create: true, strict: true });

class TOKEN_ID {
  static TOKEN_HASH = 'token_hash';
  static CREATED_AT = 'created_at';
  static EXPIRES_AT = 'expires_at';
}
class TOKEN_RECORD {
  [TOKEN_ID.TOKEN_HASH]?: string;
  [TOKEN_ID.CREATED_AT]?: number;
  [TOKEN_ID.EXPIRES_AT]?: number;
  static PARSE(record: TOKEN_RECORD): [string?, number?, number?] {
    return [
      record[TOKEN_ID.TOKEN_HASH] as string | undefined,
      record[TOKEN_ID.CREATED_AT] as number | undefined,
      record[TOKEN_ID.EXPIRES_AT] as number | undefined,
      //
    ];
  }
}
class TOKEN_DB {
  static NOW() {
    return Math.floor(Date.now() / 1000);
  }
}

class ACCESS_TOKEN {
  static TABLE = 'access_tokens';
  static CREATE_TABLE = /* sql */ `
    CREATE TABLE IF NOT EXISTS ${ACCESS_TOKEN.TABLE} (
      ${TOKEN_ID.TOKEN_HASH} TEXT PRIMARY KEY,
      ${TOKEN_ID.CREATED_AT} INTEGER NOT NULL,
      ${TOKEN_ID.EXPIRES_AT} INTEGER NOT NULL
    )
  `;
  static {
    database.run(ACCESS_TOKEN.CREATE_TABLE);
  }
  static Clear() {
    const query = /* sql */ `
      DELETE FROM ${ACCESS_TOKEN.TABLE}
    `;
    database.run(query);
  }
  static GenerateNewAccessToken() {
    const access_token = new ACCESS_TOKEN(crypto.randomBytes(32).toString('hex')); // 64-char hex token
    const created_at = TOKEN_DB.NOW();
    const expires_at = created_at + ACCESS_TOKEN.TTL_SECONDS;
    const query = /* sql */ `
      INSERT OR REPLACE INTO ${ACCESS_TOKEN.TABLE} (${TOKEN_ID.TOKEN_HASH}, ${TOKEN_ID.CREATED_AT}, ${TOKEN_ID.EXPIRES_AT})
      VALUES (?, ?, ?)
    `;
    database.run(query, [access_token.token_hash, created_at, expires_at]);
    return access_token;
  }
  static readonly TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

  access_token: string;
  token_hash: string;
  /** @throws on invalid token structure */
  constructor(access_token: string) {
    if (/^[0-9a-f]{64}$/.test(access_token) !== true) {
      throw 'Invalid Token Structure';
    }
    this.access_token = access_token;
    this.token_hash = crypto.createHash('sha512').update(access_token).digest('hex');
  }
  remove(): void {
    const query = /* sql */ `
      DELETE FROM ${ACCESS_TOKEN.TABLE} WHERE ${TOKEN_ID.TOKEN_HASH} = ?
    `;
    database.run(query, [this.token_hash]);
  }
  verify(): boolean {
    const query = /* sql */ `
      SELECT * FROM ${ACCESS_TOKEN.TABLE} WHERE ${TOKEN_ID.TOKEN_HASH} = ?
    `;
    const [token_hash, _, expires_at] = TOKEN_RECORD.PARSE(database.query<TOKEN_RECORD, SQLQueryBindings[]>(query).get(this.token_hash) ?? {});
    if (token_hash !== undefined) {
      if (expires_at !== undefined && expires_at > TOKEN_DB.NOW()) {
        return true;
      }
      this.remove();
    }
    return false;
  }
}
class PAIRING_TOKEN {
  static current_pairing_token = '';
  static GenerateNewPairingToken() {
    PAIRING_TOKEN.current_pairing_token = crypto.randomBytes(32).toString('hex');
    Core_Console_Log('-');
    Core_Console_Log('Please paste the latest pairing token into the web app when prompted:');
    Core_Console_Log(PAIRING_TOKEN.current_pairing_token);
  }
  static VerifyPairingToken(pairing_token: string): boolean {
    return pairing_token === PAIRING_TOKEN.current_pairing_token;
  }
}

class COOKIE {
  static EncodeKV(key: string, value: string) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }

  readonly kv: Record<string, string | undefined> = {};
  constructor(cookie_header: string | null | undefined) {
    cookie_header ??= undefined;
    if (cookie_header !== undefined) {
      for (const cookie of cookie_header.split(/; */)) {
        const index = cookie.indexOf('=');
        if (index !== -1) {
          const key = decodeURIComponent(cookie.slice(0, index).trim());
          const value = decodeURIComponent(cookie.slice(index + 1).trim());
          this.kv[key] = value;
        }
      }
    }
  }
  get(key: string): string | undefined {
    return this.kv[key];
  }
}

class HOOK_REQ {
  static async Async_AuthenticateAccessToken(req: Bun.BunRequest, authenticated_response_cb?: () => Response | Promise<Response>, unauthorized_response_cb?: () => Response | Promise<Response>): Promise<Response> {
    try {
      const cookie = new COOKIE(req.headers.get('cookie'));
      const access_token = new ACCESS_TOKEN(cookie.get('access_token') ?? '');
      if (access_token.verify() === true) {
        return authenticated_response_cb !== undefined ? authenticated_response_cb() : RES.OK();
      }
    } catch {}
    return HOOK_RES.UnsetAccessCookie(unauthorized_response_cb !== undefined ? await unauthorized_response_cb() : RES.Unauthorized());
  }
  static async Async_PairWithClient(req: Bun.BunRequest): Promise<Response> {
    const { pairing_token }: PairRequestBody = await req.json();
    if (typeof pairing_token === 'string') {
      if (PAIRING_TOKEN.VerifyPairingToken(pairing_token) === true) {
        PAIRING_TOKEN.GenerateNewPairingToken();
        const { access_token } = ACCESS_TOKEN.GenerateNewAccessToken();
        return HOOK_RES.SetAccessCookie(RES.OK(), access_token);
      }
    }
    return HOOK_RES.UnsetAccessCookie(RES.Unauthorized());
  }
  static async Async_UnpairAllClients(req: Bun.BunRequest): Promise<Response> {
    const cookie = new COOKIE(req.headers.get('cookie'));
    const access_token = new ACCESS_TOKEN(cookie.get('access_token') ?? '');
    access_token.remove;
    return HOOK_RES.UnsetAccessCookie(RES.OK());
  }
}
class HOOK_RES {
  static async Async_CatchInternalServerError(response_cb: () => Response | Promise<Response>): Promise<Response> {
    try {
      return HOOK_RES.SetCacheNoStore(await response_cb());
    } catch (error) {
      Core_Console_Error('Internal Server Error');
      Core_Console_Error(error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  static UnsetAccessCookie(res: Response): Response {
    res.headers.append('Set-Cookie', `${COOKIE.EncodeKV('access_token', '')}; HttpOnly; Max-Age=0; Path=/; SameSite=Strict; Secure;`);
    return res;
  }
  static SetAccessCookie(res: Response, access_token: string): Response {
    res.headers.append('Set-Cookie', `${COOKIE.EncodeKV('access_token', access_token)}; HttpOnly; Max-Age=${ACCESS_TOKEN.TTL_SECONDS}; Path=/; SameSite=Strict; Secure;`);
    return res;
  }
  static SetCacheNoStore(res: Response): Response {
    res.headers.append('Cache-Control', 'no-store');
    res.headers.append('Expires', '0');
    res.headers.append('Pragma', 'no-cache');
    return res;
  }
  static SetCSP(res: Response): Response {
    res.headers.append('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none';");
    return res;
  }
}
class RES {
  static NoContent() {
    return new Response('No Content', { status: 204 });
  }
  static NotFound() {
    return new Response('Not Found', { status: 404 });
  }
  static OK() {
    return new Response('OK', { status: 200 });
  }
  static OK_JSON(data: any) {
    return Response.json(data, { status: 200 });
  }
  static Unauthorized() {
    return new Response('Unauthorized', { status: 401 });
  }
}

await SERVER.Async_StartServer(PREFERRED_PORT);
PAIRING_TOKEN.GenerateNewPairingToken();

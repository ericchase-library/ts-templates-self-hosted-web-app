// @bun
// src/server.module.ts
import { Database } from 'bun:sqlite';
import crypto from 'crypto';

// src/lib/ericchase/Core_Console_Error.ts
function Core_Console_Error(...items) {
  console['error'](...items);
}

// src/lib/ericchase/Core_Console_Log.ts
function Core_Console_Log(...items) {
  console['log'](...items);
}

// src/lib/ericchase/NodePlatform.ts
import { default as NODE_FS } from 'fs/promises';
import { default as NODE_PATH } from 'path';

// src/lib/ericchase/NodePlatform_Path_Is_Directory.ts
async function Async_NodePlatform_Path_Is_Directory(path) {
  path = NODE_PATH.normalize(path);
  try {
    return (await NODE_FS.lstat(path)).isDirectory();
  } catch (error) {}
  return false;
}

// src/lib/ericchase/NodePlatform_PathObject_Relative_Class.ts
class Class_NodePlatform_PathObject_Relative_Class {
  os;
  dir = '';
  name = '';
  ext = '';
  os_api;
  constructor(os) {
    this.os = os;
    if (os === 'win32') {
      this.os_api = NODE_PATH.win32;
    } else {
      this.os_api = NODE_PATH.posix;
    }
  }
  overwrite(...pathlike) {
    if (pathlike.filter((segment) => segment.length > 0).length > 0) {
      const { root, dir, name, ext } = this.os_api.parse(this.os_api.join(...pathlike.filter((item) => item.length > 0)));
      if (root !== '') {
        throw new Error(`The computed path for "${pathlike}" is not considered a relative path for ${this.os} and may not be used in a ${this.os} relative path object.`);
      }
      this.dir = dir;
      this.name = name;
      this.ext = ext;
    } else {
      this.dir = '';
      this.name = '';
      this.ext = '';
    }
    return this;
  }
  join(options) {
    options ??= {};
    options.dot ??= false;
    options.slash ??= false;
    const segments = this.split();
    if (segments[0] === '.' || segments[0] === '..') {
      options.dot = false;
    }
    if (options.slash === true) {
      return (options.dot === true ? '.' + (this.os === 'win32' ? '\\' : '/') : '') + this.os_api.join(...this.split()) + (this.os === 'win32' ? '\\' : '/');
    }
    return (options.dot === true ? '.' + (this.os === 'win32' ? '\\' : '/') : '') + this.os_api.join(...this.split());
  }
  split() {
    const out = [...this.dir.split(this.os === 'win32' ? '\\' : '/'), this.name + this.ext].filter((segment) => segment.length > 0);
    if (out.length === 0) {
      return ['.'];
    }
    return out;
  }
  push(...pathlike) {
    this.overwrite(...this.split(), ...pathlike);
    return this;
  }
  pop(count = 1) {
    if (count <= 0) {
      return [];
    }
    const segments = this.split();
    if (count > segments.length) {
      count = segments.length;
    }
    const removed = [];
    for (let i = 0; i < count; i++) {
      const segment = segments.pop();
      if (segment !== undefined) {
        removed.unshift(segment);
      }
    }
    this.overwrite(...segments);
    return removed;
  }
  unshift(...pathlike) {
    this.overwrite(...pathlike, ...this.split());
    return this;
  }
  shift(count = 1) {
    if (count <= 0) {
      return [];
    }
    const segments = this.split();
    if (count > segments.length) {
      count = segments.length;
    }
    const removed = [];
    for (let i = 0; i < count; i++) {
      const segment = segments.shift();
      if (segment !== undefined) {
        removed.push(segment);
      }
    }
    this.overwrite(...segments);
    return removed;
  }
  slice(start, end) {
    return new Class_NodePlatform_PathObject_Relative_Class(this.os).overwrite(...this.split().slice(start, end));
  }
  replaceExt(ext) {
    if (ext.length > 0) {
      this.ext = ext[0] === '.' ? ext : '.' + ext;
    } else {
      this.ext = '';
    }
    return this;
  }
  toPosix() {
    if (this.os === 'win32') {
      return NodePlatform_PathObject_Relative_Posix_Class(...this.split());
    } else {
      return this;
    }
  }
  toWin32() {
    if (this.os === 'win32') {
      return this;
    } else {
      return NodePlatform_PathObject_Relative_Win32_Class(...this.split());
    }
  }
}
function NodePlatform_PathObject_Relative_Class(...pathlike) {
  return new Class_NodePlatform_PathObject_Relative_Class(process.platform === 'win32' ? 'win32' : 'posix').overwrite(...pathlike);
}
function NodePlatform_PathObject_Relative_Posix_Class(...pathlike) {
  return new Class_NodePlatform_PathObject_Relative_Class('posix').overwrite(...pathlike);
}
function NodePlatform_PathObject_Relative_Win32_Class(...pathlike) {
  return new Class_NodePlatform_PathObject_Relative_Class('win32').overwrite(...pathlike);
}

// src/server.module.ts
var HOMEPAGE = '/authenticated/index.html';
var CSP_DIRECTIVES = {
  'default-src': 'none',
  'script-src': 'self',
  'style-src': 'self',
  'img-src': 'self',
  'font-src': 'self',
  'connect-src': 'self',
  'media-src': 'self',
  'worker-src': 'self',
  'manifest-src': 'self',
  'form-action': 'self',
  'object-src': 'none',
  'base-uri': 'none',
  'frame-ancestors': 'none',
};
var PREFERRED_PORT = Number.parseInt(process.env.PORT ?? '54321');
Bun.env.PORT = `${PREFERRED_PORT}`;

class SERVER {
  static CreateServer(port) {
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
          async POST(req, server2) {
            return HOOK_RES.Async_CatchInternalServerError(() => {
              server2.publish('ws', 'reload');
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
        '/*': (req, server2) => {
          if (server2.upgrade(req) === true) {
            return;
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
        close(ws, code, reason) {
          ws.unsubscribe('ws');
        },
        message(ws, message) {},
        open(ws) {
          ws.subscribe('ws');
        },
        perMessageDeflate: false,
      },
    });
    return server;
  }
  static async Async_GetResource(req) {
    const req_url = new URL(req.url);
    const resource_dir_path = NODE_PATH.join('.');
    const request_pathobject = NodePlatform_PathObject_Relative_Class('.', decodeURIComponent(req_url.pathname));
    const resolved_request_path = NODE_PATH.resolve(NODE_PATH.join(resource_dir_path, request_pathobject.join()));
    if (resolved_request_path.startsWith(NODE_PATH.resolve(resource_dir_path)) !== true) {
      return RES.NotFound();
    }
    if ((await Async_NodePlatform_Path_Is_Directory(resolved_request_path)) === true) {
      return Response.redirect(`${req_url.pathname}${req_url.pathname.endsWith('/') ? '' : '/'}index.html`);
    }
    const file = Bun.file(resolved_request_path);
    if ((await file.exists()) !== true) {
      return RES.NotFound();
    }
    return HOOK_RES.SetCSP(new Response(file));
  }
  static async Async_StartServer(port) {
    try {
      const server = SERVER.CreateServer(port);
      Core_Console_Log('Serving at', `http://127.0.0.1:${server.port}/`);
      Core_Console_Log();
    } catch (error) {
      let code = undefined;
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
var database = new Database(NODE_PATH.join(import.meta.dir, 'auth.db'), { create: true, strict: true });

class TOKEN_ID {
  static TOKEN_HASH = 'token_hash';
  static CREATED_AT = 'created_at';
  static EXPIRES_AT = 'expires_at';
}

class TOKEN_RECORD {
  [TOKEN_ID.TOKEN_HASH];
  [TOKEN_ID.CREATED_AT];
  [TOKEN_ID.EXPIRES_AT];
  static PARSE(record) {
    return [record[TOKEN_ID.TOKEN_HASH], record[TOKEN_ID.CREATED_AT], record[TOKEN_ID.EXPIRES_AT]];
  }
}

class TOKEN_DB {
  static NOW() {
    return Math.floor(Date.now() / 1000);
  }
}

class ACCESS_TOKEN {
  static TABLE = 'access_tokens';
  static CREATE_TABLE = `
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
    const query = `
      DELETE FROM ${ACCESS_TOKEN.TABLE}
    `;
    database.run(query);
  }
  static GenerateNewAccessToken() {
    const access_token = new ACCESS_TOKEN(crypto.randomBytes(32).toString('hex'));
    const created_at = TOKEN_DB.NOW();
    const expires_at = created_at + ACCESS_TOKEN.TTL_SECONDS;
    const query = `
      INSERT OR REPLACE INTO ${ACCESS_TOKEN.TABLE} (${TOKEN_ID.TOKEN_HASH}, ${TOKEN_ID.CREATED_AT}, ${TOKEN_ID.EXPIRES_AT})
      VALUES (?, ?, ?)
    `;
    database.run(query, [access_token.token_hash, created_at, expires_at]);
    return access_token;
  }
  static TTL_SECONDS = 30 * 24 * 60 * 60;
  access_token;
  token_hash;
  constructor(access_token) {
    if (/^[0-9a-f]{64}$/.test(access_token) !== true) {
      throw 'Invalid Token Structure';
    }
    this.access_token = access_token;
    this.token_hash = crypto.createHash('sha512').update(access_token).digest('hex');
  }
  remove() {
    const query = `
      DELETE FROM ${ACCESS_TOKEN.TABLE} WHERE ${TOKEN_ID.TOKEN_HASH} = ?
    `;
    database.run(query, [this.token_hash]);
  }
  verify() {
    const query = `
      SELECT * FROM ${ACCESS_TOKEN.TABLE} WHERE ${TOKEN_ID.TOKEN_HASH} = ?
    `;
    const [token_hash, _, expires_at] = TOKEN_RECORD.PARSE(database.query(query).get(this.token_hash) ?? {});
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
  static VerifyPairingToken(pairing_token) {
    return pairing_token === PAIRING_TOKEN.current_pairing_token;
  }
}

class COOKIE {
  static EncodeKV(key, value) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
  kv = {};
  constructor(cookie_header) {
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
  get(key) {
    return this.kv[key];
  }
}

class HOOK_REQ {
  static async Async_AuthenticateAccessToken(req, authenticated_response_cb, unauthorized_response_cb) {
    try {
      const cookie = new COOKIE(req.headers.get('cookie'));
      const access_token = new ACCESS_TOKEN(cookie.get('access_token') ?? '');
      if (access_token.verify() === true) {
        return authenticated_response_cb !== undefined ? authenticated_response_cb() : RES.OK();
      }
    } catch {}
    return HOOK_RES.UnsetAccessCookie(unauthorized_response_cb !== undefined ? await unauthorized_response_cb() : RES.Unauthorized());
  }
  static async Async_PairWithClient(req) {
    const { pairing_token } = await req.json();
    if (typeof pairing_token === 'string') {
      if (PAIRING_TOKEN.VerifyPairingToken(pairing_token) === true) {
        PAIRING_TOKEN.GenerateNewPairingToken();
        const { access_token } = ACCESS_TOKEN.GenerateNewAccessToken();
        return HOOK_RES.SetAccessCookie(RES.OK(), access_token);
      }
    }
    return HOOK_RES.UnsetAccessCookie(RES.Unauthorized());
  }
  static async Async_UnpairAllClients(req) {
    const cookie = new COOKIE(req.headers.get('cookie'));
    const access_token = new ACCESS_TOKEN(cookie.get('access_token') ?? '');
    access_token.remove;
    return HOOK_RES.UnsetAccessCookie(RES.OK());
  }
}

class HOOK_RES {
  static async Async_CatchInternalServerError(response_cb) {
    try {
      return HOOK_RES.SetCacheNoStore(await response_cb());
    } catch (error) {
      Core_Console_Error('Internal Server Error');
      Core_Console_Error(error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  static UnsetAccessCookie(res) {
    res.headers.append('Set-Cookie', `${COOKIE.EncodeKV('access_token', '')}; HttpOnly; Max-Age=0; Path=/; SameSite=Strict; Secure;`);
    return res;
  }
  static SetAccessCookie(res, access_token) {
    res.headers.append('Set-Cookie', `${COOKIE.EncodeKV('access_token', access_token)}; HttpOnly; Max-Age=${ACCESS_TOKEN.TTL_SECONDS}; Path=/; SameSite=Strict; Secure;`);
    return res;
  }
  static SetCacheNoStore(res) {
    res.headers.append('Cache-Control', 'no-store');
    res.headers.append('Expires', '0');
    res.headers.append('Pragma', 'no-cache');
    return res;
  }
  static CSP = '';
  static SetCSP(res) {
    res.headers.append('Content-Security-Policy', HOOK_RES.CSP);
    return res;
  }
  static {
    for (const [key, value] of Object.entries(CSP_DIRECTIVES)) {
      HOOK_RES.CSP += `${key} '${value}'; `;
    }
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
  static OK_JSON(data) {
    return Response.json(data, { status: 200 });
  }
  static Unauthorized() {
    return new Response('Unauthorized', { status: 401 });
  }
}
await SERVER.Async_StartServer(PREFERRED_PORT);
PAIRING_TOKEN.GenerateNewPairingToken();

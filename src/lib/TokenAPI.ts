import { Async_AcquireClientMutex } from './ClientMutex.js';
import { Core_Console_Error } from './ericchase/Core_Console_Error.js';

export interface PairRequestBody {
  pairing_token: string;
}
export interface PairResponseBody {
  refresh_token: string;
}
export interface UnpairRequestBody {
  refresh_token: string;
}

export async function Async_MutexFetch(request_fn: () => Promise<Response>, response_cb: (response: Response) => Promise<void>): Promise<void> {
  const { release } = await Async_AcquireClientMutex();
  await response_cb(await request_fn());
  await release();
}

export async function Async_PairClientWithServer({ pairing_token }: PairRequestBody): Promise<Response> {
  return await fetch(`${window.location.origin}/api/authentication/pair`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pairing_token } as PairRequestBody),
  });
}
export async function Async_UnpairAllClientsFromServer(): Promise<Response> {
  return await fetch(`${window.location.origin}/api/authentication/unpair`, {
    method: 'POST',
  });
}
export async function Async_VerifyAuthentication(): Promise<Response> {
  return await fetch(`${window.location.origin}/api/authentication/verify`, {
    method: 'POST',
  });
}

export async function Async_UnpairAndReload() {
  try {
    await Async_MutexFetch(
      () => Async_UnpairAllClientsFromServer(),
      async (response) => {
        switch (response.status) {
          case 200:
            window.location.reload();
            break;
          default:
            Core_Console_Error(await response.text());
            break;
        }
      },
    );
  } catch (error: any) {
    Core_Console_Error(error);
  }
}

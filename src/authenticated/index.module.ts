import { Core_Console_Error } from '../lib/ericchase/Core_Console_Error.js';
import { Async_WebPlatform_DOM_ReadyState_Callback } from '../lib/ericchase/WebPlatform_DOM_ReadyState_Callback.js';
import { WebPlatform_Node_Reference_Class } from '../lib/ericchase/WebPlatform_Node_Reference_Class.js';
import { HotRefresh } from '../lib/server/HotRefresh.js';
import { Async_MutexFetch, Async_UnpairAllClientsFromServer } from '../lib/TokenAPI.js';

HotRefresh();

const button_unpair = WebPlatform_Node_Reference_Class(document.getElementById('unpair')).as(HTMLButtonElement);

await Async_WebPlatform_DOM_ReadyState_Callback({
  async load() {
    button_unpair.addEventListener('click', async_unpair);
  },
});

async function async_unpair() {
  try {
    await Async_MutexFetch(
      () => Async_UnpairAllClientsFromServer(),
      async (response) => {
        switch (response.status) {
          case 200:
            window.location.href = '/';
            break;
          default:
            Core_Console_Error(await response.text());
        }
      },
    );
  } catch (error: any) {
    Core_Console_Error(error);
  }
}

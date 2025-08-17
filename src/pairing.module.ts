import { Async_DeleteMutexDatabase } from './lib/ClientMutex.js';
import { Core_Console_Error } from './lib/ericchase/Core_Console_Error.js';
import { Async_WebPlatform_DOM_ReadyState_Callback } from './lib/ericchase/WebPlatform_DOM_ReadyState_Callback.js';
import { WebPlatform_Node_Reference_Class } from './lib/ericchase/WebPlatform_Node_Reference_Class.js';
import { Async_MutexFetch, Async_PairClientWithServer, Async_VerifyAuthentication } from './lib/TokenAPI.js';

switch ((await Async_VerifyAuthentication()).status) {
  case 200:
    window.location.href = './authenticated/index.html';
    break;
  default:
    document.body.classList.remove('hidden');
    try {
      await Async_DeleteMutexDatabase();
    } catch (error) {
      Core_Console_Error(error);
    }
    break;
}

const div_result = WebPlatform_Node_Reference_Class(document.getElementById('result')).as(HTMLDivElement);
const form = WebPlatform_Node_Reference_Class(document.getElementById('form')).as(HTMLFormElement);
const input_token = WebPlatform_Node_Reference_Class(document.getElementById('token')).as(HTMLInputElement);

await Async_WebPlatform_DOM_ReadyState_Callback({
  async load() {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await async_form_submit_handler();
    });
  },
});

async function async_form_submit_handler() {
  try {
    await Async_MutexFetch(
      () => Async_PairClientWithServer({ pairing_token: input_token.value.trim() }),
      async (response) => {
        switch (response.status) {
          case 200:
            window.location.href = './authenticated/index.html';
            break;
          default:
            div_result.textContent = await response.text();
            break;
        }
      },
    );
  } catch (error: any) {
    div_result.textContent = error.message;
  }
}

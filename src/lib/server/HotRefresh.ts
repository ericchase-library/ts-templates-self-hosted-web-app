import { Core_Console_Error } from '../ericchase/Core_Console_Error.js';
import { SERVER_HOST } from './constants.js';

export function HotRefresh(serverhost?: string): CHotRefresh | undefined {
  try {
    const hotrefresh = new CHotRefresh(serverhost);
    hotrefresh.startup();
    return hotrefresh;
  } catch (error) {
    Core_Console_Error(error);
  }
}

class CHotRefresh {
  socket?: WebSocket;
  methods = {
    onClose: (event: CloseEvent) => {
      this.cleanup();
    },
    onError: (event: Event) => {
      this.cleanup();
    },
    onMessage: async (event: MessageEvent<any>) => {
      if (event.data === 'reload') {
        this.socket?.close();
        setTimeout(async_reloadOnServerRestart, 100);
      }
    },
  };
  constructor(readonly serverhost?: string) {
    this.serverhost ??= SERVER_HOST;
  }
  cleanup() {
    if (this.socket) {
      this.socket.removeEventListener('close', this.methods.onClose);
      this.socket.removeEventListener('error', this.methods.onError);
      this.socket.removeEventListener('message', this.methods.onMessage);
      this.socket = undefined;
    }
  }
  startup() {
    this.socket = new WebSocket(`ws://${this.serverhost}/`);
    if (this.socket) {
      this.socket.addEventListener('close', this.methods.onClose);
      this.socket.addEventListener('error', this.methods.onError);
      this.socket.addEventListener('message', this.methods.onMessage);
    }
  }
}

async function async_reloadOnServerRestart() {
  try {
    await fetch('http://127.0.0.1:54321/');
    window.location.reload();
  } catch {
    setTimeout(async_reloadOnServerRestart, 100);
  }
}

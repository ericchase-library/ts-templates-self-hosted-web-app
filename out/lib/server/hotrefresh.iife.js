(() => {

// src/lib/ericchase/Core_Console_Error.ts
function Core_Console_Error(...items) {
  console["error"](...items);
}

// src/lib/server/constants.ts
var SERVER_HOST = "127.0.0.1:54321";

// src/lib/server/HotRefresh.ts
function HotRefresh(serverhost) {
  try {
    const hotrefresh = new CHotRefresh(serverhost);
    hotrefresh.startup();
    return hotrefresh;
  } catch (error) {
    Core_Console_Error(error);
  }
}

class CHotRefresh {
  serverhost;
  socket;
  methods = {
    onClose: (event) => {
      this.cleanup();
    },
    onError: (event) => {
      this.cleanup();
    },
    onMessage: async (event) => {
      if (event.data === "reload") {
        this.socket?.close();
        setTimeout(async_reloadOnServerRestart, 100);
      }
    }
  };
  constructor(serverhost) {
    this.serverhost = serverhost;
    this.serverhost ??= SERVER_HOST;
  }
  cleanup() {
    if (this.socket) {
      this.socket.removeEventListener("close", this.methods.onClose);
      this.socket.removeEventListener("error", this.methods.onError);
      this.socket.removeEventListener("message", this.methods.onMessage);
      this.socket = undefined;
    }
  }
  startup() {
    this.socket = new WebSocket(`ws://${this.serverhost}/`);
    if (this.socket) {
      this.socket.addEventListener("close", this.methods.onClose);
      this.socket.addEventListener("error", this.methods.onError);
      this.socket.addEventListener("message", this.methods.onMessage);
    }
  }
}
async function async_reloadOnServerRestart() {
  try {
    await fetch("http://127.0.0.1:54321/");
    window.location.reload();
  } catch {
    setTimeout(async_reloadOnServerRestart, 100);
  }
}

// src/lib/server/hotrefresh.iife.ts
HotRefresh();

})();

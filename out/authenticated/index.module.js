// src/lib/ericchase/Core_Console_Error.ts
function Core_Console_Error(...items) {
  console["error"](...items);
}

// src/lib/ericchase/WebPlatform_DOM_ReadyState_Callback.ts
async function Async_WebPlatform_DOM_ReadyState_Callback(config) {
  async function DOMContentLoaded() {
    removeEventListener("DOMContentLoaded", DOMContentLoaded);
    await config.DOMContentLoaded?.();
  }
  async function load() {
    removeEventListener("load", load);
    await config.load?.();
  }
  switch (document.readyState) {
    case "loading":
      if (config.DOMContentLoaded !== undefined) {
        addEventListener("DOMContentLoaded", DOMContentLoaded);
      }
      if (config.load !== undefined) {
        addEventListener("load", load);
      }
      break;
    case "interactive":
      await config.DOMContentLoaded?.();
      if (config.load !== undefined) {
        addEventListener("load", load);
      }
      break;
    case "complete":
      await config.DOMContentLoaded?.();
      await config.load?.();
      break;
  }
}

// src/lib/ericchase/WebPlatform_Node_Reference_Class.ts
class Class_WebPlatform_Node_Reference_Class {
  node;
  constructor(node) {
    this.node = node;
  }
  as(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
    throw new TypeError(`Reference node ${this.node} is not ${constructor_ref}`);
  }
  is(constructor_ref) {
    return this.node instanceof constructor_ref;
  }
  passAs(constructor_ref, fn) {
    if (this.node instanceof constructor_ref) {
      fn(this.node);
    }
  }
  tryAs(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
  }
  get classList() {
    return this.as(HTMLElement).classList;
  }
  get className() {
    return this.as(HTMLElement).className;
  }
  get style() {
    return this.as(HTMLElement).style;
  }
  getAttribute(qualifiedName) {
    return this.as(HTMLElement).getAttribute(qualifiedName);
  }
  setAttribute(qualifiedName, value) {
    this.as(HTMLElement).setAttribute(qualifiedName, value);
  }
  getStyleProperty(property) {
    return this.as(HTMLElement).style.getPropertyValue(property);
  }
  setStyleProperty(property, value, priority) {
    this.as(HTMLElement).style.setProperty(property, value, priority);
  }
}
function WebPlatform_Node_Reference_Class(node) {
  return new Class_WebPlatform_Node_Reference_Class(node);
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

// src/lib/ClientMutex.ts
var DATABASE_NAME = "ClientMutex";
var STORE_NAME = "lock";
async function Async_AcquireClientMutex() {
  const database = await new Promise((resolve, reject) => {
    const open_request = indexedDB.open(DATABASE_NAME, 1);
    open_request.onupgradeneeded = () => {
      return open_request.result.createObjectStore(STORE_NAME);
    };
    open_request.onsuccess = () => {
      if (open_request.result instanceof IDBDatabase) {
        resolve(open_request.result);
      } else {
        reject(new Error(`Failed to open the "${DATABASE_NAME}" IndexedDB database.`));
      }
    };
    open_request.onerror = () => {
      return reject(open_request.error);
    };
  });
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(Date.now(), STORE_NAME);
    transaction.oncomplete = () => {
      return resolve({
        release: () => {
          return new Promise((resolve2, reject2) => {
            const transaction2 = database.transaction(STORE_NAME, "readwrite");
            transaction2.objectStore(STORE_NAME).delete(STORE_NAME);
            transaction2.oncomplete = () => {
              return resolve2();
            };
            transaction2.onerror = () => {
              return reject2(transaction2.error ?? new Error(`Failed to acquire the "${DATABASE_NAME}" lock.`));
            };
          });
        }
      });
    };
    transaction.onerror = () => {
      return reject(transaction.error ?? new Error(`Failed to acquire the "${DATABASE_NAME}" lock.`));
    };
  });
}

// src/lib/TokenAPI.ts
async function Async_MutexFetch(request_fn, response_cb) {
  const { release } = await Async_AcquireClientMutex();
  await response_cb(await request_fn());
  await release();
}
async function Async_UnpairAllClientsFromServer() {
  return await fetch(`${window.location.origin}/api/authentication/unpair`, {
    method: "POST"
  });
}

// src/authenticated/index.module.ts
HotRefresh();
var button_unpair = WebPlatform_Node_Reference_Class(document.getElementById("unpair")).as(HTMLButtonElement);
await Async_WebPlatform_DOM_ReadyState_Callback({
  async load() {
    button_unpair.addEventListener("click", async_unpair);
  }
});
async function async_unpair() {
  try {
    await Async_MutexFetch(() => Async_UnpairAllClientsFromServer(), async (response) => {
      switch (response.status) {
        case 200:
          window.location.href = "/";
          break;
        default:
          Core_Console_Error(await response.text());
      }
    });
  } catch (error) {
    Core_Console_Error(error);
  }
}

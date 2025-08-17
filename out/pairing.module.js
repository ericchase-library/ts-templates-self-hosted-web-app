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
async function Async_DeleteMutexDatabase() {
  await new Promise((resolve, reject) => {
    const delete_request = indexedDB.deleteDatabase(DATABASE_NAME);
    delete_request.onsuccess = function() {
      resolve();
    };
    delete_request.onerror = function() {
      reject(delete_request.error);
    };
    delete_request.onblocked = function() {
      reject("Deletion blocked.");
    };
  });
}

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

// src/lib/TokenAPI.ts
async function Async_MutexFetch(request_fn, response_cb) {
  const { release } = await Async_AcquireClientMutex();
  await response_cb(await request_fn());
  await release();
}
async function Async_PairClientWithServer({ pairing_token }) {
  return await fetch(`${window.location.origin}/api/authentication/pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pairing_token })
  });
}
async function Async_VerifyAuthentication() {
  return await fetch(`${window.location.origin}/api/authentication/verify`, {
    method: "POST"
  });
}

// src/pairing.module.ts
switch ((await Async_VerifyAuthentication()).status) {
  case 200:
    window.location.href = "./authenticated/index.html";
    break;
  default:
    document.body.classList.remove("hidden");
    try {
      await Async_DeleteMutexDatabase();
    } catch (error) {
      Core_Console_Error(error);
    }
    break;
}
var div_result = WebPlatform_Node_Reference_Class(document.getElementById("result")).as(HTMLDivElement);
var form = WebPlatform_Node_Reference_Class(document.getElementById("form")).as(HTMLFormElement);
var input_token = WebPlatform_Node_Reference_Class(document.getElementById("token")).as(HTMLInputElement);
await Async_WebPlatform_DOM_ReadyState_Callback({
  async load() {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await async_form_submit_handler();
    });
  }
});
async function async_form_submit_handler() {
  try {
    await Async_MutexFetch(() => Async_PairClientWithServer({ pairing_token: input_token.value.trim() }), async (response) => {
      switch (response.status) {
        case 200:
          window.location.href = "./authenticated/index.html";
          break;
        default:
          div_result.textContent = await response.text();
          break;
      }
    });
  } catch (error) {
    div_result.textContent = error.message;
  }
}

const DATABASE_NAME = 'ClientMutex';
const STORE_NAME = 'lock';

export async function Async_AcquireClientMutex(): Promise<{ release: () => Promise<void> }> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
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
  return new Promise<{ release: () => Promise<void> }>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(Date.now(), STORE_NAME);
    transaction.oncomplete = () => {
      return resolve({
        release: () => {
          return new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).delete(STORE_NAME);
            transaction.oncomplete = () => {
              return resolve();
            };
            transaction.onerror = () => {
              return reject(transaction.error ?? new Error(`Failed to acquire the "${DATABASE_NAME}" lock.`));
            };
          });
        },
      });
    };
    transaction.onerror = () => {
      return reject(transaction.error ?? new Error(`Failed to acquire the "${DATABASE_NAME}" lock.`));
    };
  });
}

export async function Async_DeleteMutexDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const delete_request = indexedDB.deleteDatabase(DATABASE_NAME);
    delete_request.onsuccess = function () {
      resolve();
    };
    delete_request.onerror = function () {
      reject(delete_request.error);
    };
    delete_request.onblocked = function () {
      reject('Deletion blocked.');
    };
  });
}

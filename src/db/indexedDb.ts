const DB_NAME = 'family-planner-sqlite';
const STORE_NAME = 'database';
const DB_KEY = 'sqlite';

function openStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, mode);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      resolve(tx.objectStore(STORE_NAME));
    };
  });
}

export async function loadDatabaseFile(): Promise<Uint8Array | null> {
  const store = await openStore('readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(DB_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const value = request.result as ArrayBuffer | Uint8Array | undefined;
      if (!value) {
        resolve(null);
        return;
      }
      resolve(value instanceof Uint8Array ? value : new Uint8Array(value));
    };
  });
}

export async function saveDatabaseFile(data: Uint8Array): Promise<void> {
  const store = await openStore('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(data, DB_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

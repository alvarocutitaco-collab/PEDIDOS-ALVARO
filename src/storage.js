const DB_NAME = 'pedidos-alvaro-db';
const DB_VERSION = 1;
const SHORTAGES_STORE = 'shortages';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SHORTAGES_STORE)) {
        const store = db.createObjectStore(SHORTAGES_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('urgency', 'urgency');
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('createdBy', 'createdBy');
        store.createIndex('productId', 'productId');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SHORTAGES_STORE, mode);
    const store = transaction.objectStore(SHORTAGES_STORE);
    const result = callback(store);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllShortages() {
  const db = await openDatabase();
  const transaction = db.transaction(SHORTAGES_STORE, 'readonly');
  const store = transaction.objectStore(SHORTAGES_STORE);
  const rows = await requestToPromise(store.getAll());
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function saveShortage(shortage) {
  await withStore('readwrite', store => store.put(shortage));
  return shortage;
}

async function updateShortage(id, patch) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SHORTAGES_STORE, 'readwrite');
    const store = transaction.objectStore(SHORTAGES_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const current = getRequest.result;
      if (!current) return reject(new Error(`Faltante no encontrado: ${id}`));
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      store.put(next);
      resolve(next);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function clearShortages() {
  await withStore('readwrite', store => store.clear());
}

export { getAllShortages, saveShortage, updateShortage, clearShortages };

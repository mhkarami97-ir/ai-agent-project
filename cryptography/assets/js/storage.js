(() => {
'use strict';
const DB_NAME = 'CryptoAppDB', STORE = 'history', MAX_ITEMS = 100;
let db = null;
const wrap = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

async function init() {
  if (db) return db;
  db = await new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onerror = () => rej(r.error);
    r.onsuccess = () => res(r.result);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }).createIndex('timestamp', 'timestamp');
    };
  });
  await stripLegacyPlaintext();
  return db;
}

function stripLegacyPlaintext() {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const cur = tx.objectStore(STORE).openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c) return;
      const v = c.value;
      if ('plainText' in v || 'cipherText' in v) { delete v.plainText; delete v.cipherText; c.update(v); }
      c.continue();
    };
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
}

async function save(item) {
  await init();
  const tx = db.transaction(STORE, 'readwrite');
  const s = tx.objectStore(STORE);
  s.add({ displayText: item.displayText, charsets: item.charsets, timestamp: new Date().toISOString() });
  const keys = await wrap(s.getAllKeys());
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ITEMS))) s.delete(k);
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}
async function getAll() {
  await init();
  const all = await wrap(db.transaction(STORE).objectStore(STORE).getAll());
  return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
async function remove(id) {
  await init();
  const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id);
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
async function clear() {
  await init();
  const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).clear();
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
window.storageManager = { init, save, getAll, remove, clear };
})();

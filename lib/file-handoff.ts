// Carries a dropped file from one page to another (homepage → format viewer)
// without re-uploading. IndexedDB rather than sessionStorage: 3MF/STEP files
// are routinely bigger than sessionStorage's ~5 MB quota. One slot, consumed
// on read, so a stale file never reappears.

const DB = "flip3d-handoff";
const STORE = "files";
const KEY = "pending";
const MAX_AGE_MS = 10 * 60 * 1000;

type Pending = { name: string; buffer: ArrayBuffer; at: number };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function stashFile(name: string, buffer: ArrayBuffer): Promise<boolean> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ name, buffer, at: Date.now() } satisfies Pending, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

export async function takeFile(): Promise<{ name: string; buffer: ArrayBuffer } | null> {
  try {
    const db = await open();
    const value = await new Promise<Pending | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const get = store.get(KEY);
      get.onsuccess = () => {
        store.delete(KEY);
        resolve(get.result as Pending | undefined);
      };
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    if (!value || Date.now() - value.at > MAX_AGE_MS) return null;
    return { name: value.name, buffer: value.buffer };
  } catch {
    return null;
  }
}

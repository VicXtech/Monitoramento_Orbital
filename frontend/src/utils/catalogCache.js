const DB_NAME = 'orbital_catalog_cache';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
const TTL_FRESCO_MS = 6 * 60 * 60 * 1000;
const TTL_STALE_MS = 48 * 60 * 60 * 1000;
const MAX_ENTRADAS = 6;

let dbPromise = null;

// Abre ou reutiliza conexao com o banco IndexedDB
function abrirBanco() {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

// Remove registro expirado sem interromper a leitura principal
function removerEntradaSilenciosa(db, chave) {
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(chave);
  } catch {
    // Falha silenciosa em ambiente restrito
  }
}

// Recupera entrada do cache local com indicacao de frescor
export async function lerCacheLocal(chave) {
  try {
    const db = await abrirBanco();
    if (!db) return null;

    const registro = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(chave);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (!registro || typeof registro.savedAt !== 'number') {
      return null;
    }

    const idade = Date.now() - registro.savedAt;
    if (idade > TTL_STALE_MS) {
      removerEntradaSilenciosa(db, chave);
      return null;
    }

    return {
      data: registro.data,
      savedAt: registro.savedAt,
      isFresh: idade <= TTL_FRESCO_MS
    };
  } catch {
    return null;
  }
}

// Grava entrada no cache local e limita o total armazenado
export async function salvarCacheLocal(chave, data) {
  try {
    const db = await abrirBanco();
    if (!db) return;

    await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ key: chave, data, savedAt: Date.now() });

        const countReq = store.count();
        countReq.onsuccess = () => {
          const excedente = countReq.result - MAX_ENTRADAS;
          if (excedente <= 0 || !store.indexNames.contains('savedAt')) return;

          let removidos = 0;
          const cursorReq = store.index('savedAt').openKeyCursor();
          cursorReq.onsuccess = (ev) => {
            const cursor = ev.target.result;
            if (!cursor || removidos >= excedente) return;
            store.delete(cursor.primaryKey);
            removidos += 1;
            cursor.continue();
          };
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Falha silenciosa em modo privado ou quota excedida
  }
}

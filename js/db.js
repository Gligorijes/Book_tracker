// =====================================================
//  db.js — IndexedDB wrapper
//  All database operations live here, nothing else
//  touches the database directly.
// =====================================================

const DB = (() => {
    const DB_NAME    = 'BookTrackerDB';
    const DB_VERSION = 1;
    const STORE      = 'books';

    let _db = null;

    // Opens (or creates) the database, returns a Promise
    function open() {
        return new Promise((resolve, reject) => {
            if (_db) { resolve(_db); return; }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // Runs only when DB is first created or version bumped
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const store = db.createObjectStore(STORE, { keyPath: 'id' });
                    store.createIndex('status',    'status',    { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = (e) => {
                _db = e.target.result;
                resolve(_db);
            };

            request.onerror = (e) => {
                console.error('IndexedDB error:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Helper: wraps an IDB request in a Promise
    function promisify(requestFn) {
        return open().then(db => new Promise((resolve, reject) => {
            const request = requestFn(db);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror   = (e) => reject(e.target.error);
        }));
    }

    // Helper: generate a unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    // ---- Public API ----

    function getAll() {
        return promisify(db =>
            db.transaction(STORE, 'readonly')
              .objectStore(STORE)
              .getAll()
        );
    }

    function getById(id) {
        return promisify(db =>
            db.transaction(STORE, 'readonly')
              .objectStore(STORE)
              .get(id)
        );
    }

    function create(data) {
        const book = {
            ...data,
            id:        generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return promisify(db =>
            db.transaction(STORE, 'readwrite')
              .objectStore(STORE)
              .add(book)
        ).then(() => book); // return the full object, not just the key
    }

    function update(id, data) {
        return getById(id).then(existing => {
            if (!existing) throw new Error(`Book ${id} not found`);
            const updated = {
                ...existing,
                ...data,
                id,                          // never overwrite id
                createdAt: existing.createdAt, // never overwrite createdAt
                updatedAt: new Date().toISOString()
            };
            return promisify(db =>
                db.transaction(STORE, 'readwrite')
                  .objectStore(STORE)
                  .put(updated)
            ).then(() => updated);
        });
    }

    function remove(id) {
        return promisify(db =>
            db.transaction(STORE, 'readwrite')
              .objectStore(STORE)
              .delete(id)
        );
    }

    function count() {
        return promisify(db =>
            db.transaction(STORE, 'readonly')
              .objectStore(STORE)
              .count()
        );
    }

    // Expose only what the rest of the app needs
    return { getAll, getById, create, update, remove, count };
})();
/**
 * IndexedDB Schema für GMARK Local
 *
 * Datenbanken:
 * - bookmarks: Gespeicherte Bookmarks mit Metadaten
 * - duplicates: Erkannte Duplikate und Merge-Konflikte
 * - cache: Klassifikations- und Summary-Cache
 * - settings: Benutzereinstellungen
 */

const DB_NAME = "gmark-local";
const DB_VERSION = 1;

const STORES = {
  bookmarks: {
    name: "bookmarks",
    keyPath: "id",
    indexes: [
      { name: "url", keyPath: "url", unique: false },
      { name: "urlNormalized", keyPath: "urlNormalized", unique: true },
      { name: "category", keyPath: "category", unique: false },
      { name: "dateAdded", keyPath: "dateAdded", unique: false },
      { name: "lastModified", keyPath: "lastModified", unique: false },
    ],
  },
  duplicates: {
    name: "duplicates",
    keyPath: "id",
    indexes: [
      { name: "primary", keyPath: "primaryId", unique: false },
      { name: "duplicate", keyPath: "duplicateId", unique: false },
      { name: "similarity", keyPath: "similarity", unique: false },
      { name: "status", keyPath: "status", unique: false },
    ],
  },
  cache: {
    name: "cache",
    keyPath: "url",
    indexes: [
      { name: "type", keyPath: "type", unique: false },
      { name: "expires", keyPath: "expires", unique: false },
    ],
  },
  settings: {
    name: "settings",
    keyPath: "key",
    indexes: [],
  },
};

export class StorageManager {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        for (const store of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
            });

            for (const index of store.indexes) {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique,
              });
            }
          }
        }
      };
    });
  }

  async getDB() {
    await this.initPromise;
    return this.db;
  }

  // Bookmarks Operations
  async addBookmark(bookmark) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readwrite");
    const store = tx.objectStore("bookmarks");

    bookmark.id = bookmark.id || crypto.randomUUID();
    bookmark.dateAdded = bookmark.dateAdded || Date.now();
    bookmark.lastModified = Date.now();
    bookmark.urlNormalized = this.normalizeUrl(bookmark.url);

    return new Promise((resolve, reject) => {
      const request = store.add(bookmark);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(bookmark);
    });
  }

  async updateBookmark(id, updates) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readwrite");
    const store = tx.objectStore("bookmarks");

    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const bookmark = getRequest.result;
        if (!bookmark) {
          reject(new Error(`Bookmark ${id} not found`));
          return;
        }

        const updated = {
          ...bookmark,
          ...updates,
          lastModified: Date.now(),
        };

        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getBookmark(id) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readonly");
    const store = tx.objectStore("bookmarks");

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllBookmarks() {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readonly");
    const store = tx.objectStore("bookmarks");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteBookmark(id) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readwrite");
    const store = tx.objectStore("bookmarks");

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async searchBookmarksByCategory(category) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readonly");
    const store = tx.objectStore("bookmarks");
    const index = store.index("category");

    return new Promise((resolve, reject) => {
      const request = index.getAll(category);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getBookmarkByNormalizedUrl(normalizedUrl) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks"], "readonly");
    const store = tx.objectStore("bookmarks");
    const index = store.index("urlNormalized");

    return new Promise((resolve, reject) => {
      const request = index.get(normalizedUrl);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Duplicates Operations
  async recordDuplicate(primaryId, duplicateId, similarity) {
    const db = await this.getDB();
    const tx = db.transaction(["duplicates"], "readwrite");
    const store = tx.objectStore("duplicates");

    const duplicate = {
      id: crypto.randomUUID(),
      primaryId,
      duplicateId,
      similarity,
      status: "pending", // pending, merged, ignored
      dateDetected: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(duplicate);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(duplicate);
    });
  }

  async getPendingDuplicates() {
    const db = await this.getDB();
    const tx = db.transaction(["duplicates"], "readonly");
    const store = tx.objectStore("duplicates");
    const index = store.index("status");

    return new Promise((resolve, reject) => {
      const request = index.getAll("pending");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async mergeDuplicates(primaryId, duplicateId) {
    const db = await this.getDB();
    const tx = db.transaction(["bookmarks", "duplicates"], "readwrite");

    // Delete duplicate
    const bookmarkStore = tx.objectStore("bookmarks");
    bookmarkStore.delete(duplicateId);

    // Mark as merged
    const duplicateStore = tx.objectStore("duplicates");
    const duplicates = await new Promise((resolve, reject) => {
      const request = duplicateStore.index("duplicate").getAll(duplicateId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    for (const dup of duplicates) {
      dup.status = "merged";
      duplicateStore.put(dup);
    }

    return true;
  }

  // Cache Operations
  async setCacheEntry(url, type, data, expiryMs = 24 * 60 * 60 * 1000) {
    const db = await this.getDB();
    const tx = db.transaction(["cache"], "readwrite");
    const store = tx.objectStore("cache");

    const entry = {
      url,
      type,
      data,
      created: Date.now(),
      expires: Date.now() + expiryMs,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(entry);
    });
  }

  async getCacheEntry(url, type) {
    const db = await this.getDB();
    const tx = db.transaction(["cache"], "readonly");
    const store = tx.objectStore("cache");

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        if (entry.type !== type) {
          resolve(null);
          return;
        }

        if (entry.expires < Date.now()) {
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Settings Operations
  async setSetting(key, value) {
    const db = await this.getDB();
    const tx = db.transaction(["settings"], "readwrite");
    const store = tx.objectStore("settings");

    const setting = {
      key,
      value,
      lastModified: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(setting);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(setting);
    });
  }

  async getSetting(key) {
    const db = await this.getDB();
    const tx = db.transaction(["settings"], "readonly");
    const store = tx.objectStore("settings");

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }

  async getAllSettings() {
    const db = await this.getDB();
    const tx = db.transaction(["settings"], "readonly");
    const store = tx.objectStore("settings");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const settings = {};
        for (const item of request.result) {
          settings[item.key] = item.value;
        }
        resolve(settings);
      };
    });
  }

  async deleteSetting(key) {
    const db = await this.getDB();
    const tx = db.transaction(["settings"], "readwrite");
    const store = tx.objectStore("settings");

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  // Utility: URL Normalization
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return (urlObj.hostname + urlObj.pathname + urlObj.search).toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  // Statistics
  async getStatistics() {
    const bookmarks = await this.getAllBookmarks();
    const duplicates = await this.getPendingDuplicates();

    const categories = {};
    for (const bookmark of bookmarks) {
      categories[bookmark.category] = (categories[bookmark.category] || 0) + 1;
    }

    return {
      totalBookmarks: bookmarks.length,
      totalDuplicates: duplicates.length,
      categoriesCount: Object.keys(categories).length,
      categories,
    };
  }

  // Export
  async exportToJSON() {
    const bookmarks = await this.getAllBookmarks();
    const duplicates = await this.getPendingDuplicates();
    const settings = await this.getAllSettings();

    return {
      version: DB_VERSION,
      exported: new Date().toISOString(),
      bookmarks,
      duplicates,
      settings,
    };
  }

  // Import
  async importFromJSON(data) {
    if (data.version !== DB_VERSION) {
      throw new Error("Inkompatible Export-Version");
    }

    for (const bookmark of data.bookmarks) {
      await this.addBookmark(bookmark);
    }

    for (const duplicate of data.duplicates) {
      await this.recordDuplicate(
        duplicate.primaryId,
        duplicate.duplicateId,
        duplicate.similarity
      );
    }

    for (const [key, value] of Object.entries(data.settings)) {
      await this.setSetting(key, value);
    }

    return true;
  }

  // Clear all data
  async clearAll() {
    const db = await this.getDB();

    for (const storeName of Object.keys(STORES)) {
      const tx = db.transaction([storeName], "readwrite");
      const store = tx.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }

    return true;
  }
}

export default new StorageManager();

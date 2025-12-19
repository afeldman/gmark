/**
 * Storage Optimizer
 *
 * Verwaltet Speichernutzung:
 * - Speicherquota-Tracking
 * - Cache-Bereinigung (abgelaufene Einträge)
 * - Content-Optimierung (Screenshots, große Inhalte)
 * - Alte Duplikate löschen
 */

import StorageManager from "./storage.js";

const QUOTA_WARNING_THRESHOLD = 80; // % - Warnung ab 80%
const QUOTA_CRITICAL_THRESHOLD = 95; // % - Kritisch ab 95%
const MAX_CONTENT_SIZE = 5000; // Zeichen
const MAX_CONTENT_SUMMARY_SIZE = 500; // Zeichen

export class StorageOptimizer {
  /**
   * Prüfe Speicherquota und gebe Status zurück
   */
  static async getStorageStatus() {
    try {
      if (!navigator.storage?.estimate) {
        console.warn("⚠️ Storage Quota API nicht verfügbar");
        return null;
      }

      const estimate = await navigator.storage.estimate();
      const usageMB = estimate.usage / 1024 / 1024;
      const quotaMB = estimate.quota / 1024 / 1024;
      const percentage = (estimate.usage / estimate.quota) * 100;

      console.log(
        `📊 Storage: ${usageMB.toFixed(2)}MB / ${quotaMB.toFixed(
          2
        )}MB (${percentage.toFixed(1)}%)`
      );

      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usageMB,
        quotaMB,
        percentage,
        status:
          percentage > QUOTA_CRITICAL_THRESHOLD
            ? "critical"
            : percentage > QUOTA_WARNING_THRESHOLD
            ? "warning"
            : "ok",
      };
    } catch (error) {
      console.error("❌ Fehler beim Prüfen der Speicherquota:", error);
      return null;
    }
  }

  /**
   * Optimiere Speicher, wenn nötig
   */
  static async optimizeIfNeeded() {
    const status = await this.getStorageStatus();

    if (!status) return;

    if (status.status === "critical") {
      console.warn(
        `⚠️ KRITISCH: Speicher zu ${status.percentage.toFixed(1)}% voll`
      );
      await this.performFullCleanup();
    } else if (status.status === "warning") {
      console.warn(
        `⚠️ WARNUNG: Speicher zu ${status.percentage.toFixed(1)}% voll`
      );
      await this.performPartialCleanup();
    }
  }

  /**
   * Teilweises Cleanup (bei Warnung)
   */
  static async performPartialCleanup() {
    console.log("🧹 Starte Partial-Cleanup...");

    const results = {
      cacheDeleted: 0,
      duplicatesDeleted: 0,
      contentOptimized: 0,
      freedMB: 0,
    };

    // Parallelisiere Cache & Duplikat-Cleanup
    console.log("  ⚡ Führe Cache- und Duplikat-Cleanup parallel aus...");
    const [cacheFreed, dupsFreed] = await Promise.all([
      this.cleanupExpiredCache(),
      this.cleanupOldDuplicates(30),
    ]);

    results.cacheDeleted = cacheFreed.deleted;
    results.freedMB += cacheFreed.freedMB;
    results.duplicatesDeleted = dupsFreed.deleted;
    results.freedMB += dupsFreed.freedMB;

    console.log(
      `✅ Partial-Cleanup abgeschlossen: ${results.freedMB.toFixed(
        2
      )}MB freigegeben`
    );
    return results;
  }

  /**
   * Volles Cleanup (kritisch)
   */
  static async performFullCleanup() {
    console.log("🧹 Starte FULL-Cleanup (kritischer Speicher)...");

    const results = {
      cacheDeleted: 0,
      duplicatesDeleted: 0,
      contentOptimized: 0,
      freedMB: 0,
    };

    // Parallelisiere alle 3 Cleanup-Operationen
    console.log(
      "  ⚡ Führe Cache-, Duplikat- und Content-Cleanup parallel aus..."
    );
    const [cacheFreed, dupsFreed, contentFreed] = await Promise.all([
      this.cleanupExpiredCache(),
      this.cleanupOldDuplicates(7),
      this.removeUnnecessaryContent(),
    ]);

    results.cacheDeleted = cacheFreed.deleted;
    results.freedMB += cacheFreed.freedMB;
    results.duplicatesDeleted = dupsFreed.deleted;
    results.freedMB += dupsFreed.freedMB;
    results.contentOptimized = contentFreed.optimized;
    results.freedMB += contentFreed.freedMB;

    console.log(
      `✅ FULL-Cleanup abgeschlossen: ${results.freedMB.toFixed(
        2
      )}MB freigegeben`
    );
    return results;
  }

  /**
   * Lösche abgelaufene Cache-Einträge
   */
  static async cleanupExpiredCache() {
    try {
      console.log("📦 Bereinige abgelaufene Cache-Einträge...");
      const db = await StorageManager.getDB();
      const tx = db.transaction(["cache"], "readwrite");
      const store = tx.objectStore("cache");

      const entries = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      let deleted = 0;
      let freedBytes = 0;

      for (const entry of entries) {
        if (entry.expires < Date.now()) {
          const size = JSON.stringify(entry).length;
          await new Promise((resolve, reject) => {
            const deleteRequest = store.delete(entry.url);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => {
              deleted++;
              freedBytes += size;
              resolve();
            };
          });
        }
      }

      console.log(
        `  ✅ ${deleted} Cache-Einträge gelöscht (${(freedBytes / 1024).toFixed(
          2
        )}KB)`
      );
      return {
        deleted,
        freedMB: freedBytes / 1024 / 1024,
      };
    } catch (error) {
      console.error("❌ Fehler beim Cache-Cleanup:", error);
      return { deleted: 0, freedMB: 0 };
    }
  }

  /**
   * Lösche alte, aufgelöste Duplikate
   */
  static async cleanupOldDuplicates(daysOld = 30) {
    try {
      console.log(`🗑️ Bereinige Duplikate älter als ${daysOld} Tage...`);
      const db = await StorageManager.getDB();
      const tx = db.transaction(["duplicates"], "readwrite");
      const store = tx.objectStore("duplicates");

      const duplicates = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const oldestDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
      let deleted = 0;
      let freedBytes = 0;

      for (const dup of duplicates) {
        // Lösche nur aufgelöste/ignorierte Duplikate, nicht pending
        if (dup.dateDetected < oldestDate && dup.status !== "pending") {
          const size = JSON.stringify(dup).length;
          await new Promise((resolve, reject) => {
            const deleteRequest = store.delete(dup.id);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => {
              deleted++;
              freedBytes += size;
              resolve();
            };
          });
        }
      }

      console.log(
        `  ✅ ${deleted} alte Duplikate gelöscht (${(freedBytes / 1024).toFixed(
          2
        )}KB)`
      );
      return {
        deleted,
        freedMB: freedBytes / 1024 / 1024,
      };
    } catch (error) {
      console.error("❌ Fehler beim Duplikat-Cleanup:", error);
      return { deleted: 0, freedMB: 0 };
    }
  }

  /**
   * Entferne Screenshots & komprimiere große Inhalte
   */
  static async removeUnnecessaryContent() {
    try {
      console.log("📉 Optimiere Content (Screenshots & große Inhalte)...");
      const db = await StorageManager.getDB();
      const tx = db.transaction(["bookmarks"], "readwrite");
      const store = tx.objectStore("bookmarks");

      const bookmarks = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      let optimized = 0;
      let freedBytes = 0;

      for (const bookmark of bookmarks) {
        let changed = false;
        let beforeSize = JSON.stringify(bookmark).length;

        // 1. Screenshot entfernen wenn Content ausreichend ist
        if (
          bookmark.screenshot &&
          bookmark.content &&
          bookmark.content.length > 500
        ) {
          freedBytes += bookmark.screenshot.length || 0;
          bookmark.screenshot = null;
          changed = true;
        }

        // 2. Content auf Max-Größe kürzen
        if (bookmark.content && bookmark.content.length > MAX_CONTENT_SIZE) {
          freedBytes += bookmark.content.length - MAX_CONTENT_SUMMARY_SIZE;
          bookmark.content = bookmark.content.substring(
            0,
            MAX_CONTENT_SUMMARY_SIZE
          );
          changed = true;
        }

        // 3. Große Beschreibungen optional kürzen
        if (bookmark.description && bookmark.description.length > 1000) {
          freedBytes += Math.max(0, bookmark.description.length - 500);
          bookmark.description = bookmark.description.substring(0, 500);
          changed = true;
        }

        if (changed) {
          const afterSize = JSON.stringify(bookmark).length;
          freedBytes += Math.max(0, beforeSize - afterSize);
          await new Promise((resolve, reject) => {
            const putRequest = store.put(bookmark);
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => {
              optimized++;
              resolve();
            };
          });
        }
      }

      console.log(
        `  ✅ ${optimized} Bookmarks optimiert (${(freedBytes / 1024).toFixed(
          2
        )}KB)`
      );
      return {
        optimized,
        freedMB: freedBytes / 1024 / 1024,
      };
    } catch (error) {
      console.error("❌ Fehler bei Content-Optimierung:", error);
      return { optimized: 0, freedMB: 0 };
    }
  }
}

export default StorageOptimizer;

/**
 * Bootstrap Service
 *
 * Migriert bestehende Chrome Bookmarks in GMARK:
 * 1. Liest alle Chrome Bookmarks
 * 2. Klassifiziert diese
 * 3. Speichert in IndexedDB
 * 4. Reorganisiert Chrome Bookmarks in Kategorien-Ordner
 * 5. Tracked Progress
 */

import StorageManager from "../utils/storage.js";
import ClassificationService from "./classification.js";

export class BootstrapService {
  constructor() {
    this.bookmarksToProcess = 0;
    this.bookmarksProcessed = 0;
    this.bootstrapComplete = false;
  }

  /**
   * Starte Bootstrap-Prozess
   * @param {Function} onProgress - Callback für Progress Updates
   * @returns {Promise<Object>} Bootstrap-Ergebnis
   */
  async runBootstrap(onProgress) {
    try {
      console.log("🚀 Bootstrap startet...");

      // 1. Überprüfe ob Bootstrap schon durchgeführt wurde
      const bootstrapStatus = await StorageManager.getSetting(
        "bootstrapComplete"
      );
      if (bootstrapStatus) {
        console.log("✅ Bootstrap bereits durchgeführt");
        return {
          success: true,
          message: "Bootstrap already completed",
          bookmarksProcessed: 0,
          skipped: true,
        };
      }

      // 2. Lese alle Chrome Bookmarks
      console.log("📖 Lese Chrome Bookmarks...");
      const bookmarks = await this.getAllChromeBookmarks();
      this.bookmarksToProcess = bookmarks.length;

      if (bookmarks.length === 0) {
        console.log("ℹ️ Keine Bookmarks zum Migrieren");
        await StorageManager.setSetting("bootstrapComplete", true);
        return {
          success: true,
          message: "No bookmarks to migrate",
          bookmarksProcessed: 0,
        };
      }

      console.log(`📊 ${bookmarks.length} Bookmarks zum Klassifizieren`);

      // 3. Klassifiziere und speichere jedes Bookmark
      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        bookmarks: [],
      };

      for (const bookmark of bookmarks) {
        try {
          // Skip Ordner
          if (bookmark.children) {
            results.skipped++;
            this.bookmarksProcessed++;
            continue;
          }

          // Skip bereits gespeicherte Bookmarks
          const existing = await StorageManager.getBookmarkByNormalizedUrl(
            StorageManager.normalizeUrl(bookmark.url)
          );
          if (existing) {
            results.skipped++;
            this.bookmarksProcessed++;
            continue;
          }

          // Klassifiziere
          const classification = await ClassificationService.classify({
            title: bookmark.title || "Untitled",
            description: bookmark.tags?.join(", ") || "",
            url: bookmark.url,
          });

          // Speichere in DB
          const savedBookmark = await StorageManager.addBookmark({
            url: bookmark.url,
            title: bookmark.title || "Untitled",
            category: classification.category,
            confidence: classification.confidence,
            tags: classification.tags,
            summary: classification.summary,
            color: classification.color,
            method: "bootstrap-classification",
            chromeId: bookmark.id,
            migratedAt: Date.now(),
          });

          results.success++;
          results.bookmarks.push(savedBookmark);

          console.log(
            `✅ [${this.bookmarksProcessed}/${this.bookmarksToProcess}] ${bookmark.title} → ${classification.category}`
          );
        } catch (error) {
          console.error(`❌ Fehler bei ${bookmark.title}:`, error);
          results.failed++;
        }

        this.bookmarksProcessed++;

        // Progress-Update
        if (onProgress) {
          onProgress({
            processed: this.bookmarksProcessed,
            total: this.bookmarksToProcess,
            success: results.success,
            failed: results.failed,
            skipped: results.skipped,
            percentage: Math.round(
              (this.bookmarksProcessed / this.bookmarksToProcess) * 100
            ),
          });
        }

        // Rate Limiting - nicht zu schnell
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 4. Reorganisiere Chrome Bookmarks (optional)
      console.log("📁 Reorganisiere Chrome Bookmarks...");
      await this.reorganizeChromeBookmarks(results.bookmarks);

      // 5. Markiere Bootstrap als vollständig
      await StorageManager.setSetting("bootstrapComplete", true);
      await StorageManager.setSetting(
        "bootstrapDate",
        new Date().toISOString()
      );

      console.log("✅ Bootstrap abgeschlossen!");
      console.log(`   Erfolg: ${results.success}`);
      console.log(`   Fehler: ${results.failed}`);
      console.log(`   Übersprungen: ${results.skipped}`);

      this.bootstrapComplete = true;

      return {
        success: true,
        message: "Bootstrap completed successfully",
        ...results,
      };
    } catch (error) {
      console.error("❌ Bootstrap-Fehler:", error);
      return {
        success: false,
        error: error.message,
        bookmarksProcessed: this.bookmarksProcessed,
      };
    }
  }

  /**
   * Lese alle Chrome Bookmarks rekursiv
   */
  async getAllChromeBookmarks() {
    const allBookmarks = [];

    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.url) {
          // Es ist ein Bookmark
          allBookmarks.push(node);
        } else if (node.children) {
          // Es ist ein Ordner
          traverse(node.children);
        }
      }
    };

    try {
      const bookmarkTree = await chrome.bookmarks.getTree();
      traverse(bookmarkTree);
      return allBookmarks;
    } catch (error) {
      console.error("Fehler beim Lesen von Chrome Bookmarks:", error);
      return [];
    }
  }

  /**
   * Reorganisiere Chrome Bookmarks nach Kategorien
   */
  async reorganizeChromeBookmarks(bookmarks) {
    try {
      // Finde oder erstelle "GMARK" Ordner
      let gmmarkFolderId = await this.getOrCreateBookmarkFolder("GMARK Local");

      if (!gmmarkFolderId) {
        console.warn("⚠️ Konnte GMARK Ordner nicht erstellen");
        return;
      }

      // Gruppiere nach Kategorie
      const byCategory = {};
      for (const bookmark of bookmarks) {
        if (!byCategory[bookmark.category]) {
          byCategory[bookmark.category] = [];
        }
        byCategory[bookmark.category].push(bookmark);
      }

      // Erstelle Ordner pro Kategorie und verschiebe Bookmarks
      for (const [category, items] of Object.entries(byCategory)) {
        const categoryFolderId = await this.getOrCreateBookmarkFolder(
          category,
          gmmarkFolderId
        );

        if (!categoryFolderId) continue;

        for (const bookmark of items) {
          try {
            if (bookmark.chromeId) {
              // Verschiebe Chrome Bookmark
              await chrome.bookmarks.move(bookmark.chromeId, {
                parentId: categoryFolderId,
              });

              console.log(
                `📁 Verschoben: ${bookmark.title} → GMARK Local/${category}`
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ Konnte Bookmark nicht verschieben: ${bookmark.title}`,
              error
            );
          }
        }
      }

      console.log("✅ Chrome Bookmarks reorganisiert");
    } catch (error) {
      console.warn("⚠️ Chrome Bookmarks Reorganisation fehlgeschlagen:", error);
      // Nicht kritisch - fortfahren
    }
  }

  /**
   * Finde oder erstelle Bookmark-Ordner
   */
  async getOrCreateBookmarkFolder(folderName, parentId = null) {
    try {
      // Suche vorhandenen Ordner
      const search = await chrome.bookmarks.search({
        title: folderName,
      });

      const existing = search.find(
        (item) => !item.url && item.title === folderName
      );
      if (existing) {
        return existing.id;
      }

      // Erstelle neuen Ordner
      const createdFolder = await chrome.bookmarks.create({
        title: folderName,
        parentId: parentId || "1", // 1 = "Other Bookmarks"
      });

      console.log(`📁 Erstellt: ${folderName}`);
      return createdFolder.id;
    } catch (error) {
      console.error(`Fehler beim Erstellen von Ordner ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Überprüfe Bootstrap-Status
   */
  async getBootstrapStatus() {
    const isComplete = await StorageManager.getSetting("bootstrapComplete");
    const date = await StorageManager.getSetting("bootstrapDate");

    return {
      complete: isComplete || false,
      date: date || null,
      lastRun: date ? new Date(date) : null,
    };
  }

  /**
   * Setze Bootstrap zurück (für Testing)
   */
  async resetBootstrap() {
    await StorageManager.setSetting("bootstrapComplete", false);
    await StorageManager.setSetting("bootstrapDate", null);
    this.bootstrapComplete = false;
    console.log("🔄 Bootstrap zurückgesetzt");
  }
}

export default new BootstrapService();

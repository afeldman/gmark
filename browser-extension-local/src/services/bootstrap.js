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

      // 3. Erstelle init und notresponding Ordner
      console.log("📁 Erstelle Sortier-Ordner...");
      const initFolderId = await this.getOrCreateBookmarkFolder("init");
      const notRespondingFolderId = await this.getOrCreateBookmarkFolder(
        "notresponding"
      );

      // 4. Sortiere Bookmarks in init/notresponding und entferne Duplikate
      console.log("🔄 Sortiere Bookmarks und entferne Duplikate...");
      const { initBookmarks, notRespondingBookmarks } =
        await this.sortAndDeduplicateBookmarks(
          bookmarks,
          initFolderId,
          notRespondingFolderId,
          onProgress
        );

      console.log(
        `✅ Sortiert: ${initBookmarks.length} in 'init', ${notRespondingBookmarks.length} in 'notresponding'`
      );

      // 5. Verarbeite Bookmarks aus init-Ordner mit KI
      console.log("🤖 Verarbeite Bookmarks mit KI aus 'init'-Ordner...");
      const results = await this.processInitBookmarksWithAI(
        initBookmarks,
        initFolderId,
        onProgress
      );

      console.log(
        `✅ KI-Verarbeitung abgeschlossen: ${results.success} erfolgreich, ${results.failed} fehlgeschlagen`
      );

      // 6. Markiere Bootstrap als vollständig
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
   * Sortiere Bookmarks in init/notresponding und entferne Duplikate
   */
  async sortAndDeduplicateBookmarks(
    bookmarks,
    initFolderId,
    notRespondingFolderId,
    onProgress
  ) {
    const initBookmarks = [];
    const notRespondingBookmarks = [];
    const seenUrls = new Set();
    let processed = 0;

    for (const bookmark of bookmarks) {
      try {
        // Skip Ordner
        if (bookmark.children) {
          processed++;
          continue;
        }

        // Prüfe auf Duplikate (normalisierte URL)
        const normalizedUrl = StorageManager.normalizeUrl(bookmark.url);
        if (seenUrls.has(normalizedUrl)) {
          console.log(`🗑️ Duplikat entfernt: ${bookmark.title}`);
          // Lösche Duplikat aus Chrome Bookmarks
          if (bookmark.id) {
            await chrome.bookmarks.remove(bookmark.id);
          }
          processed++;
          continue;
        }

        seenUrls.add(normalizedUrl);

        // Prüfe ob URL erreichbar ist und ermittle Titel
        const { reachable: isReachable, title: resolvedTitle } =
          await this.checkUrlReachable(bookmark.url);

        if (isReachable) {
          // Optional: Titel aktualisieren
          if (resolvedTitle && resolvedTitle !== bookmark.title) {
            try {
              await chrome.bookmarks.update(bookmark.id, {
                title: resolvedTitle,
              });
              bookmark.title = resolvedTitle;
              console.log(
                `📝 Titel aktualisiert: ${resolvedTitle} (vorher: ${bookmark.title})`
              );
            } catch (e) {
              console.warn("⚠️ Konnte Titel nicht aktualisieren:", e);
            }
          }

          // Verschiebe zu init-Ordner
          if (bookmark.id && initFolderId) {
            await chrome.bookmarks.move(bookmark.id, {
              parentId: initFolderId,
            });
          }
          initBookmarks.push(bookmark);
          console.log(
            `✅ [${processed}/${bookmarks.length}] ${bookmark.title} → init`
          );
        } else {
          // Verschiebe zu notresponding-Ordner
          if (bookmark.id && notRespondingFolderId) {
            await chrome.bookmarks.move(bookmark.id, {
              parentId: notRespondingFolderId,
            });
          }
          notRespondingBookmarks.push(bookmark);
          console.log(
            `⚠️ [${processed}/${bookmarks.length}] ${bookmark.title} → notresponding`
          );
        }
      } catch (error) {
        console.error(`❌ Fehler bei ${bookmark.title}:`, error);
      }

      processed++;

      // Progress-Update
      if (onProgress) {
        onProgress({
          processed,
          total: bookmarks.length,
          success: initBookmarks.length,
          failed: 0,
          skipped: notRespondingBookmarks.length,
          percentage: Math.round((processed / bookmarks.length) * 100),
        });
      }

      // Rate Limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { initBookmarks, notRespondingBookmarks };
  }

  /**
   * Prüfe ob eine URL erreichbar ist
   */
  async checkUrlReachable(url) {
    // Versuche schnell per HEAD (kein Titel verfügbar)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        mode: "no-cors",
      });
      clearTimeout(timeoutId);
    } catch (error) {
      // HEAD fehlgeschlagen → als nicht erreichbar markieren
      return { reachable: false, title: null };
    }

    // Erreichbar: Ermittle Titel über Hintergrund-Tab
    const title = await this.resolvePageTitle(url);
    return { reachable: true, title };
  }

  /**
   * Ermittle den Seitentitel durch Hintergrund-Tab und Content-Ausführung
   */
  async resolvePageTitle(url) {
    try {
      console.log("🔎 Ermittle Titel für:", url);
      const tab = await chrome.tabs.create({ url, active: false });
      // Warte kurz bis Seite lädt
      await new Promise((r) => setTimeout(r, 1000));

      const [{ result: title }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.title,
      });

      // Tab schließen
      try {
        await chrome.tabs.remove(tab.id);
      } catch {}

      console.log("  ✅ Titel ermittelt:", title);
      return typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : null;
    } catch (error) {
      console.warn("⚠️ Konnte Titel nicht ermitteln:", error);
      return null;
    }
  }

  /**
   * Verarbeite Bookmarks aus init-Ordner mit KI
   */
  async processInitBookmarksWithAI(initBookmarks, initFolderId, onProgress) {
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      bookmarks: [],
    };

    for (const bookmark of initBookmarks) {
      try {
        // Skip bereits gespeicherte Bookmarks
        const existing = await StorageManager.getBookmarkByNormalizedUrl(
          StorageManager.normalizeUrl(bookmark.url)
        );
        if (existing) {
          results.skipped++;
          this.bookmarksProcessed++;
          continue;
        }

        // Klassifiziere mit KI
        const classification = await ClassificationService.classify({
          title: bookmark.title || "Untitled",
          description: bookmark.tags?.join(", ") || "",
          url: bookmark.url,
        });

        // Speichere in DB (wird in Root-Ordner der jeweiligen Kategorie gespeichert)
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

        // Verschiebe aus init-Ordner in Kategorien-Ordner (Root)
        const categoryFolderId = await this.getOrCreateBookmarkFolder(
          classification.category
        );
        if (bookmark.id && categoryFolderId) {
          await chrome.bookmarks.move(bookmark.id, {
            parentId: categoryFolderId,
          });
          console.log(
            `📁 Verschoben: ${bookmark.title} → ${classification.category}`
          );
        }

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

      // Rate Limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Lösche leeren init-Ordner wenn alle verarbeitet wurden
    if (results.success > 0 && initFolderId) {
      try {
        await chrome.bookmarks.remove(initFolderId);
        console.log("🗑️ Init-Ordner gelöscht (alle Bookmarks verarbeitet)");
      } catch (error) {
        console.warn("⚠️ Konnte init-Ordner nicht löschen:", error);
      }
    }

    // Nach Verarbeitung: generelle Bereinigung leerer Ordner
    await this.deleteEmptyBookmarkFolders();

    return results;
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

      // Nach der Reorganisation: Leere Ordner löschen
      await this.deleteEmptyBookmarkFolders();
    } catch (error) {
      console.warn("⚠️ Chrome Bookmarks Reorganisation fehlgeschlagen:", error);
      // Nicht kritisch - fortfahren
    }
  }

  /**
   * Lösche alle leeren Bookmark-Ordner (außer System-Ordner)
   */
  async deleteEmptyBookmarkFolders() {
    try {
      console.log("🧹 Lösche leere Bookmark-Ordner...");
      const tree = await chrome.bookmarks.getTree();

      // System-Ordner-IDs: 0 (root), 1 (Bookmarks Bar), 2 (Other Bookmarks), 3 (Mobile Bookmarks)
      const SYSTEM_IDS = new Set(["0", "1", "2", "3"]);

      const emptyFolders = [];

      const collectEmpty = (nodes) => {
        for (const node of nodes) {
          if (!node.url) {
            const children = node.children || [];
            // Rekursiv prüfen
            collectEmpty(children);

            // Wenn Ordner und keine Kinder → leer
            if (!SYSTEM_IDS.has(node.id) && children.length === 0) {
              emptyFolders.push(node.id);
            }
          }
        }
      };

      collectEmpty(tree);

      if (emptyFolders.length === 0) {
        console.log("✅ Keine leeren Ordner gefunden");
        return;
      }

      console.log("🗑️ Leere Ordner gefunden:", emptyFolders.length);
      for (const id of emptyFolders) {
        try {
          await chrome.bookmarks.removeTree(id);
          console.log(`  🗑️ Ordner gelöscht: ${id}`);
        } catch (error) {
          console.warn(`  ⚠️ Konnte Ordner ${id} nicht löschen:`, error);
        }
      }

      console.log("✅ Leere Ordner bereinigt");
    } catch (error) {
      console.warn("⚠️ Fehler beim Löschen leerer Ordner:", error);
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

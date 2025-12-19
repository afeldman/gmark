/**
 * Bootstrap Service - Einfache URL-für-URL Verarbeitung mit LM Studio
 *
 * Workflow:
 * 1. Für jede URL einzeln:
 *    - Erreichbar? → Titel laden, Klassifikation (Pattern Matching), Kategorie-Ordner
 *    - Nicht erreichbar? → "not_responding" Ordner
 * 2. Resume nach Neustart bei nächster unverarbeiteter URL
 * 3. Nach Bootstrap: Automatische Klassifikation für neue Links
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
   * Starte Bootstrap-Prozess - URL-für-URL Verarbeitung
   * @param {Function} onProgress - Callback für Progress Updates
   * @returns {Promise<Object>} Bootstrap-Ergebnis
   */
  async runBootstrap(onProgress) {
    try {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 GMARK Bootstrap startet...");
      console.log("=".repeat(60) + "\n");

      // ============================================================
      // SCHRITT 1: Prüfe ob Bootstrap bereits abgeschlossen
      // ============================================================
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

      // ============================================================
      // SCHRITT 2: Lade alle Chrome Bookmarks
      // ============================================================
      console.log("Step 1️⃣: Lese Chrome Bookmarks...");
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

      console.log(`📊 ${bookmarks.length} Bookmarks gefunden`);

      // ============================================================
      // SCHRITT 3: Erstelle Ordner
      // ============================================================
      console.log("\nStep 2️⃣: Erstelle Sortier-Ordner...");
      const notRespondingFolderId = await this.getOrCreateBookmarkFolder(
        "not_responding"
      );
      console.log("  ✅ not_responding Ordner bereit");

      // ============================================================
      // SCHRITT 4: Resume-Logik - Lade bereits verarbeitete URLs
      // ============================================================
      console.log("\nStep 3️⃣: Prüfe auf bereits verarbeitete URLs...");
      let processedURLs =
        (await StorageManager.getSetting("bootstrapProcessedURLs")) || [];
      let processedCount = processedURLs.length;

      if (processedCount > 0) {
        console.log(
          `  ⏸️ ${processedCount} URLs bereits verarbeitet - Resume wird fortgesetzt`
        );
      }

      // Filter unverarbeitete Bookmarks
      const unprocessedBookmarks = bookmarks.filter(
        (b) => !processedURLs.includes(b.url)
      );

      console.log(
        `  📋 ${unprocessedBookmarks.length} URLs müssen noch verarbeitet werden`
      );

      // ============================================================
      // SCHRITT 5: Verarbeite URLs einzeln
      // ============================================================
      console.log("\nStep 4️⃣: Starte URL-für-URL Verarbeitung...\n");
      const results = {
        success: 0,
        failed: 0,
        notResponding: 0,
      };

      for (let i = 0; i < unprocessedBookmarks.length; i++) {
        const bookmark = unprocessedBookmarks[i];
        const globalIndex = processedCount + i + 1;

        console.log(
          `\n[${globalIndex}/${
            this.bookmarksToProcess
          }] 🔄 Verarbeite: ${bookmark.title?.substring(0, 60)}`
        );
        console.log(`  URL: ${bookmark.url}`);

        try {
          // ============================================================
          // SCHRITT 5.1: Prüfe URL Erreichbarkeit
          // ============================================================
          const { reachable, title } = await this.checkUrlReachable(
            bookmark.url
          );

          if (!reachable) {
            // URL nicht erreichbar → in "not_responding"
            console.log(`  ⚠️ URL nicht erreichbar → not_responding`);

            if (bookmark.id && notRespondingFolderId) {
              await chrome.bookmarks.move(bookmark.id, {
                parentId: notRespondingFolderId,
              });
            }

            results.notResponding++;
            processedURLs.push(bookmark.url);
          } else {
            // URL erreichbar → Verarbeite
            console.log(`  ✅ URL erreichbar`);

            // ============================================================
            // SCHRITT 5.2: Aktualisiere Titel falls vorhanden
            // ============================================================
            if (title && bookmark.id) {
              try {
                await chrome.bookmarks.update(bookmark.id, { title });
                console.log(
                  `  📝 Titel aktualisiert: ${title.substring(0, 50)}`
                );
                bookmark.title = title;
              } catch (error) {
                console.warn(`  ⚠️ Titel-Update fehlgeschlagen`);
              }
            }

            // ============================================================
            // SCHRITT 5.3: Klassifiziere mit Pattern Matching
            // ============================================================
            console.log(`  🏷️ Klassifiziere...`);
            const classification = await ClassificationService.classify({
              title: bookmark.title || "Untitled",
              description: "",
              url: bookmark.url,
            });

            console.log(
              `  ✅ Klassifiziert: ${classification.category}`
            );

            // ============================================================
            // SCHRITT 5.4: Speichere in IndexedDB
            // ============================================================
            const savedBookmark = await StorageManager.addBookmark({
              url: bookmark.url,
              title: bookmark.title || "Untitled",
              category: classification.category,
              confidence: classification.confidence,
              tags: classification.tags,
              color: classification.color,
              method: "bootstrap-classification",
              chromeId: bookmark.id,
              migratedAt: Date.now(),
            });

            console.log(
              `  💾 In IndexedDB gespeichert`
            );

            // ============================================================
            // SCHRITT 5.5: Verschiebe in Kategorien-Ordner
            // ============================================================
            const categoryFolderId = await this.getOrCreateBookmarkFolder(
              classification.category
            );

            if (bookmark.id && categoryFolderId) {
              await chrome.bookmarks.move(bookmark.id, {
                parentId: categoryFolderId,
              });
              console.log(`  📁 Verschoben → ${classification.category}`);
            }

            results.success++;
            processedURLs.push(bookmark.url);
          }

          processedCount++;
          this.bookmarksProcessed++;

          // ============================================================
          // SCHRITT 5.6: Speichere Fortschritt nach jeder URL
          // ============================================================
          await StorageManager.setSetting(
            "bootstrapProcessedURLs",
            processedURLs
          );

          // Progress-Update
          if (onProgress) {
            onProgress({
              processed: processedCount,
              total: this.bookmarksToProcess,
              success: results.success,
              failed: results.failed,
              notResponding: results.notResponding,
              percentage: Math.round(
                (processedCount / this.bookmarksToProcess) * 100
              ),
              currentURL: bookmark.url,
              currentTitle: bookmark.title,
            });
          }

          // Kleine Pause zwischen URLs
          await new Promise((r) => setTimeout(r, 200));
        } catch (error) {
          console.error(`  ❌ Fehler bei ${bookmark.url}:`, error.message);
          results.failed++;
          processedURLs.push(bookmark.url);
          await StorageManager.setSetting(
            "bootstrapProcessedURLs",
            processedURLs
          );
        }
      }

      // ============================================================
      // SCHRITT 6: Cleanup nach erfolgreicher Verarbeitung
      // ============================================================
      console.log("\nStep 5️⃣: Cleanup und Finalisierung...");

      // Lösche Fortschritts-Marker
      await StorageManager.deleteSetting("bootstrapProcessedURLs");
      console.log("  🧹 Fortschritts-Marker gelöscht");

      // Markiere Bootstrap als abgeschlossen
      await StorageManager.setSetting("bootstrapComplete", true);
      await StorageManager.setSetting(
        "bootstrapDate",
        new Date().toISOString()
      );
      console.log("  ✅ Bootstrap als abgeschlossen markiert");

      // Bereinige leere Ordner
      await this.deleteEmptyBookmarkFolders();
      console.log("  🧹 Leere Ordner bereinigt");

      console.log("\n" + "=".repeat(60));
      console.log("🎉 Bootstrap erfolgreich abgeschlossen!");
      console.log(`   ✅ ${results.success} Bookmarks organisiert`);
      console.log(`   ⚠️ ${results.notResponding} nicht erreichbar`);
      console.log(`   ❌ ${results.failed} Fehler`);
      console.log("=".repeat(60));

      return {
        success: true,
        ...results,
        total: this.bookmarksToProcess,
      };
    } catch (error) {
      console.error("\n❌ Bootstrap fehlgeschlagen:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Prüfe ob eine URL erreichbar ist und hole Titel
   */
  async checkUrlReachable(url) {
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
      return { reachable: false, title: null };
    }

    // Erreichbar: Ermittle Titel über Hintergrund-Tab
    const title = await this.resolvePageTitle(url);
    return { reachable: true, title };
  }

  /**
   * Ermittle den Seitentitel durch Hintergrund-Tab
   */
  async resolvePageTitle(url) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      await new Promise((r) => setTimeout(r, 1500));

      const [{ result: title }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.title,
      });

      try {
        await chrome.tabs.remove(tab.id);
      } catch {}

      return typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : null;
    } catch (error) {
      console.warn("    ⚠️ Konnte Titel nicht ermitteln");
      return null;
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
          allBookmarks.push(node);
        } else if (node.children) {
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
   * Lösche alle leeren Bookmark-Ordner
   */
  async deleteEmptyBookmarkFolders() {
    try {
      console.log("🧹 Lösche leere Bookmark-Ordner...");
      const tree = await chrome.bookmarks.getTree();
      const SYSTEM_IDS = new Set(["0", "1", "2", "3"]);
      const emptyFolders = [];

      const collectEmpty = (nodes) => {
        for (const node of nodes) {
          if (
            !SYSTEM_IDS.has(node.id) &&
            node.children &&
            node.children.length === 0
          ) {
            emptyFolders.push(node.id);
          } else if (node.children) {
            collectEmpty(node.children);
          }
        }
      };

      collectEmpty(tree);

      const uniqueEmpty = Array.from(new Set(emptyFolders));

      if (uniqueEmpty.length === 0) {
        console.log("✅ Keine leeren Ordner gefunden");
        return;
      }

      console.log("🗑️ Leere Ordner gefunden:", uniqueEmpty.length);

      for (const folderId of uniqueEmpty) {
        try {
          await chrome.bookmarks.remove(folderId);
        } catch {}
      }

      console.log("✅ Leere Ordner gelöscht");
    } catch (error) {
      console.warn("⚠️ Fehler beim Löschen von leeren Ordnern:", error.message);
    }
  }

  /**
   * Finde oder erstelle Bookmark-Ordner
   */
  async getOrCreateBookmarkFolder(folderName, parentId = null) {
    try {
      // Suche existierenden Ordner in "Other Bookmarks" (Root ID: 2)
      const searchParentId = parentId || "2";
      const tree = await chrome.bookmarks.getSubTree(searchParentId);

      if (tree && tree[0] && tree[0].children) {
        const existing = tree[0].children.find(
          (child) =>
            !child.url &&
            child.title.toLowerCase() === folderName.toLowerCase()
        );

        if (existing) {
          return existing.id;
        }
      }

      // Erstelle neuen Ordner
      const newFolder = await chrome.bookmarks.create({
        parentId: searchParentId,
        title: folderName,
      });

      console.log(`  📁 Neuer Ordner erstellt: ${folderName}`);
      return newFolder.id;
    } catch (error) {
      console.warn(`  ⚠️ Fehler bei Ordner "${folderName}":`, error.message);
      return null;
    }
  }
}

export default new BootstrapService();

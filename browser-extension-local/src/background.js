/**
 * GMARK Local - Background Service Worker
 *
 * Verantwortlich für:
 * - Kontextmenü
 * - Bookmark-Events
 * - Duplikat-Erkennung (Hintergrund)
 * - Message-Routing
 * - Bootstrap (Migrieren von Chrome Bookmarks)
 */

import StorageManager from "./utils/storage.js";
import BootstrapService from "./services/bootstrap.js";
import StorageOptimizer from "./utils/storage-optimizer.js";

// Initialisiere Kontextmenü
chrome.runtime.onInstalled.addListener(async () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 GMARK Local Extension installiert!");
  console.log("=".repeat(60) + "\n");

  // Erstelle Kontextmenü
  console.log("📋 Erstelle Kontextmenüs...");
  chrome.contextMenus.create({
    id: "gmark-save-page",
    title: "In GMARK speichern",
    contexts: ["page"],
  });
  console.log("  ✅ Kontextmenü 'In GMARK speichern' erstellt");

  chrome.contextMenus.create({
    id: "gmark-save-link",
    title: "Link speichern",
    contexts: ["link"],
  });
  console.log("  ✅ Kontextmenü 'Link speichern' erstellt");

  // Standardeinstellungen setzen
  console.log("\n⚙️ Setze Standardeinstellungen...");
  StorageManager.setSetting("autoClassify", true);
  console.log("  ✅ autoClassify = true");
  StorageManager.setSetting("autoDetectDuplicates", true);
  console.log("  ✅ autoDetectDuplicates = true");
  StorageManager.setSetting("similarityThreshold", 0.8);
  console.log("  ✅ similarityThreshold = 0.8");

  // Starte Bootstrap wenn nicht schon durchgeführt
  console.log("\n" + "=".repeat(60));
  console.log("🔧 Starte Bootstrap-Prozess...");
  console.log("=".repeat(60) + "\n");

  // Leere Ordner beim Start bereinigen
  console.log("🧹 Bereinige leere Bookmark-Ordner (Startup)...");
  try {
    await BootstrapService.deleteEmptyBookmarkFolders();
    console.log("  ✅ Bereinigung abgeschlossen");
  } catch (error) {
    console.warn("  ⚠️ Bereinigung fehlgeschlagen:", error);
  }

  // Speicher prüfen und optimieren
  console.log("\n💾 Prüfe Speichernutzung...");
  const storageStatus = await StorageOptimizer.getStorageStatus();
  if (storageStatus?.status !== "ok") {
    await StorageOptimizer.optimizeIfNeeded();
  }

  // Tageslimit-Defaults für KI
  console.log("\n⚙️ Setze Token-Limits...");
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await StorageManager.setSetting("dailyTokenLimit", 10000);
  await StorageManager.setSetting("dailyTokensUsed", 0);
  await StorageManager.setSetting("tokensLastReset", todayKey);
  console.log("  ✅ dailyTokenLimit = 10000, reset heute");

  await BootstrapService.runBootstrap((progress) => {
    console.log(
      `⏳ Bootstrap Progress: ${progress.processed}/${progress.total} (${progress.percentage}%) | ✅ ${progress.success} | ❌ ${progress.failed} | ⏭️ ${progress.skipped}`
    );
  });
});

// Beim Browser-Start ebenfalls leere Ordner bereinigen
chrome.runtime.onStartup.addListener(async () => {
  console.log("\n🧹 onStartup: Bereinige leere Ordner & prüfe Speicher...");
  try {
    // Parallelisiere Ordner-Cleanup und Speicher-Optimierung
    await Promise.all([
      BootstrapService.deleteEmptyBookmarkFolders(),
      StorageOptimizer.optimizeIfNeeded(),
    ]);
    console.log("  ✅ Bereinigung und Speicher-Check abgeschlossen");
  } catch (error) {
    console.warn("  ⚠️ Fehler:", error);
  }
});

// Kontextmenü-Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("\n📌 Kontextmenü geklickt:", info.menuItemId);
  console.log("  Tab:", tab.title);
  console.log("  URL:", tab.url || info.linkUrl);

  if (info.menuItemId === "gmark-save-page") {
    console.log("💾 Speichere aktuelle Seite...");
    await savePage(tab.url, tab.title, tab.id);
  } else if (info.menuItemId === "gmark-save-link") {
    console.log("💾 Speichere Link...");
    await savePage(info.linkUrl, info.linkText || "Link", tab.id);
  }
});

// Message-Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("\n📨 Message empfangen:", message.type);
  console.log("  Von:", sender.tab ? `Tab ${sender.tab.id}` : "Extension");

  if (message.type === "SAVE_BOOKMARK") {
    console.log("  💾 Speichere Bookmark:", message.bookmark.title);
    saveBookmark(message.bookmark)
      .then(async (result) => {
        console.log("  ✅ Bookmark gespeichert:", result.id);
        // Nach Speichern: Speicher prüfen
        StorageOptimizer.getStorageStatus().catch(() => {});
        sendResponse(result);
      })
      .catch((error) => {
        console.error("  ❌ Fehler:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_BOOKMARKS") {
    console.log("\n📚 Lade alle Bookmarks...");
    StorageManager.getAllBookmarks()
      .then((bookmarks) => {
        console.log("  ✅ Bookmarks geladen:", bookmarks.length, "Einträge");
        sendResponse({ bookmarks });
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Laden:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "DELETE_BOOKMARK") {
    console.log("\n🗑️ Lösche Bookmark:", message.id);
    StorageManager.deleteBookmark(message.id)
      .then(() => {
        console.log("  ✅ Bookmark gelöscht");
        // Leere Ordner bereinigen
        BootstrapService.deleteEmptyBookmarkFolders().catch((e) => {
          console.warn("  ⚠️ Fehler bei Ordner-Bereinigung:", e);
        });
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Löschen:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_STATISTICS") {
    console.log("\n📊 Lade Statistiken...");
    StorageManager.getStatistics()
      .then((stats) => {
        console.log("  ✅ Statistiken geladen:", stats);
        sendResponse(stats);
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Laden der Statistiken:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_STORAGE_STATUS") {
    console.log("\n💾 Lade Speicherstatus...");
    StorageOptimizer.getStorageStatus()
      .then((status) => {
        console.log("  ✅ Speicherstatus:", status);
        sendResponse(status);
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Laden des Speicherstatus:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "EXPORT_DATA") {
    console.log("\n📤 Exportiere Daten...");
    StorageManager.exportToJSON()
      .then((data) => {
        console.log(
          "  ✅ Daten exportiert:",
          Object.keys(data).length,
          "Kategorien"
        );
        sendResponse(data);
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Export:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_PENDING_DUPLICATES") {
    console.log("\n🔍 Lade ausstehende Duplikate...");
    StorageManager.getPendingDuplicates()
      .then((duplicates) => {
        console.log("  ✅ Duplikate geladen:", duplicates.length, "gefunden");
        sendResponse({ duplicates });
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Laden der Duplikate:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "START_BOOTSTRAP") {
    console.log("\n🚀 Bootstrap-Prozess gestartet...");
    BootstrapService.runBootstrap((progress) => {
      console.log(
        "  📊 Bootstrap-Fortschritt:",
        `${progress.percentage}%`,
        `(${progress.current}/${progress.total})`
      );
      // Sende Progress an Popup
      chrome.runtime
        .sendMessage({
          type: "BOOTSTRAP_PROGRESS",
          progress,
        })
        .catch(() => {
          // Popup könnte nicht offen sein
        });
    })
      .then((result) => {
        console.log("  ✅ Bootstrap abgeschlossen:", result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error("  ❌ Bootstrap fehlgeschlagen:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_BOOTSTRAP_STATUS") {
    console.log("\n❓ Prüfe Bootstrap-Status...");
    BootstrapService.getBootstrapStatus()
      .then((status) => {
        console.log(
          "  ✅ Bootstrap-Status:",
          status.completed ? "Abgeschlossen" : "Ausstehend"
        );
        sendResponse(status);
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Abrufen des Status:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "RESET_BOOTSTRAP") {
    console.log("\n🔄 Setze Bootstrap zurück...");
    BootstrapService.resetBootstrap()
      .then(() => {
        console.log("  ✅ Bootstrap zurückgesetzt");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("  ❌ Fehler beim Zurücksetzen:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

// Chrome Bookmark-Events: leere Ordner global bereinigen
chrome.bookmarks.onRemoved.addListener(async () => {
  console.log("\n🧹 onRemoved: Prüfe und lösche leere Ordner...");
  try {
    await BootstrapService.deleteEmptyBookmarkFolders();
    console.log("  ✅ Bereinigung abgeschlossen");
  } catch (error) {
    console.warn("  ⚠️ Bereinigung fehlgeschlagen:", error);
  }
});

async function savePage(url, title, tabId) {
  console.log("\n💾 savePage() gestartet");
  console.log("  URL:", url);
  console.log("  Title:", title);
  console.log("  Tab ID:", tabId);

  try {
    // Prüfe ob Bootstrap abgeschlossen ist
    const bootstrapComplete = await StorageManager.getSetting(
      "bootstrapComplete"
    );

    // Extract Seiten-Inhalt vom Tab
    console.log("  📖 Extrahiere Seiten-Inhalt...");
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_PAGE_CONTENT",
    });
    console.log("  ✅ Inhalt extrahiert");

    // Duplikate prüfen
    console.log("  🔍 Prüfe auf Duplikate...");
    const existing = await StorageManager.getBookmarkByNormalizedUrl(
      StorageManager.normalizeUrl(url)
    );

    if (existing) {
      console.log("  ⚠️ Duplikat gefunden:", existing.id);
      // Duplikat gefunden
      chrome.runtime.sendMessage({
        type: "DUPLICATE_FOUND",
        existing,
        new: { url, title },
      });
      return;
    }

    let bookmark;

    // Wenn Bootstrap abgeschlossen ist, nutze KI automatisch
    if (bootstrapComplete) {
      console.log(
        "  🤖 Bootstrap abgeschlossen - nutze KI für Klassifikation..."
      );

      // Importiere ClassificationService
      const ClassificationService = (
        await import("./services/classification.js")
      ).default;

      const classification = await ClassificationService.classify({
        title: title || "Untitled",
        description: response.description || "",
        url: url,
      });

      // Generiere Seitenzusammenfassung
      let pageSummary = "";
      if (response.pageText) {
        console.log("  📝 Erstelle Seitenzusammenfassung...");
        try {
          const aiModule = await import("./types/ai.js");
          const {
            checkCanCreateSession,
            createLanguageModelSession,
            summarizeWithAI,
            safeDestroySession,
          } = aiModule;

          if (await checkCanCreateSession()) {
            const session = await createLanguageModelSession();
            if (session) {
              pageSummary =
                (await summarizeWithAI(session, response.pageText, title)) ||
                "";
              safeDestroySession(session);
              console.log("  ✅ Zusammenfassung erstellt");
            }
          }
        } catch (error) {
          console.warn("  ⚠️ Zusammenfassung fehlgeschlagen:", error);
        }
      }

      bookmark = {
        url,
        title: title || "Untitled",
        content: response.content || "",
        description: response.description || "",
        screenshot: response.screenshot || "",
        category: classification.category,
        tags: classification.tags,
        summary: pageSummary || classification.summary,
        confidence: classification.confidence,
        color: classification.color,
        method: "ai-classification",
      };

      console.log(
        `  ✅ KI-Klassifikation: ${classification.category} (${classification.confidence})`
      );
    } else {
      // Vor Bootstrap: Standard-Klassifikation
      bookmark = {
        url,
        title: title || "Untitled",
        content: response.content || "",
        description: response.description || "",
        screenshot: response.screenshot || "",
        category: "Uncategorized",
        tags: [],
        summary: "",
        confidenceScore: 0,
      };
    }

    // Speichern
    console.log("  💾 Speichere Bookmark...");
    const saved = await StorageManager.addBookmark(bookmark);
    console.log("  ✅ Bookmark gespeichert:", saved.id);

    // Wenn noch nicht klassifiziert (vor Bootstrap), triggere Klassifikation im Hintergrund
    if (!bootstrapComplete) {
      console.log("  🏷️ Triggere Klassifikation...");
      chrome.runtime.sendMessage({
        type: "CLASSIFY_BOOKMARK",
        bookmarkId: saved.id,
      });
    }

    return saved;
  } catch (error) {
    console.error("  ❌ Fehler beim Speichern:", error);
  }
}

async function saveBookmark(bookmark) {
  console.log("\n💾 saveBookmark() gestartet");
  console.log("  📄 Bookmark:", bookmark.title);
  console.log("  🔗 URL:", bookmark.url);

  try {
    // Check für Duplikate
    console.log("  🔍 Prüfe auf Duplikate...");
    const existing = await StorageManager.getBookmarkByNormalizedUrl(
      StorageManager.normalizeUrl(bookmark.url)
    );

    if (existing) {
      console.log("  ⚠️ Duplikat gefunden:", existing.id);
      throw new Error("Duplikat erkannt");
    }

    // Prüfe ob Bootstrap abgeschlossen ist
    const bootstrapComplete = await StorageManager.getSetting(
      "bootstrapComplete"
    );

    let finalBookmark = bookmark;

    // Wenn Bootstrap abgeschlossen ist, nutze KI automatisch (wenn noch nicht klassifiziert)
    if (
      bootstrapComplete &&
      (!bookmark.category || bookmark.category === "Uncategorized")
    ) {
      console.log(
        "  🤖 Bootstrap abgeschlossen - nutze KI für Klassifikation..."
      );

      const ClassificationService = (
        await import("./services/classification.js")
      ).default;

      const classification = await ClassificationService.classify({
        title: bookmark.title || "Untitled",
        description: bookmark.description || "",
        url: bookmark.url,
      });

      // Generiere Seitenzusammenfassung wenn Content verfügbar
      let pageSummary = "";
      if (bookmark.content) {
        console.log("  📝 Erstelle Seitenzusammenfassung...");
        try {
          const aiModule = await import("./types/ai.js");
          const {
            checkCanCreateSession,
            createLanguageModelSession,
            summarizeWithAI,
            safeDestroySession,
          } = aiModule;

          if (await checkCanCreateSession()) {
            const session = await createLanguageModelSession();
            if (session) {
              pageSummary =
                (await summarizeWithAI(
                  session,
                  bookmark.content,
                  bookmark.title
                )) || "";
              safeDestroySession(session);
              console.log("  ✅ Zusammenfassung erstellt");
            }
          }
        } catch (error) {
          console.warn("  ⚠️ Zusammenfassung fehlgeschlagen:", error);
        }
      }

      finalBookmark = {
        ...bookmark,
        category: classification.category,
        tags: classification.tags,
        summary: pageSummary || classification.summary,
        confidence: classification.confidence,
        color: classification.color,
        method: "ai-classification",
      };

      console.log(
        `  ✅ KI-Klassifikation: ${classification.category} (${classification.confidence})`
      );
    }

    // Speichern
    console.log("  💾 Speichere in IndexedDB...");
    const saved = await StorageManager.addBookmark(finalBookmark);
    console.log("  ✅ Gespeichert mit ID:", saved.id);
    return saved;
  } catch (error) {
    console.error("  ❌ Fehler in saveBookmark():", error);
    throw error;
  }
}

// Aktive Duplikat-Detection (optional im Hintergrund)
async function detectDuplicatesBackground() {
  console.log("\n🔍 detectDuplicatesBackground() gestartet");

  const autoDetect = await StorageManager.getSetting("autoDetectDuplicates");
  console.log("  ⚙️ Auto-Erkennung aktiviert:", autoDetect);

  if (!autoDetect) {
    console.log("  ⏭️ Übersprungen (Auto-Erkennung deaktiviert)");
    return;
  }

  const bookmarks = await StorageManager.getAllBookmarks();
  console.log("  📚 Prüfe", bookmarks.length, "Bookmarks");

  const threshold =
    (await StorageManager.getSetting("similarityThreshold")) || 0.8;
  console.log("  📊 Ähnlichkeits-Schwellenwert:", threshold);

  let duplicatesFound = 0;

  // Simple Duplikat-Erkennung
  for (let i = 0; i < bookmarks.length; i++) {
    for (let j = i + 1; j < bookmarks.length; j++) {
      const similarity = calculateSimilarity(bookmarks[i], bookmarks[j]);
      if (similarity >= threshold) {
        console.log(
          "  ⚠️ Duplikat gefunden:",
          bookmarks[i].title,
          "<->",
          bookmarks[j].title,
          "(",
          similarity.toFixed(2),
          ")"
        );
        await StorageManager.recordDuplicate(
          bookmarks[i].id,
          bookmarks[j].id,
          similarity
        );
        duplicatesFound++;
      }
    }
  }

  console.log(
    "  ✅ Duplikat-Erkennung abgeschlossen:",
    duplicatesFound,
    "Duplikate gefunden"
  );
}

function calculateSimilarity(bookmark1, bookmark2) {
  // URL-Normalisierung
  const url1 = StorageManager.normalizeUrl(bookmark1.url);
  const url2 = StorageManager.normalizeUrl(bookmark2.url);

  if (url1 === url2) return 1.0;

  // Title-Ähnlichkeit
  const titleSimilarity = levenshteinDistance(
    bookmark1.title.toLowerCase(),
    bookmark2.title.toLowerCase()
  );

  return (
    titleSimilarity / Math.max(bookmark1.title.length, bookmark2.title.length)
  );
}

function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Periodische Duplikat-Detection (optional)
// setInterval(detectDuplicatesBackground, 60 * 60 * 1000); // Every hour

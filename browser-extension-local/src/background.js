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
import AIProviderManager from "./services/ai-provider.js";
import ClassificationService from "./services/classification.js";
import logger from "./utils/logger.js";
import {
  checkCanCreateSession,
  createLanguageModelSession,
  summarizeWithAI,
  safeDestroySession,
} from "./types/ai.js";

// Initialisiere Kontextmenü
chrome.runtime.onInstalled.addListener(async () => {
  logger.log("\n" + "=".repeat(60));
  logger.log("🚀 GMARK Local Extension installiert!");
  logger.log("=".repeat(60) + "\n");

  // Erstelle Kontextmenü
  logger.log("📋 Erstelle Kontextmenüs...");
  chrome.contextMenus.create({
    id: "gmark-save-page",
    title: "In GMARK speichern",
    contexts: ["page"],
  });
  logger.log("  ✅ Kontextmenü 'In GMARK speichern' erstellt");

  chrome.contextMenus.create({
    id: "gmark-save-link",
    title: "Link speichern",
    contexts: ["link"],
  });
  logger.log("  ✅ Kontextmenü 'Link speichern' erstellt");

  // Standardeinstellungen setzen
  logger.log("\n⚙️ Setze Standardeinstellungen...");
  StorageManager.setSetting("autoClassify", true);
  logger.log("  ✅ autoClassify = true");
  StorageManager.setSetting("autoDetectDuplicates", true);
  logger.log("  ✅ autoDetectDuplicates = true");
  StorageManager.setSetting("similarityThreshold", 0.8);
  logger.log("  ✅ similarityThreshold = 0.8");

  // Starte Bootstrap wenn nicht schon durchgeführt
  logger.log("\n" + "=".repeat(60));
  logger.log("🔧 Starte Bootstrap-Prozess...");
  logger.log("=".repeat(60) + "\n");

  // Leere Ordner beim Start bereinigen
  logger.log("🧹 Bereinige leere Bookmark-Ordner (Startup)...");
  try {
    await BootstrapService.deleteEmptyBookmarkFolders();
    logger.log("  ✅ Bereinigung abgeschlossen");
  } catch (error) {
    logger.warn("  ⚠️ Bereinigung fehlgeschlagen:", error);
  }

  // Speicher prüfen und optimieren
  logger.log("\n💾 Prüfe Speichernutzung...");
  const storageStatus = await StorageOptimizer.getStorageStatus();
  if (storageStatus?.status !== "ok") {
    await StorageOptimizer.optimizeIfNeeded();
  }

  // Tageslimit-Defaults für KI
  logger.log("\n⚙️ Setze Token-Limits...");
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await StorageManager.setSetting("dailyTokenLimit", 10000);
  await StorageManager.setSetting("dailyTokensUsed", 0);
  await StorageManager.setSetting("tokensLastReset", todayKey);
  logger.log("  ✅ dailyTokenLimit = 10000, reset heute");

  await BootstrapService.runBootstrap((progress) => {
    logger.log(
      `⏳ Bootstrap: ${progress.processed}/${progress.total} (${
        progress.percentage
      }%) | ✅ ${progress.success} | ❌ ${progress.failed} | ⏭️ ${
        progress.notResponding
      } | 🔴 ${progress.notResponding || 0}`
    );
    if (progress.currentTitle) {
      logger.log(`   Aktuell: ${progress.currentTitle}`);
    }
  });
});

// Beim Browser-Start ebenfalls leere Ordner bereinigen
chrome.runtime.onStartup.addListener(async () => {
  logger.log("\n🧹 onStartup: Bereinige leere Ordner & prüfe Speicher...");
  try {
    // Parallelisiere Ordner-Cleanup und Speicher-Optimierung
    await Promise.all([
      BootstrapService.deleteEmptyBookmarkFolders(),
      StorageOptimizer.optimizeIfNeeded(),
    ]);
    logger.log("  ✅ Bereinigung und Speicher-Check abgeschlossen");
  } catch (error) {
    logger.warn("  ⚠️ Fehler:", error);
  }
});

// Kontextmenü-Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  logger.log("\n📌 Kontextmenü geklickt:", info.menuItemId);
  logger.log("  Tab:", tab.title);
  logger.log("  URL:", tab.url || info.linkUrl);

  if (info.menuItemId === "gmark-save-page") {
    logger.log("💾 Speichere aktuelle Seite...");
    await savePage(tab.url, tab.title, tab.id);
  } else if (info.menuItemId === "gmark-save-link") {
    logger.log("💾 Speichere Link...");
    await savePage(info.linkUrl, info.linkText || "Link", tab.id);
  }
});

// Message-Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.log("\n📨 Message empfangen:", message.type);
  logger.log("  Von:", sender.tab ? `Tab ${sender.tab.id}` : "Extension");

  if (message.type === "SAVE_BOOKMARK") {
    logger.log("  💾 Speichere Bookmark:", message.bookmark.title);
    saveBookmark(message.bookmark)
      .then(async (result) => {
        logger.log("  ✅ Bookmark gespeichert:", result.id);
        // Nach Speichern: Speicher prüfen
        StorageOptimizer.getStorageStatus().catch(() => {});
        sendResponse(result);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_BOOKMARKS") {
    logger.log("\n📚 Lade alle Bookmarks...");
    StorageManager.getAllBookmarks()
      .then((bookmarks) => {
        logger.log("  ✅ Bookmarks geladen:", bookmarks.length, "Einträge");
        sendResponse({ bookmarks });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "DELETE_BOOKMARK") {
    logger.log("\n🗑️ Lösche Bookmark:", message.id);
    StorageManager.deleteBookmark(message.id)
      .then(() => {
        logger.log("  ✅ Bookmark gelöscht");
        // Leere Ordner bereinigen
        BootstrapService.deleteEmptyBookmarkFolders().catch((e) => {
          logger.warn("  ⚠️ Fehler bei Ordner-Bereinigung:", e);
        });
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Löschen:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_STATISTICS") {
    logger.log("\n📊 Lade Statistiken...");
    StorageManager.getStatistics()
      .then((stats) => {
        logger.log("  ✅ Statistiken geladen:", stats);
        sendResponse(stats);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden der Statistiken:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_STORAGE_STATUS") {
    logger.log("\n💾 Lade Speicherstatus...");
    StorageOptimizer.getStorageStatus()
      .then((status) => {
        logger.log("  ✅ Speicherstatus:", status);
        sendResponse(status);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden des Speicherstatus:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "EXPORT_DATA") {
    logger.log("\n📤 Exportiere Daten...");
    StorageManager.exportToJSON()
      .then((data) => {
        logger.log(
          "  ✅ Daten exportiert:",
          Object.keys(data).length,
          "Kategorien"
        );
        sendResponse(data);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Export:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_PENDING_DUPLICATES") {
    logger.log("\n🔍 Lade ausstehende Duplikate...");
    StorageManager.getPendingDuplicates()
      .then((duplicates) => {
        logger.log("  ✅ Duplikate geladen:", duplicates.length, "gefunden");
        sendResponse({ duplicates });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden der Duplikate:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "START_BOOTSTRAP") {
    logger.log("\n🚀 Bootstrap-Prozess gestartet...");
    BootstrapService.runBootstrap((progress) => {
      logger.log(
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
        logger.log("  ✅ Bootstrap abgeschlossen:", result);
        sendResponse(result);
      })
      .catch((error) => {
        logger.error("  ❌ Bootstrap fehlgeschlagen:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "GET_BOOTSTRAP_STATUS") {
    logger.log("\n❓ Prüfe Bootstrap-Status...");
    BootstrapService.getBootstrapStatus()
      .then((status) => {
        logger.log(
          "  ✅ Bootstrap-Status:",
          status.completed ? "Abgeschlossen" : "Ausstehend"
        );
        sendResponse(status);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Abrufen des Status:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "RESET_BOOTSTRAP") {
    logger.log("\n🔄 Setze Bootstrap zurück...");
    BootstrapService.resetBootstrap()
      .then(() => {
        logger.log("  ✅ Bootstrap zurückgesetzt");
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Zurücksetzen:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  // =====================================================================
  // AI Provider Settings Handler
  // =====================================================================

  if (message.type === "getSetting") {
    logger.log("\n⚙️ Lade Setting:", message.key);
    StorageManager.getSetting(message.key)
      .then((value) => {
        logger.log("  ✅ Setting geladen:", message.key, "=", value);
        sendResponse({ value });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden des Settings:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "setSetting") {
    logger.log("\n⚙️ Speichere Setting:", message.key, "=", message.value);
    StorageManager.setSetting(message.key, message.value)
      .then(() => {
        logger.log("  ✅ Setting gespeichert:", message.key);
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Speichern des Settings:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "getProviderConfig") {
    logger.log("\n⚙️ Lade Provider-Config:", message.provider);
    AIProviderManager.getProviderConfig(message.provider)
      .then((config) => {
        logger.log("  ✅ Config geladen:", config);
        sendResponse({ config });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden der Config:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "setProviderConfig") {
    logger.log("\n⚙️ Speichere Provider-Config:", message.provider);
    AIProviderManager.setProviderConfig(message.provider, message.config)
      .then(() => {
        logger.log("  ✅ Provider-Config gespeichert");
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Speichern der Config:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "checkProviderAvailability") {
    logger.log("\n🔍 Prüfe Provider-Verfügbarkeit:", message.provider);
    AIProviderManager.checkProviderAvailability(message.provider)
      .then((result) => {
        logger.log("  ✅ Provider-Check abgeschlossen:", result);
        sendResponse(result);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Provider-Check:", error);
        sendResponse({
          available: false,
          error: error.message,
        });
      });
    return true;
  }

  if (message.type === "classifyWithProvider") {
    logger.log("\n🤖 Klassifiziere mit Provider:", message.provider);
    AIProviderManager.classifyWithProvider(message.data)
      .then((result) => {
        logger.log("  ✅ Klassifikation abgeschlossen:", result);
        sendResponse(result);
      })
      .catch((error) => {
        logger.error("  ❌ Fehler bei Klassifikation:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "saveAPIKey") {
    logger.log("\n🔐 Speichere API Key für:", message.provider);
    StorageManager.setSetting(`${message.provider}_apiKey`, message.apiKey)
      .then(() => {
        logger.log("  ✅ API Key gespeichert");
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Speichern des API Keys:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === "getAPIKey") {
    logger.log("\n🔑 Lade API Key für:", message.provider);
    StorageManager.getSetting(`${message.provider}_apiKey`)
      .then((apiKey) => {
        logger.log("  ✅ API Key geladen");
        sendResponse({ apiKey: apiKey || null });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Laden des API Keys:", error);
        sendResponse({ apiKey: null, error: error.message });
      });
    return true;
  }

  if (message.type === "deleteAPIKey") {
    logger.log("\n🗑️ Lösche API Key für:", message.provider);
    StorageManager.deleteSetting(`${message.provider}_apiKey`)
      .then(() => {
        logger.log("  ✅ API Key gelöscht");
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("  ❌ Fehler beim Löschen des API Keys:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

// Chrome Bookmark-Events: leere Ordner global bereinigen
chrome.bookmarks.onRemoved.addListener(async () => {
  logger.log("\n🧹 onRemoved: Prüfe und lösche leere Ordner...");
  try {
    await BootstrapService.deleteEmptyBookmarkFolders();
    logger.log("  ✅ Bereinigung abgeschlossen");
  } catch (error) {
    logger.warn("  ⚠️ Bereinigung fehlgeschlagen:", error);
  }
});

async function savePage(url, title, tabId) {
  logger.log("\n💾 savePage() gestartet");
  logger.log("  URL:", url);
  logger.log("  Title:", title);
  logger.log("  Tab ID:", tabId);

  try {
    // ============================================================
    // SCHRITT 1: Duplikat-Prüfung
    // ============================================================
    logger.log("  🔍 Prüfe auf Duplikate...");
    const duplicateCheck = await checkAndHandleDuplicates(url, {
      title,
      url,
    });

    if (duplicateCheck.isDuplicate) {
      logger.log("  ⚠️ Duplikat gefunden:", duplicateCheck.existing.id);
      return duplicateCheck;
    }

    // Prüfe ob Bootstrap abgeschlossen ist
    const bootstrapComplete = await StorageManager.getSetting(
      "bootstrapComplete"
    );

    // Extract Seiten-Inhalt vom Tab
    logger.log("  📖 Extrahiere Seiten-Inhalt...");
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_PAGE_CONTENT",
    });
    logger.log("  ✅ Inhalt extrahiert");

    let bookmark;

    // Wenn Bootstrap abgeschlossen ist, nutze KI automatisch
    if (bootstrapComplete) {
      logger.log(
        "  🤖 Bootstrap abgeschlossen - nutze KI für Klassifikation..."
      );

      const classification = await ClassificationService.classify({
        title: title || "Untitled",
        description: response.description || "",
        url: url,
      });

      // Generiere Seitenzusammenfassung
      let pageSummary = "";
      if (response.pageText) {
        logger.log("  📝 Erstelle Seitenzusammenfassung...");
        try {
          if (await checkCanCreateSession()) {
            const session = await createLanguageModelSession();
            if (session) {
              pageSummary =
                (await summarizeWithAI(session, response.pageText, title)) ||
                "";
              safeDestroySession(session);
              logger.log("  ✅ Zusammenfassung erstellt");
            }
          }
        } catch (error) {
          logger.warn("  ⚠️ Zusammenfassung fehlgeschlagen:", error);
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

      logger.log(
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

    // ============================================================
    // SCHRITT 2: Speichern
    // ============================================================
    logger.log("  💾 Speichere Bookmark...");
    const saved = await StorageManager.addBookmark(bookmark);
    logger.log("  ✅ Bookmark gespeichert:", saved.id);

    // ============================================================
    // SCHRITT 3: Sortierung durchführen
    // ============================================================
    logger.log("  📁 Sortiere Bookmark...");
    await sortNewBookmark(saved);

    // Wenn noch nicht klassifiziert (vor Bootstrap), triggere Klassifikation im Hintergrund
    if (!bootstrapComplete) {
      logger.log("  🏷️ Triggere Klassifikation...");
      chrome.runtime.sendMessage({
        type: "CLASSIFY_BOOKMARK",
        bookmarkId: saved.id,
      });
    }

    return saved;
  } catch (error) {
    logger.error("  ❌ Fehler beim Speichern:", error);
  }
}

async function saveBookmark(bookmark) {
  logger.log("\n💾 saveBookmark() gestartet");
  logger.log("  📄 Bookmark:", bookmark.title);
  logger.log("  🔗 URL:", bookmark.url);

  try {
    // ============================================================
    // SCHRITT 1: Duplikat-Prüfung
    // ============================================================
    logger.log("  🔍 Prüfe auf Duplikate...");
    const duplicateCheck = await checkAndHandleDuplicates(
      bookmark.url,
      bookmark
    );

    if (duplicateCheck.isDuplicate) {
      logger.log("  ⚠️ Duplikat gefunden:", duplicateCheck.existing.id);
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
      logger.log(
        "  🤖 Bootstrap abgeschlossen - nutze KI für Klassifikation..."
      );

      const classification = await ClassificationService.classify({
        title: bookmark.title || "Untitled",
        description: bookmark.description || "",
        url: bookmark.url,
      });

      // Generiere Seitenzusammenfassung wenn Content verfügbar
      let pageSummary = "";
      if (bookmark.content) {
        logger.log("  📝 Erstelle Seitenzusammenfassung...");
        try {
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
              logger.log("  ✅ Zusammenfassung erstellt");
            }
          }
        } catch (error) {
          logger.warn("  ⚠️ Zusammenfassung fehlgeschlagen:", error);
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

      logger.log(
        `  ✅ KI-Klassifikation: ${classification.category} (${classification.confidence})`
      );
    }

    // ============================================================
    // SCHRITT 2: Speichern
    // ============================================================
    logger.log("  💾 Speichere in IndexedDB...");
    const saved = await StorageManager.addBookmark(finalBookmark);
    logger.log("  ✅ Gespeichert mit ID:", saved.id);

    // ============================================================
    // SCHRITT 3: Sortierung durchführen
    // ============================================================
    logger.log("  📁 Sortiere Bookmark...");
    await sortNewBookmark(saved);

    return saved;
  } catch (error) {
    logger.error("  ❌ Fehler in saveBookmark():", error);
    throw error;
  }
}

// ============================================================
// Hilfsfunktionen für Duplikat-Prüfung und Sortierung
// ============================================================

/**
 * Prüfe auf Duplikate und handle diese
 * @param {string} url - Zu prüfende URL
 * @param {Object} newBookmarkData - Daten des neuen Bookmarks
 * @returns {Promise<Object>} { isDuplicate: boolean, existing?: Object }
 */
async function checkAndHandleDuplicates(url, newBookmarkData) {
  logger.log("    🔎 Prüfe auf exakte URL-Duplikate...");

  // Exakte URL-Prüfung
  const existing = await StorageManager.getBookmarkByNormalizedUrl(
    StorageManager.normalizeUrl(url)
  );

  if (existing) {
    logger.log(`    ❌ Exaktes Duplikat gefunden - URL existiert bereits`);
    return {
      isDuplicate: true,
      existing,
      type: "exact",
    };
  }

  // Ähnliche Bookmarks finden (Levenshtein Distance)
  logger.log("    🔎 Prüfe auf ähnliche Bookmarks...");
  const allBookmarks = await StorageManager.getAllBookmarks();
  const threshold = 0.85;

  for (const bookmark of allBookmarks) {
    const similarity = calculateSimilarity(
      { url, title: newBookmarkData.title },
      bookmark
    );

    if (similarity >= threshold) {
      logger.log(
        `    ⚠️ Ähnliches Bookmark gefunden: "${bookmark.title}" (${(
          similarity * 100
        ).toFixed(1)}% ähnlich)`
      );

      // Speichere als ausstehende Duplikat-Überprüfung
      await StorageManager.recordDuplicate(bookmark.id, url, similarity);

      return {
        isDuplicate: false, // Kein exaktes Duplikat, nur ähnlich
        similar: bookmark,
        similarity,
        type: "similar",
      };
    }
  }

  logger.log("    ✅ Keine Duplikate gefunden");
  return {
    isDuplicate: false,
  };
}

/**
 * Sortiere neuen Bookmark in richtige Chrome-Folder
 * Falls Kategorie bekannt ist, verschiebe in entsprechende Chrome-Folder
 * @param {Object} bookmark - Gespeichertes Bookmark mit Kategorie
 */
async function sortNewBookmark(bookmark) {
  try {
    if (!bookmark.category || bookmark.category === "Uncategorized") {
      logger.log("    ⏭️ Keine Kategorie - Sortierung übersprungen");
      return;
    }

    // Prüfe ob es Chrome Bookmark ID gibt
    if (!bookmark.chromeId) {
      logger.log("    ℹ️ Kein Chrome Bookmark - nur in IndexedDB gespeichert");
      return;
    }

    logger.log(`    📁 Versuche zu sortieren in: ${bookmark.category}`);

    // Hole oder erstelle Kategorie-Ordner
    const categoryFolderId = await BootstrapService.getOrCreateBookmarkFolder(
      bookmark.category
    );

    if (!categoryFolderId) {
      logger.log(`    ⚠️ Konnte Ordner nicht erstellen/finden`);
      return;
    }

    // Verschiebe Bookmark in Kategorie-Ordner
    try {
      await chrome.bookmarks.move(bookmark.chromeId, {
        parentId: categoryFolderId,
      });
      logger.log(`    ✅ Bookmark verschoben → ${bookmark.category}`);
    } catch (error) {
      logger.warn(`    ⚠️ Verschiebung fehlgeschlagen:`, error.message);
    }
  } catch (error) {
    logger.warn("    ⚠️ Sortierung fehlgeschlagen:", error);
  }
}

// Aktive Duplikat-Detection (optional im Hintergrund)
async function detectDuplicatesBackground() {
  logger.log("\n🔍 detectDuplicatesBackground() gestartet");

  const autoDetect = await StorageManager.getSetting("autoDetectDuplicates");
  logger.log("  ⚙️ Auto-Erkennung aktiviert:", autoDetect);

  if (!autoDetect) {
    logger.log("  ⏭️ Übersprungen (Auto-Erkennung deaktiviert)");
    return;
  }

  const bookmarks = await StorageManager.getAllBookmarks();
  logger.log("  📚 Prüfe", bookmarks.length, "Bookmarks");

  const threshold =
    (await StorageManager.getSetting("similarityThreshold")) || 0.8;
  logger.log("  📊 Ähnlichkeits-Schwellenwert:", threshold);

  let duplicatesFound = 0;

  // Simple Duplikat-Erkennung
  for (let i = 0; i < bookmarks.length; i++) {
    for (let j = i + 1; j < bookmarks.length; j++) {
      const similarity = calculateSimilarity(bookmarks[i], bookmarks[j]);
      if (similarity >= threshold) {
        logger.log(
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

  logger.log(
    "  ✅ Duplikat-Erkennung abgeschlossen:",
    duplicatesFound,
    "Duplikate gefunden"
  );
}

/**
 * Berechne Ähnlichkeit zwischen zwei Bookmarks basierend auf URL und Titel
 * @param {Object} bookmark1 - Erstes Bookmark Objekt
 * @param {Object} bookmark2 - Zweites Bookmark Objekt
 * @returns {number} Ähnlichkeits-Score (0-1)
 */
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

/**
 * Berechne Levenshtein Distance zwischen zwei Strings
 * @param {string} a - Erster String
 * @param {string} b - Zweiter String
 * @returns {number} Levenshtein Distance Wert
 */
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

// ============================================================
// Omnibox - Suche nach Bookmarks in der Adressleiste
// ============================================================

// Input-Handler: Wird bei jeder Eingabe aufgerufen
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  logger.log("\n🔍 Omnibox Input:", text);

  if (!text || text.trim().length < 2) {
    suggest([]);
    return;
  }

  try {
    const bookmarks = await StorageManager.getAllBookmarks();
    const query = text.toLowerCase();

    // Suche in Title, URL, Category, Tags und Summary
    const results = bookmarks.filter((b) => {
      const titleMatch = b.title?.toLowerCase().includes(query);
      const urlMatch = b.url?.toLowerCase().includes(query);
      const categoryMatch = b.category?.toLowerCase().includes(query);
      const tagsMatch = b.tags?.some((t) => t.toLowerCase().includes(query));
      const summaryMatch = b.summary?.toLowerCase().includes(query);

      return (
        titleMatch || urlMatch || categoryMatch || tagsMatch || summaryMatch
      );
    });

    // Begrenzen auf 10 Ergebnisse
    const suggestions = results.slice(0, 10).map((b) => ({
      content: b.url, // URL wird beim Click geöffnet
      description: `<dim>[${b.category}]</dim> ${b.title}`,
    }));

    logger.log(`  ✅ ${suggestions.length} Ergebnisse gefunden`);
    suggest(suggestions);
  } catch (error) {
    logger.error("  ❌ Omnibox-Fehler:", error);
  }
});

// Enter-Handler: Wird aufgerufen wenn Benutzer Enter drückt
chrome.omnibox.onInputEntered.addListener((url, disposition) => {
  logger.log("\n🌐 Omnibox Navigate:", url);
  logger.log("  Disposition:", disposition);

  if (url) {
    // Öffne URL im neuen/aktuellen Tab
    switch (disposition) {
      case "currentTab":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, { url });
            logger.log("  ✅ URL in aktuellem Tab geöffnet");
          }
        });
        break;
      case "newForegroundTab":
      case "newBackgroundTab":
      default:
        chrome.tabs.create({
          url,
          active: disposition === "newForegroundTab",
        });
        logger.log("  ✅ URL in neuem Tab geöffnet");
        break;
    }
  }
});

// Cancel-Handler: Wird aufgerufen wenn Benutzer Suche abbricht
chrome.omnibox.onInputCancelled.addListener(() => {
  logger.log("\n❌ Omnibox cancelled");
});

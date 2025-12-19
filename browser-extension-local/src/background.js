/**
 * GMARK Local - Background Service Worker
 *
 * Verantwortlich für:
 * - Kontextmenü
 * - Bookmark-Events
 * - Duplikat-Erkennung (Hintergrund)
 * - Message-Routing
 */

import StorageManager from "./utils/storage.js";

// Initialisiere Kontextmenü
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "gmark-save-page",
    title: "In GMARK speichern",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "gmark-save-link",
    title: "Link speichern",
    contexts: ["link"],
  });

  // Standardeinstellungen setzen
  StorageManager.setSetting("autoClassify", true);
  StorageManager.setSetting("autoDetectDuplicates", true);
  StorageManager.setSetting("similarityThreshold", 0.8);
});

// Kontextmenü-Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "gmark-save-page") {
    await savePage(tab.url, tab.title, tab.id);
  } else if (info.menuItemId === "gmark-save-link") {
    await savePage(info.linkUrl, info.linkText || "Link", tab.id);
  }
});

// Message-Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_BOOKMARK") {
    saveBookmark(message.bookmark)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "GET_BOOKMARKS") {
    StorageManager.getAllBookmarks()
      .then((bookmarks) => sendResponse({ bookmarks }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "DELETE_BOOKMARK") {
    StorageManager.deleteBookmark(message.id)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "GET_STATISTICS") {
    StorageManager.getStatistics()
      .then((stats) => sendResponse(stats))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "EXPORT_DATA") {
    StorageManager.exportToJSON()
      .then((data) => sendResponse(data))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "GET_PENDING_DUPLICATES") {
    StorageManager.getPendingDuplicates()
      .then((duplicates) => sendResponse({ duplicates }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

async function savePage(url, title, tabId) {
  try {
    // Extract Seiten-Inhalt vom Tab
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_PAGE_CONTENT",
    });

    const bookmark = {
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

    // Duplikate prüfen
    const existing = await StorageManager.getBookmarkByNormalizedUrl(
      StorageManager.normalizeUrl(url)
    );

    if (existing) {
      // Duplikat gefunden
      chrome.runtime.sendMessage({
        type: "DUPLICATE_FOUND",
        existing,
        new: bookmark,
      });
      return;
    }

    // Speichern
    const saved = await StorageManager.addBookmark(bookmark);

    // Klassifikation im Hintergrund
    chrome.runtime.sendMessage({
      type: "CLASSIFY_BOOKMARK",
      bookmarkId: saved.id,
    });

    return saved;
  } catch (error) {
    console.error("Error saving page:", error);
  }
}

async function saveBookmark(bookmark) {
  try {
    // Check für Duplikate
    const existing = await StorageManager.getBookmarkByNormalizedUrl(
      StorageManager.normalizeUrl(bookmark.url)
    );

    if (existing) {
      throw new Error("Duplikat erkannt");
    }

    // Speichern
    const saved = await StorageManager.addBookmark(bookmark);
    return saved;
  } catch (error) {
    throw error;
  }
}

// Aktive Duplikat-Detection (optional im Hintergrund)
async function detectDuplicatesBackground() {
  const autoDetect = await StorageManager.getSetting("autoDetectDuplicates");
  if (!autoDetect) return;

  const bookmarks = await StorageManager.getAllBookmarks();
  const threshold =
    (await StorageManager.getSetting("similarityThreshold")) || 0.8;

  // Simple Duplikat-Erkennung
  for (let i = 0; i < bookmarks.length; i++) {
    for (let j = i + 1; j < bookmarks.length; j++) {
      const similarity = calculateSimilarity(bookmarks[i], bookmarks[j]);
      if (similarity >= threshold) {
        await StorageManager.recordDuplicate(
          bookmarks[i].id,
          bookmarks[j].id,
          similarity
        );
      }
    }
  }
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

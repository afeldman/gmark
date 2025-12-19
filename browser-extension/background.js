// GMARK Browser Extension - Background Service Worker

// ============================================
// INITIALIZATION
// ============================================

// Installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log("GMARK Extension installed");

  // Create context menu
  try {
    chrome.contextMenus.create({
      id: "saveToGmark",
      title: "In GMARK speichern",
      contexts: ["page", "link"],
    });

    chrome.contextMenus.create({
      id: "saveToGmarkQuick",
      title: "Schnell speichern (Auto-Klassifikation)",
      contexts: ["page", "link"],
    });
  } catch (e) {
    console.log("Context menu already exists or error:", e);
  }

  // Set default settings
  chrome.storage.sync.get(["apiEndpoint"], (result) => {
    if (!result.apiEndpoint) {
      chrome.storage.sync.set({
        apiEndpoint: "http://localhost:8000",
        preferLocalAI: true,
        autoClassify: true,
      });
    }
  });

  // Set up periodic sync alarm
  try {
    chrome.alarms.create("syncBookmarks", { periodInMinutes: 30 });
  } catch (e) {
    console.log("Could not create alarm:", e);
  }
});

// ============================================
// CONTEXT MENU HANDLER
// ============================================

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveToGmark") {
    // Open popup for manual entry
    chrome.action.openPopup?.();
  } else if (info.menuItemId === "saveToGmarkQuick") {
    // Quick save with auto-classification
    await quickSaveBookmark(info.linkUrl || tab.url, tab);
  }
});

// ============================================
// QUICK SAVE FUNCTION
// ============================================

// Quick save bookmark function
async function quickSaveBookmark(url, tab) {
  try {
    const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);

    if (!config.authToken) {
      showNotification(
        "Nicht angemeldet",
        "Bitte in den Extension-Einstellungen anmelden"
      );
      return;
    }

    const endpoint = config.apiEndpoint || "http://localhost:8000";

    // Get page content
    let pageContent = "";
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getPageContent",
      });
      pageContent = response?.content || "";
    } catch (e) {
      console.log("Could not get page content:", e);
    }

    const bookmarkData = {
      url: url,
      title: tab.title,
      auto_classify: true,
      folder_path: "/unsorted",
    };

    showNotification("Speichere...", "Bookmark wird mit AI klassifiziert");

    const response = await fetch(
      `${endpoint}/api/bookmarks?prefer_local_ai=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: config.authToken,
        },
        body: JSON.stringify(bookmarkData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      const folder = result.suggested_folder || bookmarkData.folder_path;
      showNotification(
        "✅ Bookmark gespeichert",
        `${tab.title}\nOrdner: ${folder}`
      );
    } else {
      const error = await response.json();
      showNotification(
        "❌ Fehler",
        error.detail || "Konnte Bookmark nicht speichern"
      );
    }
  } catch (error) {
    console.error("Quick save error:", error);
    showNotification("❌ Fehler", "Verbindung zum Server fehlgeschlagen");
  }
}

// ============================================
// NOTIFICATION FUNCTION
// ============================================

// Show notification
function showNotification(title, message) {
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title,
      message: message,
    });
  } catch (e) {
    console.log("Notification error:", e);
  }
}

// ============================================
// MESSAGE LISTENER
// ============================================

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "showNotification") {
      showNotification(request.title, request.message);
      sendResponse({ success: true });
    } else if (request.action === "quickSave") {
      quickSaveBookmark(request.url, request.tab);
      sendResponse({ success: true });
    }
  } catch (e) {
    console.error("Message listener error:", e);
    sendResponse({ success: false, error: e.message });
  }
});

// ============================================
// KEYBOARD SHORTCUT
// ============================================

// Keyboard shortcut handler (handled automatically by Chrome)
chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    console.log("Keyboard shortcut triggered");
  }
});

// ============================================
// ALARM LISTENER FOR SYNC
// ============================================

// Periodic sync alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "syncBookmarks") {
    await syncBookmarksFromServer();
  }
});

// Sync bookmarks from server (optional feature)
async function syncBookmarksFromServer() {
  try {
    const config = await chrome.storage.sync.get([
      "apiEndpoint",
      "authToken",
      "enableSync",
    ]);

    if (!config.authToken || !config.enableSync) {
      return;
    }

    const endpoint = config.apiEndpoint || "http://localhost:8000";

    const response = await fetch(`${endpoint}/api/bookmarks`, {
      headers: {
        token: config.authToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Store bookmarks locally for offline access (optional)
      await chrome.storage.local.set({
        cachedBookmarks: data.bookmarks,
        lastSync: Date.now(),
      });
      console.log("Synced bookmarks from server");
    }
  } catch (error) {
    console.error("Sync error:", error);
  }
}

// ============================================
// STORAGE LISTENER FOR BADGE UPDATE
// ============================================

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.authToken) {
    updateBadge();
  }
});

function updateBadge() {
  chrome.storage.sync.get(["authToken"], (config) => {
    try {
      if (!config.authToken) {
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }
    } catch (e) {
      console.log("Badge update error:", e);
    }
  });
}

console.log("GMARK Background Service Worker loaded");

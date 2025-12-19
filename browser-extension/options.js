// GMARK Browser Extension - Options Script

// Load settings on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await checkAuthStatus();
  await refreshStats();

  // Add event listeners
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document
    .getElementById("saveSettingsBtn")
    ?.addEventListener("click", saveSettings);
  document
    .getElementById("clearCacheBtn")
    ?.addEventListener("click", clearCache);
  document
    .getElementById("refreshStatsBtn")
    ?.addEventListener("click", refreshStats);
});

// Load saved settings
async function loadSettings() {
  const config = await chrome.storage.sync.get([
    "apiEndpoint",
    "authToken",
    "autoClassify",
    "preferLocalAI",
    "highlightBookmarks",
    "showNotifications",
    "enableSync",
  ]);

  document.getElementById("apiEndpoint").value =
    config.apiEndpoint || "http://localhost:8000";
  document.getElementById("autoClassify").checked =
    config.autoClassify !== false;
  document.getElementById("preferLocalAI").checked =
    config.preferLocalAI !== false;
  document.getElementById("highlightBookmarks").checked =
    config.highlightBookmarks || false;
  document.getElementById("showNotifications").checked =
    config.showNotifications !== false;
  document.getElementById("enableSync").checked = config.enableSync || false;
}

// Save settings
async function saveSettings() {
  const settings = {
    apiEndpoint: document.getElementById("apiEndpoint").value,
    autoClassify: document.getElementById("autoClassify").checked,
    preferLocalAI: document.getElementById("preferLocalAI").checked,
    highlightBookmarks: document.getElementById("highlightBookmarks").checked,
    showNotifications: document.getElementById("showNotifications").checked,
    enableSync: document.getElementById("enableSync").checked,
  };

  await chrome.storage.sync.set(settings);
  showStatus("✅ Einstellungen gespeichert", "success");
}

// Login function
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const endpoint = document.getElementById("apiEndpoint").value;

  if (!username || !password) {
    showStatus("❌ Bitte Benutzername und Passwort eingeben", "error");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${endpoint}/users/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();

      await chrome.storage.sync.set({
        authToken: data.access_token,
        username: username,
        apiEndpoint: endpoint,
      });

      showStatus("✅ Erfolgreich angemeldet!", "success");
      await checkAuthStatus();
      await refreshStats();

      // Clear password field
      document.getElementById("password").value = "";
    } else {
      const error = await response.json();
      showStatus(`❌ Login fehlgeschlagen: ${error.detail}`, "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showStatus("❌ Verbindung zum Server fehlgeschlagen", "error");
  }
}

// Logout function
async function logout() {
  await chrome.storage.sync.remove(["authToken", "username"]);
  showStatus("🔒 Abgemeldet", "info");
  await checkAuthStatus();
  document.getElementById("totalBookmarks").textContent = "-";
  document.getElementById("totalFolders").textContent = "-";
}

// Check authentication status
async function checkAuthStatus() {
  const config = await chrome.storage.sync.get(["authToken", "username"]);
  const authStatus = document.getElementById("authStatus");

  if (config.authToken) {
    authStatus.style.display = "block";

    // Decode JWT to get expiry (simplified - in production use a library)
    try {
      const payload = JSON.parse(atob(config.authToken.split(".")[1]));
      const expiry = new Date(payload.exp * 1000);
      document.getElementById("tokenExpiry").textContent =
        expiry.toLocaleString("de-DE");
    } catch (e) {
      document.getElementById("tokenExpiry").textContent = "Unbekannt";
    }

    // Pre-fill username
    if (config.username) {
      document.getElementById("username").value = config.username;
    }
  } else {
    authStatus.style.display = "none";
  }
}

// Refresh statistics
async function refreshStats() {
  const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);

  if (!config.authToken) {
    return;
  }

  const endpoint = config.apiEndpoint || "http://localhost:8000";

  try {
    // Get bookmarks count
    const bookmarksResponse = await fetch(`${endpoint}/api/bookmarks`, {
      headers: { token: config.authToken },
    });

    if (bookmarksResponse.ok) {
      const bookmarksData = await bookmarksResponse.json();
      document.getElementById("totalBookmarks").textContent =
        bookmarksData.bookmarks?.length || 0;
    }

    // Get folders count
    const foldersResponse = await fetch(`${endpoint}/api/folders`, {
      headers: { token: config.authToken },
    });

    if (foldersResponse.ok) {
      const foldersData = await foldersResponse.json();
      const folderCount = countFolders(foldersData.folders || []);
      document.getElementById("totalFolders").textContent = folderCount;
    }

    // Last sync time
    const syncData = await chrome.storage.local.get(["lastSync"]);
    if (syncData.lastSync) {
      const lastSync = new Date(syncData.lastSync);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSync) / 60000);

      if (diffMinutes < 1) {
        document.getElementById("lastSync").textContent = "Gerade eben";
      } else if (diffMinutes < 60) {
        document.getElementById("lastSync").textContent = `vor ${diffMinutes}m`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        document.getElementById("lastSync").textContent = `vor ${diffHours}h`;
      }
    } else {
      document.getElementById("lastSync").textContent = "Nie";
    }
  } catch (error) {
    console.error("Stats refresh error:", error);
  }
}

// Count folders recursively
function countFolders(folders) {
  let count = folders.length;
  folders.forEach((folder) => {
    if (folder.children && folder.children.length > 0) {
      count += countFolders(folder.children);
    }
  });
  return count;
}

// Clear cache
async function clearCache() {
  if (!confirm("Möchten Sie wirklich den Cache leeren?")) {
    return;
  }

  await chrome.storage.local.clear();
  showStatus("🗑️ Cache geleert", "info");
  document.getElementById("lastSync").textContent = "-";
}

// Show status message
function showStatus(message, type = "info") {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status ${type} show`;

  setTimeout(() => {
    statusEl.classList.remove("show");
  }, 3000);
}

// Auto-save on checkbox change
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", saveSettings);
});

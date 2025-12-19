/**
 * GMARK Local - Popup Script
 */

import StorageManager from "../utils/storage.js";

console.log("📱 Popup.js loading...");

const app = {
  state: "main",
  settings: {},

  async init() {
    console.log("📱 App initializing...");
    this.showLoading();
    try {
      console.log("📱 Sending GET_BOOTSTRAP_STATUS message...");
      // Überprüfe ob Bootstrap nötig ist
      const bootstrapStatus = await chrome.runtime.sendMessage({
        type: "GET_BOOTSTRAP_STATUS",
      });

      console.log("📱 Bootstrap status:", bootstrapStatus);

      if (!bootstrapStatus.complete) {
        this.showView("bootstrap");
        return;
      }

      await this.loadSettings();
      await this.loadStats();
      this.attachEventListeners();
      this.showView("main");
    } catch (error) {
      console.error("📱 Error in app.init:", error);
      this.showError(error.message);
    }
  },

  async loadSettings() {
    this.settings = await StorageManager.getAllSettings();
  },

  async loadStats() {
    const stats = await StorageManager.getStatistics();
    document.getElementById("stat-bookmarks").textContent =
      stats.totalBookmarks;
    document.getElementById("stat-duplicates").textContent =
      stats.totalDuplicates;
    document.getElementById("stat-categories").textContent =
      stats.categoriesCount;

    await this.loadRecentBookmarks();
  },

  async loadRecentBookmarks() {
    const bookmarks = await StorageManager.getAllBookmarks();
    const recent = bookmarks.slice(-5).reverse();

    const list = document.getElementById("recent-list");
    list.innerHTML = "";

    if (recent.length === 0) {
      list.innerHTML =
        '<p class="empty-message">Noch keine Bookmarks gespeichert</p>';
      return;
    }

    for (const bookmark of recent) {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="bookmark-info">
          <h3>${escapeHtml(bookmark.title)}</h3>
          <p class="url">${escapeHtml(bookmark.url)}</p>
          <div class="tags">
            <span class="category">${bookmark.category}</span>
            ${bookmark.tags
              .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
              .join("")}
          </div>
        </div>
        <button class="delete-btn" data-id="${
          bookmark.id
        }" title="Löschen">✕</button>
      `;

      item.querySelector(".delete-btn").addEventListener("click", () => {
        this.deleteBookmark(bookmark.id);
      });

      list.appendChild(item);
    }
  },

  async deleteBookmark(id) {
    if (confirm("Soll dieses Bookmark wirklich gelöscht werden?")) {
      await StorageManager.deleteBookmark(id);
      await this.loadStats();
    }
  },

  attachEventListeners() {
    // Main View
    document.getElementById("menu-btn").addEventListener("click", () => {
      document.getElementById("menu").classList.toggle("hidden");
    });

    document.getElementById("save-current").addEventListener("click", () => {
      this.saveCurrentPage();
    });

    document
      .getElementById("manage-duplicates")
      .addEventListener("click", () => {
        chrome.runtime.openOptionsPage?.() ||
          chrome.tabs.create({ url: "src/ui/duplicates.html" });
      });

    document.getElementById("view-dashboard").addEventListener("click", () => {
      chrome.tabs.create({ url: "src/ui/dashboard.html" });
    });

    // Menu
    document.getElementById("menu-settings").addEventListener("click", () => {
      this.showView("settings");
    });

    document.getElementById("menu-export").addEventListener("click", () => {
      this.exportData();
    });

    document.getElementById("menu-import").addEventListener("click", () => {
      this.importData();
    });

    document.getElementById("menu-clear").addEventListener("click", () => {
      if (
        confirm(
          "Alle Daten löschen? Dies kann nicht rückgängig gemacht werden!"
        )
      ) {
        StorageManager.clearAll().then(() => {
          location.reload();
        });
      }
    });

    // Settings View
    document.getElementById("back-btn").addEventListener("click", () => {
      this.showView("main");
    });

    document.getElementById("auto-classify").addEventListener("change", (e) => {
      StorageManager.setSetting("autoClassify", e.target.checked);
    });

    document
      .getElementById("auto-detect-duplicates")
      .addEventListener("change", (e) => {
        StorageManager.setSetting("autoDetectDuplicates", e.target.checked);
      });

    document
      .getElementById("similarity-threshold")
      .addEventListener("change", (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById("threshold-value").textContent =
          value.toFixed(1);
        StorageManager.setSetting("similarityThreshold", value);
      });

    document
      .getElementById("use-prompt-api")
      .addEventListener("change", (e) => {
        StorageManager.setSetting("usePromptAPI", e.target.checked);
      });

    // Error View
    document.getElementById("error-close").addEventListener("click", () => {
      this.showView("main");
    });

    // Bootstrap View
    const bootstrapBtn = document.getElementById("start-bootstrap-btn");
    if (bootstrapBtn) {
      bootstrapBtn.addEventListener("click", () => {
        this.startBootstrap();
      });
    }
  },

  async saveCurrentPage() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    try {
      const content = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_PAGE_CONTENT",
      });

      const bookmark = {
        url: tab.url,
        title: tab.title || content.title,
        content: content.content,
        description: content.description,
        category: "Uncategorized",
        tags: [],
        summary: "",
        confidenceScore: 0,
      };

      // Check Duplikate
      const existing = await StorageManager.getBookmarkByNormalizedUrl(
        StorageManager.normalizeUrl(bookmark.url)
      );

      if (existing) {
        if (
          confirm(
            `Bookmark bereits vorhanden:\n\n${existing.title}\n\nÜberschreiben?`
          )
        ) {
          await StorageManager.updateBookmark(existing.id, bookmark);
        }
        return;
      }

      await StorageManager.addBookmark(bookmark);
      alert("✅ Bookmark gespeichert!");
      await this.loadStats();
    } catch (error) {
      this.showError(`Fehler beim Speichern: ${error.message}`);
    }
  },

  async exportData() {
    const data = await StorageManager.exportToJSON();
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gmark-local-${Date.now()}.json`;
    link.click();

    alert("✅ Daten exportiert!");
  },

  async importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await StorageManager.importFromJSON(data);
        alert("✅ Daten importiert!");
        await this.loadStats();
      } catch (error) {
        this.showError(`Fehler beim Importieren: ${error.message}`);
      }
    });

    input.click();
  },

  showView(viewName) {
    console.log(`📱 Showing view: ${viewName}`);
    document.querySelectorAll(".state").forEach((el) => {
      el.classList.add("hidden");
    });

    if (viewName === "main") {
      document.getElementById("main-view").classList.remove("hidden");
    } else if (viewName === "settings") {
      this.populateSettingsView();
      document.getElementById("settings-view").classList.remove("hidden");
    } else if (viewName === "error") {
      document.getElementById("error-view").classList.remove("hidden");
    } else if (viewName === "bootstrap") {
      document.getElementById("bootstrap-view").classList.remove("hidden");
    }

    this.state = viewName;
  },

  populateSettingsView() {
    document.getElementById("auto-classify").checked =
      this.settings.autoClassify ?? true;
    document.getElementById("auto-detect-duplicates").checked =
      this.settings.autoDetectDuplicates ?? true;
    document.getElementById("similarity-threshold").value =
      this.settings.similarityThreshold ?? 0.8;
    document.getElementById("threshold-value").textContent = (
      this.settings.similarityThreshold ?? 0.8
    ).toFixed(1);
    document.getElementById("use-prompt-api").checked =
      this.settings.usePromptAPI ?? true;
  },

  showLoading() {
    console.log("📱 Showing loading state");
    document.querySelectorAll(".state").forEach((el) => {
      el.classList.add("hidden");
    });
    document.getElementById("loading").classList.remove("hidden");
  },

  showError(message) {
    console.error("📱 Showing error:", message);
    document.getElementById("error-message").textContent = message;
    this.showView("error");
  },

  // Bootstrap-Methoden
  async startBootstrap() {
    const progressDiv = document.getElementById("bootstrap-progress");
    const btn = document.getElementById("start-bootstrap-btn");

    // Zeige Progress-Bereich
    progressDiv.classList.remove("hidden");
    btn.disabled = true;
    btn.textContent = "⏳ Wird ausgeführt...";

    // Höre auf Progress-Updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "BOOTSTRAP_PROGRESS") {
        this.updateBootstrapProgress(message.progress);
      }
    });

    try {
      // Starte Bootstrap
      const result = await chrome.runtime.sendMessage({
        type: "START_BOOTSTRAP",
      });

      if (result.success) {
        document.getElementById("progress-text").textContent =
          "✅ Importieren abgeschlossen!";

        // Warte 2 Sekunden dann zeige Main View
        setTimeout(() => {
          this.init();
        }, 2000);
      } else if (result.configured === false) {
        // Chrome ist nicht konfiguriert - zeige Dialog mit Optionen
        this.showConfigurationDialog(result);
      } else {
        this.showError(result.error || "Bootstrap fehlgeschlagen");
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      btn.disabled = false;
    }
  },

  showConfigurationDialog(result) {
    // Verberge die Progress Bar
    const progressSection = document.getElementById("bootstrap-view");
    if (progressSection) {
      progressSection.style.display = "none";
    }

    const dialog = document.createElement("div");
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    content.innerHTML = `
      <h2 style="margin-top: 0; color: #333;">⚙️ Chrome Konfiguration erforderlich</h2>
      <p style="color: #666; line-height: 1.6;">
        Dein Browser benötigt die Prompt API (Gemini Nano) Konfiguration.
        Du kannst entweder:
      </p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #333;">Option 1: Chrome konfigurieren</h4>
        <p style="margin: 0; color: #666; font-size: 13px;">
          Aktiviere Prompt API und lade Gemini Nano herunter
        </p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #333;">Option 2: Ollama/LM Studio nutzen</h4>
        <p style="margin: 0; color: #666; font-size: 13px;">
          Wechsle zu einem lokalen AI Provider in den Einstellungen
        </p>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 30px;">
        <button id="btn-configure-chrome" style="
          flex: 1;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">🔧 Chrome konfigurieren</button>
        <button id="btn-use-alternative" style="
          flex: 1;
          padding: 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">⚙️ Provider wechseln</button>
      </div>
    `;

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    document
      .getElementById("btn-configure-chrome")
      .addEventListener("click", () => {
        // Öffne alle Chrome-Flags in neuen Tabs
        chrome.tabs.create({
          url: "chrome://flags/#prompt-api-for-gemini-nano",
        });
        chrome.tabs.create({
          url: "chrome://components",
        });
        chrome.tabs.create({
          url: "chrome://flags/#optimization-guide-on-device-model",
        });
        dialog.remove();
        // Zeige Instructions
        if (progressSection) {
          progressSection.style.display = "block";
        }
      });

    document
      .getElementById("btn-use-alternative")
      .addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
        dialog.remove();
      });
  },

  updateBootstrapProgress(progress) {
    const percentage = progress.percentage || 0;
    document.getElementById("progress-fill").style.width = percentage + "%";
    document.getElementById(
      "progress-text"
    ).textContent = `${progress.processed}/${progress.total} Bookmarks verarbeitet (${percentage}%)`;
    document.getElementById("stat-success").textContent = progress.success;
    document.getElementById("stat-failed").textContent = progress.failed;
    document.getElementById("stat-skipped").textContent = progress.skipped;
  },
};

// Utility
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Init
console.log("📱 Adding DOMContentLoaded listener...");
document.addEventListener("DOMContentLoaded", () => {
  console.log("📱 DOMContentLoaded fired, calling app.init()");
  try {
    app.init().catch((error) => {
      console.error("📱 Unhandled error in app.init:", error);
      document.body.innerHTML = `<div style="padding: 20px; color: red;"><h2>Fehler beim Laden des Popups</h2><p>${error.message}</p><details><pre>${error.stack}</pre></details></div>`;
    });
  } catch (error) {
    console.error("📱 Synchronous error:", error);
  }
});

console.log("📱 Popup.js loaded successfully");

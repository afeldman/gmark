// GMARK Browser Extension - Popup Script

let currentTab = null;
let aiClassification = null;

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentTab();
  await checkAuth();
  await loadFolders();

  // Auto-classify if enabled
  const autoClassify = document.getElementById("autoClassify");
  if (autoClassify.checked) {
    classifyPage();
  }

  // Add event listeners
  document.getElementById("saveBtn")?.addEventListener("click", saveBookmark);
  document
    .getElementById("cancelBtn")
    ?.addEventListener("click", () => window.close());
  document
    .getElementById("settingsBtn")
    ?.addEventListener("click", openOptions);
  document.getElementById("settingsLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    openOptions();
  });
  document
    .getElementById("useSuggestionBtn")
    ?.addEventListener("click", useSuggestion);
});

// Load current tab information
async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  document.getElementById("url").value = tab.url;
  document.getElementById("title").value = tab.title;
}

// Check authentication status
async function checkAuth() {
  const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);

  if (!config.authToken) {
    document.getElementById("loginPrompt").classList.remove("hidden");
    document.getElementById("bookmarkForm").classList.add("hidden");
    return false;
  }

  return true;
}

// Load folder list from API
async function loadFolders() {
  try {
    const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);
    const endpoint = config.apiEndpoint || "http://localhost:8000";

    const response = await fetch(`${endpoint}/api/folders`, {
      headers: {
        token: config.authToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      populateFolderSelect(data.folders);
    }
  } catch (error) {
    console.error("Failed to load folders:", error);
  }
}

// Populate folder dropdown
function populateFolderSelect(folders) {
  const select = document.getElementById("folderPath");
  select.innerHTML = '<option value="/unsorted">/unsorted (Standard)</option>';

  function addFolder(folder, level = 0) {
    const indent = "  ".repeat(level);
    const option = document.createElement("option");
    option.value = folder.full_path;
    option.textContent =
      indent + folder.full_path + ` (${folder.bookmark_count})`;
    select.appendChild(option);

    if (folder.children && folder.children.length > 0) {
      folder.children.forEach((child) => addFolder(child, level + 1));
    }
  }

  folders.forEach((folder) => addFolder(folder));
}

// Classify page with AI
async function classifyPage() {
  const aiStatus = document.getElementById("aiStatus");
  const aiStatusText = document.getElementById("aiStatusText");

  aiStatus.classList.remove("hidden");
  aiStatus.classList.add("processing");
  aiStatusText.textContent = "AI analysiert Seite...";

  try {
    // Get page content from content script
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getPageContent",
    });

    // Try Chrome AI first
    const classification = await classifyWithChromeAI(
      currentTab.url,
      currentTab.title,
      response?.content || ""
    );

    if (classification) {
      aiClassification = classification;
      displayClassification(classification);
      aiStatusText.textContent = "✅ Mit Chrome AI klassifiziert";
      setTimeout(() => aiStatus.classList.add("hidden"), 2000);
    } else {
      // Fallback to backend API
      await classifyWithBackend(response?.content || "");
    }
  } catch (error) {
    console.error("Classification error:", error);
    aiStatusText.textContent = "⚠️ AI-Klassifikation fehlgeschlagen";
    aiStatus.classList.remove("processing");
  }
}

// Classify with Chrome AI (Gemini Nano)
async function classifyWithChromeAI(url, title, content) {
  try {
    if (typeof window.ai === "undefined") {
      return null;
    }

    const canUse = await window.ai.canCreateTextSession();
    if (canUse !== "readily") {
      return null;
    }

    const session = await window.ai.createTextSession({
      temperature: 0.7,
      topK: 3,
    });

    const prompt = `Analyze this webpage and provide:
1. 5 relevant keywords (comma-separated)
2. A brief summary (1-2 sentences)
3. A suggested folder path in format /category/subcategory

URL: ${url}
Title: ${title}
Content: ${content.substring(0, 1000)}

Respond with JSON:
{"keywords": ["k1","k2","k3","k4","k5"], "summary": "...", "folder_path": "/path"}`;

    const response = await session.prompt(prompt);
    await session.destroy();

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error("Chrome AI error:", error);
    return null;
  }
}

// Classify with backend API
async function classifyWithBackend(content) {
  const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);
  const endpoint = config.apiEndpoint || "http://localhost:8000";

  // Backend will handle classification
  const aiStatusText = document.getElementById("aiStatusText");
  aiStatusText.textContent = "🌐 Backend-AI klassifiziert...";

  // For now, just indicate backend will handle it
  setTimeout(() => {
    document.getElementById("aiStatus").classList.add("hidden");
  }, 1500);
}

// Display classification results
function displayClassification(classification) {
  // Show suggested folder
  if (classification.folder_path) {
    document.getElementById("suggestedFolder").textContent =
      classification.folder_path;
    document.getElementById("folderSuggestion").classList.remove("hidden");
  }

  // Show keywords
  if (classification.keywords && classification.keywords.length > 0) {
    const keywordsList = document.getElementById("keywordsList");
    keywordsList.innerHTML = "";

    classification.keywords.forEach((keyword) => {
      const tag = document.createElement("span");
      tag.className = "keyword-tag";
      tag.textContent = keyword;
      keywordsList.appendChild(tag);
    });

    document.getElementById("keywordsDisplay").classList.remove("hidden");
  }

  // Fill description if available
  if (classification.summary) {
    const descField = document.getElementById("description");
    if (!descField.value) {
      descField.value = classification.summary;
    }
  }
}

// Use AI suggested folder
function useSuggestion() {
  const suggested = document.getElementById("suggestedFolder").textContent;
  document.getElementById("folderPath").value = suggested;
  showStatus("Ordner-Empfehlung übernommen", "success");
}

// Save bookmark
async function saveBookmark() {
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "💾 Speichere...";

  try {
    const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);
    const endpoint = config.apiEndpoint || "http://localhost:8000";

    const bookmarkData = {
      url: document.getElementById("url").value,
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      folder_path: document.getElementById("folderPath").value,
      auto_classify: document.getElementById("autoClassify").checked,
    };

    const response = await fetch(`${endpoint}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: config.authToken,
      },
      body: JSON.stringify(bookmarkData),
    });

    if (response.ok) {
      const result = await response.json();
      showStatus("✅ Bookmark erfolgreich gespeichert!", "success");

      // Send notification
      chrome.runtime.sendMessage({
        action: "showNotification",
        title: "Bookmark gespeichert",
        message: `${bookmarkData.title} wurde gespeichert`,
      });

      // Close popup after 1 second
      setTimeout(() => window.close(), 1000);
    } else {
      const error = await response.json();
      showStatus(`❌ Fehler: ${error.detail || "Unbekannter Fehler"}`, "error");
    }
  } catch (error) {
    console.error("Save error:", error);
    showStatus("❌ Verbindungsfehler zum Server", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 Speichern";
  }
}

// Show status message
function showStatus(message, type = "info") {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove("hidden");

  setTimeout(() => {
    statusEl.classList.add("hidden");
  }, 3000);
}

// Open options page
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// Listen for auto-classify checkbox
document.getElementById("autoClassify")?.addEventListener("change", (e) => {
  if (e.target.checked) {
    classifyPage();
  }
});

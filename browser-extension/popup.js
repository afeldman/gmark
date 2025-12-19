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
        Authorization: `Bearer ${config.authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      populateFolderSelect(data.folders || []);
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
async function classifyWithBackend() {
  const config = await chrome.storage.sync.get(["apiEndpoint", "authToken"]);
  const endpoint = config.apiEndpoint || "http://localhost:8000";
  const aiStatusText = document.getElementById("aiStatusText");

  try {
    aiStatusText.textContent = "🔍 Analysiere URL mit Backend-AI...";

    // Rufe Classification Endpoint auf
    const response = await fetch(`${endpoint}/api/bookmarks/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.authToken}`,
      },
      body: JSON.stringify({
        url: currentTab.url,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      aiClassification = result.classification;

      // Populate form fields mit Klassifikation
      if (result.metadata?.title && !document.getElementById("title").value) {
        document.getElementById("title").value = result.metadata.title;
      }

      if (
        result.metadata?.description &&
        !document.getElementById("description").value
      ) {
        document.getElementById("description").value =
          result.metadata.description;
      }

      // Display classification
      displayBackendClassification(result.classification);

      aiStatusText.textContent = `✅ Klassifiziert als "${
        result.classification.category
      }" (${Math.round(result.classification.confidence * 100)}%)`;
      setTimeout(() => {
        document.getElementById("aiStatus").classList.add("hidden");
      }, 3000);
    } else {
      throw new Error("Classification failed");
    }
  } catch (error) {
    console.error("Backend classification error:", error);
    aiStatusText.textContent =
      "⚠️ Classification fehlgeschlagen, verwende Defaults";
    setTimeout(() => {
      document.getElementById("aiStatus").classList.add("hidden");
    }, 2000);
  }
}

// Display backend classification results
function displayBackendClassification(classification) {
  // Show category
  const categoryBadge = document.getElementById("categoryBadge");
  if (!categoryBadge) {
    const badge = document.createElement("div");
    badge.id = "categoryBadge";
    badge.className = "category-badge";
    document
      .getElementById("aiStatus")
      .parentElement.insertBefore(badge, document.getElementById("aiStatus"));
  }

  const badge = document.getElementById("categoryBadge");
  badge.textContent = `📁 ${classification.category}`;
  badge.classList.remove("hidden");

  // Show tags
  if (classification.tags && classification.tags.length > 0) {
    const keywordsList = document.getElementById("keywordsList");
    keywordsList.innerHTML = "";

    classification.tags.forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.className = "keyword-tag";
      tagEl.textContent = tag;
      keywordsList.appendChild(tag);
    });

    document.getElementById("keywordsDisplay").classList.remove("hidden");
  }
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
      title: document.getElementById("title").value,
      url: document.getElementById("url").value,
      description: document.getElementById("description").value,
      tags: Array.from(
        document.querySelectorAll("#keywordsList .keyword-tag")
      ).map((t) => t.textContent),
      category: aiClassification?.category || null,
      folder_id: document.getElementById("folderPath").value,
      autoClassify: document.getElementById("autoClassify").checked,
    };

    const response = await fetch(`${endpoint}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.authToken}`,
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
      showStatus(`❌ Fehler: ${error.error || "Unbekannter Fehler"}`, "error");
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

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

// Classify page with AI - Priorität: Prompt API → Backend → Offline
async function classifyPage() {
  const aiStatus = document.getElementById("aiStatus");
  const aiStatusText = document.getElementById("aiStatusText");

  aiStatus.classList.remove("hidden");
  aiStatus.classList.add("processing");
  aiStatusText.textContent = "🔍 AI analysiert Seite...";

  try {
    // 1. Versuche Chrome Prompt API (On-Device LLM)
    const promptApiResult = await classifyWithPromptAPI(
      currentTab.url,
      currentTab.title
    );

    if (promptApiResult) {
      aiClassification = {
        ...promptApiResult,
        method: "prompt-api",
      };
      displayClassificationResult(promptApiResult);
      aiStatusText.textContent =
        "✅ Mit Chrome Prompt API klassifiziert (On-Device)";
      setTimeout(() => aiStatus.classList.add("hidden"), 2500);
      return;
    }

    // 2. Fallback: Backend-Klassifikation
    await classifyWithBackend();
  } catch (error) {
    console.error("Classification error:", error);
    aiStatusText.textContent = "⚠️ AI-Klassifikation fehlgeschlagen";
    aiStatus.classList.remove("processing");
  }
}

// Klassifiziere mit Chrome Prompt API (Gemini Nano - On-Device)
async function classifyWithPromptAPI(url, title) {
  try {
    // Prüfe ob Prompt API verfügbar ist
    if (typeof window.ai === "undefined") {
      console.log("Prompt API nicht verfügbar");
      return null;
    }

    // Prüfe ob Text-Session erstellt werden kann
    const canUse = await window.ai.canCreateTextSession();
    console.log("Prompt API Status:", canUse);

    if (canUse !== "readily" && canUse !== "after-download") {
      // "readily" = sofort verfügbar
      // "after-download" = nach Download verfügbar (könnte warten)
      // andere = nicht verfügbar
      return null;
    }

    const aiStatusText = document.getElementById("aiStatusText");
    aiStatusText.textContent = "⏳ Laden Sie das lokale LLM-Modell...";

    // Erstelle Text-Session (lädt Modell herunter falls nötig)
    const session = await window.ai.createTextSession({
      temperature: 0.3, // Niedrig für konsistente Klassifikation
      topK: 1,
    });

    // Spezifischer Prompt für Bookmark-Klassifikation
    const prompt = `Du bist ein Experte für URL-Klassifikation. Analysiere diese Webpage und klassifiziere sie.

URL: ${url}
Title: ${title}

Antworte AUSSCHLIESSLICH im JSON-Format (kein zusätzlicher Text):
{
  "category": "Development|Social|News|Shopping|Education|Entertainment|Documentation|Tools|Other",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}

Kategorien:
- Development: Code, GitHub, APIs, Frameworks, Dokumentation für Entwicklung
- Social: Twitter, Facebook, Instagram, Reddit, LinkedIn, YouTube
- News: Nachrichten, Blogs, Artikel, Journalismus
- Shopping: Amazon, eBay, Online-Shops, Produkte
- Education: Kurse, Tutorials, Universitäten, Learning Platforms
- Entertainment: Netflix, Filme, Musik, Spiele
- Documentation: Technische Dokumentation, Handbücher, Referenzen
- Tools: Online-Tools, Converter, Generatoren, Editoren
- Other: Sonstiges`;

    const response = await session.prompt(prompt);
    await session.destroy();

    console.log("Prompt API Response:", response);

    // Parse JSON aus Response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        category: result.category,
        tags: result.tags || [],
        confidence: result.confidence || 0.8,
      };
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Prompt API error:", message);
    return null;
  }
}

// Display Klassifikationsergebnis (einheitlich für alle Methoden)
function displayClassificationResult(classification) {
  const aiStatus = document.getElementById("aiStatus");
  const categoryBadge = document.getElementById("categoryBadge");

  // Erstelle oder update Category Badge
  if (!categoryBadge) {
    const badge = document.createElement("div");
    badge.id = "categoryBadge";
    badge.className = "category-badge";
    aiStatus.parentElement.insertBefore(badge, aiStatus);
  }

  const badge = document.getElementById("categoryBadge");
  badge.textContent = `📁 ${classification.category} (${Math.round(
    (classification.confidence || 0.8) * 100
  )}%)`;
  badge.classList.remove("hidden");

  // Zeige Tags
  if (classification.tags && classification.tags.length > 0) {
    const keywordsList = document.getElementById("keywordsList");
    keywordsList.innerHTML = "";

    classification.tags.forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.className = "keyword-tag";
      tagEl.textContent = tag;
      keywordsList.appendChild(tagEl);
    });

    document.getElementById("keywordsDisplay").classList.remove("hidden");
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
  // Nutze einheitliche Funktion
  displayClassificationResult(classification);
}

// Display classification results
function displayClassification(classification) {
  // Nutze einheitliche Funktion
  displayClassificationResult(classification);
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

/**
 * Options Page Logic for GMARK Local
 * Handles provider selection, configuration, and testing
 */

// DOM Elements
const aiProviderSelect = document.getElementById("aiProvider");
const checkProviderBtn = document.getElementById("checkProviderBtn");
const testProviderBtn = document.getElementById("testProviderBtn");
const providerStatus = document.getElementById("providerStatus");
const modelsList = document.getElementById("modelsList");
const providerInfo = document.getElementById("providerInfo");

const ollamaConfig = document.getElementById("ollamaConfig");
const ollamaUrl = document.getElementById("ollamaUrl");
const ollamaModel = document.getElementById("ollamaModel");

const lmStudioConfig = document.getElementById("lmStudioConfig");
const lmStudioUrl = document.getElementById("lmStudioUrl");
const lmStudioModel = document.getElementById("lmStudioModel");

const autoClassify = document.getElementById("autoClassify");
const autoDetectDuplicates = document.getElementById("autoDetectDuplicates");

const resetBtn = document.getElementById("resetBtn");
const saveStatus = document.getElementById("saveStatus");

// Provider Info Text
const providerTexts = {
  "prompt-api":
    "🎯 Chrome Prompt API mit Gemini Nano - Schnellste Methode, völlig lokal, keine externe Abhängigkeit.",
  ollama:
    "🦙 Ollama - Open-source LLM Framework. Lade dein favorites Modell herunter und führe es lokal aus.",
  "lm-studio":
    "🎮 LM Studio - Benutzerfreundliche Desktop-App zum Download und Ausführen von LLMs mit GUI.",
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", loadSettings);

// Event Listeners
aiProviderSelect.addEventListener("change", handleProviderChange);
checkProviderBtn.addEventListener("click", checkProviderAvailability);
testProviderBtn.addEventListener("click", testProvider);
resetBtn.addEventListener("click", resetSettings);

// Auto-Save beim Ändern von Checkboxen
autoClassify.addEventListener("change", (e) => {
  chrome.runtime
    .sendMessage({
      type: "setSetting",
      key: "autoClassify",
      value: e.target.checked,
    })
    .then(() => {
      console.log("✅ autoClassify gespeichert:", e.target.checked);
      showStatus("success", "✅ Automatisch gespeichert", "saveStatus");
      setTimeout(() => clearStatus("saveStatus"), 2000);
    });
});

autoDetectDuplicates.addEventListener("change", (e) => {
  chrome.runtime
    .sendMessage({
      type: "setSetting",
      key: "autoDetectDuplicates",
      value: e.target.checked,
    })
    .then(() => {
      console.log("✅ autoDetectDuplicates gespeichert:", e.target.checked);
      showStatus("success", "✅ Automatisch gespeichert", "saveStatus");
      setTimeout(() => clearStatus("saveStatus"), 2000);
    });
});

// Auto-Save für Provider-Felder (mit Debounce)
let saveTimeout;
const debounceSave = (callback) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(callback, 1000); // 1 Sekunde Verzögerung
};

ollamaUrl.addEventListener("input", () => {
  debounceSave(() => saveProviderField("ollama", "url", ollamaUrl.value));
});

ollamaModel.addEventListener("input", () => {
  debounceSave(() => saveProviderField("ollama", "model", ollamaModel.value));
});

lmStudioUrl.addEventListener("input", () => {
  debounceSave(() => saveProviderField("lm-studio", "url", lmStudioUrl.value));
});

lmStudioModel.addEventListener("input", () => {
  debounceSave(() =>
    saveProviderField("lm-studio", "model", lmStudioModel.value)
  );
});

/**
 * Save individual provider field
 */
async function saveProviderField(provider, field, value) {
  console.log(`💾 Speichere ${provider}.${field}:`, value);

  try {
    // Lade aktuelle Config
    const response = await chrome.runtime.sendMessage({
      type: "getProviderConfig",
      provider: provider,
    });

    const config = response?.config || {};
    config[field] = value;

    // Speichere aktualisierte Config
    await chrome.runtime.sendMessage({
      type: "setProviderConfig",
      provider: provider,
      config: config,
    });

    console.log("✅ Gespeichert");
    showStatus("success", "✅ Automatisch gespeichert", "saveStatus");
    setTimeout(() => clearStatus("saveStatus"), 2000);
  } catch (error) {
    console.error("❌ Fehler beim Speichern:", error);
    showStatus("error", "❌ Fehler beim Speichern", "saveStatus");
  }
}

// Prevent auto-save during initial load
let isInitialLoad = true;

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    // Get storage manager from background
    const response = await chrome.runtime.sendMessage({
      type: "getSetting",
      key: "aiProvider",
    });

    const provider = response?.value || "prompt-api";
    aiProviderSelect.value = provider;

    // Load provider-specific settings
    await loadProviderSettings(provider);

    // Load other settings
    const autoClassifyResponse = await chrome.runtime.sendMessage({
      type: "getSetting",
      key: "autoClassify",
    });
    autoClassify.checked = autoClassifyResponse?.value !== false;

    const autoDetectResponse = await chrome.runtime.sendMessage({
      type: "getSetting",
      key: "autoDetectDuplicates",
    });
    autoDetectDuplicates.checked = autoDetectResponse?.value !== false;

    handleProviderChange();

    // Enable auto-save after initial load
    setTimeout(() => {
      isInitialLoad = false;
    }, 500);
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

/**
 * Load provider-specific configuration
 */
async function loadProviderSettings(provider) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "getProviderConfig",
      provider: provider,
    });

    const config = response?.config || {};

    if (provider === "ollama") {
      ollamaUrl.value = config.url || "http://localhost:11434";
      ollamaModel.value = config.model || "llama2";
    } else if (provider === "lm-studio") {
      lmStudioUrl.value = config.url || "http://localhost:1234";
      lmStudioModel.value = config.model || "default";
    }
  } catch (error) {
    console.error("Error loading provider settings:", error);
  }
}

/**
 * Handle provider change
 */
async function handleProviderChange() {
  const provider = aiProviderSelect.value;

  // Show/hide provider-specific configs
  ollamaConfig.style.display = provider === "ollama" ? "block" : "none";
  lmStudioConfig.style.display = provider === "lm-studio" ? "block" : "none";

  // Update provider info
  providerInfo.textContent = providerTexts[provider] || "";

  // Clear previous status
  clearStatus();

  // Auto-Save Provider-Auswahl (nur wenn nicht initial load)
  if (!isInitialLoad) {
    try {
      await chrome.runtime.sendMessage({
        type: "setSetting",
        key: "aiProvider",
        value: provider,
      });
      console.log("✅ AI Provider gespeichert:", provider);
      showStatus("success", "✅ Provider gespeichert", "saveStatus");
      setTimeout(() => clearStatus("saveStatus"), 2000);
    } catch (error) {
      console.error("❌ Fehler beim Speichern des Providers:", error);
    }
  }
}

/**
 * Check provider availability
 */
async function checkProviderAvailability() {
  const provider = aiProviderSelect.value;

  try {
    checkProviderBtn.disabled = true;
    showStatus("info", "⏳ Prüfe " + provider + " Verfügbarkeit...");

    const response = await chrome.runtime.sendMessage({
      type: "checkProviderAvailability",
      provider: provider,
      config: getProviderConfig(),
    });

    if (response.available) {
      let message = "✅ Provider ist verfügbar";

      if (response.models && response.models.length > 0) {
        message += ` (${response.models.length} Modelle gefunden)`;
        displayModels(response.models);
      }

      showStatus("success", message);
    } else {
      let message = "❌ Provider nicht erreichbar";

      if (response.error) {
        message += ": " + response.error;
      }

      if (response.help) {
        message += "\n\n💡 Hilfe: " + response.help;
      }

      showStatus("error", message);
    }
  } catch (error) {
    console.error("Error checking provider:", error);
    showStatus("error", "❌ Fehler beim Prüfen: " + error.message);
  } finally {
    checkProviderBtn.disabled = false;
  }
}

/**
 * Test provider by sending a test classification
 */
async function testProvider() {
  const provider = aiProviderSelect.value;

  try {
    testProviderBtn.disabled = true;
    showStatus("info", "⏳ Teste " + provider + "...");

    const testData = {
      url: "https://example.com/test",
      title: "Test Article",
      summary:
        "Dies ist ein Test-Artikel über Programmierung und Software-Entwicklung.",
      tags: [],
    };

    const response = await chrome.runtime.sendMessage({
      type: "classifyWithProvider",
      provider: provider,
      data: testData,
      config: getProviderConfig(),
    });

    if (response.error) {
      showStatus("error", "❌ Test fehlgeschlagen: " + response.error);
    } else {
      showStatus(
        "success",
        "✅ Test erfolgreich!\n\n" +
          "📁 Kategorie: " +
          response.category +
          "\n" +
          "📊 Vertrauen: " +
          (response.confidence * 100).toFixed(0) +
          "%\n" +
          "🏷️ Tags: " +
          (response.tags.join(", ") || "keine")
      );
    }
  } catch (error) {
    console.error("Error testing provider:", error);
    showStatus("error", "❌ Test-Fehler: " + error.message);
  } finally {
    testProviderBtn.disabled = false;
  }
}

/**
 * Reset to default settings
 */
async function resetSettings() {
  if (
    !confirm(
      "Sollen wirklich alle Einstellungen auf Standard zurückgesetzt werden?"
    )
  ) {
    return;
  }

  try {
    resetBtn.disabled = true;
    showStatus("info", "⏳ Setze zurück...", "saveStatus");

    // Reset Provider
    await chrome.runtime.sendMessage({
      type: "setSetting",
      key: "aiProvider",
      value: "prompt-api",
    });
    aiProviderSelect.value = "prompt-api";

    // Reset Ollama Config
    const ollamaDefaultConfig = {
      url: "http://localhost:11434",
      model: "llama2",
    };
    await chrome.runtime.sendMessage({
      type: "setProviderConfig",
      provider: "ollama",
      config: ollamaDefaultConfig,
    });
    ollamaUrl.value = ollamaDefaultConfig.url;
    ollamaModel.value = ollamaDefaultConfig.model;

    // Reset LM Studio Config
    const lmStudioDefaultConfig = {
      url: "http://localhost:1234",
      model: "default",
    };
    await chrome.runtime.sendMessage({
      type: "setProviderConfig",
      provider: "lm-studio",
      config: lmStudioDefaultConfig,
    });
    lmStudioUrl.value = lmStudioDefaultConfig.url;
    lmStudioModel.value = lmStudioDefaultConfig.model;

    // Reset other settings
    await chrome.runtime.sendMessage({
      type: "setSetting",
      key: "autoClassify",
      value: true,
    });
    autoClassify.checked = true;

    await chrome.runtime.sendMessage({
      type: "setSetting",
      key: "autoDetectDuplicates",
      value: true,
    });
    autoDetectDuplicates.checked = true;

    // Temporarily set isInitialLoad to prevent auto-save during UI updates
    isInitialLoad = true;
    handleProviderChange();
    setTimeout(() => {
      isInitialLoad = false;
    }, 500);

    showStatus("success", "✅ Auf Standard zurückgesetzt", "saveStatus");
  } catch (error) {
    console.error("Fehler beim Zurücksetzen:", error);
    showStatus("error", "❌ Fehler beim Zurücksetzen", "saveStatus");
  } finally {
    resetBtn.disabled = false;
  }
}

/**
 * Save a single setting to storage
 */
async function saveToStorage(event) {
  const element = event.target;
  let key = element.id;
  let value = element.type === "checkbox" ? element.checked : element.value;

  try {
    await chrome.runtime.sendMessage({
      type: "setSetting",
      key: key,
      value: value,
    });
  } catch (error) {
    console.error("Error saving setting:", error);
  }
}

/**
 * Get provider-specific configuration
 */
function getProviderConfig() {
  const provider = aiProviderSelect.value;

  if (provider === "ollama") {
    return {
      url: ollamaUrl.value || "http://localhost:11434",
      model: ollamaModel.value || "llama2",
    };
  } else if (provider === "lm-studio") {
    return {
      url: lmStudioUrl.value || "http://localhost:1234",
      model: lmStudioModel.value || "default",
    };
  }

  return {};
}

/**
 * Display list of available models
 */
function displayModels(models) {
  if (!models || models.length === 0) {
    modelsList.style.display = "none";
    return;
  }

  modelsList.innerHTML = models
    .slice(0, 10) // Show first 10
    .map((model) => `<div>📦 ${model}</div>`)
    .join("");

  if (models.length > 10) {
    modelsList.innerHTML += `<div><em>... und ${
      models.length - 10
    } weitere</em></div>`;
  }

  modelsList.style.display = "block";
}

/**
 * Show status message
 */
function showStatus(type, message, target = "providerStatus") {
  const statusElement = document.getElementById(target);

  // Clear all classes
  statusElement.className = "status";

  // Replace \n with <br>
  const htmlMessage = message.replace(/\n/g, "<br>");

  statusElement.innerHTML = htmlMessage;
  statusElement.classList.add(type);
}

/**
 * Clear status message
 */
function clearStatus(target = "providerStatus") {
  const statusElement = document.getElementById(target);
  if (statusElement) {
    statusElement.innerHTML = "";
    statusElement.className = "status";
  }

  // Nur für providerStatus die Modelliste löschen
  if (target === "providerStatus") {
    modelsList.innerHTML = "";
    modelsList.style.display = "none";
  }
}

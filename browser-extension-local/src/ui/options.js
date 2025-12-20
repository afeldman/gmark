/**
 * Options Page Logic for GMARK Local
 * Handles provider selection, configuration, and testing
 */

// DOM Elements - Prompt API
const promptApiToggle = document.getElementById("promptApiToggle");
const promptApiStatus = document.getElementById("promptApiStatus");
const promptApiSetupBtn = document.getElementById("promptApiSetupBtn");

// DOM Elements - Provider Selection
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

// Cloud Provider Elements
const openaiConfig = document.getElementById("openaiConfig");
const openaiApiKey = document.getElementById("openaiApiKey");
const openaiModel = document.getElementById("openaiModel");

const deepseekConfig = document.getElementById("deepseekConfig");
const deepseekApiKey = document.getElementById("deepseekApiKey");
const deepseekModel = document.getElementById("deepseekModel");

const geminiConfig = document.getElementById("geminiConfig");
const geminiApiKey = document.getElementById("geminiApiKey");

const mistralConfig = document.getElementById("mistralConfig");
const mistralApiKey = document.getElementById("mistralApiKey");
const mistralModel = document.getElementById("mistralModel");

const llamaConfig = document.getElementById("llamaConfig");
const llamaApiKey = document.getElementById("llamaApiKey");
const llamaModel = document.getElementById("llamaModel");

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
  openai:
    "🔴 OpenAI - GPT-3.5 Turbo und GPT-4 Modelle. ⚠️ API Keys erforderlich, Kosten pro Token.",
  deepseek:
    "🟢 DeepSeek - Leistungsstarke und kosteneffiziente Alternative zu OpenAI.",
  gemini:
    "🟠 Google Gemini - Hochmodernes Modell von Google mit kostenlosem Tier.",
  mistral: "💜 Mistral AI - Schnelle und effiziente europäische Alternative.",
  llama:
    "🦙 Llama via Together AI - Meta's Llama Modelle über Together AI gehostet.",
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", loadSettings);

// Event Listeners
promptApiToggle.addEventListener("change", handlePromptApiToggle);
promptApiSetupBtn.addEventListener("click", showPromptApiSetup);
aiProviderSelect.addEventListener("change", handleProviderChange);
checkProviderBtn.addEventListener("click", checkProviderAvailability);
testProviderBtn.addEventListener("click", testProvider);
resetBtn.addEventListener("click", resetSettings);

// Auto-Save beim Ändern von Checkboxen
autoClassify.addEventListener("change", async (e) => {
  // Prüfe ob Bootstrap läuft
  const bootstrapRunning = await chrome.runtime
    .sendMessage({
      type: "getSetting",
      key: "bootstrapRunning",
    })
    .catch(() => ({ value: false }));

  if (bootstrapRunning.value) {
    console.warn(
      "⚠️ Bootstrap läuft noch - Änderungen könnten abgebrochen werden"
    );
    showStatus("warning", "⚠️ Warte bis Bootstrap beendet ist", "saveStatus");
    e.target.checked = !e.target.checked; // Revert
    return;
  }

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

autoDetectDuplicates.addEventListener("change", async (e) => {
  // Prüfe ob Bootstrap läuft
  const bootstrapRunning = await chrome.runtime
    .sendMessage({
      type: "getSetting",
      key: "bootstrapRunning",
    })
    .catch(() => ({ value: false }));

  if (bootstrapRunning.value) {
    console.warn(
      "⚠️ Bootstrap läuft noch - Änderungen könnten abgebrochen werden"
    );
    showStatus("warning", "⚠️ Warte bis Bootstrap beendet ist", "saveStatus");
    e.target.checked = !e.target.checked; // Revert
    return;
  }

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

// Cloud Provider API Key handlers
if (openaiApiKey) {
  openaiApiKey.addEventListener("input", () => {
    debounceSave(() => saveAPIKey("openai", openaiApiKey.value));
  });
  openaiModel?.addEventListener("change", () => {
    debounceSave(() => saveProviderField("openai", "model", openaiModel.value));
  });
}

if (deepseekApiKey) {
  deepseekApiKey.addEventListener("input", () => {
    debounceSave(() => saveAPIKey("deepseek", deepseekApiKey.value));
  });
  deepseekModel?.addEventListener("change", () => {
    debounceSave(() =>
      saveProviderField("deepseek", "model", deepseekModel.value)
    );
  });
}

if (geminiApiKey) {
  geminiApiKey.addEventListener("input", () => {
    debounceSave(() => saveAPIKey("gemini", geminiApiKey.value));
  });
}

if (mistralApiKey) {
  mistralApiKey.addEventListener("input", () => {
    debounceSave(() => saveAPIKey("mistral", mistralApiKey.value));
  });
  mistralModel?.addEventListener("change", () => {
    debounceSave(() =>
      saveProviderField("mistral", "model", mistralModel.value)
    );
  });
}

if (llamaApiKey) {
  llamaApiKey.addEventListener("input", () => {
    debounceSave(() => saveAPIKey("llama", llamaApiKey.value));
  });
  llamaModel?.addEventListener("change", () => {
    debounceSave(() => saveProviderField("llama", "model", llamaModel.value));
  });
}

/**
 * Save API Key securely
 */
async function saveAPIKey(provider, apiKey) {
  // Prüfe ob Bootstrap läuft
  const bootstrapRunning = await chrome.runtime
    .sendMessage({
      type: "getSetting",
      key: "bootstrapRunning",
    })
    .catch(() => ({ value: false }));

  if (bootstrapRunning.value) {
    console.warn(
      "⚠️ Bootstrap läuft noch - Änderungen könnten abgebrochen werden"
    );
    showStatus("warning", "⚠️ Warte bis Bootstrap beendet ist", "saveStatus");
    return;
  }

  console.log(`💾 Speichere ${provider} API Key...`);

  try {
    await chrome.runtime.sendMessage({
      type: "saveAPIKey",
      provider: provider,
      apiKey: apiKey,
    });

    console.log("✅ API Key gespeichert");
    showStatus("success", "✅ API Key gespeichert", "saveStatus");
    setTimeout(() => clearStatus("saveStatus"), 2000);
  } catch (error) {
    console.error("❌ Fehler beim Speichern des API Keys:", error);
    showStatus("error", "❌ Fehler beim Speichern", "saveStatus");
  }
}

/**
 * Save individual provider field
 */
async function saveProviderField(provider, field, value) {
  // Prüfe ob Bootstrap läuft
  const bootstrapRunning = await chrome.runtime
    .sendMessage({
      type: "getSetting",
      key: "bootstrapRunning",
    })
    .catch(() => ({ value: false }));

  if (bootstrapRunning.value) {
    console.warn(
      "⚠️ Bootstrap läuft noch - Änderungen könnten abgebrochen werden"
    );
    showStatus("warning", "⚠️ Warte bis Bootstrap beendet ist", "saveStatus");
    return;
  }

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
    // Load Prompt API setting
    const promptApiResponse = await chrome.runtime.sendMessage({
      type: "getSetting",
      key: "aiProvider",
    });

    const currentProvider = promptApiResponse?.value || "prompt-api";
    const usePromptApi = currentProvider === "prompt-api";

    // Set Prompt API toggle
    promptApiToggle.checked = usePromptApi;

    // If not using Prompt API, set the dropdown to the current provider
    if (!usePromptApi) {
      aiProviderSelect.value = currentProvider;
    }

    // Load provider-specific settings
    await loadProviderSettings(currentProvider);

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

    // Update UI based on Prompt API toggle
    updatePromptApiUI();
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
    } else if (provider === "openai") {
      openaiApiKey.value = (await getStoredAPIKey("openai")) || "";
      openaiModel.value = config.model || "gpt-3.5-turbo";
    } else if (provider === "deepseek") {
      deepseekApiKey.value = (await getStoredAPIKey("deepseek")) || "";
      deepseekModel.value = config.model || "deepseek-chat";
    } else if (provider === "gemini") {
      geminiApiKey.value = (await getStoredAPIKey("gemini")) || "";
    } else if (provider === "mistral") {
      mistralApiKey.value = (await getStoredAPIKey("mistral")) || "";
      mistralModel.value = config.model || "mistral-small-latest";
    } else if (provider === "llama") {
      llamaApiKey.value = (await getStoredAPIKey("llama")) || "";
      llamaModel.value =
        config.model || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
    }
  } catch (error) {
    console.error("Error loading provider settings:", error);
  }
}

/**
 * Get stored API Key
 */
async function getStoredAPIKey(provider) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "getAPIKey",
      provider: provider,
    });
    return response?.apiKey || null;
  } catch (error) {
    console.error("Error getting API key:", error);
    return null;
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
  openaiConfig.style.display = provider === "openai" ? "block" : "none";
  deepseekConfig.style.display = provider === "deepseek" ? "block" : "none";
  geminiConfig.style.display = provider === "gemini" ? "block" : "none";
  mistralConfig.style.display = provider === "mistral" ? "block" : "none";
  llamaConfig.style.display = provider === "llama" ? "block" : "none";

  // Update provider info
  providerInfo.textContent = providerTexts[provider] || "";

  // Clear previous status
  clearStatus();

  // Load API Keys für Cloud-Provider
  if (["openai", "deepseek", "gemini", "mistral", "llama"].includes(provider)) {
    await loadProviderSettings(provider);
  }

  // Auto-Save Provider-Auswahl (nur wenn nicht initial load)
  if (!isInitialLoad) {
    // Prüfe ob Bootstrap läuft
    const bootstrapRunning = await chrome.runtime
      .sendMessage({
        type: "getSetting",
        key: "bootstrapRunning",
      })
      .catch(() => ({ value: false }));

    if (bootstrapRunning.value) {
      console.warn(
        "⚠️ Bootstrap läuft noch - Provider-Wechsel wird verhindert"
      );
      showStatus(
        "error",
        "❌ Provider kann während Bootstrap nicht gewechselt werden",
        "saveStatus"
      );
      // Revert to previous provider
      aiProviderSelect.value = provider;
      return;
    }

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

/**
 * Handle Prompt API Toggle
 */
async function handlePromptApiToggle(e) {
  const enabled = e.target.checked;

  // Prüfe ob Bootstrap läuft
  const bootstrapRunning = await chrome.runtime
    .sendMessage({
      type: "getSetting",
      key: "bootstrapRunning",
    })
    .catch(() => ({ value: false }));

  if (bootstrapRunning.value) {
    console.warn(
      "⚠️ Bootstrap läuft noch - Prompt API-Wechsel wird verhindert"
    );
    showStatus(
      "error",
      "❌ Prompt API kann während Bootstrap nicht geändert werden",
      "promptApiStatus"
    );
    promptApiToggle.checked = !enabled; // Revert
    return;
  }

  try {
    if (enabled) {
      // Prüfe ob Prompt API verfügbar ist
      const availability = await chrome.runtime.sendMessage({
        type: "checkProviderAvailability",
        provider: "prompt-api",
      });

      if (!availability.available) {
        // Prompt API nicht verfügbar - schalte Toggle aus und zeige Setup
        promptApiToggle.checked = false;
        showPromptApiSetup();
        showStatus(
          "error",
          "❌ Prompt API nicht verfügbar. Bitte Setup-Anleitung folgen.",
          "promptApiStatus"
        );
        return;
      }

      // Prompt API verfügbar - setze als aktiven Provider
      await chrome.runtime.sendMessage({
        type: "setSetting",
        key: "aiProvider",
        value: "prompt-api",
      });

      showStatus("success", "✅ Prompt API aktiviert", "promptApiStatus");
      aiProviderSelect.style.display = "none";
      setTimeout(() => {
        clearStatus("promptApiStatus");
      }, 2000);
    } else {
      // Deaktiviere Prompt API, setze zu erstem anderen Provider
      const firstProvider = aiProviderSelect.value || "ollama";
      await chrome.runtime.sendMessage({
        type: "setSetting",
        key: "aiProvider",
        value: firstProvider,
      });

      showStatus("info", "ℹ️ Prompt API deaktiviert", "promptApiStatus");
      aiProviderSelect.style.display = "block";
      setTimeout(() => {
        clearStatus("promptApiStatus");
      }, 2000);
    }

    updatePromptApiUI();
    handleProviderChange();
  } catch (error) {
    console.error("Fehler beim Ändern des Prompt API Toggle:", error);
    promptApiToggle.checked = !enabled;
    showStatus("error", "❌ Fehler: " + error.message, "promptApiStatus");
  }
}

/**
 * Update Prompt API UI basierend auf Toggle-Status
 */
function updatePromptApiUI() {
  const usePromptApi = promptApiToggle.checked;

  // Zeige/verstecke Provider-Dropdown
  aiProviderSelect.parentElement.style.display = usePromptApi
    ? "none"
    : "block";
  document.getElementById("checkProviderBtn").style.display = usePromptApi
    ? "none"
    : "inline-block";
  document.getElementById("testProviderBtn").style.display = usePromptApi
    ? "none"
    : "inline-block";
  providerInfo.style.display = usePromptApi ? "none" : "block";
  document.getElementById("providerStatus").style.display = usePromptApi
    ? "none"
    : "block";

  // Zeige/verstecke Provider-Config-Sektionen
  const isPromptApi = usePromptApi;
  ollamaConfig.style.display = isPromptApi ? "none" : "block";
  lmStudioConfig.style.display = isPromptApi ? "none" : "block";
  openaiConfig.style.display = isPromptApi ? "none" : "block";
  deepseekConfig.style.display = isPromptApi ? "none" : "block";
  geminiConfig.style.display = isPromptApi ? "none" : "block";
  mistralConfig.style.display = isPromptApi ? "none" : "block";
  llamaConfig.style.display = isPromptApi ? "none" : "block";
}

/**
 * Zeige Prompt API Setup-Anleitung
 */
function showPromptApiSetup() {
  const setupText = `
🎯 Chrome Prompt API (Gemini Nano) Setup

Die Prompt API ist nicht verfügbar. Folge diesen Schritten zum Aktivieren:

1. Öffne Chrome mit folgendem Flag:
   chrome://flags/#prompt-api-for-gemini-nano

2. Setze den Flag auf "Enabled"

3. Starte den Browser neu

4. Öffne diese Seite erneut und versuche die Prompt API zu aktivieren

5. Beim ersten Mal wird Gemini Nano automatisch heruntergeladen

Weitere Informationen:
https://docs.google.com/document/d/1gS4uKSxl-cMfBp9nFl5EXmC1hLCVaFVqY7sOE7i9PpA/edit`;

  alert(setupText);
}

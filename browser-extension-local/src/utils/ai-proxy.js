/**
 * AI Proxy - Ermöglicht Prompt API Nutzung aus Service Worker Context
 *
 * Problem: Service Worker hat kein self.ai verfügbar
 * Lösung: Führe AI-Calls in Tab-Context aus über Message-Passing
 */

// Singleton Worker Tab
let workerTabId = null;

/**
 * Erstelle oder hole Worker Tab
 */
async function getWorkerTab() {
  // Prüfe ob existierender Tab noch gültig ist
  if (workerTabId) {
    try {
      await chrome.tabs.get(workerTabId);
      return workerTabId;
    } catch {
      workerTabId = null;
    }
  }

  // Erstelle neuen Worker Tab
  const workerUrl = chrome.runtime.getURL("src/utils/ai-worker.html");
  const tab = await chrome.tabs.create({
    url: workerUrl,
    active: false,
  });

  // Warte bis Tab geladen ist
  await new Promise((r) => setTimeout(r, 800));

  workerTabId = tab.id;
  return workerTabId;
}

/**
 * Sende Message an Worker Tab und warte auf Antwort
 */
async function sendToWorker(action, data = {}) {
  const tabId = await getWorkerTab();

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { action, ...data },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error("No response from worker"));
          return;
        }

        if (!response.success) {
          reject(new Error(response.error));
          return;
        }

        resolve(response.result);
      }
    );
  });
}

/**
 * Prüfe ob Prompt API in einem Tab verfügbar ist
 */
export async function checkPromptAPIInTab() {
  console.log("🔍 Prüfe Prompt API in Tab-Context...");

  try {
    const result = await sendToWorker("checkPromptAPI");
    console.log("  ✅ Tab-Check Ergebnis:", result);
    return result;
  } catch (error) {
    console.error("  ❌ Tab-Check fehlgeschlagen:", error);
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * Klassifiziere Text mit Prompt API im Tab-Context
 */
export async function classifyInTab(bookmark) {
  console.log(`🤖 Klassifiziere in Tab-Context: ${bookmark.title}`);

  try {
    const result = await sendToWorker("classify", { bookmark });
    console.log(`  ✅ Klassifiziert: ${result.category}`);
    return result;
  } catch (error) {
    console.error(`  ❌ Klassifikation fehlgeschlagen:`, error);
    throw error;
  }
}

/**
 * Erstelle Zusammenfassung mit Prompt API im Tab-Context
 */
export async function summarizeInTab(content, title) {
  console.log(`📝 Erstelle Zusammenfassung in Tab-Context...`);

  try {
    const result = await sendToWorker("summarize", { content, title });
    console.log("  ✅ Zusammenfassung erstellt");
    return result;
  } catch (error) {
    console.error("  ❌ Zusammenfassung fehlgeschlagen:", error);
    throw error;
  }
}

/**
 * Schließe Worker Tab (für Cleanup)
 */
export async function closeWorkerTab() {
  if (workerTabId) {
    try {
      await chrome.tabs.remove(workerTabId);
    } catch (error) {
      console.warn("⚠️ Konnte Worker Tab nicht schließen:", error);
    }
    workerTabId = null;
  }
}

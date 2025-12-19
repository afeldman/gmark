/**
 * AI Proxy - Ermöglicht Prompt API Nutzung aus Service Worker Context
 *
 * Problem: Service Worker hat kein self.ai verfügbar
 * Lösung: Führe AI-Calls in Tab-Context aus über Message-Passing
 */

// Singleton Worker Tab
let workerTabId = null;
let workerReadyPromise = null;

/**
 * Warte bis Worker Tab vollständig geladen ist
 */
async function waitForWorkerReady(tabId, timeout = 3000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === "complete") {
        console.log("  ✅ Worker Tab vollständig geladen");
        return true;
      }
      await new Promise((r) => setTimeout(r, 100));
    } catch (error) {
      console.error("  ⚠️ Tab nicht mehr verfügbar:", error.message);
      return false;
    }
  }
  
  console.warn("  ⚠️ Worker Tab Timeout nach", timeout, "ms");
  return true; // Versuche trotzdem
}

/**
 * Erstelle oder hole Worker Tab
 */
async function getWorkerTab() {
  // Prüfe ob existierender Tab noch gültig ist
  if (workerTabId) {
    try {
      const tab = await chrome.tabs.get(workerTabId);
      if (tab.status === "complete") {
        console.log("  ♻️ Verwende existierenden Worker Tab:", workerTabId);
        return workerTabId;
      }
    } catch {
      console.log("  ⚠️ Alter Worker Tab nicht mehr verfügbar");
      workerTabId = null;
    }
  }

  // Erstelle neuen Worker Tab
  console.log("  🔨 Erstelle neuen Worker Tab...");
  const workerUrl = chrome.runtime.getURL("src/utils/ai-worker.html");
  const tab = await chrome.tabs.create({
    url: workerUrl,
    active: false,
  });

  console.log("  ⏳ Warte bis Tab geladen ist...", tab.id);
  
  // Warte bis Tab vollständig geladen ist
  await waitForWorkerReady(tab.id);

  workerTabId = tab.id;
  console.log("  ✅ Worker Tab bereit:", workerTabId);
  return workerTabId;
}

/**
 * Sende Message an Worker Tab und warte auf Antwort (mit Retry)
 */
async function sendToWorker(action, data = {}, retries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const tabId = await getWorkerTab();

      return await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Message timeout - no response from worker"));
        }, 2000);

        chrome.tabs.sendMessage(
          tabId,
          { action, ...data },
          (response) => {
            clearTimeout(timeoutId);

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
    } catch (error) {
      lastError = error;
      console.warn(`  ⚠️ Versuch ${attempt + 1} fehlgeschlagen:`, error.message);

      if (attempt < retries) {
        console.log(`  🔄 Versuche erneut (${retries - attempt} übrig)...`);
        workerTabId = null; // Reset für nächsten Versuch
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  throw lastError;
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

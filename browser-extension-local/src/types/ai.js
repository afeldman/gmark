/**
 * Chrome Prompt API Type Definitions
 *
 * Type-safe wrappers für Chrome Prompt API mit @types/dom-chromium-ai
 * Erweitert die bestehenden Chrome API Types
 *
 * Diese Datei stellt Runtime-Funktionen für sichere Nutzung der Prompt API zur Verfügung
 */

import { checkPromptAPIInTab } from "../utils/ai-proxy.js";

/**
 * Check if Prompt API is available
 * @param {any} ai - AI object (from self.ai or globalThis.ai)
 * @returns {boolean}
 */
export function isPromptAPIAvailable(ai) {
  const available = ai?.languageModel !== undefined;
  console.log("🔍 isPromptAPIAvailable:", available);
  return available;
}

/**
 * Check if we can create a text session
 * Prüft Service Worker Context, dann Tab-Context als Fallback
 * @param {Function} statusCallback - Optional callback for status updates
 * @returns {Promise<boolean>}
 */
export async function checkCanCreateSession(statusCallback) {
  try {
    console.log("🔍 Checking Prompt API availability...");
    // Service Worker verwendet self statt window
    const ai = self.ai || globalThis.ai;
    const hasLM = !!ai?.languageModel;
    console.log("  AI object available:", !!ai);
    console.log("  languageModel available:", hasLM);

    // Wenn im Service Worker Context kein AI verfügbar, prüfe Tab-Context
    if (!hasLM || typeof ai.languageModel.canCreateTextSession !== "function") {
      console.log("  ⚠️ AI nicht im Service Worker verfügbar");
      console.log("  🔄 Prüfe Tab-Context als Fallback...");

      try {
        const tabResult = await checkPromptAPIInTab();

        if (tabResult.available) {
          console.log("  ✅ AI verfügbar in Tab-Context!");
          if (statusCallback) statusCallback("readily");
          return true;
        } else {
          console.log(
            "  ❌ AI auch in Tab-Context nicht verfügbar:",
            tabResult.error
          );
          if (statusCallback) statusCallback("no");
          return false;
        }
      } catch (error) {
        console.error("  ❌ Tab-Context Check fehlgeschlagen:", error);
        if (statusCallback) statusCallback("no");
        return false;
      }
    }

    const status = await ai.languageModel.canCreateTextSession();
    const canCreate = status === "readily" || status === "after-download";
    console.log("  📊 Prompt API status:", status, "| canCreate:", canCreate);

    if (statusCallback) {
      statusCallback(status);
    }
    return canCreate;
  } catch (error) {
    console.error("❌ Error checking Prompt API availability:", error);
    return false;
  }
}

/**
 * Create a language model session
 * @param {Object} options - Session options
 * @param {AbortSignal} options.signal - Abort signal
 * @param {Function} options.monitor - Progress monitor callback
 * @returns {Promise<LanguageModelSession|null>}
 */
export async function createLanguageModelSession(options) {
  try {
    console.log("🔧 Creating language model session...");
    // Service Worker verwendet self statt window
    const ai = self.ai || globalThis.ai;
    const canCreateFn = ai?.languageModel?.create;
    console.log("  AI available:", !!ai);
    console.log("  create() available:", typeof canCreateFn === "function");

    if (typeof canCreateFn !== "function") {
      console.error("  ❌ AI available: false (no create function)");
      return null;
    }

    const session = await ai.languageModel.create(options);
    if (!session) {
      throw new Error("Failed to create language model session");
    }
    console.log("  ✅ Session created successfully");
    return session;
  } catch (error) {
    console.error("❌ Failed to create language model session:", error);
    return null;
  }
}

/**
 * Classify with AI using Prompt API
 * @param {LanguageModelSession} session - Active session
 * @param {string} prompt - Classification prompt
 * @returns {Promise<Object|null>}
 */
export async function classifyWithAI(session, prompt) {
  try {
    console.log("🤖 Classifying with AI...");
    if (!session) {
      throw new Error("Session is null or undefined");
    }

    console.log("  📤 Sending prompt to AI model...");
    const response = await session.prompt(prompt);
    console.log("  📥 Received AI response");

    // Parse JSON response
    const parsed = JSON.parse(response);

    // Validate structure
    if (!parsed.category || typeof parsed.confidence !== "number") {
      throw new Error("Invalid response structure from AI model");
    }

    console.log(
      "  ✅ Classification successful:",
      parsed.category,
      `(${parsed.confidence})`
    );

    return {
      category: parsed.category,
      confidence: Math.min(Math.max(parsed.confidence, 0), 1),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      summary: parsed.summary || "",
    };
  } catch (error) {
    console.error("❌ Failed to classify with AI:", error);
    return null;
  }
}

/**
 * Safely destroy a session
 * @param {LanguageModelSession|null|undefined} session
 * @returns {void}
 */
export function safeDestroySession(session) {
  try {
    if (session && typeof session.destroy === "function") {
      console.log("🗑️ Destroying AI session...");
      session.destroy();
      console.log("  ✅ Session destroyed");
    }
  } catch (error) {
    console.warn("⚠️ Warning destroying session:", error);
  }
}

/**
 * Summarize page content with AI
 * @param {LanguageModelSession} session - Active session
 * @param {string} pageText - Page content to summarize
 * @param {string} pageTitle - Page title for context
 * @returns {Promise<string|null>}
 */
export async function summarizeWithAI(session, pageText, pageTitle) {
  try {
    console.log("📝 Summarizing page content...");
    if (!session || !pageText) {
      console.warn("⚠️ Missing session or pageText");
      return null;
    }

    // Kürze Text auf erste 3000 Zeichen für Token-Limit
    const truncatedText = pageText.substring(0, 3000);

    const prompt = `Zusammenfasse den folgenden Seiten-Inhalt in 3-5 stichpunktartige Punkte (Deutsch):\n\nTitel: ${pageTitle}\n\n${truncatedText}\n\nAntworte nur mit den Stichpunkten, ohne zusätzlichen Text.`;

    console.log("  📤 Sending summary prompt to AI...");
    const response = await session.prompt(prompt);
    console.log("  📥 Received summary from AI");

    if (!response || response.trim().length === 0) {
      throw new Error("Empty response from AI");
    }

    const summary = response.trim();
    console.log("  ✅ Summary created:", summary.substring(0, 100) + "...");

    return summary;
  } catch (error) {
    console.error("❌ Failed to summarize with AI:", error);
    // Fallback: Erste 300 Zeichen
    return pageText.substring(0, 300) + "...";
  }
}

export default {
  isPromptAPIAvailable,
  checkCanCreateSession,
  createLanguageModelSession,
  classifyWithAI,
  safeDestroySession,
  summarizeWithAI,
};

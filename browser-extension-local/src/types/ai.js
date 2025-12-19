/**
 * Chrome Prompt API Type Definitions
 *
 * Type-safe wrappers für Chrome Prompt API mit @types/dom-chromium-ai
 * Erweitert die bestehenden Chrome API Types
 *
 * Diese Datei stellt Runtime-Funktionen für sichere Nutzung der Prompt API zur Verfügung
 */

/**
 * Check if Prompt API is available
 * @param {any} ai - Window.ai object
 * @returns {boolean}
 */
export function isPromptAPIAvailable(ai) {
  return ai?.languageModel !== undefined;
}

/**
 * Check if we can create a text session
 * @param {Function} statusCallback - Optional callback for status updates
 * @returns {Promise<boolean>}
 */
export async function checkCanCreateSession(statusCallback) {
  try {
    const status = await window.ai?.languageModel?.canCreateTextSession?.();
    if (statusCallback) {
      statusCallback(status);
    }
    return status !== "no";
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
    const session = await window.ai?.languageModel?.create?.(options);
    if (!session) {
      throw new Error("Failed to create language model session");
    }
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
    if (!session) {
      throw new Error("Session is null or undefined");
    }

    const response = await session.prompt(prompt);

    // Parse JSON response
    const parsed = JSON.parse(response);

    // Validate structure
    if (!parsed.category || typeof parsed.confidence !== "number") {
      throw new Error("Invalid response structure from AI model");
    }

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
      session.destroy();
    }
  } catch (error) {
    console.warn("⚠️ Warning destroying session:", error);
  }
}

export default {
  isPromptAPIAvailable,
  checkCanCreateSession,
  createLanguageModelSession,
  classifyWithAI,
  safeDestroySession,
};

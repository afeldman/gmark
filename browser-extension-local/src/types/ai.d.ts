/**
 * Chrome Prompt API Type Definitions
 *
 * Type-safe wrappers für Chrome Prompt API mit @types/dom-chromium-ai
 * Erweitert die bestehenden Chrome API Types
 */

declare global {
  interface Window {
    ai?: AI;
  }

  interface AI {
    languageModel?: LanguageModelAPI;
  }

  interface LanguageModelAPI {
    canCreateTextSession?(): Promise<"readily" | "after-download" | "no">;
    create?(
      options?: LanguageModelCreateOptions
    ): Promise<LanguageModelSession | undefined>;
  }

  interface LanguageModelCreateOptions {
    signal?: AbortSignal;
    monitor?: (percentage: number) => void;
  }

  interface LanguageModelSession {
    prompt(message: string): Promise<string>;
    promptStreaming(message: string): AsyncIterable<string>;
    destroy(): void;
  }

  interface LanguageModelResponse {
    category: string;
    confidence: number;
    tags: string[];
    summary: string;
  }
}

// Type-Guard Functions
export function isPromptAPIAvailable(
  ai: any
): ai is { languageModel: LanguageModelAPI } {
  return ai?.languageModel !== undefined;
}

export async function checkCanCreateSession(
  statusCallback?: (status: "readily" | "after-download" | "no") => void
): Promise<boolean> {
  try {
    const status = await window.ai?.languageModel?.canCreateTextSession?.();
    if (statusCallback) statusCallback(status as any);
    return status !== "no";
  } catch {
    return false;
  }
}

export async function createLanguageModelSession(
  options?: LanguageModelCreateOptions
): Promise<LanguageModelSession | null> {
  try {
    const session = await window.ai?.languageModel?.create?.(options);
    return session || null;
  } catch (error) {
    console.error("Failed to create language model session:", error);
    return null;
  }
}

export async function classifyWithAI(
  session: LanguageModelSession,
  prompt: string
): Promise<LanguageModelResponse | null> {
  try {
    const response = await session.prompt(prompt);
    return JSON.parse(response) as LanguageModelResponse;
  } catch (error) {
    console.error("Failed to classify with AI:", error);
    return null;
  }
}

export function safeDestroySession(
  session: LanguageModelSession | null | undefined
): void {
  try {
    if (session && typeof session.destroy === "function") {
      session.destroy();
    }
  } catch (error) {
    console.error("Failed to destroy session:", error);
  }
}

export default {};

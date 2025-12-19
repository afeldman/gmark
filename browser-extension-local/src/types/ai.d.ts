/**
 * Chrome Prompt API Type Definitions
 * 
 * Reine Typ-Definitionen für die Chrome Prompt API
 * Implementierung: siehe ai.js
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

// Type-Safe Helper Funktionen
export function isPromptAPIAvailable(ai: any): ai is { languageModel: LanguageModelAPI };

export function checkCanCreateSession(
  statusCallback?: (status: "readily" | "after-download" | "no") => void
): Promise<boolean>;

export function createLanguageModelSession(
  options?: LanguageModelCreateOptions
): Promise<LanguageModelSession | null>;

export function classifyWithAI(
  session: LanguageModelSession,
  prompt: string
): Promise<LanguageModelResponse | null>;

export function safeDestroySession(
  session: LanguageModelSession | null | undefined
): void;

export default {}

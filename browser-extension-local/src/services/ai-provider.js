/**
 * AI Provider Manager
 * Unterstützt: Prompt API, Ollama, LM Studio
 */

import StorageManager from "../utils/storage.js";
import { checkCanCreateSession } from "../types/ai.js";

export class AIProviderManager {
  /**
   * Hole aktuellen Provider
   */
  static async getActiveProvider() {
    const provider =
      (await StorageManager.getSetting("aiProvider")) || "prompt-api";
    console.log(`🤖 Aktiver AI Provider: ${provider}`);
    return provider;
  }

  /**
   * Setze AI Provider
   */
  static async setActiveProvider(provider) {
    const validProviders = [
      "prompt-api",
      "ollama",
      "lm-studio",
      "openai",
      "deepseek",
      "gemini",
      "mistral",
      "llama",
    ];

    if (!validProviders.includes(provider)) {
      console.error(`❌ Ungültiger Provider: ${provider}`);
      return false;
    }

    await StorageManager.setSetting("aiProvider", provider);
    console.log(`✅ AI Provider gesetzt auf: ${provider}`);
    return true;
  }

  /**
   * Hole Provider-Einstellungen
   */
  static async getProviderConfig(provider) {
    const provider_key = `${provider}_config`;
    let config = await StorageManager.getSetting(provider_key);

    config = config || this.getDefaultConfig(provider);

    // Lade API Keys für Cloud-Provider aus Storage
    if (
      ["openai", "deepseek", "gemini", "mistral", "llama"].includes(provider)
    ) {
      const apiKey = await StorageManager.getSetting(`${provider}_apiKey`);
      if (apiKey) {
        config.apiKey = apiKey;
      }
    }

    return config;
  }

  /**
   * Setze Provider-Konfiguration
   */
  static async setProviderConfig(provider, config) {
    const provider_key = `${provider}_config`;
    await StorageManager.setSetting(provider_key, config);
    console.log(`✅ Konfiguration für ${provider} gespeichert`);
  }

  /**
   * Default-Konfigurationen
   */
  static getDefaultConfig(provider) {
    const defaults = {
      "prompt-api": {
        type: "prompt-api",
        status: "unknown",
        description: "Chrome Prompt API mit lokalem Gemini Nano",
      },
      ollama: {
        type: "ollama",
        url: "http://localhost:11434",
        model: "llama2",
        description: "Ollama Server (lokal oder remote)",
      },
      "lm-studio": {
        type: "lm-studio",
        url: "http://localhost:1234",
        model: "default",
        description: "LM Studio Server",
      },
      openai: {
        type: "openai",
        apiKey: "",
        baseURL: "https://api.openai.com/v1",
        model: "gpt-3.5-turbo",
        description: "OpenAI GPT Models",
      },
      deepseek: {
        type: "deepseek",
        apiKey: "",
        baseURL: "https://api.deepseek.com/v1",
        model: "deepseek-chat",
        description: "DeepSeek (OpenAI-kompatibel)",
      },
      gemini: {
        type: "gemini",
        apiKey: "",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        model: "gemini-2.0-flash",
        description: "Google Gemini API (Cloud)",
      },
      mistral: {
        type: "mistral",
        apiKey: "",
        baseURL: "https://api.mistral.ai/v1",
        model: "mistral-small-latest",
        description: "Mistral AI API",
      },
      llama: {
        type: "llama",
        apiKey: "",
        baseURL: "https://api.together.xyz/v1",
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        description: "Llama via Together AI",
      },
    };

    return defaults[provider] || {};
  }

  /**
   * Prüfe Provider-Verfügbarkeit
   */
  static async checkProviderAvailability(provider) {
    console.log(`\n🔍 Prüfe ${provider} Verfügbarkeit...`);

    switch (provider) {
      case "prompt-api":
        return await this.checkPromptAPIAvailability();
      case "ollama":
        return await this.checkOllamaAvailability();
      case "lm-studio":
        return await this.checkLMStudioAvailability();
      case "openai":
        return await this.checkOpenAIAvailability();
      case "deepseek":
        return await this.checkDeepSeekAvailability();
      case "gemini":
        return await this.checkGeminiAvailability();
      case "mistral":
        return await this.checkMistralAvailability();
      case "llama":
        return await this.checkLlamaAvailability();
      default:
        return { available: false, error: "Unbekannter Provider" };
    }
  }

  /**
   * Prüfe Prompt API
   */
  static async checkPromptAPIAvailability() {
    try {
      const canCreate = await checkCanCreateSession();

      if (canCreate) {
        console.log("  ✅ Prompt API verfügbar");
        return { available: true };
      } else {
        console.log("  ❌ Prompt API nicht verfügbar");
        return {
          available: false,
          error: "Prompt API nicht konfiguriert",
          help: "Aktiviere die Chrome Flags und lade Gemini Nano herunter",
        };
      }
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Prüfe Ollama Verfügbarkeit
   */
  static async checkOllamaAvailability() {
    try {
      const config = await this.getProviderConfig("ollama");
      const response = await fetch(`${config.url}/api/tags`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Ollama Server antwortet nicht");
      }

      const data = await response.json();
      const models = data.models || [];

      console.log(`  ✅ Ollama verfügbar - ${models.length} Modelle`);

      return {
        available: true,
        models: models.map((m) => m.name),
      };
    } catch (error) {
      console.log("  ❌ Ollama nicht verfügbar");
      return {
        available: false,
        error: error.message,
        help: "Starte Ollama: ollama serve",
      };
    }
  }

  /**
   * Prüfe LM Studio Verfügbarkeit
   */
  static async checkLMStudioAvailability() {
    try {
      const config = await this.getProviderConfig("lm-studio");
      const response = await fetch(`${config.url}/v1/models`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("LM Studio Server antwortet nicht");
      }

      const data = await response.json();
      const models = data.data || [];

      console.log(`  ✅ LM Studio verfügbar - ${models.length} Modelle`);

      return {
        available: true,
        models: models.map((m) => m.id),
      };
    } catch (error) {
      console.log("  ❌ LM Studio nicht verfügbar");
      return {
        available: false,
        error: error.message,
        help: "Starte LM Studio und aktiviere Local Server",
      };
    }
  }

  /**
   * Klassifiziere mit aktivem Provider
   */
  static async classifyWithProvider(data) {
    const provider = await this.getActiveProvider();

    console.log(`🤖 Klassifiziere mit ${provider}...`);

    switch (provider) {
      case "ollama":
        return await this.classifyWithOllama(data);
      case "lm-studio":
        return await this.classifyWithLMStudio(data);
      case "openai":
        return await this.classifyWithOpenAICompatible(data, "openai");
      case "deepseek":
        return await this.classifyWithOpenAICompatible(data, "deepseek");
      case "gemini":
        return await this.classifyWithOpenAICompatible(data, "gemini");
      case "mistral":
        return await this.classifyWithOpenAICompatible(data, "mistral");
      case "llama":
        return await this.classifyWithOpenAICompatible(data, "llama");
      case "prompt-api":
      default:
        return await this.classifyWithPromptAPI(data);
    }
  }

  /**
   * Klassifiziere mit Ollama
   */
  static async classifyWithOllama(data) {
    try {
      const config = await this.getProviderConfig("ollama");

      const prompt = `Klassifiziere folgende URL und gib NUR ein JSON-Object zurück:
Title: ${data.title}
URL: ${data.url}
Description: ${data.description}

Antworte nur mit diesem JSON-Format (keine anderen Zeichen):
{
  "category": "Development|Social|News|Shopping|Education|Entertainment|Documentation|Tools|Other",
  "confidence": 0.9,
  "tags": ["tag1", "tag2"],
  "summary": "Kurze Zusammenfassung"
}`;

      const response = await fetch(`${config.url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          stream: false,
        }),
      });

      const result = await response.json();
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("  ✅ Ollama Klassifikation erfolgreich");
        return parsed;
      }

      throw new Error("Ungültige Antwort von Ollama");
    } catch (error) {
      console.error("❌ Ollama-Klassifikation fehlgeschlagen:", error);
      return null;
    }
  }

  /**
   * Klassifiziere mit LM Studio
   */
  static async classifyWithLMStudio(data) {
    try {
      const config = await this.getProviderConfig("lm-studio");

      const prompt = `Klassifiziere folgende URL und gib NUR ein JSON-Object zurück:
Title: ${data.title}
URL: ${data.url}
Description: ${data.description}

Antworte nur mit diesem JSON-Format (keine anderen Zeichen):
{
  "category": "Development|Social|News|Shopping|Education|Entertainment|Documentation|Tools|Other",
  "confidence": 0.9,
  "tags": ["tag1", "tag2"],
  "summary": "Kurze Zusammenfassung"
}`;

      const response = await fetch(`${config.url}/v1/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const result = await response.json();
      const text = result.choices[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("  ✅ LM Studio Klassifikation erfolgreich");
        return parsed;
      }

      throw new Error("Ungültige Antwort von LM Studio");
    } catch (error) {
      console.error("❌ LM Studio-Klassifikation fehlgeschlagen:", error);
      return null;
    }
  }

  /**
   * Prüfe OpenAI Verfügbarkeit
   */
  static async checkOpenAIAvailability() {
    try {
      const config = await this.getProviderConfig("openai");
      if (!config.apiKey) {
        return {
          available: false,
          error: "API Key nicht konfiguriert",
          help: "Setze deinen OpenAI API Key in den Einstellungen",
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${config.baseURL}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        console.log("  ✅ OpenAI verfügbar");
        return { available: true };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.log("  ❌ OpenAI nicht verfügbar:", error.message);
      return {
        available: false,
        error: error.message,
        help: "Überprüfe deinen API Key und Internetverbindung",
      };
    }
  }

  /**
   * Prüfe DeepSeek Verfügbarkeit
   */
  static async checkDeepSeekAvailability() {
    try {
      const config = await this.getProviderConfig("deepseek");
      if (!config.apiKey) {
        return {
          available: false,
          error: "API Key nicht konfiguriert",
          help: "Setze deinen DeepSeek API Key in den Einstellungen",
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${config.baseURL}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        console.log("  ✅ DeepSeek verfügbar");
        return { available: true };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.log("  ❌ DeepSeek nicht verfügbar:", error.message);
      return {
        available: false,
        error: error.message,
        help: "Überprüfe deinen API Key und Internetverbindung",
      };
    }
  }

  /**
   * Prüfe Gemini Cloud Verfügbarkeit
   */
  static async checkGeminiAvailability() {
    try {
      const config = await this.getProviderConfig("gemini");
      if (!config.apiKey) {
        return {
          available: false,
          error: "API Key nicht konfiguriert",
          help: "Setze deinen Google Gemini API Key in den Einstellungen",
        };
      }

      console.log("  ✅ Gemini verfügbar");
      return { available: true };
    } catch (error) {
      console.log("  ❌ Gemini nicht verfügbar");
      return {
        available: false,
        error: error.message,
      };
    }
  }

  /**
   * Prüfe Mistral Verfügbarkeit
   */
  static async checkMistralAvailability() {
    try {
      const config = await this.getProviderConfig("mistral");
      if (!config.apiKey) {
        return {
          available: false,
          error: "API Key nicht konfiguriert",
          help: "Setze deinen Mistral API Key in den Einstellungen",
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${config.baseURL}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        console.log("  ✅ Mistral verfügbar");
        return { available: true };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.log("  ❌ Mistral nicht verfügbar:", error.message);
      return {
        available: false,
        error: error.message,
        help: "Überprüfe deinen API Key und Internetverbindung",
      };
    }
  }

  /**
   * Prüfe Llama (via Together AI) Verfügbarkeit
   */
  static async checkLlamaAvailability() {
    try {
      const config = await this.getProviderConfig("llama");
      if (!config.apiKey) {
        return {
          available: false,
          error: "API Key nicht konfiguriert",
          help: "Setze deinen Together AI API Key in den Einstellungen",
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${config.baseURL}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        console.log("  ✅ Llama verfügbar");
        return { available: true };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.log("  ❌ Llama nicht verfügbar:", error.message);
      return {
        available: false,
        error: error.message,
        help: "Überprüfe deinen Together AI API Key und Internetverbindung",
      };
    }
  }

  /**
   * Klassifiziere mit OpenAI-kompatiblen Providern
   * (OpenAI, DeepSeek, Gemini, Mistral, Llama)
   */
  static async classifyWithOpenAICompatible(data, provider) {
    try {
      const config = await this.getProviderConfig(provider);

      if (!config.apiKey) {
        throw new Error(`${provider} API Key ist nicht gesetzt`);
      }

      const prompt = `Klassifiziere folgende URL und gib NUR ein JSON-Object zurück:
Title: ${data.title}
URL: ${data.url}
Description: ${data.description}

Antworte nur mit diesem JSON-Format (keine anderen Zeichen):
{
  "category": "Development|Social|News|Shopping|Education|Entertainment|Documentation|Tools|Other",
  "confidence": 0.9,
  "tags": ["tag1", "tag2"],
  "summary": "Kurze Zusammenfassung"
}`;

      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API Fehler");
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`  ✅ ${provider} Klassifikation erfolgreich`);
        return parsed;
      }

      throw new Error("Ungültige JSON in Antwort");
    } catch (error) {
      console.error(
        `❌ ${provider}-Klassifikation fehlgeschlagen:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Klassifiziere mit Prompt API
   * Fallback-Implementierung ohne externe Dependencies
   */
  static async classifyWithPromptAPI(data) {
    console.log("🤖 Klassifiziere mit Prompt API...");

    try {
      if (!(await checkCanCreateSession())) {
        throw new Error("Prompt API not available");
      }

      // Einfache Pattern-Matching Klassifikation als Fallback
      const combined =
        `${data.title} ${data.description} ${data.url}`.toLowerCase();

      const categoryPatterns = {
        Development: ["github", "stackoverflow", "npm", "code", "programming"],
        Documentation: ["docs", "documentation", "guide", "manual"],
        News: ["news", "article", "blog", "post"],
        Social: ["twitter", "facebook", "instagram", "linkedin"],
        Shopping: ["amazon", "shop", "buy", "cart"],
      };

      let bestCategory = "Other";
      let maxScore = 0;

      for (const [category, patterns] of Object.entries(categoryPatterns)) {
        let score = 0;
        for (const pattern of patterns) {
          if (combined.includes(pattern)) score += 2;
        }
        if (score > maxScore) {
          maxScore = score;
          bestCategory = category;
        }
      }

      return {
        category: bestCategory,
        confidence: Math.min(maxScore * 0.2, 0.95),
        tags: [],
        summary: data.description || "",
        method: "prompt-api",
      };
    } catch (error) {
      console.error("❌ Prompt API classification failed:", error);
      return {
        category: "Other",
        confidence: 0,
        tags: [],
        summary: "",
        method: "error-fallback",
      };
    }
  }
}

/**
 * AI Singleton - Verwaltet die aktuell konfigurierte KI global
 */
class AISingleton {
  constructor() {
    this.currentProvider = null;
    this.currentConfig = null;
    this.initialized = false;
  }

  async init() {
    try {
      const provider = await AIProviderManager.getActiveProvider();
      const config = await AIProviderManager.getProviderConfig(provider);
      this.currentProvider = provider;
      this.currentConfig = config;
      this.initialized = true;
      console.log(`🎯 AI Singleton initialisiert: ${provider}`);
      return true;
    } catch (error) {
      console.error("❌ Fehler beim Initialisieren des AI Singleton:", error);
      return false;
    }
  }

  async switchProvider(provider) {
    try {
      const validProviders = [
        "prompt-api",
        "ollama",
        "lm-studio",
        "openai",
        "deepseek",
        "gemini",
        "mistral",
        "llama",
      ];

      if (!validProviders.includes(provider)) {
        throw new Error(`Ungültiger Provider: ${provider}`);
      }

      await AIProviderManager.setActiveProvider(provider);
      const config = await AIProviderManager.getProviderConfig(provider);
      this.currentProvider = provider;
      this.currentConfig = config;
      console.log(`🎯 AI Singleton gewechselt zu: ${provider}`);
      return true;
    } catch (error) {
      console.error("❌ Fehler beim Wechsel des Providers:", error);
      return false;
    }
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  getCurrentConfig() {
    return this.currentConfig;
  }

  getCurrentInfo() {
    return {
      provider: this.currentProvider,
      config: this.currentConfig,
      initialized: this.initialized,
    };
  }

  async refreshConfig() {
    if (!this.currentProvider) {
      return false;
    }

    try {
      const config = await AIProviderManager.getProviderConfig(
        this.currentProvider
      );
      this.currentConfig = config;
      console.log(`🔄 AI Singleton Config aktualisiert`);
      return true;
    } catch (error) {
      console.error("❌ Fehler beim Aktualisieren der Config:", error);
      return false;
    }
  }
}

const aiSingleton = new AISingleton();

export default AIProviderManager;
export { aiSingleton, AISingleton };

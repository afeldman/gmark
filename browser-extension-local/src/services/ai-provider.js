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
    const validProviders = ["prompt-api", "ollama", "lm-studio"];

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
    const config = await StorageManager.getSetting(provider_key);

    return config || this.getDefaultConfig(provider);
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

export default AIProviderManager;

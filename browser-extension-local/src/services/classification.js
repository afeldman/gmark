/**
 * Classification Service
 *
 * Nutzt Chrome Prompt API für lokale, private Klassifikation
 * Mit @types/dom-chromium-ai für Type-Safety
 * Kategorien werden aus categories.yml geladen
 *
 * @typedef {import('../types/ai').LanguageModelResponse} LanguageModelResponse
 * @typedef {import('../types/ai').LanguageModelSession} LanguageModelSession
 */

import {
  isPromptAPIAvailable,
  checkCanCreateSession,
  createLanguageModelSession,
  classifyWithAI,
  safeDestroySession,
} from "../types/ai.js";
import UsageManager from "../utils/usage.js";
import logger from "../utils/logger.js";
import { aiSingleton } from "./ai-provider.js";

import { loadYAML } from "../utils/yaml-parser.js";

/**
 * Formatiere Confidence auf 5 Dezimalstellen
 */
function formatConfidence(value) {
  const num = parseFloat(value) || 0.0;
  return Math.round(num * 100_000) / 100_000;
}

// Wird beim Start geladen
let CATEGORIES = {};

export class ClassificationService {
  constructor() {
    this.promptAPIAvailable = false;
    this.categoriesLoaded = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    logger.log("🔧 Initializing ClassificationService...");

    // Lade Kategorien aus YAML
    await this.loadCategories();

    // Prüfe Prompt API
    await this.checkPromptAPI();

    logger.log("✅ ClassificationService initialized");
  }

  /**
   * Lade Kategorien aus YAML-Datei
   */
  async loadCategories() {
    try {
      logger.log("📂 Loading categories (using defaults)...");
      CATEGORIES = this.getDefaultCategories();
      this.categoriesLoaded = true;
      logger.log("✅ Categories loaded:", Object.keys(CATEGORIES));
    } catch (error) {
      logger.error("❌ Failed to load categories:", error);
      CATEGORIES = this.getDefaultCategories();
      this.categoriesLoaded = true;
      logger.warn("⚠️ Using default categories as fallback");
    }
  }

  /**
   * Fallback Standard-Kategorien
   */
  getDefaultCategories() {
    return {
      Development: {
        patterns: ["github", "stackoverflow", "npm", "code", "programming"],
        color: "#4f46e5",
      },
      Social: {
        patterns: ["twitter", "facebook", "instagram", "linkedin", "reddit"],
        color: "#ec4899",
      },
      News: {
        patterns: ["news", "article", "blog", "post"],
        color: "#f59e0b",
      },
      Shopping: {
        patterns: ["amazon", "shop", "buy", "cart"],
        color: "#10b981",
      },
      Education: {
        patterns: ["coursera", "udemy", "learn", "course", "tutorial"],
        color: "#8b5cf6",
      },
      Entertainment: {
        patterns: ["netflix", "youtube", "spotify", "game", "movie"],
        color: "#f43f5e",
      },
      Documentation: {
        patterns: ["docs", "documentation", "guide", "manual"],
        color: "#06b6d4",
      },
      Tools: {
        patterns: ["tool", "utility", "converter", "editor"],
        color: "#64748b",
      },
      Other: {
        patterns: ["online", "free"],
        color: "#6b7280",
      },
    };
  }

  async checkPromptAPI() {
    try {
      // Nutze Type-sichere Funktion
      this.promptAPIAvailable = await checkCanCreateSession((status) => {
        logger.log(`ℹ️ Prompt API Status: ${status}`);
        if (status === "readily") {
          logger.log("✅ Prompt API ready to use");
        } else if (status === "after-download") {
          logger.log("⏳ Model downloading, will be available shortly");
        } else {
          logger.log("❌ Prompt API not available on this device");
        }
      });
    } catch (error) {
      logger.warn("⚠️ Prompt API check failed:", error);
      this.promptAPIAvailable = false;
    }
  }

  /**
   * Klassifiziere ein Bookmark mit mehreren Methoden
   * 1. Pattern-Matching (schnell, offline)
   * 2. Prompt API (lokal, KI-basiert)
   * 3. Fallback zu "Other"
   */
  async classify(bookmark, usePromptAPI = true) {
    // Warte bis Kategorien geladen sind
    await this.initPromise;

    try {
      logger.log("🏷️ Starting classification for:", bookmark.title);
      logger.log("  URL:", bookmark.url);
      logger.log("  Use Prompt API:", usePromptAPI);
      logger.log("  Prompt API available:", this.promptAPIAvailable);

      // Methode 1: Pattern-Matching (schnell)
      logger.log("  🔍 Trying pattern-based classification...");
      const patternResult = this.classifyByPatterns(
        bookmark.title,
        bookmark.description,
        bookmark.url
      );
      patternResult.confidence = formatConfidence(patternResult.confidence);

      logger.log(
        "  ✅ Pattern result:",
        patternResult.category,
        `(confidence: ${patternResult.confidence})`
      );

      // Wenn confidence hoch genug, use it
      if (patternResult.confidence >= 0.6) {
        logger.log("  🎯 Sufficient confidence, using pattern result");
        return patternResult;
      }

      // Fallback: Verwende Pattern-Result (auch wenn confidence < 0.6)
      logger.log("  🔙 Using pattern result as fallback");
      return patternResult;
    } catch (error) {
      logger.error("❌ Classification error:", error);
      return {
        category: "Other",
        confidence: formatConfidence(0.3),
        tags: [],
        summary: "",
        method: "error-fallback",
        color: "#6b7280",
      };
    }
  }

  /**
   * Pattern-basierte Klassifikation (schnell, offline)
   */
  classifyByPatterns(title, description, url) {
    logger.log("🔍 Pattern-based classification...");
    logger.log("  CATEGORIES keys:", Object.keys(CATEGORIES));
    logger.log(
      "  CATEGORIES structure:",
      JSON.stringify(CATEGORIES).substring(0, 500)
    );

    const combined = `${title} ${description} ${url}`.toLowerCase();
    const scores = {};

    // Score jede Kategorie
    for (const [category, data] of Object.entries(CATEGORIES)) {
      let score = 0.0;

      // Debug einzelne Kategorien
      logger.log(`  Category "${category}":`, {
        hasData: !!data,
        dataType: typeof data,
        hasPatterns: data?.patterns,
        patternsType: typeof data?.patterns,
        isArray: Array.isArray(data?.patterns),
      });

      // Safety check - wenn patterns nicht existiert, skip
      if (!data || !Array.isArray(data.patterns)) {
        logger.warn(`  ⚠️ Category "${category}" hat keine patterns array`);
        scores[category] = 0.0;
        continue;
      }

      for (const pattern of data.patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, "gi");
        const matches = combined.match(regex);
        score += (matches?.length || 0.0) * 2.0; // Gewichte Pattern-Matches
      }
      scores[category] = score;
    }

    // Finde beste Kategorie
    const bestCategory = Object.entries(scores).sort(
      ([, a], [, b]) => b - a
    )[0];
    const category = bestCategory?.[0] || "Other";
    const maxScore = Math.max(...Object.values(scores), 1.0);
    const rawConfidence =
      maxScore > 0 ? Math.min(bestCategory?.[1] / maxScore, 1.0) : 0.2;
    const confidence = formatConfidence(rawConfidence);

    logger.log("  Scores:", scores);
    logger.log("  Best:", category, `(${confidence})`);

    // Generiere Tags
    const tags = this.generateTags(combined, category);

    return {
      category,
      confidence,
      tags,
      summary: "",
      method: "patterns",
      color: CATEGORIES[category]?.color || "#6b7280",
    };
  }

  /**
   * Klassifikation mit Chrome Prompt API
   * @param {Object} bookmark - Bookmark-Objekt
   * @returns {Promise<Object>} Classification result
   */
  async classifyWithPromptAPI(bookmark) {
    let session = null;
    try {
      logger.log("🤖 Starting Prompt API classification...");

      // Type-safe Session Creation
      session = await createLanguageModelSession({
        signal: AbortSignal.timeout(60000),
      });

      if (!session) {
        throw new Error("Failed to create Prompt API session");
      }

      logger.log("  ✅ Session created");

      const prompt = `
Du bist ein Bookmark-Klassifizierer. Klassifiziere das folgende Bookmark in EINER der folgenden Kategorien:
- Development (Programmierung, Code, APIs)
- Social (Social Media, Communities)
- News (Nachrichten, Artikel, Blogs)
- Shopping (E-Commerce, Produkte)
- Education (Kurse, Tutorials, Lernen)
- Entertainment (Filme, Musik, Spiele, Streaming)
- Documentation (Doku, Guides, Referenzen)
- Tools (Online-Tools, Utilities)
- Other (Sonstiges)

Bookmark:
Titel: ${bookmark.title}
Beschreibung: ${bookmark.description || "Keine"}
URL: ${bookmark.url}

Antwort im JSON-Format:
{
  "category": "...",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "Kurze Zusammenfassung in 1-2 Sätzen"
}

Antwort (nur JSON, keine anderen Worte):
`;

      // Token-Quota prüfen (nur prompt geschätzt, Antwort wird nachgetragen)
      const requiredTokens = UsageManager.estimateTokensFromText(prompt);
      const canUse = await UsageManager.canConsume(requiredTokens);
      if (!canUse) {
        console.warn(
          "⛔ Tageslimit erreicht – KI wird nicht verwendet, Fallback zu Patterns"
        );
        return null; // lässt classify() auf Pattern zurückfallen
      }

      logger.log("  📤 Sending prompt to AI...");
      // Type-safe Classification
      const result = await classifyWithAI(session, prompt);
      // Antwort-Tokens schätzen und verbuchen (prompt + response grob)
      const responseTokens = UsageManager.estimateTokensFromText(
        JSON.stringify(result)
      );
      await UsageManager.consume(requiredTokens + responseTokens);

      if (!result) {
        throw new Error("Classification failed");
      }

      logger.log("  ✅ AI classification result:", result.category);

      return {
        category: result.category || "Other",
        confidence: formatConfidence(result.confidence || 0.5),
        tags: result.tags || [],
        summary: result.summary || "",
        method: "prompt-api",
        color: CATEGORIES[result.category]?.color || "#6b7280",
      };
    } catch (error) {
      logger.error("❌ Prompt API classification error:", error);
      throw error;
    } finally {
      // Type-safe Cleanup
      safeDestroySession(session);
    }
  }

  /**
   * Generiere Tags basierend auf Content und Kategorie
   */
  generateTags(content, category) {
    const combined = content.toLowerCase();
    const tags = [];

    // Extrahiere Domäne
    try {
      const url = new URL(content);
      const domain = url.hostname.replace("www.", "");
      if (domain && domain.length > 3) {
        tags.push(domain.split(".")[0]); // z.B. "github" von github.com
      }
    } catch {}

    // Kategorie-spezifische Tags
    switch (category) {
      case "Development":
        if (combined.includes("javascript")) tags.push("javascript");
        if (combined.includes("python")) tags.push("python");
        if (combined.includes("react")) tags.push("react");
        if (combined.includes("vue")) tags.push("vue");
        if (combined.includes("api")) tags.push("api");
        break;

      case "Social":
        if (combined.includes("twitter")) tags.push("twitter");
        if (combined.includes("linkedin")) tags.push("linkedin");
        if (combined.includes("reddit")) tags.push("reddit");
        break;

      case "Entertainment":
        if (combined.includes("netflix")) tags.push("netflix");
        if (combined.includes("youtube")) tags.push("youtube");
        if (combined.includes("spotify")) tags.push("spotify");
        break;

      case "Shopping":
        if (combined.includes("amazon")) tags.push("amazon");
        if (combined.includes("ebay")) tags.push("ebay");
        break;
    }

    // Begrenzte auf 5 Tags
    return tags.slice(0, 5);
  }

  /**
   * Batch-Klassifikation für mehrere Bookmarks
   */
  async classifyBatch(bookmarks, usePromptAPI = true) {
    const results = [];

    for (const bookmark of bookmarks) {
      try {
        const result = await this.classify(bookmark, usePromptAPI);
        results.push({ bookmarkId: bookmark.id, ...result });

        // Rate Limiting für Prompt API
        if (usePromptAPI) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        logger.error(`Classification failed for ${bookmark.id}:`, error);
        results.push({
          bookmarkId: bookmark.id,
          category: "Other",
          confidence: formatConfidence(0),
          tags: [],
          summary: "",
          method: "error",
        });
      }
    }

    return results;
  }

  /**
   * Get Category Color
   */
  getCategoryColor(category) {
    return CATEGORIES[category]?.color || "#6b7280";
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Object.keys(CATEGORIES);
  }
}

export default new ClassificationService();

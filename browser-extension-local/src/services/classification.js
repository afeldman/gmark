/**
 * Classification Service
 * 
 * Nutzt Chrome Prompt API für lokale, private Klassifikation
 * Mit @types/dom-chromium-ai für Type-Safety
 * Kategorien: Development, Social, News, Shopping, Education, Entertainment, Documentation, Tools, Other
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
} from "../types/ai.d.ts";

const CATEGORIES = {
  Development: {
    patterns: [
      "github",
      "stackoverflow",
      "npm",
      "docker",
      "kubernetes",
      "code",
      "programming",
      "javascript",
      "python",
      "react",
      "api",
      "library",
      "framework",
    ],
    color: "#4f46e5",
  },
  Social: {
    patterns: [
      "twitter",
      "facebook",
      "instagram",
      "linkedin",
      "reddit",
      "tiktok",
      "social",
      "community",
      "follow",
      "like",
      "share",
    ],
    color: "#ec4899",
  },
  News: {
    patterns: [
      "news",
      "article",
      "blog",
      "post",
      "story",
      "breaking",
      "headline",
      "magazine",
      "journal",
      "press",
      "bbc",
      "cnn",
      "nyt",
    ],
    color: "#f59e0b",
  },
  Shopping: {
    patterns: [
      "amazon",
      "ebay",
      "shop",
      "buy",
      "cart",
      "checkout",
      "product",
      "store",
      "price",
      "discount",
      "sale",
      "order",
    ],
    color: "#10b981",
  },
  Education: {
    patterns: [
      "coursera",
      "udemy",
      "khan academy",
      "edx",
      "learn",
      "course",
      "tutorial",
      "university",
      "school",
      "education",
      "training",
      "certificate",
    ],
    color: "#06b6d4",
  },
  Entertainment: {
    patterns: [
      "netflix",
      "youtube",
      "spotify",
      "twitch",
      "game",
      "movie",
      "music",
      "film",
      "stream",
      "watch",
      "play",
      "entertainment",
    ],
    color: "#a855f7",
  },
  Documentation: {
    patterns: [
      "docs",
      "documentation",
      "guide",
      "manual",
      "reference",
      "wiki",
      "readme",
      "specification",
      "spec",
      "help",
      "support",
    ],
    color: "#8b5cf6",
  },
  Tools: {
    patterns: [
      "tool",
      "software",
      "app",
      "application",
      "utility",
      "converter",
      "generator",
      "editor",
      "online",
      "free",
    ],
    color: "#64748b",
  },
};

export class ClassificationService {
  constructor() {
    this.promptAPIAvailable = false;
    this.initPromise = this.checkPromptAPI();
  }

  async checkPromptAPI() {
    try {
      // Nutze Type-sichere Funktion
      this.promptAPIAvailable = await checkCanCreateSession((status) => {
        console.log(`ℹ️ Prompt API Status: ${status}`);
        if (status === "readily") {
          console.log("✅ Prompt API ready to use");
        } else if (status === "after-download") {
          console.log("⏳ Model downloading, will be available shortly");
        } else {
          console.log("❌ Prompt API not available on this device");
        }
      });
    } catch (error) {
      console.warn("⚠️ Prompt API check failed:", error);
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
    try {
      // Methode 1: Pattern-Matching (schnell)
      const patternResult = this.classifyByPatterns(
        bookmark.title,
        bookmark.description,
        bookmark.url
      );

      // Wenn confidence hoch genug, use it
      if (patternResult.confidence >= 0.8) {
        return patternResult;
      }

      // Methode 2: Prompt API (wenn verfügbar und gewünscht)
      if (usePromptAPI && this.promptAPIAvailable) {
        try {
          const aiResult = await this.classifyWithPromptAPI(bookmark);
          return aiResult;
        } catch (error) {
          console.warn("Prompt API classification failed, using pattern match");
        }
      }

      // Fallback: Verwende Pattern-Result (auch wenn confidence < 0.8)
      return patternResult;
    } catch (error) {
      console.error("Classification error:", error);
      return {
        category: "Other",
        confidence: 0,
        tags: [],
        summary: "",
        method: "error-fallback",
      };
    }
  }

  /**
   * Pattern-basierte Klassifikation (schnell, offline)
   */
  classifyByPatterns(title, description, url) {
    const combined = `${title} ${description} ${url}`.toLowerCase();
    const scores = {};

    // Score jede Kategorie
    for (const [category, data] of Object.entries(CATEGORIES)) {
      let score = 0;
      for (const pattern of data.patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, "gi");
        const matches = combined.match(regex);
        score += (matches?.length || 0) * 2; // Gewichte Pattern-Matches
      }
      scores[category] = score;
    }

    // Finde beste Kategorie
    const bestCategory = Object.entries(scores).sort(
      ([, a], [, b]) => b - a
    )[0];
    const category = bestCategory?.[0] || "Other";
    const confidence = Math.min((bestCategory?.[1] || 0) / 10, 1);

    // Generiere Tags
    const tags = this.generateTags(combined, category);

    return {
      category,
      confidence,
      tags,
      summary: "",
      method: "patterns",
      color: CATEGORIES[category as keyof typeof CATEGORIES]?.color || "#6b7280",
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
      // Type-safe Session Creation
      session = await createLanguageModelSession({
        signal: AbortSignal.timeout(60000),
      });

      if (!session) {
        throw new Error("Failed to create Prompt API session");
      }

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

      // Type-safe Classification
      const result = await classifyWithAI(session, prompt);
      
      if (!result) {
        throw new Error("Classification failed");
      }

      return {
        category: result.category || "Other",
        confidence: result.confidence || 0.5,
        tags: result.tags || [],
        summary: result.summary || "",
        method: "prompt-api",
        color:
          CATEGORIES[result.category as keyof typeof CATEGORIES]?.color ||
          "#6b7280",
      };
    } catch (error) {
      console.error("❌ Prompt API classification error:", error);
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
        console.error(`Classification failed for ${bookmark.id}:`, error);
        results.push({
          bookmarkId: bookmark.id,
          category: "Other",
          confidence: 0,
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
    return CATEGORIES[category as keyof typeof CATEGORIES]?.color || "#6b7280";
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Object.keys(CATEGORIES);
  }
}

export default new ClassificationService();

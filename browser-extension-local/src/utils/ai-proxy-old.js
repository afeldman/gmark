/**
 * AI Proxy - Ermöglicht Prompt API Nutzung aus Service Worker Context
 *
 * Problem: Service Worker hat kein self.ai verfügbar
 * Lösung: Führe AI-Calls in Tab-Context aus und sende Ergebnis zurück
 */

/**
 * Prüfe ob Prompt API in einem Tab verfügbar ist
 */
export async function checkPromptAPIInTab() {
  console.log("🔍 Prüfe Prompt API in Tab-Context...");

  try {
    // Erstelle temporären Tab mit Extension-eigener HTML-Datei
    const workerUrl = chrome.runtime.getURL("src/utils/ai-worker.html");
    const tab = await chrome.tabs.create({
      url: workerUrl,
      active: false,
    });

    // Warte kurz bis Tab geladen ist
    await new Promise((r) => setTimeout(r, 500));

    // Führe Check im Tab aus
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        try {
          // Prüfe ob AI verfügbar ist
          const ai = self.ai || globalThis.ai;

          if (!ai?.languageModel) {
            return {
              available: false,
              error: "AI object not found",
              aiExists: !!ai,
              languageModelExists: !!ai?.languageModel,
            };
          }

          // Prüfe ob Session erstellt werden kann
          const status = await ai.languageModel.capabilities();

          return {
            available: status.available === "readily",
            status: status.available,
            defaultTemperature: status.defaultTemperature,
            defaultTopK: status.defaultTopK,
            maxTopK: status.maxTopK,
          };
        } catch (error) {
          return {
            available: false,
            error: error.message,
          };
        }
      },
    });

    // Tab schließen
    await chrome.tabs.remove(tab.id);

    console.log("  ✅ Tab-Check Ergebnis:", result.result);
    return result.result;
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
    // Erstelle temporären Tab mit Extension-eigener HTML-Datei
    const workerUrl = chrome.runtime.getURL("src/utils/ai-worker.html");
    const tab = await chrome.tabs.create({
      url: workerUrl,
      active: false,
    });

    // Warte kurz bis Tab geladen ist
    await new Promise((r) => setTimeout(r, 500));

    // Führe Klassifikation im Tab aus
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [bookmark],
      func: async (bookmark) => {
        try {
          const ai = self.ai || globalThis.ai;

          if (!ai?.languageModel) {
            throw new Error("AI languageModel not available");
          }

          // Erstelle Session
          const session = await ai.languageModel.create({
            systemPrompt:
              "You are a bookmark classifier. Always respond with valid JSON only.",
            temperature: 0.3,
            topK: 3,
          });

          const prompt = `Classify this bookmark into ONE category:

Categories:
- Development (programming, code, APIs, GitHub, StackOverflow)
- Social (social media, communities, Twitter, LinkedIn, Reddit)
- News (news articles, blogs, magazines)
- Shopping (e-commerce, products, Amazon, eBay)
- Education (courses, tutorials, learning, Udemy, Coursera)
- Entertainment (movies, music, games, Netflix, Spotify, YouTube)
- Documentation (docs, guides, references, manuals)
- Tools (online tools, utilities, converters, generators)
- Other (anything else)

Bookmark:
Title: ${bookmark.title || "Untitled"}
Description: ${bookmark.description || "None"}
URL: ${bookmark.url}

Respond ONLY with JSON (no markdown, no code blocks):
{
  "category": "...",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "One sentence summary"
}`;

          const response = await session.prompt(prompt);
          await session.destroy();

          // Parse JSON aus Antwort
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON in response");
          }

          const classification = JSON.parse(jsonMatch[0]);

          return {
            success: true,
            category: classification.category || "Other",
            confidence: classification.confidence || 0.5,
            tags: classification.tags || [],
            summary: classification.summary || "",
            method: "prompt-api-tab",
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    });

    // Tab schließen
    await chrome.tabs.remove(tab.id);

    if (!result.result.success) {
      throw new Error(result.result.error);
    }

    console.log(`  ✅ Klassifiziert: ${result.result.category}`);
    return result.result;
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
    // Erstelle temporären Tab mit Extension-eigener HTML-Datei
    const workerUrl = chrome.runtime.getURL("src/utils/ai-worker.html");
    const tab = await chrome.tabs.create({
      url: workerUrl,
      active: false,
    });

    // Warte kurz bis Tab geladen ist
    await new Promise((r) => setTimeout(r, 500));

    // Führe Zusammenfassung im Tab aus
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [content, title],
      func: async (content, title) => {
        try {
          const ai = self.ai || globalThis.ai;

          if (!ai?.languageModel) {
            throw new Error("AI languageModel not available");
          }

          // Erstelle Session
          const session = await ai.languageModel.create({
            systemPrompt:
              "You are a content summarizer. Create concise summaries.",
            temperature: 0.5,
            topK: 5,
          });

          const prompt = `Summarize this content in 2-3 sentences:

Title: ${title}

Content:
${content.substring(0, 3000)}

Summary:`;

          const response = await session.prompt(prompt);
          await session.destroy();

          return {
            success: true,
            summary: response.trim(),
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    });

    // Tab schließen
    await chrome.tabs.remove(tab.id);

    if (!result.result.success) {
      throw new Error(result.result.error);
    }

    console.log(
      `  ✅ Zusammenfassung erstellt (${result.result.summary.length} Zeichen)`
    );
    return result.result.summary;
  } catch (error) {
    console.error(`  ❌ Zusammenfassung fehlgeschlagen:`, error);
    return "";
  }
}

export default {
  checkPromptAPIInTab,
  classifyInTab,
  summarizeInTab,
};

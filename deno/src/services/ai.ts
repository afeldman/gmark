// AI Classification Service
// Unterstützt: OpenAI API + Local LLM (AnythingLLM)

/**
 * Klassifiziere URL basierend auf Title und Description
 * Nutzt Simple Text Pattern Matching (keine LLM erforderlich)
 */
export function classifyByPatterns(
  title: string | null,
  description: string | null,
  keywords: string[],
): { category: string; confidence: number } {
  const text = `${title || ""} ${description || ""} ${keywords.join(" ")}`
    .toLowerCase();

  // Kategorie Patterns
  const categories: Record<string, { patterns: string[]; confidence: number }> =
    {
      Development: {
        patterns: [
          "github",
          "gitlab",
          "code",
          "programming",
          "developer",
          "npm",
          "javascript",
          "python",
          "typescript",
          "react",
          "angular",
          "vue",
          "node",
          "express",
          "api",
          "database",
          "sql",
        ],
        confidence: 0.8,
      },
      Social: {
        patterns: [
          "twitter",
          "facebook",
          "instagram",
          "linkedin",
          "reddit",
          "tiktok",
          "youtube",
          "social",
          "community",
        ],
        confidence: 0.85,
      },
      News: {
        patterns: [
          "news",
          "article",
          "blog",
          "medium",
          "journalist",
          "press",
          "breaking",
          "headline",
        ],
        confidence: 0.8,
      },
      Shopping: {
        patterns: [
          "amazon",
          "ebay",
          "shop",
          "store",
          "buy",
          "price",
          "product",
          "cart",
          "checkout",
        ],
        confidence: 0.85,
      },
      Education: {
        patterns: [
          "udemy",
          "coursera",
          "edx",
          "learning",
          "course",
          "tutorial",
          "education",
          "school",
          "university",
        ],
        confidence: 0.8,
      },
      Entertainment: {
        patterns: [
          "netflix",
          "disney",
          "movie",
          "music",
          "game",
          "film",
          "entertainment",
        ],
        confidence: 0.8,
      },
      Documentation: {
        patterns: [
          "docs",
          "documentation",
          "manual",
          "guide",
          "specification",
          "reference",
          "readme",
        ],
        confidence: 0.85,
      },
      Tools: {
        patterns: [
          "tool",
          "converter",
          "generator",
          "calculator",
          "editor",
          "app",
          "application",
          "online",
        ],
        confidence: 0.7,
      },
    };

  let bestCategory = "Other";
  let bestScore = 0;

  for (const [category, config] of Object.entries(categories)) {
    let matchCount = 0;
    for (const pattern of config.patterns) {
      if (text.includes(pattern)) {
        matchCount++;
      }
    }

    const score = (matchCount / config.patterns.length) * config.confidence;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return {
    category: bestCategory,
    confidence: Math.min(bestScore, 1),
  };
}

/**
 * Generiere Tags basierend auf Title, Description und Keywords
 */
export function generateTags(
  title: string | null,
  description: string | null,
  keywords: string[],
  category: string,
): string[] {
  const tags = new Set<string>();

  // Füge Kategorie als Tag hinzu
  tags.add(category);

  // Füge existierende Keywords hinzu
  keywords.forEach((k) => {
    if (k.length > 2 && k.length < 30) {
      tags.add(k);
    }
  });

  // Extrahiere wichtige Worte aus Title
  if (title) {
    const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
    titleWords.slice(0, 3).forEach((w) => tags.add(w));
  }

  // Convert to array und limit to 10 tags
  return Array.from(tags).slice(0, 10);
}

/**
 * Call OpenAI API für erweiterte Classification
 * (Optional - fallback zu Pattern-basierter Classification)
 */
export async function classifyWithOpenAI(
  title: string,
  description: string,
  apiKey?: string,
): Promise<{ category: string; confidence: number; reasoning: string } | null> {
  const key = apiKey || Deno.env.get("OPENAI_API_KEY");

  if (!key) {
    return null; // Kein API Key verfügbar
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein Experte für URL-Klassifizierung. Klassifiziere die gegebene URL in eine Kategorie. Antworte im JSON Format: {category: string, confidence: number 0-1, reasoning: string}",
          },
          {
            role: "user",
            content:
              `Klassifiziere diese URL:\nTitle: ${title}\nDescription: ${description}`,
          },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn("OpenAI API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    // Parse JSON response
    const result = JSON.parse(content);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("OpenAI classification error:", message);
    return null;
  }
}

/**
 * Call Local LLM (AnythingLLM) für Classification
 * (Optional - fallback zu Pattern-basierter Classification)
 */
export async function classifyWithLocalLLM(
  title: string,
  description: string,
  endpoint?: string,
): Promise<{ category: string; confidence: number; reasoning: string } | null> {
  const url = endpoint || Deno.env.get("ANYTHINGLLM_ENDPOINT");

  if (!url) {
    return null; // Kein Endpoint verfügbar
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          `Klassifiziere diese URL in eine Kategorie (Development, Social, News, Shopping, Education, Entertainment, Documentation, Tools, Other):\nTitle: ${title}\nDescription: ${description}\n\nAntwort im JSON Format: {category: string, confidence: number 0-1}`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn("Local LLM error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.classification || null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Local LLM classification error:", message);
    return null;
  }
}

/**
 * Full Classification Pipeline
 * 1. Versuche OpenAI (falls API Key verfügbar)
 * 2. Fallback zu Local LLM (falls Endpoint verfügbar)
 * 3. Fallback zu Pattern-basierter Classification
 */
export async function classifyBookmark(
  title: string,
  description: string,
  keywords: string[],
  options?: {
    useOpenAI?: boolean;
    useLocalLLM?: boolean;
    usePatterns?: boolean;
  },
): Promise<{
  category: string;
  confidence: number;
  tags: string[];
  method: "openai" | "local-llm" | "patterns";
}> {
  const useOpenAI = options?.useOpenAI !== false;
  const useLocalLLM = options?.useLocalLLM !== false;
  const usePatterns = options?.usePatterns !== false;

  // Try OpenAI first
  if (useOpenAI) {
    const openaiResult = await classifyWithOpenAI(title, description);
    if (openaiResult && openaiResult.confidence > 0.7) {
      const tags = generateTags(
        title,
        description,
        keywords,
        openaiResult.category,
      );
      return {
        category: openaiResult.category,
        confidence: openaiResult.confidence,
        tags,
        method: "openai",
      };
    }
  }

  // Try Local LLM
  if (useLocalLLM) {
    const localResult = await classifyWithLocalLLM(title, description);
    if (localResult && localResult.confidence > 0.7) {
      const tags = generateTags(
        title,
        description,
        keywords,
        localResult.category,
      );
      return {
        category: localResult.category,
        confidence: localResult.confidence,
        tags,
        method: "local-llm",
      };
    }
  }

  // Fallback zu Pattern-basierter Classification
  if (usePatterns) {
    const patternResult = classifyByPatterns(title, description, keywords);
    const tags = generateTags(
      title,
      description,
      keywords,
      patternResult.category,
    );
    return {
      category: patternResult.category,
      confidence: patternResult.confidence,
      tags,
      method: "patterns",
    };
  }

  // Default
  return {
    category: "Other",
    confidence: 0,
    tags: generateTags(title, description, keywords, "Other"),
    method: "patterns",
  };
}

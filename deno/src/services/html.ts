// HTML Fetching und Title Extraction Service

/**
 * Fetch HTML Content von einer URL
 * @param url - URL zum Fetchen
 * @returns HTML Content oder null bei Error
 */
export async function fetchHtmlContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5000), // 5 Sekunde Timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`HTML fetch error for ${url}: ${message}`);
    return null;
  }
}

/**
 * Extrahiere Title aus HTML
 * @param html - HTML Content
 * @returns Title oder null
 */
export function extractTitle(html: string): string | null {
  try {
    // Try <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return decodeHTML(titleMatch[1].trim());
    }

    // Try og:title meta tag
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    );
    if (ogTitleMatch && ogTitleMatch[1]) {
      return decodeHTML(ogTitleMatch[1]);
    }

    // Try h1 tag as fallback
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return decodeHTML(h1Match[1].trim());
    }

    return null;
  } catch (err: unknown) {
    console.warn("Title extraction error:", err);
    return null;
  }
}

/**
 * Extrahiere Description aus HTML
 * @param html - HTML Content
 * @returns Description oder null
 */
export function extractDescription(html: string): string | null {
  try {
    // Try meta description tag
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    );
    if (descMatch && descMatch[1]) {
      return decodeHTML(descMatch[1]);
    }

    // Try og:description meta tag
    const ogDescMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    );
    if (ogDescMatch && ogDescMatch[1]) {
      return decodeHTML(ogDescMatch[1]);
    }

    return null;
  } catch (err: unknown) {
    console.warn("Description extraction error:", err);
    return null;
  }
}

/**
 * Extrahiere Keywords/Tags aus HTML
 * @param html - HTML Content
 * @returns Array von Keywords
 */
export function extractKeywords(html: string): string[] {
  try {
    const keywords: string[] = [];

    // Try meta keywords tag
    const keywordsMatch = html.match(
      /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i,
    );
    if (keywordsMatch && keywordsMatch[1]) {
      const kw = keywordsMatch[1].split(",").map((k) => k.trim()).filter((k) =>
        k
      );
      keywords.push(...kw);
    }

    // Try Open Graph tags (category, type)
    const ogTypeMatch = html.match(
      /<meta\s+property=["']og:type["']\s+content=["']([^"']+)["']/i,
    );
    if (ogTypeMatch && ogTypeMatch[1]) {
      keywords.push(ogTypeMatch[1]);
    }

    return keywords.slice(0, 10); // Max 10 keywords
  } catch (err: unknown) {
    console.warn("Keyword extraction error:", err);
    return [];
  }
}

/**
 * Decode HTML entities
 * @param html - HTML string mit entities
 * @returns Decoded string
 */
function decodeHTML(html: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return html.replace(/&[#\w]+;/g, (match) => entities[match] || match);
}

/**
 * Fetch und extrahiere alle Metadaten aus URL
 * @param url - URL
 * @returns Metadata { title, description, keywords }
 */
export async function extractMetadata(url: string): Promise<{
  title: string | null;
  description: string | null;
  keywords: string[];
}> {
  const html = await fetchHtmlContent(url);

  if (!html) {
    return { title: null, description: null, keywords: [] };
  }

  return {
    title: extractTitle(html),
    description: extractDescription(html),
    keywords: extractKeywords(html),
  };
}

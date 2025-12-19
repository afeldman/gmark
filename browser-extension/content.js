// GMARK Browser Extension - Content Script
// Extracts page content for AI classification

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const content = extractPageContent();
    sendResponse({ content: content });
  }
  return true;
});

// Extract meaningful content from page
function extractPageContent() {
  let content = "";

  // Try to get main content (various methods)

  // 1. Look for <article> tags
  const article = document.querySelector("article");
  if (article) {
    content = article.innerText;
  }

  // 2. Look for common content containers
  if (!content) {
    const selectors = [
      "main",
      '[role="main"]',
      ".main-content",
      "#main-content",
      ".content",
      "#content",
      ".post-content",
      ".article-content",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.innerText;
        break;
      }
    }
  }

  // 3. Fallback to body, but filter out scripts and styles
  if (!content) {
    const body = document.body.cloneNode(true);

    // Remove unwanted elements
    const unwanted = body.querySelectorAll(
      "script, style, nav, header, footer, aside, .sidebar, .advertisement"
    );
    unwanted.forEach((el) => el.remove());

    content = body.innerText;
  }

  // Clean up the content
  content = cleanText(content);

  // Limit to first 2000 characters for AI
  return content.substring(0, 2000);
}

// Clean and normalize text
function cleanText(text) {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
    .trim();
}

// Extract meta information
function extractMetaInfo() {
  const meta = {
    description: "",
    keywords: [],
    author: "",
    published: "",
  };

  // Meta description
  const descMeta =
    document.querySelector('meta[name="description"]') ||
    document.querySelector('meta[property="og:description"]');
  if (descMeta) {
    meta.description = descMeta.content;
  }

  // Meta keywords
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta) {
    meta.keywords = keywordsMeta.content.split(",").map((k) => k.trim());
  }

  // Author
  const authorMeta =
    document.querySelector('meta[name="author"]') ||
    document.querySelector('meta[property="article:author"]');
  if (authorMeta) {
    meta.author = authorMeta.content;
  }

  // Published date
  const dateMeta = document.querySelector(
    'meta[property="article:published_time"]'
  );
  if (dateMeta) {
    meta.published = dateMeta.content;
  }

  return meta;
}

// Extract headings for better context
function extractHeadings() {
  const headings = [];
  const h1 = document.querySelectorAll("h1");
  const h2 = document.querySelectorAll("h2");

  h1.forEach((h) => headings.push(h.innerText.trim()));
  h2.forEach((h) => headings.push(h.innerText.trim()));

  return headings.slice(0, 10); // Limit to first 10
}

// Optional: Highlight bookmarked links (if syncing is enabled)
async function highlightBookmarkedLinks() {
  const config = await chrome.storage.local.get(["cachedBookmarks"]);

  if (!config.cachedBookmarks) {
    return;
  }

  const bookmarkedUrls = new Set(config.cachedBookmarks.map((b) => b.url));

  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const url = new URL(link.href, window.location.href).href;
    if (bookmarkedUrls.has(url)) {
      link.style.backgroundColor = "#fff3cd";
      link.title = "🔖 In GMARK gespeichert";
    }
  });
}

// Auto-highlight on page load (if enabled)
chrome.storage.sync.get(["highlightBookmarks"], (config) => {
  if (config.highlightBookmarks) {
    highlightBookmarkedLinks();
  }
});

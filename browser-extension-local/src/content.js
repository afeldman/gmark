/**
 * GMARK Local - Content Script
 *
 * Verantwortlich für:
 * - Seiten-Inhalt extrahieren
 * - Screenshots (optional)
 * - Text-Analyse
 */

// Nachricht vom Background erhalten
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTENT") {
    const content = extractPageContent();
    sendResponse(content);
  }
});

function extractPageContent() {
  const pageText = extractMainContent();
  return {
    content: pageText,
    description:
      getMetaDescription() || getOGDescription() || getFirstParagraph(),
    title: document.title,
    url: window.location.href,
    keywords: getMetaKeywords(),
    headings: getHeadings(),
    images: getImages(),
    pageText: pageText,
    timestamp: Date.now(),
  };
}

/**
 * Extrahiere den Hauptinhalt einer Webseite
 * @returns {string} Der extrahierte Text-Inhalt der Seite
 */
function extractMainContent() {
  // Versuche, den Hauptinhalt zu extrahieren

  // 1. Prüfe auf article
  let main = document.querySelector("article");
  if (main) return main.innerText;

  // 2. Prüfe auf main
  main = document.querySelector("main");
  if (main) return main.innerText;

  // 3. Prüfe auf [role="main"]
  main = document.querySelector("[role='main']");
  if (main) return main.innerText;

  // 4. Fallback: body
  return document.body.innerText;
}

/**
 * Lese die Meta-Description der Seite
 * @returns {string} Die Meta-Description oder ein leerer String
 */
function getMetaDescription() {
  return (
    document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="description"]')?.content ||
    ""
  );
}

/**
 * Lese die Open Graph Description der Seite
 * @returns {string} Die OG-Description oder ein leerer String
 */
function getOGDescription() {
  return (
    document.querySelector('meta[property="og:description"]')?.content || ""
  );
}

/**
 * Lese den ersten Absatz der Seite
 * @returns {string} Der Text des ersten Absatzes oder ein leerer String
 */
function getFirstParagraph() {
  const p = document.querySelector("p");
  return p?.innerText || "";
}

/**
 * Lese die Meta-Keywords der Seite
 * @returns {Array<string>} Array der Keywords oder ein leeres Array
 */
function getMetaKeywords() {
  const keywords = document.querySelector('meta[name="keywords"]')?.content;
  return keywords ? keywords.split(",").map((k) => k.trim()) : [];
}

/**
 * Extrahiere alle Überschriften von der Seite
 * @returns {Array<Object>} Array mit level und text Eigenschaften
 */
function getHeadings() {
  const headings = [];
  document.querySelectorAll("h1, h2, h3").forEach((h) => {
    headings.push({
      level: parseInt(h.tagName[1]),
      text: h.innerText,
    });
  });
  return headings;
}

/**
 * Extrahiere Bilder von der Seite
 * @returns {Array<Object>} Array mit bis zu 5 Bildern (src, alt, title)
 */
function getImages() {
  const images = [];
  document.querySelectorAll("img").forEach((img) => {
    if (img.src && !img.src.includes("data:")) {
      images.push({
        src: img.src,
        alt: img.alt || "",
        title: img.title || "",
      });
    }
  });
  return images.slice(0, 5); // Limit auf 5 Bilder
}

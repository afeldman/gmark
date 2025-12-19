/**
 * Duplicate Detection Service
 *
 * Erkennt Duplikate durch:
 * 1. URL-Normalisierung
 * 2. Levenshtein Distance (String-Ähnlichkeit)
 * 3. Fuzzy Matching
 */

export class DuplicateDetectionService {
  /**
   * Finde mögliche Duplikate für ein Bookmark
   */
  async findDuplicates(newBookmark, existingBookmarks, threshold = 0.8) {
    const duplicates = [];

    // Normalisiere neue URL
    const newNormalizedUrl = this.normalizeUrl(newBookmark.url);

    for (const existing of existingBookmarks) {
      const similarity = this.calculateSimilarity(
        newBookmark,
        existing,
        newNormalizedUrl
      );

      if (similarity >= threshold) {
        duplicates.push({
          bookmarkId: existing.id,
          similarity,
          reason: this.getSimilarityReason(newBookmark, existing, similarity),
        });
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Berechne Ähnlichkeit zwischen zwei Bookmarks
   */
  calculateSimilarity(bookmark1, bookmark2, normalizedUrl1 = null) {
    // 1. URL-Vergleich (höchstes Gewicht)
    const url1 = normalizedUrl1 || this.normalizeUrl(bookmark1.url);
    const url2 = this.normalizeUrl(bookmark2.url);

    if (url1 === url2) {
      return 1.0; // Identische URLs = 100% Duplikat
    }

    // 2. URL-Domain-Vergleich
    const domain1 = this.extractDomain(bookmark1.url);
    const domain2 = this.extractDomain(bookmark2.url);
    const domainSimilarity =
      domain1 === domain2
        ? 0.4
        : this.levenshteinSimilarity(domain1, domain2) * 0.2;

    // 3. Titel-Vergleich
    const titleSimilarity = this.levenshteinSimilarity(
      bookmark1.title.toLowerCase(),
      bookmark2.title.toLowerCase()
    );

    // 4. Beschreibung-Vergleich
    const descSimilarity = this.levenshteinSimilarity(
      (bookmark1.description || "").toLowerCase(),
      (bookmark2.description || "").toLowerCase()
    );

    // Gewichteter Durchschnitt
    const totalSimilarity =
      Math.min(
        url1.length > 0 && url2.length > 0 ? titleSimilarity * 0.4 : 0,
        1
      ) +
      domainSimilarity +
      descSimilarity * 0.1;

    return Math.min(totalSimilarity, 1.0);
  }

  /**
   * Berechne Levenshtein Distance zwischen zwei Strings
   * Gibt Wert zwischen 0 (unterschiedlich) und 1 (identisch) zurück
   */
  levenshteinSimilarity(a, b) {
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);

    if (maxLength === 0) return 1.0;

    return 1 - distance / maxLength;
  }

  /**
   * Levenshtein Distance (Implementierung)
   */
  levenshteinDistance(a, b) {
    const matrix = [];

    // Initialisiere Matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fülle Matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Ersetzung
            matrix[i][j - 1] + 1, // Einfügung
            matrix[i - 1][j] + 1 // Löschung
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Normalisiere URL für Vergleich
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);

      // Entferne www
      let hostname = urlObj.hostname.replace(/^www\./, "");

      // Entferne trailing slash
      let pathname = urlObj.pathname.replace(/\/$/, "");

      // Kleinbuchstaben
      return (hostname + pathname).toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Extrahiere Domain aus URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  }

  /**
   * Beschreibe warum zwei Bookmarks als Duplikate erkannt wurden
   */
  getSimilarityReason(bookmark1, bookmark2, similarity) {
    const url1 = this.normalizeUrl(bookmark1.url);
    const url2 = this.normalizeUrl(bookmark2.url);

    if (url1 === url2) {
      return "Identische URL";
    }

    const domain1 = this.extractDomain(bookmark1.url);
    const domain2 = this.extractDomain(bookmark2.url);

    if (domain1 === domain2) {
      return `Gleiche Domain (${domain1})`;
    }

    const titleSimilarity = this.levenshteinSimilarity(
      bookmark1.title.toLowerCase(),
      bookmark2.title.toLowerCase()
    );

    if (titleSimilarity > 0.85) {
      return `Ähnliche Titel (${Math.round(titleSimilarity * 100)}% Match)`;
    }

    return `Ähnlich (${Math.round(similarity * 100)}% Match)`;
  }

  /**
   * Merge zwei Bookmarks
   * Behalte den besten Titel, Description, etc.
   */
  mergeBookmarks(primary, duplicate, keepPrimary = true) {
    if (keepPrimary) {
      return {
        ...primary,
        tags: Array.from(new Set([...primary.tags, ...duplicate.tags])),
        lastModified: Date.now(),
      };
    } else {
      return {
        ...duplicate,
        tags: Array.from(new Set([...primary.tags, ...duplicate.tags])),
        lastModified: Date.now(),
      };
    }
  }

  /**
   * Batch-Duplikat-Erkennung
   */
  async findAllDuplicates(bookmarks, threshold = 0.8) {
    const duplicates = [];

    for (let i = 0; i < bookmarks.length; i++) {
      for (let j = i + 1; j < bookmarks.length; j++) {
        const similarity = this.calculateSimilarity(bookmarks[i], bookmarks[j]);

        if (similarity >= threshold) {
          duplicates.push({
            primary: bookmarks[i],
            duplicate: bookmarks[j],
            similarity,
            reason: this.getSimilarityReason(
              bookmarks[i],
              bookmarks[j],
              similarity
            ),
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Automatisches Merge von hochgradig ähnlichen Bookmarks
   */
  async autoMergeHighSimilarity(bookmarks, threshold = 0.95) {
    const duplicates = await this.findAllDuplicates(bookmarks, threshold);
    const merged = new Map();
    const toDelete = new Set();

    for (const dup of duplicates) {
      if (toDelete.has(dup.duplicate.id)) continue;

      const mergedBookmark = this.mergeBookmarks(dup.primary, dup.duplicate);
      merged.set(dup.primary.id, mergedBookmark);
      toDelete.add(dup.duplicate.id);
    }

    return {
      merged: Array.from(merged.values()),
      toDelete: Array.from(toDelete),
    };
  }

  /**
   * Intelligentes Merge von Bookmarks mit Konflikt-Auflösung
   */
  resolveMerge(primary, duplicate, choices = {}) {
    const merged = {
      id: primary.id,
      url: choices.url || primary.url,
      title: choices.title || primary.title,
      description: choices.description || primary.description,
      content: choices.content || primary.content,
      category: choices.category || primary.category,
      tags: Array.from(
        new Set([...(choices.tags || primary.tags), ...duplicate.tags])
      ),
      summary: choices.summary || primary.summary,
      confidenceScore: Math.max(
        primary.confidenceScore,
        duplicate.confidenceScore
      ),
      dateAdded: Math.min(primary.dateAdded, duplicate.dateAdded),
      lastModified: Date.now(),
    };

    return merged;
  }
}

export default new DuplicateDetectionService();

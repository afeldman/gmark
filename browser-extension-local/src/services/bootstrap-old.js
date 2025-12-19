/**
 * Bootstrap Service - URL-für-URL Verarbeitung
 *
 * Workflow:
 * 1. Für jede URL einzeln:
 *    - Erreichbar? → Titel laden, Klassifikation, Kategorie-Ordner
 *    - Nicht erreichbar? → "not_responding" Ordner
 * 2. Resume nach Neustart bei nächster unverarbeiteter URL
 * 3. Nach Bootstrap: Automatische Klassifikation für neue Links
 */

import StorageManager from "../utils/storage.js";
import ClassificationService from "./classification.js";
import {
  checkCanCreateSession,
  createLanguageModelSession,
  summarizeWithAI,
  safeDestroySession,
} from "../types/ai.js";

export class BootstrapService {
  constructor() {
    this.bookmarksToProcess = 0;
    this.bookmarksProcessed = 0;
    this.bootstrapComplete = false;
  }

  /**
   * Prüfe Chrome Konfiguration für Prompt API
   * @returns {Promise<{configured: boolean, issues: string[], steps: string[], alert: string}>}
   */
  async checkChromeConfiguration() {
    console.log("\n🔍 Prüfe Chrome Konfiguration für Prompt API...");

    const issues = [];
    const solutions = [];

    // ============================================================
    // 1. Prüfe Chrome Version
    // ============================================================
    console.log("  📌 Prüfe Chrome Version...");
    const userAgent = navigator.userAgent;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;

    console.log(`    Chrome Version: ${chromeVersion}`);

    if (chromeVersion < 128) {
      issues.push(`Chrome Version zu alt (${chromeVersion})`);
      solutions.push(
        "1️⃣ Chrome aktualisieren:\n   • Menu → Einstellungen → Über Chrome\n   • Chrome wird automatisch aktualisiert\n   • Browser neu starten"
      );
    } else {
      console.log(`    ✅ Chrome ${chromeVersion} ist kompatibel`);
    }

    // ============================================================
    // 2. Prüfe Prompt API Flag
    // ============================================================
    console.log("  📌 Prüfe Prompt API Flag...");
    const promptAPIAvailable = await this.checkPromptAPIFlag();
    console.log(
      `    Prompt API Flag: ${
        promptAPIAvailable ? "✅ Aktiviert" : "❌ Deaktiviert"
      }`
    );

    if (!promptAPIAvailable) {
      issues.push("Prompt API Flag nicht aktiviert");
      solutions.push(
        "2️⃣ Aktiviere Prompt API Flag:\n   • chrome://flags/#prompt-api-for-gemini-nano in URL-Leiste eingeben\n   • Dropdown auf 'Enabled' setzen\n   • Browser neu starten"
      );
    }

    // ============================================================
    // 3. Prüfe Gemini Nano Download
    // ============================================================
    console.log("  📌 Prüfe Gemini Nano Status...");
    const geminiStatus = await this.checkGeminiNanoStatus();
    console.log(`    Gemini Nano Status: ${geminiStatus}`);

    if (geminiStatus !== "downloaded") {
      issues.push(
        `Gemini Nano nicht heruntergeladen (Status: ${geminiStatus})`
      );
      solutions.push(
        "3️⃣ Lade Gemini Nano herunter:\n   • chrome://components in URL-Leiste eingeben\n   • Suche nach 'Optimization Guide On Device Model'\n   • Klicke auf 'Check for update'\n   • Warte bis Download abgeschlossen ist (5-10 Minuten)"
      );
    } else {
      console.log("    ✅ Gemini Nano heruntergeladen");
    }

    // ============================================================
    // 4. Prüfe Optimization Guide Flag
    // ============================================================
    console.log("  📌 Prüfe Optimization Guide Flag...");
    const optimizationGuideAvailable = await this.checkOptimizationGuideFlag();
    console.log(
      `    Optimization Guide Flag: ${
        optimizationGuideAvailable ? "✅ Aktiviert" : "❌ Deaktiviert"
      }`
    );

    if (!optimizationGuideAvailable) {
      issues.push("Optimization Guide On Device Model nicht aktiviert");
      solutions.push(
        "4️⃣ Aktiviere Optimization Guide Flag:\n   • chrome://flags/#optimization-guide-on-device-model in URL-Leiste eingeben\n   • Dropdown auf 'Enabled BypassPerfRequirement' setzen\n   • Browser neu starten"
      );
    }

    // ============================================================
    // Zusammenfassung
    // ============================================================
    const configured = issues.length === 0;

    if (configured) {
      console.log("\n✅ Alle Chrome-Einstellungen korrekt konfiguriert!");
      return {
        configured: true,
        issues: [],
        steps: [],
        alert: `✅ GMARK ist einsatzbereit!

Alle Chrome-Einstellungen sind korrekt konfiguriert:
• Chrome Version: ${chromeVersion}+ ✅
• Prompt API Flag: Aktiviert ✅
• Gemini Nano: Heruntergeladen ✅
• Optimization Guide: Aktiviert ✅

Bootstrap kann jetzt gestartet werden!`,
      };
    } else {
      console.warn("\n⚠️ Chrome-Konfiguration unvollständig");
      console.warn("Folgende Probleme müssen behoben werden:");
      issues.forEach((issue) => console.warn(`  • ${issue}`));

      const alertMessage = `⚠️ GMARK - Chrome Konfiguration erforderlich

Folgende Einstellungen sind erforderlich:

${solutions.map((s) => `${s}\n`).join("\n")}
Nachdem alle Schritte durchgeführt wurden:
✓ Browser vollständig neu starten (alle Tabs schließen)
✓ Extension neu laden (chrome://extensions)
✓ Bootstrap erneut starten

Aktuelle Status:
${issues.map((i) => `❌ ${i}`).join("\n")}`;

      // Biete automatische Konfiguration an
      if (typeof confirm === "function") {
        const userChoice = confirm(
          `⚠️ Chrome-Konfiguration erforderlich\n\n${issues.join(
            "\n"
          )}\n\n✅ Möchtest du die Konfigurationsseiten automatisch öffnen?\n\n(OK = Ja | Abbrechen = Nein)`
        );

        if (userChoice) {
          console.log("✅ Öffne Konfigurationsseiten...");
          // Öffne automatisch alle erforderlichen Seiten
          await this.openChromeConfigurationPages();
        }
      }

      return {
        configured: false,
        issues,
        steps: solutions,
        alert: alertMessage,
      };
    }
  }

  /**
   * Öffne automatisch alle erforderlichen Chrome-Konfigurationsseiten
   */
  async openChromeConfigurationPages() {
    console.log("\n🌐 Öffne Chrome-Konfigurationsseiten...");

    const pages = [
      {
        url: "chrome://flags/#prompt-api-for-gemini-nano",
        title: "Prompt API Flag",
        instruction: "Setze auf 'Enabled'",
      },
      {
        url: "chrome://flags/#optimization-guide-on-device-model",
        title: "Optimization Guide Flag",
        instruction: "Setze auf 'Enabled BypassPerfRequirement'",
      },
      {
        url: "chrome://components",
        title: "Chrome Components",
        instruction:
          "Suche 'Optimization Guide On Device Model' und klicke 'Check for update'",
      },
    ];

    // Öffne alle Tabs nacheinander mit Verzögerung
    for (const page of pages) {
      console.log(`  📱 Öffne: ${page.title}`);
      chrome.tabs.create({ url: page.url, active: false });
      // Kleine Verzögerung zwischen Tabs
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log("✅ Alle Konfigurationsseiten geöffnet");

    // Zeige Anleitung
    const instructions = pages
      .map((p) => `✓ ${p.title}: ${p.instruction}`)
      .join("\n");

    // Bestimme OS für Launch-Befehle
    const userAgent = navigator.userAgent;
    const isWindows = userAgent.includes("Windows");
    const isMac = userAgent.includes("Mac");

    let launchCommand = "";
    if (isWindows) {
      launchCommand = `chrome.exe --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano`;
    } else if (isMac) {
      launchCommand = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano`;
    } else {
      launchCommand = `google-chrome --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano`;
    }

    const alertMsg = `✅ Chrome-Konfigurationsseiten wurden geöffnet!

📋 Folgende Schritte durchführen:
${instructions}

⏱️ Warte auf Gemini Nano Download (5-10 Minuten)

Danach:
1. Chrome vollständig neu starten (alle Tabs schließen)
2. Diese Extension neu laden (chrome://extensions)
3. Bootstrap erneut starten

🔧 Alternative (schneller):
Schließe Chrome komplett und starte es so:
${launchCommand}

Die Chrome-Tabs sind im Hintergrund geöffnet - schau in die Tab-Leiste!`;

    if (typeof alert === "function") {
      alert(alertMsg);
    }

    return {
      instructions,
      launchCommand,
      alert: alertMsg,
    };
  }

  /**
   * Prüfe ob Prompt API Flag vorhanden ist
   */
  async checkPromptAPIFlag() {
    const canCreate = await checkCanCreateSession();
    return canCreate === true;
  }

  /**
   * Prüfe Gemini Nano Download Status
   */
  async checkGeminiNanoStatus() {
    try {
      const ai = self.ai || globalThis.ai;

      if (!ai?.languageModel) {
        return "not-available";
      }

      const status = await ai.languageModel.canCreateTextSession();

      // Status kann sein: "readily", "after-download", "no"
      if (status === "readily") {
        return "downloaded";
      } else if (status === "after-download") {
        return "downloading";
      } else {
        return "not-available";
      }
    } catch (error) {
      console.warn("  ⚠️ Fehler bei Gemini Status Check:", error.message);
      return "error";
    }
  }

  /**
   * Prüfe Optimization Guide Flag
   */
  async checkOptimizationGuideFlag() {
    try {
      const ai = self.ai || globalThis.ai;
      return !!ai?.languageModel;
    } catch {
      return false;
    }
  }

  /**
   * Prüfe Prompt API Verfügbarkeit
   * @returns {Promise<{available: boolean, error: string|null, help: string|null}>}
   */
  async checkPromptAPIAvailability() {
    console.log("\n🔍 Prüfe Prompt API Verfügbarkeit...");

    try {
      const canCreate = await checkCanCreateSession();

      if (!canCreate) {
        const errorMessage = "❌ Prompt API nicht verfügbar";
        const helpMessage = `
⚠️ Mögliche Ursachen und Lösungen:

1. **Chrome Version zu alt**
   → Mindestens Chrome 128+ erforderlich
   → Prüfen: chrome://version
   → Lösung: Chrome aktualisieren

2. **Gemini Nano nicht heruntergeladen**
   → Prüfen: chrome://components → "Optimization Guide On Device Model"
   → Lösung: Auf "Check for update" klicken und warten

3. **Prompt API nicht aktiviert**
   → Prüfen: chrome://flags/#prompt-api-for-gemini-nano
   → Lösung: Auf "Enabled" setzen und Chrome neu starten

4. **Experimentelle Features deaktiviert**
   → Prüfen: chrome://flags/#optimization-guide-on-device-model
   → Lösung: Auf "Enabled BypassPerfRequirement" setzen

5. **Service Worker Kontext**
   → Die API ist möglicherweise nur in Tab-Kontexten verfügbar
   → Lösung: Extension neu laden

Nachdem Änderungen vorgenommen wurden:
→ Chrome neu starten
→ Extension neu laden
→ Bootstrap erneut starten
        `;

        console.error(errorMessage);
        console.error(helpMessage);

        return {
          available: false,
          error: errorMessage,
          help: helpMessage,
        };
      }

      console.log("✅ Prompt API verfügbar und bereit");
      return {
        available: true,
        error: null,
        help: null,
      };
    } catch (error) {
      console.error("❌ Fehler bei Prompt API Check:", error);
      return {
        available: false,
        error: error.message,
        help: "Siehe Console für Details. Extension neu laden und erneut versuchen.",
      };
    }
  }

  /**
   * Starte Bootstrap-Prozess mit Prompt API Check und URL-für-URL Verarbeitung
   * @param {Function} onProgress - Callback für Progress Updates
   * @returns {Promise<Object>} Bootstrap-Ergebnis
   */
  async runBootstrap(onProgress) {
    try {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 GMARK Bootstrap startet...");
      console.log("=".repeat(60) + "\n");

      // ============================================================
      // SCHRITT 1: Prüfe Chrome Konfiguration
      // ============================================================
      console.log("Step: Prüfe Chrome Konfiguration...\n");
      const configCheck = await this.checkChromeConfiguration();

      if (!configCheck.configured) {
        // console.error("\n Chrome-Konfiguration unvollständig!");
        // console.error(configCheck.alert);

        return {
          success: false,
          error: "Chrome-Konfiguration erforderlich",
          configured: false,
          issues: configCheck.issues,
          steps: configCheck.steps,
          alert: configCheck.alert,
        };
      }

      console.log("✅ Chrome-Konfiguration OK\n");

      // ============================================================
      // SCHRITT 2: Prompt API Check
      // ============================================================
      console.log("Step 2️⃣: Prüfe Prompt API Verfügbarkeit...\n");
      const apiCheck = await this.checkPromptAPIAvailability();

      if (!apiCheck.available) {
        return {
          success: false,
          error: apiCheck.error,
          help: apiCheck.help,
          promptAPIAvailable: false,
        };
      }

      // ============================================================
      // SCHRITT 3: Prüfe ob Bootstrap bereits abgeschlossen
      // ============================================================
      const bootstrapStatus = await StorageManager.getSetting(
        "bootstrapComplete"
      );
      if (bootstrapStatus) {
        console.log("✅ Bootstrap bereits durchgeführt");
        return {
          success: true,
          message: "Bootstrap already completed",
          bookmarksProcessed: 0,
          skipped: true,
        };
      }

      // ============================================================
      // SCHRITT 4: Lade alle Chrome Bookmarks
      // ============================================================
      console.log("Step 4️⃣: Lese Chrome Bookmarks...");
      const bookmarks = await this.getAllChromeBookmarks();
      this.bookmarksToProcess = bookmarks.length;

      if (bookmarks.length === 0) {
        console.log("ℹ️ Keine Bookmarks zum Migrieren");
        await StorageManager.setSetting("bootstrapComplete", true);
        return {
          success: true,
          message: "No bookmarks to migrate",
          bookmarksProcessed: 0,
        };
      }

      console.log(`📊 ${bookmarks.length} Bookmarks gefunden`);

      // ============================================================
      // SCHRITT 5: Erstelle Ordner
      // ============================================================
      console.log("\nStep 5️⃣: Erstelle Sortier-Ordner...");
      const notRespondingFolderId = await this.getOrCreateBookmarkFolder(
        "not_responding"
      );
      console.log("  ✅ not_responding Ordner bereit");

      // ============================================================
      // SCHRITT 6: Resume-Logik - Lade bereits verarbeitete URLs
      // ============================================================
      console.log("\nStep 6️⃣: Prüfe auf bereits verarbeitete URLs...");
      let processedURLs =
        (await StorageManager.getSetting("bootstrapProcessedURLs")) || [];
      let processedCount = processedURLs.length;

      if (processedCount > 0) {
        console.log(
          `  ⏸️ ${processedCount} URLs bereits verarbeitet - Resume wird fortgesetzt`
        );
      }

      // Filter unverarbeitete Bookmarks
      const unprocessedBookmarks = bookmarks.filter(
        (b) => !processedURLs.includes(b.url)
      );

      console.log(
        `  📋 ${unprocessedBookmarks.length} URLs müssen noch verarbeitet werden`
      );

      // ============================================================
      // SCHRITT 7: Verarbeite URLs einzeln (URL-für-URL)
      // ============================================================
      console.log("\nStep 7️⃣: Starte URL-für-URL Verarbeitung...\n");
      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        notResponding: 0,
      };

      for (let i = 0; i < unprocessedBookmarks.length; i++) {
        const bookmark = unprocessedBookmarks[i];
        const globalIndex = processedCount + i + 1;

        console.log(
          `\n[${globalIndex}/${
            this.bookmarksToProcess
          }] 🔄 Verarbeite: ${bookmark.title?.substring(0, 60)}`
        );
        console.log(`  URL: ${bookmark.url}`);

        // ============================================================
        // SCHRITT 6.1: Prüfe Prompt API vor jeder URL
        // ============================================================
        const apiAvailable = await checkCanCreateSession();
        if (!apiAvailable) {
          console.warn(
            "\n⚠️ Prompt API nicht mehr verfügbar - Bootstrap pausiert"
          );
          console.warn(
            `   ${processedCount + i} von ${
              this.bookmarksToProcess
            } URLs verarbeitet`
          );
          console.warn("   Extension neu laden um fortzusetzen");
          return {
            success: false,
            error: "Prompt API während Verarbeitung verloren gegangen",
            help: "Extension neu laden - Bootstrap wird automatisch fortgesetzt",
            processed: processedCount + i,
            total: this.bookmarksToProcess,
          };
        }

        try {
          // ============================================================
          // SCHRITT 6.2: Prüfe URL Erreichbarkeit
          // ============================================================
          const { reachable, title } = await this.checkUrlReachable(
            bookmark.url
          );

          if (!reachable) {
            // URL nicht erreichbar → in "not_responding"
            console.log(`  ⚠️ URL nicht erreichbar → not_responding`);

            if (bookmark.id && notRespondingFolderId) {
              await chrome.bookmarks.move(bookmark.id, {
                parentId: notRespondingFolderId,
              });
            }

            results.notResponding++;
            processedURLs.push(bookmark.url);
          } else {
            // URL erreichbar → Verarbeite mit KI
            console.log(`  ✅ URL erreichbar`);

            // ============================================================
            // SCHRITT 6.3: Aktualisiere Titel falls vorhanden
            // ============================================================
            if (title && bookmark.id) {
              try {
                await chrome.bookmarks.update(bookmark.id, { title });
                console.log(
                  `  📝 Titel aktualisiert: ${title.substring(0, 50)}`
                );
                bookmark.title = title;
              } catch (error) {
                console.warn(`  ⚠️ Titel-Update fehlgeschlagen`);
              }
            }

            // ============================================================
            // SCHRITT 6.4: Lade Seiteninhalt
            // ============================================================
            console.log(`  📖 Lade Seiteninhalt...`);
            const pageContent = await this.loadPageContent(bookmark.url);

            // ============================================================
            // SCHRITT 6.5: Erstelle Zusammenfassung mit KI (über Tab-Context)
            // ============================================================
            let summary = "";
            // Zusammenfassung entfernt - nur Pattern-Matching Klassifikation

            // ============================================================
            // SCHRITT 6.6: Klassifiziere mit KI
            // ============================================================
            console.log(`  🏷️ Klassifiziere mit KI...`);
            const classification = await ClassificationService.classify({
              title: bookmark.title || "Untitled",
              description: summary || "",
              url: bookmark.url,
            });

            console.log(
              `  ✅ Klassifiziert: ${classification.category} (Confidence: ${classification.confidence})`
            );

            // ============================================================
            // SCHRITT 6.7: Speichere in IndexedDB mit ai:true Tag
            // ============================================================
            const savedBookmark = await StorageManager.addBookmark({
              url: bookmark.url,
              title: bookmark.title || "Untitled",
              category: classification.category,
              confidence: classification.confidence,
              tags: classification.tags,
              summary: summary || classification.summary,
              color: classification.color,
              content: pageContent || "",
              method: "bootstrap-ai-classification",
              chromeId: bookmark.id,
              migratedAt: Date.now(),
              ai: true, // ← AI-Verarbeitung durchgeführt
            });

            console.log(
              `  💾 In IndexedDB gespeichert (ID: ${savedBookmark.id?.substring(
                0,
                8
              )}...)`
            );

            // ============================================================
            // SCHRITT 6.8: Verschiebe in Kategorien-Ordner
            // ============================================================
            const categoryFolderId = await this.getOrCreateBookmarkFolder(
              classification.category
            );

            if (bookmark.id && categoryFolderId) {
              await chrome.bookmarks.move(bookmark.id, {
                parentId: categoryFolderId,
              });
              console.log(`  📁 Verschoben → ${classification.category}`);
            }

            results.success++;
            processedURLs.push(bookmark.url);
          }

          processedCount++;
          this.bookmarksProcessed++;

          // ============================================================
          // SCHRITT 6.9: Speichere Fortschritt nach jeder URL
          // ============================================================
          await StorageManager.setSetting(
            "bootstrapProcessedURLs",
            processedURLs
          );

          // Progress-Update
          if (onProgress) {
            onProgress({
              processed: processedCount,
              total: this.bookmarksToProcess,
              success: results.success,
              failed: results.failed,
              skipped: results.skipped,
              notResponding: results.notResponding,
              percentage: Math.round(
                (processedCount / this.bookmarksToProcess) * 100
              ),
              currentURL: bookmark.url,
              currentTitle: bookmark.title,
            });
          }

          // Kleine Pause zwischen URLs um System zu schonen
          await new Promise((r) => setTimeout(r, 200));
        } catch (error) {
          console.error(`  ❌ Fehler bei ${bookmark.url}:`, error.message);
          results.failed++;
          processedURLs.push(bookmark.url); // Als verarbeitet markieren um Endlosschleife zu vermeiden
          await StorageManager.setSetting(
            "bootstrapProcessedURLs",
            processedURLs
          );
        }
      }

      // ============================================================
      // SCHRITT 8: Cleanup nach erfolgreicher Verarbeitung
      // ============================================================
      console.log("\nStep 8️⃣: Cleanup und Finalisierung...");

      // Lösche Fortschritts-Marker
      await StorageManager.deleteSetting("bootstrapProcessedURLs");
      console.log("  🧹 Fortschritts-Marker gelöscht");

      // Markiere Bootstrap als abgeschlossen
      await StorageManager.setSetting("bootstrapComplete", true);
      await StorageManager.setSetting(
        "bootstrapDate",
        new Date().toISOString()
      );
      console.log("  ✅ Bootstrap als abgeschlossen markiert");

      // Bereinige leere Ordner
      await this.deleteEmptyBookmarkFolders();
      console.log("  🧹 Leere Ordner bereinigt");

      console.log("\n" + "=".repeat(60));
      console.log("🎉 Bootstrap erfolgreich abgeschlossen!");
      console.log(`   ✅ ${results.success} erfolgreich klassifiziert`);
      console.log(`   ⚠️ ${results.notResponding} nicht erreichbar`);
      console.log(`   ❌ ${results.failed} Fehler`);
      console.log("=".repeat(60));

      return {
        success: true,
        ...results,
        total: this.bookmarksToProcess,
      };
    } catch (error) {
      console.error("\n❌ Bootstrap fehlgeschlagen:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lade Seiteninhalt über Hintergrund-Tab
   */
  async loadPageContent(url) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });

      // Warte bis Seite geladen ist
      await new Promise((r) => setTimeout(r, 2500));

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Extrahiere Text-Content
          return document.body.innerText;
        },
      });

      // Tab schließen
      try {
        await chrome.tabs.remove(tab.id);
      } catch {}

      return typeof result === "string" ? result.substring(0, 5000) : "";
    } catch (error) {
      console.warn("    ⚠️ Content-Laden fehlgeschlagen:", error.message);
      return "";
    }
  }

  /**
   * Prüfe ob eine URL erreichbar ist und hole Titel
   */
  async checkUrlReachable(url) {
    // Versuche schnell per HEAD (kein Titel verfügbar)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        mode: "no-cors",
      });
      clearTimeout(timeoutId);
    } catch (error) {
      // HEAD fehlgeschlagen → als nicht erreichbar markieren
      return { reachable: false, title: null };
    }

    // Erreichbar: Ermittle Titel über Hintergrund-Tab
    const title = await this.resolvePageTitle(url);
    return { reachable: true, title };
  }

  /**
   * Ermittle den Seitentitel durch Hintergrund-Tab und Content-Ausführung
   */
  async resolvePageTitle(url) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      // Warte kurz bis Seite lädt
      await new Promise((r) => setTimeout(r, 1500));

      const [{ result: title }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.title,
      });

      // Tab schließen
      try {
        await chrome.tabs.remove(tab.id);
      } catch {}

      return typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : null;
    } catch (error) {
      console.warn("    ⚠️ Konnte Titel nicht ermitteln:", error.message);
      return null;
    }
  }

  /**
   * Lese alle Chrome Bookmarks rekursiv
   */
  async getAllChromeBookmarks() {
    const allBookmarks = [];

    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.url) {
          // Es ist ein Bookmark
          allBookmarks.push(node);
        } else if (node.children) {
          // Es ist ein Ordner
          traverse(node.children);
        }
      }
    };

    try {
      const bookmarkTree = await chrome.bookmarks.getTree();
      traverse(bookmarkTree);
      return allBookmarks;
    } catch (error) {
      console.error("Fehler beim Lesen von Chrome Bookmarks:", error);
      return [];
    }
  }

  /**
   * Reorganisiere Chrome Bookmarks nach Kategorien
   */
  async reorganizeChromeBookmarks(bookmarks) {
    try {
      // Gruppiere nach Kategorie
      const byCategory = {};
      for (const bookmark of bookmarks) {
        if (!byCategory[bookmark.category]) {
          byCategory[bookmark.category] = [];
        }
        byCategory[bookmark.category].push(bookmark);
      }

      // Erstelle Ordner pro Kategorie und verschiebe Bookmarks
      for (const [category, items] of Object.entries(byCategory)) {
        // Erstelle Kategorie-Ordner direkt im Standard-Bookmarks-Bereich (Other Bookmarks)
        const categoryFolderId = await this.getOrCreateBookmarkFolder(category);

        if (!categoryFolderId) continue;

        for (const bookmark of items) {
          try {
            if (bookmark.chromeId) {
              // Verschiebe Chrome Bookmark
              await chrome.bookmarks.move(bookmark.chromeId, {
                parentId: categoryFolderId,
              });

              console.log(`📁 Verschoben: ${bookmark.title} → ${category}`);
            }
          } catch (error) {
            console.warn(
              `⚠️ Konnte Bookmark nicht verschieben: ${bookmark.title}`,
              error
            );
          }
        }
      }

      console.log("✅ Chrome Bookmarks reorganisiert");

      // Nach der Reorganisation: Leere Ordner löschen
      await this.deleteEmptyBookmarkFolders();
    } catch (error) {
      console.warn("⚠️ Chrome Bookmarks Reorganisation fehlgeschlagen:", error);
      // Nicht kritisch - fortfahren
    }
  }

  /**
   * Lösche alle leeren Bookmark-Ordner (außer System-Ordner)
   */
  async deleteEmptyBookmarkFolders() {
    try {
      console.log("🧹 Lösche leere Bookmark-Ordner...");
      const tree = await chrome.bookmarks.getTree();

      // System-Ordner-IDs: 0 (root), 1 (Bookmarks Bar), 2 (Other Bookmarks), 3 (Mobile Bookmarks)
      const SYSTEM_IDS = new Set(["0", "1", "2", "3"]);

      const emptyFolders = [];

      const collectEmpty = (nodes) => {
        for (const node of nodes) {
          if (!node.url) {
            const children = node.children || [];
            // Rekursiv prüfen
            collectEmpty(children);

            // Wenn Ordner und keine Kinder → leer
            if (!SYSTEM_IDS.has(node.id) && children.length === 0) {
              emptyFolders.push(node.id);
            }
          }
        }
      };

      collectEmpty(tree);

      // Dedupliziere IDs
      const uniqueEmpty = Array.from(new Set(emptyFolders));

      if (uniqueEmpty.length === 0) {
        console.log("✅ Keine leeren Ordner gefunden");
        return;
      }

      console.log("🗑️ Leere Ordner gefunden:", uniqueEmpty.length);

      // In kleinen Batches löschen, Existenz vorher prüfen
      const BATCH_SIZE = 50;
      for (let i = 0; i < uniqueEmpty.length; i += BATCH_SIZE) {
        const batch = uniqueEmpty.slice(i, i + BATCH_SIZE);
        console.log(
          `  🔹 Lösche Batch ${i / BATCH_SIZE + 1}/${Math.ceil(
            uniqueEmpty.length / BATCH_SIZE
          )} (Größe: ${batch.length})`
        );
        for (const id of batch) {
          try {
            // Prüfe Existenz
            const nodes = await chrome.bookmarks.get(id).catch(() => []);
            if (!nodes || nodes.length === 0) {
              console.log(`   ⏭️ Übersprungen (nicht gefunden): ${id}`);
              continue;
            }
            const node = nodes[0];
            if (node.url) {
              // Sicherheit: nur Ordner löschen
              console.log(`   ⏭️ Übersprungen (kein Ordner): ${id}`);
              continue;
            }

            await chrome.bookmarks.removeTree(id);
            console.log(`   🗑️ Ordner gelöscht: ${id}`);
          } catch (error) {
            // Häufig: "Can't find bookmark for id." → ignorieren
            if (
              String(error?.message || error).includes("Can't find bookmark")
            ) {
              console.log(`   ⏭️ Bereits entfernt / nicht vorhanden: ${id}`);
            } else {
              console.warn(`   ⚠️ Konnte Ordner ${id} nicht löschen:`, error);
            }
          }
          // Kurze Pause, um API nicht zu überlasten
          await new Promise((r) => setTimeout(r, 5));
        }
        // kleine Pause zwischen Batches
        await new Promise((r) => setTimeout(r, 50));
      }

      console.log("✅ Leere Ordner bereinigt");
    } catch (error) {
      console.warn("⚠️ Fehler beim Löschen leerer Ordner:", error);
    }
  }

  /**
   * Finde oder erstelle Bookmark-Ordner
   */
  async getOrCreateBookmarkFolder(folderName, parentId = null) {
    try {
      // Suche vorhandenen Ordner
      const search = await chrome.bookmarks.search({
        title: folderName,
      });

      const existing = search.find(
        (item) => !item.url && item.title === folderName
      );
      if (existing) {
        return existing.id;
      }

      // Erstelle neuen Ordner
      const createdFolder = await chrome.bookmarks.create({
        title: folderName,
        parentId: parentId || "1", // 1 = "Other Bookmarks"
      });

      console.log(`📁 Erstellt: ${folderName}`);
      return createdFolder.id;
    } catch (error) {
      console.error(`Fehler beim Erstellen von Ordner ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Überprüfe Bootstrap-Status
   */
  async getBootstrapStatus() {
    const isComplete = await StorageManager.getSetting("bootstrapComplete");
    const date = await StorageManager.getSetting("bootstrapDate");

    return {
      complete: isComplete || false,
      date: date || null,
      lastRun: date ? new Date(date) : null,
    };
  }

  /**
   * Setze Bootstrap zurück (für Testing)
   */
  async resetBootstrap() {
    await StorageManager.setSetting("bootstrapComplete", false);
    await StorageManager.setSetting("bootstrapDate", null);
    this.bootstrapComplete = false;
    console.log("🔄 Bootstrap zurückgesetzt");
  }
}

export default new BootstrapService();

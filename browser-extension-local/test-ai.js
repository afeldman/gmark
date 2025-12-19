/**
 * AI Test Script für GMARK Extension
 *
 * Führe dieses Script in der Service Worker Console aus:
 * 1. chrome://extensions/ öffnen
 * 2. Bei GMARK Extension auf "Service Worker" klicken
 * 3. Dieses Script in die Console kopieren und ausführen
 */

(async () => {
  console.log("🧪 ==========================================");
  console.log("🧪 GMARK AI Test Suite");
  console.log("🧪 ==========================================\n");

  // Test 1: AI Proxy Module importieren
  console.log("📦 Test 1: AI Proxy Module laden...");
  try {
    const aiProxy = await import("./src/utils/ai-proxy.js");
    console.log("  ✅ ai-proxy.js erfolgreich geladen");
    console.log("  ✅ Verfügbare Funktionen:", Object.keys(aiProxy));

    // Test 2: Prompt API Status prüfen
    console.log("\n🔍 Test 2: Prompt API Status prüfen...");
    const status = await aiProxy.checkPromptAPIInTab();
    console.log("  📊 Status:", status);

    if (status.available) {
      console.log("  ✅ Prompt API ist verfügbar!");
      console.log("  📈 Temperature:", status.defaultTemperature);
      console.log("  📈 Top-K:", status.defaultTopK, "/", status.maxTopK);
    } else {
      console.log("  ❌ Prompt API nicht verfügbar");
      console.log("  ℹ️ Fehler:", status.error);
      console.log("\n  💡 Troubleshooting:");
      console.log("     1. Öffne chrome://on-device-internals/");
      console.log("     2. Prüfe ob Gemini Nano Model 'Ready' ist");
      console.log("     3. Falls nicht: Download starten und warten");
      return;
    }

    // Test 3: Klassifikation testen
    console.log("\n🤖 Test 3: Bookmark-Klassifikation testen...");
    const testBookmark = {
      title: "GitHub - The world's leading AI code assistant",
      url: "https://github.com",
      description:
        "GitHub is where over 100 million developers shape the future of software",
    };

    console.log("  📝 Test-Bookmark:", testBookmark.title);

    try {
      const classificationResult = await aiProxy.classifyInTab(testBookmark);
      console.log("  ✅ Klassifikation erfolgreich!");
      console.log("  📂 Kategorie:", classificationResult.category);
      console.log("  🎯 Confidence:", classificationResult.confidence);
      console.log("  📊 Volle Antwort:", classificationResult);
    } catch (error) {
      console.log("  ❌ Klassifikation fehlgeschlagen:", error.message);
      console.log("  📋 Stack:", error.stack);
    }

    // Test 4: Zusammenfassung testen
    console.log("\n📝 Test 4: Content-Zusammenfassung testen...");
    const testContent = `
      Artificial Intelligence (AI) is transforming software development.
      Modern AI tools like GitHub Copilot help developers write code faster
      and with fewer errors. Machine learning models can now understand
      context and generate relevant code suggestions in real-time.
    `;
    const testTitle = "AI in Software Development";

    console.log("  📝 Test-Content:", testTitle);

    try {
      const summary = await aiProxy.summarizeInTab(testContent, testTitle);
      console.log("  ✅ Zusammenfassung erfolgreich!");
      console.log("  📄 Summary:", summary);
    } catch (error) {
      console.log("  ❌ Zusammenfassung fehlgeschlagen:", error.message);
      console.log("  📋 Stack:", error.stack);
    }

    // Test 5: Performance-Check
    console.log("\n⚡ Test 5: Performance-Check...");
    console.log("  ⏱️ Starte Performance-Test...");

    const startTime = Date.now();
    await aiProxy.checkPromptAPIInTab();
    const checkDuration = Date.now() - startTime;

    console.log(`  ✅ AI-Check dauert ~${checkDuration}ms`);

    if (checkDuration > 2000) {
      console.log("  ⚠️ Warnung: Check dauert länger als 2 Sekunden");
    }

    // Zusammenfassung
    console.log("\n🎉 ==========================================");
    console.log("🎉 Alle Tests abgeschlossen!");
    console.log("🎉 ==========================================");
    console.log("\n💡 Nächste Schritte:");
    console.log("   1. Öffne die Extension-Popup");
    console.log("   2. Starte Bootstrap-Prozess (falls noch nicht geschehen)");
    console.log("   3. Speichere ein echtes Bookmark und beobachte die Logs");
    console.log("   4. Prüfe IndexedDB: chrome://inspect/#devices → IndexedDB");
  } catch (error) {
    console.log("\n❌ ==========================================");
    console.log("❌ Test-Suite fehlgeschlagen!");
    console.log("❌ ==========================================");
    console.log("❌ Fehler:", error.message);
    console.log("📋 Stack:", error.stack);
    console.log("\n💡 Mögliche Ursachen:");
    console.log("   1. Extension nicht korrekt geladen");
    console.log("   2. Service Worker nicht aktiv");
    console.log("   3. Module-Imports fehlgeschlagen");
    console.log("   4. Chrome Version zu alt (benötigt Chrome 127+)");
  }
})();

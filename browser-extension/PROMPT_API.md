# Chrome Prompt API Integration

## Überblick

GMARK nutzt die **Chrome Prompt API** für lokale, On-Device LLM-basierte Klassifikation von Webseiten. Das Modell (Gemini Nano) läuft direkt im Browser ohne externe API-Aufrufe.

## Klassifikations-Hierarchie

Die Extension nutzt folgende **Fallback-Strategie**:

1. **Chrome Prompt API (Priorität: HÖCHST)** ⚡
   - Lokale On-Device LLM (Gemini Nano)
   - ✅ Keine API-Abhängigkeit
   - ✅ Schnellste Klassifikation
   - ✅ Datenschutz: Daten bleiben lokal
   - ⚠️ Nur auf Chrome 131+ mit aktiviertem Flag verfügbar
   - ⚠️ Erstes Download des Modells kann 100MB+ sein

2. **Backend Classification API (Fallback)** 🌐
   - Pattern-basierte Klassifikation
   - ✅ Funktioniert offline nach Download
   - ✅ Zuverlässig auf allen Systemen
   - ✅ Keine Hardware-Anforderungen

3. **Offline Pattern Matching (Ultimate Fallback)** 📊
   - Lokale Keyword-Analyse
   - ✅ Funktioniert immer
   - ✅ Keine Netzwerkverbindung erforderlich

## Verfügbarkeit prüfen

```javascript
// Prüfe ob Prompt API verfügbar ist
const canUse = await window.ai.canCreateTextSession();

// Mögliche Werte:
// "readily"       → sofort nutzbar
// "after-download" → nach Modell-Download verfügbar
// "no"            → nicht verfügbar (kein Chrome 131+, kein Flag)
```

## Aktivierung (Chrome Browser)

### Voraussetzungen:
- Chrome 131+ (die API wird schrittweise eingeführt)
- 4GB+ RAM (für Modell-Inferenz)
- ~100MB Speicher (Gemini Nano Modell)

### Schritte:

1. **Chrome Flags aktivieren:**
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   ```
   → Auf "Enabled" setzen

2. **Chrome Neustart:**
   ```
   chrome://restart
   ```

3. **Extension laden:**
   - Gehe zu `chrome://extensions`
   - Schalte "Entwicklermodus" an
   - "Erweiterung laden" → `/browser-extension` Ordner

4. **Popup öffnen:**
   - Klicke auf Extension-Icon
   - Aktiviere "Mit AI klassifizieren" Checkbox
   - Warte auf Modell-Download (beim ersten Mal)

## Klassifikations-Kategorien

Die Prompt API klassifiziert URLs in folgende Kategorien:

```
- Development     (Code, GitHub, APIs, Frameworks)
- Social         (Twitter, Facebook, Instagram, LinkedIn)
- News           (Nachrichten, Blogs, Artikel)
- Shopping       (Amazon, eBay, Shops, Produkte)
- Education      (Kurse, Tutorials, Universitäten)
- Entertainment  (Netflix, Filme, Musik, Spiele)
- Documentation  (Technische Docs, Handbücher)
- Tools          (Online-Tools, Converter, Generatoren)
- Other          (Sonstiges)
```

## Performance

### Erste Nutzung (mit Modell-Download):
- Download: ~100MB (einmalig)
- Klassifikation: 2-5 Sekunden
- Extension zeigt: "⏳ Laden Sie das lokale LLM-Modell..."

### Nachfolgende Nutzung (Modell gecacht):
- Klassifikation: 200-800ms
- ⚡ Ultra-schnell, offline verfügbar

## Datenschutz

✅ **Vollständiger Datenschutz mit Prompt API:**
- Keine Daten verlassen den Browser
- Keine Requests zu externen Servern
- Lokale Verarbeitung auf deinem Gerät
- Modell wird nur für Klassifikation verwendet
- Keine Logs oder Telemetrie

⚠️ **Backend-Fallback:**
- Bei Fallback zum Backend werden URL + Title gesendet
- Aber: nur wenn Prompt API nicht verfügbar ist
- Du kannst Backend-Klassifikation in Einstellungen deaktivieren

## Troubleshooting

### Problem: "Prompt API nicht verfügbar"
**Lösung:**
1. Chrome Version prüfen: `chrome://version` → mind. 131
2. Flag aktivieren: `chrome://flags/#prompt-api-for-gemini-nano`
3. Chrome neustarten: `chrome://restart`

### Problem: Klassifikation dauert lange (erste Nutzung)
**Lösung:**
- Das ist normal beim ersten Download des Modells
- Modell wird danach gecacht, zukünftige Klassifikationen sind schneller
- Download läuft im Hintergrund

### Problem: "Classification fehlgeschlagen"
**Lösung:**
1. Fallback zu Backend wird automatisch versucht
2. Prüfe Internet-Verbindung
3. Prüfe ob Backend-Server läuft (auf Port 8000)

## Umschaltung zwischen Methoden

In der Extension (popup.js):

```javascript
// Priorisierung anpassen:
const result = await classifyWithPromptAPI(url, title);
// → Bei null: automatisch Fallback zu Backend

// Backend-Klassifikation deaktivieren (nur lokal):
// Entferne Fallback in classifyPage() Funktion
```

## Entwicklung & Testing

### Prompt API lokal testen:

```javascript
// In Browser Console öffnen (F12):
await window.ai.canCreateTextSession()

// Wenn "readily" oder "after-download" → Verfügbar!

// Session erstellen und Prompt senden:
const session = await window.ai.createTextSession();
const response = await session.prompt("Classify: GitHub");
console.log(response);
await session.destroy();
```

### Debug-Logs in Extension:

```
F12 → Service Worker Console
→ Sehe Klassifikations-Logs mit Methode (prompt-api vs backend)
```

## Zukunft

**Geplant:**
- [ ] Speichern von Klassifikations-Historie
- [ ] Modell-Optimierung für Bookmark-Kategorien
- [ ] Lokale Model Fine-Tuning basierend auf User-Feedback
- [ ] Unterstützung für weitere Chrome Built-in APIs (LanguageDetection, etc.)

## Referenzen

- [Chrome Prompt API Docs](https://developer.chrome.com/docs/ai/built-in-apis?hl=de#prompt_api)
- [Gemini Nano Model Info](https://ai.google.dev/gemini-api/docs/models/gemini)
- [Chrome Origin Trial](https://developer.chrome.com/origintrials/#/view_trial/3821286622385168385)

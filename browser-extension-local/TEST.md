# GMARK Local - Test-Anleitung

## Extension in Chrome laden

### 1. Extension installieren

1. Öffne **Chrome** Browser
2. Navigiere zu: `chrome://extensions/`
3. Aktiviere **"Entwicklermodus"** (Toggle oben rechts)
4. Klicke auf **"Entpackte Erweiterung laden"**
5. Wähle den Ordner: `/Users/anton.feldmann/Projects/priv/gmark/browser-extension-local/`
6. Extension sollte nun geladen sein ✅

### 2. Developer Console öffnen

1. Klicke auf **"Service Worker"** Link unter der Extension
2. Developer Console öffnet sich
3. Alle Console-Logs sind nun sichtbar 📊

## Test-Szenarien

### ✅ Test 1: Installation & Bootstrap

**Erwartete Console-Ausgabe:**

```
============================================================
🚀 GMARK Local Extension installiert!
============================================================

📋 Erstelle Kontextmenüs...
  ✅ Kontextmenü 'In GMARK speichern' erstellt
  ✅ Kontextmenü 'Link speichern' erstellt

⚙️ Setze Standardeinstellungen...
  ✅ autoClassify = true
  ✅ autoDetectDuplicates = true
  ✅ similarityThreshold = 0.8

============================================================
🔧 Starte Bootstrap-Prozess...
============================================================

⏳ Bootstrap Progress: 5/10 (50%) | ✅ 4 | ❌ 0 | ⏭️ 1
```

**Was zu prüfen:**

- ✅ Kontextmenüs wurden erstellt
- ✅ Standardeinstellungen gesetzt
- ✅ Bootstrap läuft automatisch
- ✅ Fortschritt wird angezeigt

### ✅ Test 2: Bookmark speichern (Kontextmenü)

1. Navigiere zu einer Webseite (z.B. `github.com`)
2. Rechtsklick auf Seite
3. Wähle **"In GMARK speichern"**

**Erwartete Console-Ausgabe:**

```
📌 Kontextmenü geklickt: gmark-save-page
  Tab: GitHub: Let's build from here · GitHub
  URL: https://github.com/

💾 Speichere aktuelle Seite...

💾 savePage() gestartet
  URL: https://github.com/
  Title: GitHub: Let's build from here · GitHub
  Tab ID: 123
  📖 Extrahiere Seiten-Inhalt...
  ✅ Inhalt extrahiert
  🔍 Prüfe auf Duplikate...
  💾 Speichere Bookmark...
  ✅ Bookmark gespeichert: 1
  🏷️ Triggere Klassifikation...
```

**Was zu prüfen:**

- ✅ Seiten-Inhalt extrahiert
- ✅ Duplikat-Prüfung durchgeführt
- ✅ Bookmark gespeichert mit ID
- ✅ Klassifikation getriggert

### ✅ Test 3: Bookmarks laden (Popup)

1. Klicke auf Extension-Icon
2. Popup öffnet sich
3. Bookmarks werden geladen

**Erwartete Console-Ausgabe:**

```
📨 Message empfangen: GET_BOOKMARKS
  Von: Extension

📚 Lade alle Bookmarks...
  ✅ Bookmarks geladen: 5 Einträge
```

**Was zu prüfen:**

- ✅ Message empfangen
- ✅ Anzahl Bookmarks korrekt
- ✅ Bookmarks im Popup angezeigt

### ✅ Test 4: Bookmark löschen

1. Im Popup auf "Löschen" klicken
2. Bookmark wird gelöscht

**Erwartete Console-Ausgabe:**

```
📨 Message empfangen: DELETE_BOOKMARK
  Von: Extension

🗑️ Lösche Bookmark: 123
  ✅ Bookmark gelöscht
```

**Was zu prüfen:**

- ✅ Bookmark gelöscht
- ✅ UI aktualisiert

### ✅ Test 5: Bootstrap Status prüfen

1. Im Popup auf Bootstrap-Bereich schauen
2. Status sollte angezeigt werden

**Erwartete Console-Ausgabe:**

```
📨 Message empfangen: GET_BOOTSTRAP_STATUS
  Von: Extension

❓ Prüfe Bootstrap-Status...
  ✅ Bootstrap-Status: Abgeschlossen
```

**Was zu prüfen:**

- ✅ Status korrekt angezeigt
- ✅ Bootstrap-Datum vorhanden

### ✅ Test 6: Duplikat-Erkennung

1. Versuche denselben Link zweimal zu speichern

**Erwartete Console-Ausgabe:**

```
💾 saveBookmark() gestartet
  📄 Bookmark: Example Site
  🔗 URL: https://example.com
  🔍 Prüfe auf Duplikate...
  ⚠️ Duplikat gefunden: 123
  ❌ Fehler in saveBookmark(): Duplikat erkannt
```

**Was zu prüfen:**

- ✅ Duplikat erkannt
- ✅ Fehler-Meldung angezeigt
- ✅ Bookmark nicht doppelt gespeichert

### ✅ Test 7: Statistiken anzeigen

1. Im Popup auf "Statistiken" klicken

**Erwartete Console-Ausgabe:**

```
📨 Message empfangen: GET_STATISTICS
  Von: Extension

📊 Lade Statistiken...
  ✅ Statistiken geladen: {total: 10, byCategory: {...}}
```

**Was zu prüfen:**

- ✅ Statistiken korrekt
- ✅ Kategorien richtig gezählt

### ✅ Test 8: Daten exportieren

1. Im Popup auf "Export" klicken

**Erwartete Console-Ausgabe:**

```
📨 Message empfangen: EXPORT_DATA
  Von: Extension

📤 Exportiere Daten...
  ✅ Daten exportiert: 3 Kategorien
```

**Was zu prüfen:**

- ✅ JSON-Export funktioniert
- ✅ Alle Bookmarks enthalten

## Chrome Bookmarks überprüfen

Nach dem Bootstrap sollten die Chrome Bookmarks reorganisiert sein:

1. Öffne Chrome Bookmarks Manager: `chrome://bookmarks/`
2. Prüfe Ordner-Struktur:

```
📁 GMARK Local
  📁 Development (alle Dev-Bookmarks)
  📁 Social (alle Social-Bookmarks)
  📁 News (alle News-Bookmarks)
  📁 Shopping (alle Shopping-Bookmarks)
  📁 Education (alle Education-Bookmarks)
  📁 Entertainment (alle Entertainment-Bookmarks)
  📁 Documentation (alle Doku-Bookmarks)
  📁 Tools (alle Tool-Bookmarks)
  📁 Other (alle sonstigen Bookmarks)
```

## IndexedDB überprüfen

1. In Developer Console (F12)
2. Tab **"Application"**
3. Sidebar → **"IndexedDB"** → **"gmark-local"**
4. Prüfe Stores:
   - ✅ `bookmarks` - Alle gespeicherten Bookmarks
   - ✅ `duplicates` - Erkannte Duplikate
   - ✅ `cache` - Cache-Einträge
   - ✅ `settings` - Einstellungen

## Bekannte Probleme & Lösungen

### Problem: "Cannot read property of undefined"

**Lösung:** Content Script nicht geladen

- Seite neu laden (F5)
- Extension neu laden

### Problem: Bootstrap läuft nicht

**Lösung:**

1. Console öffnen: `BootstrapService.getBootstrapStatus()`
2. Wenn `completed: true`, Reset: `BootstrapService.resetBootstrap()`
3. Extension neu laden

### Problem: Prompt API nicht verfügbar

**Erwartete Console-Ausgabe:**

```
ℹ️ Prompt API Status: not-available
❌ Prompt API not available on this device
```

**Info:** Prompt API benötigt Chrome Canary/Dev mit aktiviertem Flag:

- `chrome://flags/#prompt-api-for-gemini-nano`
- Flag auf "Enabled" setzen
- Chrome neu starten

**Fallback:** Extension nutzt Pattern-Matching statt AI

### Problem: Service Worker stoppt nach einiger Zeit

**Lösung:** Normal in Chrome - Service Worker schlafen nach Inaktivität

- Klicke auf "Service Worker" Link um neu zu starten
- Logs gehen verloren, neue Aktionen erzeugen neue Logs

## Performance Monitoring

### Erwartete Zeiten:

- **Bookmark speichern:** < 100ms
- **Klassifikation (Pattern):** < 50ms
- **Klassifikation (Prompt API):** 1-3 Sekunden
- **Bootstrap (100 Bookmarks):** 30-60 Sekunden
- **Duplikat-Erkennung (100 Bookmarks):** 2-5 Sekunden

### Zu langsam?

Console-Logs zeigen Performance-Bottlenecks:

- Prompt API langsam → Nutze Pattern-Matching
- IndexedDB langsam → Zu viele Bookmarks? Index prüfen
- Bootstrap langsam → Rate Limiting in bootstrap.js anpassen

## Weitere Tests

### Optional: Type-Check ausführen

```bash
cd /Users/anton.feldmann/Projects/priv/gmark/browser-extension-local
npm run type-check
```

**Erwartet:** Keine TypeScript-Fehler

### Optional: Extension neu bauen

```bash
cd /Users/anton.feldmann/Projects/priv/gmark/browser-extension-local
npm run build
```

**Erwartet:** Build erfolgreich

## Erfolgs-Kriterien ✅

- [x] Extension lädt ohne Fehler
- [x] Kontextmenüs funktionieren
- [x] Bookmarks werden gespeichert
- [x] Bootstrap läuft automatisch
- [x] Chrome Bookmarks reorganisiert
- [x] IndexedDB enthält Daten
- [x] Duplikat-Erkennung funktioniert
- [x] Console-Logs sind sichtbar und hilfreich
- [x] Popup zeigt Bookmarks korrekt an

## Support

Bei Problemen:

1. Console-Logs prüfen (F12 → Console)
2. Service Worker neu starten
3. Extension neu laden
4. Chrome neu starten
5. IndexedDB löschen (chrome://settings/siteData → gmark-local)

---

**Viel Erfolg beim Testen! 🚀**

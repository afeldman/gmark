# 🔖 GMARK Browser Extension

Die offizielle Browser-Extension für GMARK - Intelligentes Bookmark-Management mit KI-Unterstützung.

## ✨ Features

- **1-Click Bookmarking**: Aktuelle Seite mit einem Klick speichern
- **AI-Klassifikation**: Automatische Analyse mit Chrome AI (Gemini Nano), AnythingLLM oder OpenAI
- **Ordner-Organisation**: Hierarchische Struktur wie ein Dateisystem
- **Kontext-Menü**: Rechtsklick auf Links zum Speichern
- **Keyboard-Shortcut**: `Ctrl+Shift+B` (Windows/Linux) oder `Cmd+Shift+B` (Mac)
- **Intelligente Content-Extraktion**: Automatische Erkennung des Hauptinhalts
- **Offline-Sync**: Lokales Caching für schnellen Zugriff

## 🌐 Unterstützte Browser

- ✅ **Google Chrome** (127+)
- ✅ **Brave**
- ✅ **Vivaldi**
- ✅ **Microsoft Edge**
- ✅ **Opera**
- ⚠️ Alle Chromium-basierten Browser mit Manifest V3

## 📦 Installation

### Aus dem Chrome Web Store (In Planung)

1. Besuche den [Chrome Web Store](#)
2. Klicke auf "Zu Chrome hinzufügen"
3. Bestätige die Berechtigungen

### Manuell (Developer Mode)

1. **Extension-Dateien vorbereiten**:

   ```bash
   cd browser-extension
   ```

2. **Chrome/Brave/Vivaldi öffnen**:

   - Navigiere zu `chrome://extensions/` (Chrome)
   - Oder `brave://extensions/` (Brave)
   - Oder `vivaldi://extensions/` (Vivaldi)

3. **Developer Mode aktivieren**:

   - Toggle "Entwicklermodus" oben rechts

4. **Extension laden**:

   - Klicke "Entpackte Extension laden"
   - Wähle den `browser-extension` Ordner

5. **Extension pinnen**:
   - Klicke auf das Puzzle-Icon in der Toolbar
   - Pin GMARK für schnellen Zugriff

## ⚙️ Einrichtung

### 1. Backend-Server starten

Stelle sicher, dass dein GMARK Backend läuft:

```bash
cd gmark
uvicorn app:app --reload
```

Server läuft auf `http://localhost:8000`

### 2. Extension konfigurieren

1. **Klicke auf das GMARK-Icon** → "Einstellungen" (oder Rechtsklick → Optionen)

2. **Server-Verbindung**:

   - API-Endpoint: `http://localhost:8000`
   - (Für Remote-Server: `https://your-server.com`)

3. **Anmelden**:

   - Benutzername eingeben
   - Passwort eingeben
   - "Anmelden" klicken

4. **AI-Einstellungen**:

   - ✅ Automatische Klassifikation
   - ✅ Lokale AI bevorzugen (Chrome AI/AnythingLLM)

5. **Einstellungen speichern**

### 3. Chrome AI aktivieren (Optional, aber empfohlen)

Für Chrome AI (Gemini Nano) - **lokal & kostenlos**:

1. **Chrome Canary/Dev installieren** (Version 127+):

   - [Chrome Canary Download](https://www.google.com/chrome/canary/)

2. **Flags aktivieren**:

   - Öffne `chrome://flags/#optimization-guide-on-device-model`
   - Setze auf "Enabled"
   - Öffne `chrome://flags/#prompt-api-for-gemini-nano`
   - Setze auf "Enabled"
   - Browser neu starten

3. **Model herunterladen**:
   - Öffne DevTools (F12) auf einer beliebigen Seite
   - Console: `await window.ai.canCreateTextSession()`
   - Falls "after-download", warte auf Download
   - Falls "readily", bereit! ✅

## 🚀 Verwendung

### Schnell-Bookmark

1. **Klicke auf GMARK-Icon** in der Toolbar
2. Extension analysiert automatisch die Seite mit AI
3. **Ordner-Empfehlung** wird angezeigt
4. **"Speichern"** klicken - fertig! 🎉

### Kontext-Menü

- **Rechtsklick** auf einer Seite → "In GMARK speichern"
- **Rechtsklick** auf einem Link → "Schnell speichern"

### Keyboard-Shortcut

- Windows/Linux: `Ctrl + Shift + B`
- macOS: `Cmd + Shift + B`

## 🎨 Screenshots

_(Hier würden Screenshots eingefügt)_

### Popup

![Popup Screenshot](#)

### Einstellungen

![Settings Screenshot](#)

### AI-Klassifikation

![AI Classification](#)

## 🔧 Erweiterte Funktionen

### Ordner-Verwaltung

Die Extension lädt automatisch deine Ordner-Hierarchie:

```
/tech
  /javascript
    /frameworks
  /python
/personal
/work
```

### AI-Klassifikation

Die Extension nutzt in dieser Reihenfolge:

1. **Chrome AI (Gemini Nano)** - Lokal, schnell, kostenlos
2. **AnythingLLM** - Dein lokaler Server (falls konfiguriert)
3. **OpenAI** - Cloud-Fallback (falls API-Key hinterlegt)

### Content-Extraktion

Die Extension extrahiert intelligent:

- Hauptinhalt (Article, Main-Content)
- Meta-Beschreibungen
- Überschriften (H1, H2)
- Keywords aus Meta-Tags

### Synchronisation

Optional: Automatischer Sync alle 30 Minuten:

- Bookmarks vom Server abrufen
- Lokales Caching für Offline-Zugriff
- Hervorhebung bereits gespeicherter Links

## 🛠️ Entwicklung

### Dateien-Struktur

```
browser-extension/
├── manifest.json          # Extension-Konfiguration (Manifest V3)
├── popup.html            # Popup-UI
├── popup.js              # Popup-Logik
├── background.js         # Service Worker
├── content.js            # Content Script
├── options.html          # Einstellungs-Seite
├── options.js            # Einstellungs-Logik
└── icons/                # Extension-Icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### Berechtigungen

Die Extension benötigt:

- `storage` - Einstellungen speichern
- `activeTab` - Zugriff auf aktuelle Seite
- `contextMenus` - Rechtsklick-Menü
- `tabs` - Tab-Informationen
- `<all_urls>` - Content-Extraction (optional beschränkbar)

### Debugging

1. Öffne `chrome://extensions/`
2. Klicke "Details" bei GMARK
3. "Hintergrundseite untersuchen" → DevTools öffnen
4. Console-Logs für Background Worker
5. Für Popup: Rechtsklick auf Popup → "Untersuchen"

### Build & Package

```bash
# Zip für Submission
cd browser-extension
zip -r gmark-extension.zip . -x ".*" -x "__MACOSX"
```

## 🔐 Sicherheit & Datenschutz

- **Lokale Verarbeitung**: Chrome AI läuft komplett lokal
- **Keine Tracking**: Keine Analytics, keine Telemetrie
- **Token-Speicherung**: Verschlüsselt in Chrome Sync Storage
- **HTTPS**: Produktions-Server sollte HTTPS verwenden
- **Open Source**: Code ist vollständig einsehbar

## ❓ Troubleshooting

### "Nicht angemeldet"

- Gehe zu Einstellungen
- Prüfe API-Endpoint (läuft Backend?)
- Login erneut durchführen

### "Chrome AI nicht verfügbar"

- Chrome Version prüfen (`chrome://version/`)
- Flags aktiviert? (`chrome://flags/`)
- Model heruntergeladen? (siehe Setup)

### "Verbindung fehlgeschlagen"

- Backend läuft? `curl http://localhost:8000/docs`
- CORS aktiviert im Backend?
- Firewall blockiert Port 8000?

### Icons nicht sichtbar

- Fehlende Icon-Dateien erstellen (siehe unten)
- Extension neu laden in `chrome://extensions/`

## 📝 Icon-Erstellung

Erstelle Icons in diesen Größen:

```bash
# Mit ImageMagick
convert bookmark-icon.png -resize 16x16 icon16.png
convert bookmark-icon.png -resize 32x32 icon32.png
convert bookmark-icon.png -resize 48x48 icon48.png
convert bookmark-icon.png -resize 128x128 icon128.png
```

Oder nutze ein Online-Tool: [Icon Generator](https://www.favicon-generator.org/)

## 🚀 Roadmap

- [ ] Chrome Web Store Veröffentlichung
- [ ] Firefox Add-on (WebExtensions)
- [ ] Safari Extension
- [ ] Bulk-Import von Browser-Bookmarks
- [ ] Offline-Modus mit Service Worker
- [ ] Dark Mode
- [ ] Mehrsprachigkeit (i18n)
- [ ] Custom Keyboard Shortcuts
- [ ] Bookmark-Vorschau (Thumbnail)

## 📄 Lizenz

MIT License - siehe [LICENSE](../license)

## 🤝 Beitragen

Pull Requests sind willkommen!

1. Fork das Projekt
2. Feature Branch erstellen
3. Änderungen committen
4. Push zum Branch
5. Pull Request öffnen

## 📞 Support

- GitHub Issues: [Issues](https://github.com/afeldman/gmark/issues)
- Diskussionen: [Discussions](#)
- Email: anton.feldmann@gmail.com

---

**Happy Bookmarking! 🔖**

Made with ❤️ for productivity

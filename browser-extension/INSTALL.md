# 🚀 GMARK Browser Extension - Schnellstart

## ✅ Status: Einsatzbereit!

Die PNG-Icons wurden erfolgreich generiert. Die Extension kann sofort geladen werden.

## Installation in 3 Minuten

### Schritt 1: Backend starten

```bash
cd /Users/anton.feldmann/Projects/priv/gmark
source venv/bin/activate  # Falls noch nicht aktiviert
cd gmark
uvicorn app:app --reload
```

✅ Backend läuft auf: http://localhost:8000

### Schritt 2: Extension laden

#### Chrome / Brave / Vivaldi / Edge

1. **Öffne Extension-Seite**:

   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Vivaldi: `vivaldi://extensions/`
   - Edge: `edge://extensions/`

2. **Developer Mode aktivieren**:

   - Toggle "Entwicklermodus" oben rechts ✅

3. **Extension laden**:

   - Klicke "Entpackte Extension laden"
   - Navigiere zu: `/Users/anton.feldmann/Projects/priv/gmark/browser-extension`
   - Wähle den Ordner aus

4. **Extension pinnen**:
   - Klicke Puzzle-Icon 🧩 in der Toolbar
   - Suche "GMARK"
   - Klicke Pin 📌

### Schritt 3: Konfigurieren & Anmelden

1. **Klicke GMARK-Icon** in der Toolbar
2. **Klicke "Einstellungen"** (Zahnrad unten)
3. **Server-Verbindung**:
   - API-Endpoint: `http://localhost:8000` ✅
4. **Anmelden**:
   - Benutzername: (dein GMARK User)
   - Passwort: (dein Passwort)
   - Klicke "Anmelden"
5. **AI-Einstellungen** (optional):
   - ✅ Automatische Klassifikation
   - ✅ Lokale AI bevorzugen
6. **"Einstellungen speichern"**

## Erste Verwendung

### Test-Bookmark speichern

1. **Öffne eine beliebige Webseite** (z.B. https://react.dev)
2. **Klicke GMARK-Icon** 🔖 in der Toolbar
3. **Warte auf AI-Klassifikation** (~2 Sekunden)
4. **Überprüfe Ordner-Empfehlung** (z.B. "/tech/javascript")
5. **Klicke "Speichern"** 💾

✅ **Fertig!** Dein erstes KI-klassifiziertes Bookmark ist gespeichert!

## Keyboard Shortcut

- **macOS**: `Cmd + Shift + B`
- **Windows/Linux**: `Ctrl + Shift + B`

## Kontext-Menü

- **Rechtsklick auf Seite** → "In GMARK speichern"
- **Rechtsklick auf Link** → "Schnell speichern (Auto-Klassifikation)"

## Chrome AI aktivieren (Optional)

Für **lokale, kostenlose AI** mit Gemini Nano:

### 1. Chrome Canary installieren

```bash
# macOS
brew install --cask google-chrome-canary

# Oder Download: https://www.google.com/chrome/canary/
```

### 2. Flags aktivieren

1. Öffne: `chrome://flags/#optimization-guide-on-device-model`

   - Setze auf **"Enabled"**

2. Öffne: `chrome://flags/#prompt-api-for-gemini-nano`

   - Setze auf **"Enabled"**

3. **Restart Chrome Canary**

### 3. Model-Download prüfen

1. Öffne **DevTools** (F12) auf einer Seite
2. Console eingeben:
   ```javascript
   await window.ai.canCreateTextSession();
   ```
3. Antwort:
   - `"readily"` → ✅ Bereit!
   - `"after-download"` → ⏳ Warte auf Download
   - `"no"` → ❌ Nicht verfügbar

### 4. Model verwenden

Nach Download (kann einige Minuten dauern):

1. Extension neu laden in `chrome://extensions/`
2. Bookmark erstellen
3. **Chrome AI wird automatisch verwendet!** 🎉

## Icons anpassen (Optional)

Die Extension nutzt derzeit SVG-Placeholder-Icons, die zu PNG konvertiert wurden.

Für eigene Icons:

```bash
cd /Users/anton.feldmann/Projects/priv/gmark/browser-extension

# Neue PNGs generieren (mit Python PIL):
python3 generate_png_icons.py

# Oder SVGs manuell konvertieren:
# Nutze: https://cloudconvert.com/svg-to-png
```

Die Icons müssen sein:

- 16x16, 32x32, 48x48, 128x128 Pixel
- PNG Format (.png)
- Im Ordner: `icons/`

## Troubleshooting

### ❌ "Nicht angemeldet"

**Lösung**:

1. Backend läuft? → `curl http://localhost:8000/docs`
2. User existiert? → In GMARK registrieren
3. Einstellungen → Login erneut

### ❌ "Verbindung fehlgeschlagen"

**Lösung**:

```bash
# Backend-Status prüfen
curl http://localhost:8000/api/folders

# Sollte geben: {"detail":"Authentication required"}
# (= Backend läuft, aber Auth fehlt)
```

### ❌ Icons nicht sichtbar

**Lösung**:

1. SVG-Icons in PNG konvertieren
2. Extension neu laden in `chrome://extensions/`

### ❌ Chrome AI nicht verfügbar

**Lösung**:

1. Chrome Version: `chrome://version/` → Mind. 127
2. Nutze Chrome Canary/Dev
3. Flags korrekt aktiviert?
4. Fallback: Extension nutzt automatisch Backend-AI

## Nächste Schritte

✅ **Extension läuft!**

Jetzt kannst du:

1. **Bookmarks organisieren**: Ordner erstellen unter `/tech`, `/personal`, etc.
2. **Bulk-Import**: Bestehende Browser-Bookmarks importieren
3. **Ordner-Empfehlungen**: Lass AI die beste Kategorie vorschlagen
4. **Suche**: Alle Bookmarks durchsuchen
5. **Teams**: Bookmarks mit Kollegen teilen

## Weiterführende Dokumentation

- **Extension Details**: [README.md](README.md)
- **Backend API**: [../README_NEW.md](../README_NEW.md)
- **Quickstart**: [../QUICKSTART.md](../QUICKSTART.md)
- **API Docs**: http://localhost:8000/docs

---

**Viel Erfolg! 🚀**

Bei Fragen: GitHub Issues oder anton.feldmann@gmail.com

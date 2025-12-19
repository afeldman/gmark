# 🔖 Extension Laden - Schnelle Anleitung

## ✅ Problem gelöst!

Die PNG-Icons wurden erfolgreich generiert. Die Extension kann jetzt geladen werden.

## 🚀 Extension in 3 Schritten laden

### 1. Chrome/Brave/Vivaldi öffnen

Wähle deinen Browser:

- **Chrome**: `chrome://extensions/`
- **Brave**: `brave://extensions/`
- **Vivaldi**: `vivaldi://extensions/`
- **Edge**: `edge://extensions/`

### 2. Developer Mode aktivieren

- Klicke den Toggle **"Entwicklermodus"** oben rechts
- Der Toggle wird blau ✅

### 3. Extension laden

1. Klicke **"Entpackte Extension laden"**
2. Navigiere zu: `/Users/anton.feldmann/Projects/priv/gmark/browser-extension`
3. Klicke **"Ordner auswählen"**

✅ **Extension wird geladen!**

Du solltest das GMARK-Icon jetzt in der Toolbar sehen 🔖

## 📍 Icon pinnen (Optional)

1. Klicke das **Puzzle-Icon** 🧩 in der Toolbar
2. Suche "GMARK"
3. Klicke den **Pin** 📌

Jetzt ist GMARK immer sichtbar!

## ⚙️ Konfigurieren

1. Klicke das **GMARK-Icon** 🔖
2. Klicke **"Einstellungen"** (Zahnrad unten)
3. Fülle aus:
   - **API-Endpoint**: `http://localhost:8000`
   - **Benutzername**: (dein GMARK User)
   - **Passwort**: (dein Passwort)
4. Klicke **"Anmelden"**
5. Klicke **"Einstellungen speichern"**

✅ **Extension ist konfiguriert!**

## 🧪 Testen

1. Öffne eine beliebige Webseite (z.B. https://react.dev)
2. Klicke das **GMARK-Icon** 🔖
3. Warte auf AI-Klassifikation (~2 Sekunden)
4. Klicke **"Speichern"** 💾

✅ **Fertig! Dein erstes Bookmark ist gespeichert!**

## 🐛 Troubleshooting

### ❌ "Manifest error"

**Lösung**:

- Ich habe PNG-Icons generiert
- Extension neu laden: `chrome://extensions/` → Refresh
- Cache leeren: Strg+Shift+Delete

### ❌ Icon wird nicht angezeigt

**Lösung**:

1. Extensions-Seite aktualisieren (F5)
2. Browser neu starten
3. Extension neu laden

### ❌ Backend nicht erreichbar

**Lösung**:

```bash
# Backend starten
cd /Users/anton.feldmann/Projects/priv/gmark/gmark
uvicorn app:app --reload
```

Backend muss auf http://localhost:8000 laufen!

---

**Happy Bookmarking! 🔖**

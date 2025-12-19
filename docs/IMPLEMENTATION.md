# 🔖 GMARK - Vollständige Implementierung

## Projekt-Übersicht

GMARK ist ein **AI-gestütztes Bookmark-Management-System** mit:

✅ **Dateisystem-ähnlicher Organisation** (`/tech/javascript/frameworks`)  
✅ **Multi-AI-Support** (Chrome AI, AnythingLLM, OpenAI)  
✅ **Browser-Extension** (Chrome, Brave, Vivaldi, Edge)  
✅ **FastAPI Backend** mit SQLite  
✅ **Automatische Klassifikation** mit KI

---

## 📁 Projekt-Struktur

```
gmark/
├── browser-extension/          # 🌐 Browser Extension (Neu!)
│   ├── manifest.json          # Manifest V3
│   ├── popup.html/js          # 1-Click Bookmarking UI
│   ├── background.js          # Service Worker
│   ├── content.js             # Content Extraktion
│   ├── options.html/js        # Einstellungen
│   ├── icons/                 # Extension Icons (SVG)
│   ├── README.md              # Extension Docs
│   └── INSTALL.md             # Schnellstart
│
├── gmark/                      # 🐍 Python Backend
│   ├── DTOs/
│   │   ├── Bookmark.py        # + BookmarkCreate, BookmarkMove
│   │   ├── BookmarkFolder.py  # Neu! Ordner-Hierarchie
│   │   └── ...
│   ├── repositories/
│   │   ├── BookmarkRepository.py  # Neu! SQLite CRUD
│   │   └── ...
│   ├── services/
│   │   ├── BookmarkService.py     # Neu! AI-Integration
│   │   └── ...
│   ├── controllers/
│   │   ├── BookmarkController.py  # Neu! API Endpoints
│   │   └── ...
│   ├── bookmark.py            # AIClassifier (Multi-Provider)
│   ├── app.py                 # FastAPI App
│   └── ...
│
├── assets/
│   └── data.sql               # Erweitert: bookmark_folders Tabelle
│
├── static/
│   └── chrome-ai-demo.html    # Web-Demo für Chrome AI
│
├── examples/
│   └── demo.py                # Python API Demo
│
├── migrate_db.py              # Datenbank-Migration
├── setup.sh                   # Automatisches Setup
├── README_NEW.md              # Vollständige Dokumentation
├── QUICKSTART.md              # 5-Minuten Start
└── pyproject.toml             # Dependencies
```

---

## 🚀 Schnellstart (5 Minuten)

### 1. Backend Setup

```bash
# Setup ausführen
./setup.sh

# Oder manuell:
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic loguru requests beautifulsoup4 openai python-decouple pyjwt passlib[bcrypt] fastapi-utils

# Datenbank erstellen
sqlite3 gmark.db < assets/data.sql

# Server starten
cd gmark && uvicorn app:app --reload
```

✅ Backend: http://localhost:8000

### 2. Browser Extension installieren

```bash
# Chrome/Brave/Vivaldi öffnen
# Navigiere zu: chrome://extensions/

# Developer Mode aktivieren ✅
# "Entpackte Extension laden" → browser-extension/ Ordner wählen

# Extension konfigurieren:
# - API-Endpoint: http://localhost:8000
# - Login mit GMARK Credentials
```

### 3. Ersten Bookmark speichern

1. **Webseite öffnen** (z.B. https://react.dev)
2. **GMARK-Icon klicken** 🔖
3. **AI analysiert** automatisch
4. **Ordner-Empfehlung** annehmen
5. **"Speichern"** ✅

**Fertig!** 🎉

---

## 🎯 Hauptfeatures

### 1️⃣ Dateisystem-Organisation

```
/tech
  /javascript
    /frameworks      ← Hierarchisch wie Linux!
    /libraries
  /python
/personal
  /recipes
  /travel
/work
/unsorted
```

**API**:

- `POST /api/folders` - Ordner erstellen
- `GET /api/folders` - Hierarchie abrufen
- `PUT /api/bookmarks/{id}/move` - Verschieben

### 2️⃣ Multi-AI-Klassifikation

**Priorisierung**:

1. **Chrome AI (Gemini Nano)** 🌟

   - Lokal (im Browser)
   - Kostenlos
   - Privat
   - Erfordert Chrome 127+

2. **AnythingLLM** 🔧

   - Lokal (Docker)
   - Open Source
   - Konfigurierbar

3. **OpenAI** ☁️
   - Cloud-basiert
   - Fallback
   - API-Key erforderlich

**Output**:

```json
{
  "keywords": ["javascript", "react", "frontend", "framework", "ui"],
  "summary": "React ist eine JavaScript-Bibliothek für UI-Entwicklung",
  "folder_path": "/tech/javascript/frameworks"
}
```

### 3️⃣ Browser Extension

**Features**:

- ⌨️ Keyboard Shortcut: `Cmd+Shift+B`
- 🖱️ Kontext-Menü: Rechtsklick → "In GMARK speichern"
- 🤖 Auto-Klassifikation mit Chrome AI
- 📂 Ordner-Vorschläge
- 🔄 Periodischer Sync (optional)
- 💾 Offline-Caching

**Unterstützte Browser**:

- Chrome / Chromium
- Brave
- Vivaldi
- Microsoft Edge
- Opera

---

## 📋 API-Übersicht

### Bookmarks

| Endpoint                       | Methode | Beschreibung                |
| ------------------------------ | ------- | --------------------------- |
| `/api/bookmarks`               | POST    | Bookmark erstellen (mit AI) |
| `/api/bookmarks`               | GET     | Alle Bookmarks abrufen      |
| `/api/bookmarks/search?query=` | GET     | Suche                       |
| `/api/bookmarks/{id}/move`     | PUT     | Verschieben                 |
| `/api/bookmarks/{id}`          | DELETE  | Löschen                     |

### Ordner

| Endpoint              | Methode | Beschreibung      |
| --------------------- | ------- | ----------------- |
| `/api/folders`        | POST    | Ordner erstellen  |
| `/api/folders`        | GET     | Ordner-Baum       |
| `/api/folders/{path}` | GET     | Ordner nach Pfad  |
| `/api/folders/{id}`   | DELETE  | Löschen (CASCADE) |

### User

| Endpoint          | Methode | Beschreibung      |
| ----------------- | ------- | ----------------- |
| `/users/register` | POST    | Registrieren      |
| `/users/token`    | POST    | Login & JWT holen |
| `/users/logout`   | POST    | Logout            |

---

## 🛠️ Technologie-Stack

### Backend

- **FastAPI** (0.115.5) - Web Framework
- **SQLite** - Lokale Datenbank
- **Pydantic** (2.9.2) - Validation
- **Peewee** (3.17.8) - ORM (optional)
- **OpenAI** (1.54.4) - AI Integration
- **BeautifulSoup4** - HTML Parsing
- **JWT** - Authentifizierung

### Extension

- **Manifest V3** - Chrome Extension Standard
- **Vanilla JavaScript** - Keine Dependencies
- **Chrome AI API** - Gemini Nano
- **Service Worker** - Background Tasks

---

## 🔧 Konfiguration

### Backend (.env)

```bash
# Database
DATABASE_PATH=gmark.db

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI
OPENAI_API_KEY=sk-...
ANYTHINGLLM_ENDPOINT=http://localhost:3001/api/chat
PREFER_LOCAL_AI=true
```

### Extension (Options)

- **API-Endpoint**: `http://localhost:8000`
- **Auto-Klassifikation**: ✅
- **Lokale AI bevorzugen**: ✅
- **Sync aktivieren**: Optional
- **Links hervorheben**: Optional

---

## 🧪 Testing

### Backend testen

```bash
# Demo-Skript ausführen
python3 examples/demo.py

# Oder manuell:
curl -X POST http://localhost:8000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@test.com"}'

curl -X POST http://localhost:8000/users/token \
  -F "username=test" -F "password=test123"

TOKEN="..."
curl -X POST http://localhost:8000/api/bookmarks \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://react.dev","auto_classify":true}'
```

### Extension testen

1. Extension laden (siehe Schnellstart)
2. Webseite öffnen
3. GMARK-Icon klicken
4. Bookmark speichern
5. DevTools öffnen → Console prüfen

---

## 📊 Datenbank-Schema

### `bookmark_folders` (Neu!)

```sql
id, user_id, name, parent_id, full_path, created_time, modified_time
```

### `bookmarks` (Erweitert)

```sql
id, user_id, folder_id,  -- folder_id ist neu!
url, title, hash, description,
access_time, modified_time, changed_time, mode
```

### `bookmark_keywords`

```sql
bookmark_id, keyword_id, ranking
```

---

## 🎨 UI-Komponenten

### Extension Popup

- URL & Titel (auto-filled)
- Beschreibung (AI-generiert)
- Ordner-Dropdown (dynamisch geladen)
- AI-Ordner-Vorschlag
- Keywords-Anzeige
- Auto-Klassifikation Toggle

### Extension Options

- Server-Konfiguration
- Login/Logout
- AI-Präferenzen
- Anzeige-Optionen
- Statistiken
- Cache-Management

---

## 🔐 Sicherheit

✅ **JWT-basierte Auth**  
✅ **Bcrypt Password Hashing** (12 Rounds)  
✅ **Token-Ablauf** (30 Minuten)  
✅ **CORS konfigurierbar**  
✅ **Lokale AI-Verarbeitung** (Chrome AI)  
✅ **Keine Telemetrie**

---

## 🐛 Troubleshooting

### Backend startet nicht

```bash
# Port bereits belegt?
lsof -i :8000

# Dependencies fehlen?
pip install -r requirements.txt

# Datenbank fehlt?
sqlite3 gmark.db < assets/data.sql
```

### Extension lädt nicht

1. Developer Mode aktiviert?
2. Richtiger Ordner gewählt?
3. Console-Errors in `chrome://extensions/`?
4. Icons vorhanden? (`icons/*.svg`)

### Chrome AI nicht verfügbar

1. Chrome Version ≥ 127? (`chrome://version/`)
2. Flags aktiviert? (`chrome://flags/`)
3. Nutze Chrome Canary/Dev
4. Fallback: Backend-AI wird automatisch genutzt

### "Verbindung fehlgeschlagen"

1. Backend läuft? `curl http://localhost:8000/docs`
2. CORS aktiviert? (sollte `*` erlauben für localhost)
3. Token gültig? (Login erneut)
4. Firewall blockiert Port 8000?

---

## 📚 Weiterführende Docs

- **Backend**: [README_NEW.md](README_NEW.md)
- **Extension**: [browser-extension/README.md](browser-extension/README.md)
- **Quickstart**: [QUICKSTART.md](QUICKSTART.md)
- **Installation**: [browser-extension/INSTALL.md](browser-extension/INSTALL.md)
- **API Docs**: http://localhost:8000/docs (automatisch von FastAPI)

---

## 🗺️ Roadmap

### Backend

- [ ] Bulk-Import von HTML Bookmarks
- [ ] Volltext-Suche (FTS5)
- [ ] Tag-basierte Suche
- [ ] Export (HTML, JSON)
- [ ] Docker Compose Setup
- [ ] Web-Frontend (React/Vue)

### Extension

- [ ] Chrome Web Store Veröffentlichung
- [ ] Firefox Add-on (WebExtensions)
- [ ] Safari Extension
- [ ] Dark Mode
- [ ] Mehrsprachigkeit (i18n)
- [ ] Bookmark-Vorschau (Thumbnails)
- [ ] Bulk-Operations
- [ ] Custom Shortcuts

### AI

- [ ] Google Gemini API Integration
- [ ] Claude API Integration
- [ ] Ollama Support (lokal)
- [ ] Custom Prompts
- [ ] Duplicate Detection
- [ ] Smart Tagging

---

## 📄 Lizenz

MIT License - siehe [license](license)

## 🙏 Credits

- **Chrome AI**: Google Gemini Nano
- **FastAPI**: Sebastián Ramírez
- **Icons**: Custom SVG (siehe `generate_icons.py`)

---

## 🤝 Mitwirken

Pull Requests sind willkommen! 🎉

1. Fork das Projekt
2. Feature Branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request öffnen

---

**Happy Bookmarking! 🔖**

Made with ❤️ by Anton Feldmann  
2024-2025

# 🚀 GMARK Quick Start Guide

## Installation (5 Minuten)

### Option 1: Automatisches Setup

```bash
# Repository klonen
git clone <your-repo>
cd gmark

# Setup-Skript ausführen
./setup.sh

# Server starten
source venv/bin/activate
cd gmark
uvicorn app:app --reload
```

### Option 2: Manuelles Setup

```bash
# Virtual Environment
python3 -m venv venv
source venv/bin/activate

# Dependencies
pip install fastapi uvicorn pydantic loguru requests beautifulsoup4 \
            openai python-decouple pyjwt passlib[bcrypt] fastapi-utils

# Datenbank
sqlite3 gmark.db < assets/data.sql

# Config
cp .env.example .env
```

## Erste Schritte

### 1. Server starten

```bash
cd gmark
uvicorn app:app --reload
```

Server läuft auf: http://localhost:8000

### 2. User registrieren

```bash
curl -X POST http://localhost:8000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123", "email": "demo@example.com"}'
```

### 3. Login & Token holen

```bash
curl -X POST http://localhost:8000/users/token \
  -F "username=demo" \
  -F "password=demo123"
```

Antwort: `{"access_token": "eyJ..."}`

### 4. Bookmark erstellen (mit AI)

```bash
TOKEN="your-token-here"

curl -X POST "http://localhost:8000/api/bookmarks?prefer_local_ai=true" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://react.dev",
    "auto_classify": true
  }'
```

Antwort:

```json
{
  "bookmark_id": 1,
  "suggested_folder": "/tech/javascript/frameworks",
  "message": "Bookmark created successfully"
}
```

### 5. Ordner erstellen

```bash
curl -X POST http://localhost:8000/api/folders \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "python",
    "parent_path": "/tech"
  }'
```

### 6. Bookmarks anzeigen

```bash
# Alle Bookmarks
curl -H "token: $TOKEN" http://localhost:8000/api/bookmarks

# Bookmarks in Ordner
curl -H "token: $TOKEN" "http://localhost:8000/api/bookmarks?folder_path=/tech"

# Ordner-Baum
curl -H "token: $TOKEN" http://localhost:8000/api/folders
```

## AI-Konfiguration

### Chrome AI (Gemini Nano) - Lokal & Kostenlos

1. **Chrome Canary/Dev installieren** (Version 127+)
2. **Flags aktivieren**:
   - `chrome://flags/#optimization-guide-on-device-model` → Enabled
   - `chrome://flags/#prompt-api-for-gemini-nano` → Enabled
3. **Demo öffnen**: `static/chrome-ai-demo.html`

### AnythingLLM - Lokal

```bash
# Docker Installation
docker run -d -p 3001:3001 mintplexlabs/anythingllm

# In .env konfigurieren
ANYTHINGLLM_ENDPOINT=http://localhost:3001/api/chat
PREFER_LOCAL_AI=true
```

### OpenAI - Cloud Fallback

```bash
# In .env eintragen
OPENAI_API_KEY=sk-your-key-here
```

## Python API Demo

```bash
# Demo-Skript ausführen
python3 examples/demo.py
```

Das Skript zeigt:

- User-Registrierung
- Ordner erstellen
- Bookmarks mit AI klassifizieren
- Suche
- Ordner-Baum anzeigen

## API-Übersicht

| Endpoint                   | Methode | Beschreibung       |
| -------------------------- | ------- | ------------------ |
| `/users/register`          | POST    | User registrieren  |
| `/users/token`             | POST    | Login & Token      |
| `/api/bookmarks`           | POST    | Bookmark erstellen |
| `/api/bookmarks`           | GET     | Bookmarks abrufen  |
| `/api/bookmarks/search`    | GET     | Suche              |
| `/api/bookmarks/{id}/move` | PUT     | Verschieben        |
| `/api/folders`             | POST    | Ordner erstellen   |
| `/api/folders`             | GET     | Ordner-Baum        |

## Troubleshooting

### "Chrome AI not available"

- Chrome Version prüfen (≥127)
- Flags aktiviert? (siehe oben)
- Developer/Canary Channel nutzen

### "AnythingLLM connection failed"

- Docker läuft? `docker ps`
- Port 3001 frei? `lsof -i :3001`
- Endpoint in .env korrekt?

### "Database locked"

- Nur eine Instanz läuft?
- Berechtigungen prüfen: `ls -la gmark.db`

## Nächste Schritte

1. **Chrome Extension**: Installiere Browser-Extension für 1-Click Bookmarks
2. **Bulk Import**: Importiere existierende Bookmarks mit `util/html.py`
3. **Web Frontend**: Baue ein React/Vue Frontend
4. **Mobile App**: Nutze FastAPI für mobile Clients

## Weitere Infos

- Vollständige Doku: [README_NEW.md](README_NEW.md)
- API Docs: http://localhost:8000/docs (automatisch von FastAPI)
- GitHub Issues: Für Bugs & Features

---

**Happy Bookmarking! 🔖**

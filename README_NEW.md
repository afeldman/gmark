# GMARK - AI-Powered Bookmark Manager

Ein intelligentes Bookmark-Management-System mit KI-Klassifikation und Dateisystem-ähnlicher Organisationsstruktur.

## 🎯 Features

- **Hierarchische Ordnerstruktur**: Organisieren Sie Bookmarks wie ein Linux-Dateisystem (`/tech/javascript/frameworks`)
- **Multi-AI-Unterstützung**:
  - 🌟 **Chrome Built-in AI (Gemini Nano)** - Lokal, kostenlos, schnell (bevorzugt)
  - 🔧 **AnythingLLM** - Lokale Open-Source AI-Installation
  - ☁️ **OpenAI** - Cloud-basierter Fallback
- **Automatische Klassifikation**: Keywords, Zusammenfassung und Ordner-Empfehlung durch AI
- **SQLite-Datenbank**: Lokale, portable Speicherung
- **Team-Sharing**: Teilen Sie Bookmark-Sammlungen mit Teams
- **Volltext-Suche**: Durchsuchen Sie Titel, Beschreibungen und URLs

## 🏗️ Architektur

```
gmark/
├── DTOs/                    # Data Transfer Objects (Pydantic Models)
│   ├── Bookmark.py         # Bookmark-Modell mit folder_id
│   ├── BookmarkFolder.py   # Ordner-Hierarchie
│   └── User.py
├── repositories/            # Datenzugriff-Layer
│   ├── IBookmarkRepository.py
│   ├── BookmarkRepository.py  # SQLite-basiert
│   └── UserRepository.py
├── services/                # Business Logic
│   ├── BookmarkService.py  # Haupt-Logik mit AI-Integration
│   └── UserService.py
├── controllers/             # API-Endpoints
│   ├── BookmarkController.py  # REST API für Bookmarks & Ordner
│   └── UserController.py
├── bookmark.py              # AI-Klassifikation (multi-provider)
├── util/html.py            # HTML/Web-Scraping
└── app.py                  # FastAPI Application
```

## 📦 Installation

```bash
# Repository klonen
git clone <repo-url>
cd gmark

# Virtual Environment erstellen
python -m venv venv
source venv/bin/activate  # Auf Windows: venv\Scripts\activate

# Dependencies installieren
pip install -r requirements.txt  # oder:
pip install fastapi uvicorn pydantic loguru requests beautifulsoup4 openai python-decouple pyjwt passlib

# Datenbank initialisieren
sqlite3 gmark.db < assets/data.sql

# Environment-Variablen konfigurieren
cp .env.example .env
# .env editieren und API-Keys eintragen
```

## 🚀 Verwendung

### Server starten

```bash
cd gmark
uvicorn app:app --reload --port 8000
```

### API-Endpoints

#### Bookmarks

- `POST /api/bookmarks` - Neues Bookmark erstellen (mit optionaler AI-Klassifikation)
- `GET /api/bookmarks` - Alle Bookmarks abrufen (optional: `?folder_path=/tech`)
- `GET /api/bookmarks/search?query=python` - Bookmarks durchsuchen
- `PUT /api/bookmarks/{id}/move` - Bookmark in anderen Ordner verschieben
- `DELETE /api/bookmarks/{id}` - Bookmark löschen

#### Ordner

- `POST /api/folders` - Neuen Ordner erstellen
- `GET /api/folders` - Ordner-Baum abrufen
- `GET /api/folders/{path:path}` - Ordner nach Pfad abrufen
- `DELETE /api/folders/{id}` - Ordner löschen (CASCADE)

### Beispiel: Bookmark mit AI erstellen

```bash
curl -X POST http://localhost:8000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "token: YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://react.dev",
    "auto_classify": true,
    "prefer_local_ai": true
  }'
```

Antwort:

```json
{
  "bookmark_id": 42,
  "suggested_folder": "/tech/javascript/frameworks",
  "message": "Bookmark created successfully"
}
```

## 🤖 AI-Konfiguration

### Chrome Built-in AI (Gemini Nano)

**Voraussetzungen:**

- Chrome 127+ (Canary/Dev Channel)
- Flags aktivieren: `chrome://flags/#optimization-guide-on-device-model`

**Frontend-Integration:**

- Siehe `static/chrome-ai-demo.html` für Beispiel
- Chrome AI läuft nur im Browser (client-side)

### AnythingLLM (Lokal)

```bash
# AnythingLLM installieren (z.B. mit Docker)
docker run -d -p 3001:3001 \
  --name anythingllm \
  mintplexlabs/anythingllm

# In .env konfigurieren
ANYTHINGLLM_ENDPOINT=http://localhost:3001/api/chat
PREFER_LOCAL_AI=true
```

### OpenAI (Fallback)

```bash
# In .env konfigurieren
OPENAI_API_KEY=sk-...
```

## 📊 Datenbank-Schema

### bookmark_folders

```sql
id, user_id, name, parent_id, full_path, created_time, modified_time
```

Beispiel-Hierarchie:

```
/tech (id=1, parent_id=NULL)
├── /tech/javascript (id=5, parent_id=1)
│   └── /tech/javascript/frameworks (id=10, parent_id=5)
└── /tech/python (id=6, parent_id=1)
```

### bookmarks

```sql
id, user_id, folder_id, url, title, description, hash,
access_time, modified_time, changed_time, mode
```

- `folder_id`: Verknüpfung mit bookmark_folders
- `mode`: user_mode | team_mode | public_mode

## 🔧 Entwicklung

### Tests ausführen (TODO)

```bash
pytest tests/
```

### Code-Qualität

```bash
mypy gmark/
black gmark/
```

## 🗺️ Roadmap

- [x] Hierarchische Ordnerstruktur
- [x] Multi-AI-Provider (Chrome AI, AnythingLLM, OpenAI)
- [x] Automatische Klassifikation
- [ ] Chrome Extension für 1-Click Bookmark
- [ ] Bulk-Import von Mozilla/Chrome HTML Bookmarks
- [ ] Web-Frontend (React/Vue)
- [ ] Volltext-Indexierung mit FTS5
- [ ] Tag-basierte Suche mit Ranking
- [ ] Exportieren als HTML/JSON
- [ ] Docker Compose Setup

## 📝 Lizenz

Siehe [LICENSE](license)

## 🤝 Beitragen

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue öffnen.

---

**Hinweis**: Dieses Projekt befindet sich in aktiver Entwicklung. Die AI-Integration mit Chrome Gemini Nano ist experimentell und erfordert Chrome Canary/Dev Channel.

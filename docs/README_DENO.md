# GMARK - Deno Backend + Chrome Extension

Modernes Bookmark-Management System mit Chrome Extension und Deno Server.

## 🚀 Quick Start

```bash
# 1. Starte Deno Server
cd deno
deno run --allow-net --allow-read --allow-write --allow-env ./src/main.ts

# 2. Lade Chrome Extension
# Öffne: chrome://extensions/
# Click "Load unpacked" → Wähle `/browser-extension/`
```

Server läuft auf `http://localhost:8000`

## 📁 Project Structure

```
gmark/
├── deno/                 # Deno Backend (Phase 1-3 DONE)
│   ├── deno.json        # Config & Dependencies
│   ├── prisma/          # Database Schema (für Zukunft)
│   ├── .env             # Secrets
│   └── src/
│       ├── main.ts      # HTTP Server
│       ├── controllers/ # Route Handlers
│       ├── services/    # Business Logic
│       └── utils/       # JWT, Password, DB
│
├── browser-extension/   # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html/js
│   ├── options.html/js
│   ├── background.js
│   └── content.js
│
└── license, README.md   # Dokumentation
```

## ✅ Implementation Status

### Phase 1: Infrastructure ✅

- deno.json mit allen Dependencies
- Prisma Schema (SQLite)
- TypeScript Config
- Keine externen Package Dependencies (nur Deno std lib)

### Phase 2: Auth Layer ✅

- User Registration: `POST /api/users/register`
- User Login: `POST /api/users/login` → JWT Token
- Get User: `GET /api/users/me` (auth required)
- JWT Token Generation (HS256)
- Password Hashing (SHA256 + Salt)
- In-Memory DB mit User & Session Management

### Phase 3: Bookmarks CRUD ✅

- Create Bookmark: `POST /api/bookmarks`
- List Bookmarks: `GET /api/bookmarks`
- Get Bookmark: `GET /api/bookmarks/:id`
- Update Bookmark: `PUT /api/bookmarks/:id`
- Delete Bookmark: `DELETE /api/bookmarks/:id`
- Create Folder: `POST /api/folders`
- List Folders: `GET /api/folders`
- Get Folder: `GET /api/folders/:id`
- Update Folder: `PUT /api/folders/:id`
- Delete Folder: `DELETE /api/folders/:id`
- Folder Hierarchy Support

### Phase 4: AI Classification 🔄 (Next)

- HTML Title Extraction
- LLM-based Classification
- Category Auto-Tagging

### Phase 5: Testing & Deployment 🔄 (Next)

- Unit Tests
- Integration Tests
- Docker Setup
- Extension Integration

## 🔌 API Endpoints

### Auth

```bash
# Register
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","email":"user@example.com","password":"Pass123!"}'

# Login
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"Pass123!"}'
# Response: { token, user, expiresAt }

# Get Current User (requires Bearer token)
curl -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <token>"
```

### Bookmarks

```bash
# Create
curl -X POST http://localhost:8000/api/bookmarks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"GitHub",
    "url":"https://github.com",
    "description":"Code hosting",
    "category":"Dev",
    "folder_id":1
  }'

# List All
curl -X GET http://localhost:8000/api/bookmarks \
  -H "Authorization: Bearer <token>"

# Get One
curl -X GET http://localhost:8000/api/bookmarks/1 \
  -H "Authorization: Bearer <token>"

# Update
curl -X PUT http://localhost:8000/api/bookmarks/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"category":"Development"}'

# Delete
curl -X DELETE http://localhost:8000/api/bookmarks/1 \
  -H "Authorization: Bearer <token>"
```

### Folders

```bash
# Create
curl -X POST http://localhost:8000/api/folders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Work","parent_id":null}'

# List All
curl -X GET http://localhost:8000/api/folders \
  -H "Authorization: Bearer <token>"

# Update
curl -X PUT http://localhost:8000/api/folders/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Personal"}'

# Delete (cascades bookmarks)
curl -X DELETE http://localhost:8000/api/folders/1 \
  -H "Authorization: Bearer <token>"
```

## 🔐 Authentication

- JWT Token Format: HS256 signed
- Token Expiration: 30 minutes (configurable in .env)
- Token stored in: `Authorization: Bearer <token>` header
- Session tracked in-memory (DB-backed in production)

## 🗄️ Database

Current: In-Memory (Map-based)

- Users Table
- Active Sessions
- Bookmarks
- Bookmark Folders
- Keywords (for tagging)

Future: SQLite with Prisma

- Schema already defined in `deno/prisma/schema.prisma`
- When ready: `deno run -A npm:prisma migrate dev`

## 🔧 Configuration

`.env` file:

```env
SECRET_KEY=gmark-secret-key-2025-production-secure-token
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=  # Optional for AI features
ANYTHINGLLM_ENDPOINT=http://localhost:3001/api/chat
PREFER_LOCAL_AI=true
```

## 📦 Browser Extension

- Manifest V3 compliant
- Service Worker (no content scripts for inline execution)
- Communicates with Deno backend via HTTP
- Chrome Storage API for local caching
- CORS enabled on backend

## 🛠️ Development

```bash
cd deno

# Format Code
deno fmt

# Lint
deno lint

# Run with Watch
deno run --allow-net --allow-read --allow-write --allow-env --watch ./src/main.ts

# Run Production
deno run --allow-net --allow-read --allow-write --allow-env ./src/main.ts
```

## 🚀 Deployment

Single executable:

```bash
deno compile --allow-net --allow-read --allow-write --allow-env ./src/main.ts
# Outputs: gmark (executable)
```

Docker coming in Phase 5.

## 📋 Architecture

```
Browser Extension
    ↓
HTTP Request
    ↓
Deno Server (Port 8000)
    ↓
Controllers (Route Handler)
    ↓
Services (Business Logic)
    ↓
In-Memory DB / Future: Prisma + SQLite
```

No external npm dependencies required!

## 🎯 Next Steps

1. **Phase 4**: Implement AI Classification

   - HTML title extraction
   - LLM-based category suggestions
   - Auto-tagging

2. **Phase 5**: Testing & Deployment

   - Unit tests with Deno.test()
   - Integration tests
   - Docker container
   - Production ready

3. **Future**: SQLite Persistence
   - Switch from in-memory to file-based SQLite
   - Use Prisma for type-safe queries
   - Database migrations

## 🤝 Contributing

1. Create feature branch
2. Implement with TypeScript
3. Test endpoints with curl
4. Commit to git

## 📄 License

See LICENSE file

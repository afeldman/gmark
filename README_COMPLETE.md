# GMARK - AI Bookmark Manager 🔖

> **Intelligentes Bookmark Management mit Chrome Prompt API und On-Device LLM Classification**

Ein vollständig funktionsfähiges Bookmark-Management-System mit:

- 🧠 **Chrome Prompt API** für lokale LLM-basierte Klassifikation (Gemini Nano)
- 🔐 **Sichere Authentifizierung** mit JWT und SHA256+Salt Password Hashing
- 📊 **Backend Classification** mit Pattern-Matching als Fallback
- 🗂️ **Folder Hierarchy** zur Organisation von Bookmarks
- ⚡ **Deno + TypeScript** Backend ohne externe Dependencies
- 🧪 **Comprehensive Testing** mit Unit Tests und E2E Tests
- 🔍 **Linting & Formatting** für Code Quality

## 🚀 Quick Start

### Backend (Deno)

```bash
cd deno

# Entwicklung mit Auto-Reload
deno task dev

# Produktion
deno task start

# Testing
deno task test
deno task test:watch

# Code Quality
deno task lint
deno task format
deno task check
```

Server läuft auf `http://localhost:8000`

### Chrome Extension

```bash
cd browser-extension

# Dependencies installieren (für Testing/Linting)
npm install

# Linting
npm run lint

# Tests
npm test

# Extension in Chrome laden:
# 1. chrome://extensions
# 2. Entwicklermodus einschalten
# 3. "Erweiterung laden" → browser-extension/
```

## 📋 Features

### Phase 1-3: Foundation ✅

- ✅ Deno TypeScript Backend
- ✅ JWT Authentication
- ✅ Bookmarks CRUD
- ✅ Folder Hierarchy
- ✅ In-Memory Database

### Phase 4: AI Classification ✅

- ✅ HTML Metadata Extraction
- ✅ Pattern-based Classification (9 Kategorien)
- ✅ Auto-Tag Generation
- ✅ OpenAI/LLM API Support (optional)

### Phase 4.1: Chrome Extension Integration ✅

- ✅ Backend Classification Integration
- ✅ UI für Classification Results
- ✅ Bookmark Auto-Populate

### Phase 5: Prompt API Integration ✅

- ✅ Chrome Prompt API (Gemini Nano)
- ✅ Local On-Device Classification
- ✅ Privacy-First (keine externen API-Aufrufe)
- ✅ Fallback zu Backend Classification
- ✅ Intelligent Retry Mechanism

### Phase 5: Linting & Testing ✅

- ✅ Deno Unit Tests (23 Test Cases)
- ✅ Jest Extension Tests (12 Test Cases)
- ✅ ESLint Code Style
- ✅ Prettier Formatting
- ✅ GitHub Actions CI/CD

## 📚 Architecture

```
GMARK
├── deno/                          # TypeScript Backend
│   ├── src/
│   │   ├── main.ts               # HTTP Server & Router
│   │   ├── services/
│   │   │   ├── user.ts           # Authentication Logic
│   │   │   ├── bookmark.ts       # CRUD Operations
│   │   │   ├── html.ts           # Metadata Extraction
│   │   │   └── ai.ts             # Classification Pipeline
│   │   ├── controllers/
│   │   │   ├── user.ts           # HTTP Handlers
│   │   │   └── bookmark.ts       # HTTP Handlers
│   │   └── utils/
│   │       ├── db.ts             # In-Memory Database
│   │       ├── jwt.ts            # JWT Generation/Verification
│   │       └── password.ts       # SHA256+Salt Hashing
│   └── src/services/*.test.ts    # Unit Tests
│
├── browser-extension/             # Chrome Extension
│   ├── popup.js                  # UI Logic
│   ├── background.js             # Service Worker
│   ├── content.js                # Content Script
│   ├── manifest.json             # Extension Config
│   └── __tests__/                # Jest Tests
│
└── .github/workflows/
    └── test.yml                  # CI/CD Pipeline
```

## 🔄 Classification Flow

### 1. Chrome Prompt API (Priority)

```
User toggles AI Classify
↓
classifyPage() detects Prompt API
↓
Download Gemini Nano model (~100MB, einmalig)
↓
Local classification (200-800ms)
↓
Display results WITHOUT external API calls
```

### 2. Backend Fallback

```
Prompt API unavailable
↓
classifyWithBackend() sends URL to server
↓
Server fetches HTML metadata
↓
Pattern-based classification
↓
Return results
```

### 3. Ultimate Fallback

```
Network error
↓
Use pattern-matching offline
↓
Always works
```

## 🧪 Testing

### Backend Tests

```bash
cd deno

# Alle Tests
deno task test

# Einzelne Service
deno test --allow-net --allow-read --allow-write --allow-env src/services/user.test.ts

# Watch-Modus
deno task test:watch
```

**Test Coverage:**

- User Service: 7 Cases (Register, Login, Token, User Retrieval)
- HTML Service: 8 Cases (Title/Description/Keywords Extraction)
- AI Service: 8 Cases (Classification, Tag Generation)

### Extension Tests

```bash
cd browser-extension

# Jest Tests
npm test

# Coverage Report
npm run test:coverage

# Watch-Modus
npm test -- --watch
```

**Test Coverage:**

- Authentication Detection
- Prompt API Availability
- Classification Response Handling
- Bookmark Creation
- Error Handling

## 🔍 Code Quality

### Linting

```bash
# Backend
cd deno && deno task lint

# Extension
cd browser-extension && npm run lint
```

### Formatting

```bash
# Backend
cd deno && deno task format

# Extension
cd browser-extension && npm run format
```

### Type Checking

```bash
cd deno && deno task check
```

## 📡 API Endpoints

### Authentication

```
POST /api/users/register
POST /api/users/login
GET /api/users/me
```

### Bookmarks

```
POST /api/bookmarks              # Create (with autoClassify)
GET /api/bookmarks               # List all
GET /api/bookmarks/:id           # Get single
PUT /api/bookmarks/:id           # Update
DELETE /api/bookmarks/:id        # Delete
POST /api/bookmarks/classify     # Classify preview
```

### Folders

```
POST /api/folders
GET /api/folders
GET /api/folders/:id
PUT /api/folders/:id
DELETE /api/folders/:id
```

## 🌍 Environment Variables

```env
# Backend (.env)
PORT=8000
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=optional-for-llm
ANYTHINGLLM_ENDPOINT=http://localhost:3001/api/chat
PREFER_LOCAL_AI=true
```

## 📦 Classification Categories

```
1. Development      → Code, GitHub, APIs, Frameworks
2. Social           → Twitter, Facebook, LinkedIn
3. News             → Blogs, Articles, Journalism
4. Shopping         → E-commerce, Products
5. Education        → Courses, Universities
6. Entertainment    → Netflix, Movies, Games
7. Documentation    → Technical Docs, Manuals
8. Tools            → Converters, Generators
9. Other            → Misc content
```

## 🔐 Security

- ✅ **Password Hashing**: SHA256 + Random Salt (16 bytes)
- ✅ **JWT Tokens**: HS256 with 30-min expiration
- ✅ **Timing-Attack Safe**: Constant-time comparison
- ✅ **CORS**: Configured for Extension
- ✅ **CSP**: Manifest V3 compliant
- ✅ **On-Device LLM**: No external API keys in extension

## ⚙️ Setup für Entwicklung

### Voraussetzungen

- **Deno**: v1.40+
- **Node.js**: 18+ (für Extension Testing)
- **Chrome**: 131+ (für Prompt API)

### Installation

```bash
# 1. Repository clonen
git clone <repo-url>
cd gmark

# 2. Backend starten
cd deno
deno task dev

# 3. Extension installieren
# chrome://extensions → Load unpacked → browser-extension/

# 4. Tests laufen
cd ../deno && deno task test
cd ../browser-extension && npm install && npm test
```

### Chrome Prompt API aktivieren

```
1. chrome://flags/#prompt-api-for-gemini-nano
2. Auf "Enabled" setzen
3. chrome://restart
```

## 📊 Performance

### Backend

- Register/Login: ~50ms
- Bookmark Create: ~30ms
- Classification (Pattern): ~20ms
- HTML Extraction: ~800ms (netzwerk-abhängig)

### Extension

- First Classification (mit Download): 2-5 Sekunden
- Cached Classification: 200-800ms
- Backend Fallback: 1-2 Sekunden

### Testing

- All Backend Tests: ~2 Sekunden
- All Extension Tests: ~5 Sekunden
- Linting: ~3 Sekunden

## 🚢 CI/CD Pipeline

GitHub Actions automatisiert:

```yaml
On Push/PR: 1. Backend Linting
  2. Backend Tests
  3. Extension Linting
  4. Extension Tests
  5. Coverage Reports
```

Siehe: `.github/workflows/test.yml`

## 📖 Dokumentation

Alle Dokumentationen sind im [docs/](./docs/)-Verzeichnis organisiert:

- [docs/INDEX.md](./docs/INDEX.md) - Dokumentations-Übersicht
- [docs/TESTING.md](./docs/TESTING.md) - Testing Guide & Best Practices
- [docs/PROMPT_API.md](./docs/PROMPT_API.md) - Prompt API Setup
- [docs/README_DENO.md](./docs/README_DENO.md) - Deno Backend Details
- [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) - Implementierungsdetails
- [docs/EXTENSION_SUMMARY.md](./docs/EXTENSION_SUMMARY.md) - Extension-Zusammenfassung
- [docs/TASKFILE.md](./docs/TASKFILE.md) - Taskfile Quick Reference

## 🛣️ Roadmap

**✅ Completed:**

- Phase 1: Infrastructure
- Phase 2: Authentication
- Phase 3: CRUD Operations
- Phase 4: AI Classification
- Phase 4.1: Extension Integration
- Phase 4.2: Chrome Prompt API
- Phase 5: Testing & Linting

**📋 Planned:**

- [ ] Prisma + SQLite Database
- [ ] User Accounts Persistence
- [ ] Bookmark Sharing
- [ ] Cloud Sync
- [ ] Mobile App
- [ ] Advanced Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `deno task test` & `npm test`
4. Run linting: `deno task lint` & `npm run lint`
5. Submit a PR

## 📄 License

MIT License - See LICENSE file

## 🎯 Project Goals

- ✅ **Privacy-First**: Local LLM, no external API requirements
- ✅ **Fast**: 200-800ms classification after model cached
- ✅ **Simple**: No dependencies, plain Deno + TypeScript
- ✅ **Secure**: JWT auth, SHA256 hashing, CSP compliant
- ✅ **Tested**: Comprehensive test coverage
- ✅ **Maintainable**: Linting, formatting, documentation

## 📞 Support

Für Bugs und Fragen: GitHub Issues

---

**Built with ❤️ using Deno + Chrome Prompt API**

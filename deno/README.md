# GMARK Deno Migration

Deno + Prisma Backend für GMARK Browser Extension.

## Setup

```bash
# 1. Wechsle in deno/ Verzeichnis
cd deno

# 2. Starte mit deno.json dependencies
# Die deno.json definiert alle dependencies über Imports

# 3. Generiere Prisma Client
deno run -A npm:prisma generate

# 4. Migriere Datenbank (erstelle Tabellen)
deno run -A npm:prisma migrate dev --name init

# 5. Starte Dev Server
deno task dev
```

## Development

```bash
# Format Code
deno task format

# Lint Code
deno task lint

# Prisma Studio (GUI für Datenbank)
deno task prisma:studio

# Production Start
deno task start
```

## Architecture

```
src/
├── main.ts              # Entry point mit Hono Server
├── controllers/         # HTTP Route Handler
│   ├── user.ts         # Auth Endpoints (Phase 2 - AKTIV)
│   ├── bookmark.ts     # Bookmark CRUD (Phase 3)
│   └── folder.ts       # Folder CRUD (Phase 3)
├── services/           # Business Logic
│   ├── user.ts         # User Service mit JWT + Prisma (Phase 2 - AKTIV)
│   ├── bookmark.ts     # Bookmark Service (Phase 3)
│   └── folder.ts       # Folder Service (Phase 3)
└── utils/              # Shared Utilities
    ├── jwt.ts          # JWT Token Generation (DONE)
    ├── password.ts     # SHA256 Password Hashing (DONE)
    └── schemas.ts      # Zod Validation (DONE)

prisma/
└── schema.prisma       # Database Schema für SQLite (DONE)
```

## Migration Phases

- ✅ Phase 1: Infrastructure Setup (deno.json, Prisma, TypeScript config)
- 🔄 Phase 2: Auth Layer (UserService, JWT, Sessions) - IN PROGRESS
- ⏳ Phase 3: Bookmarks CRUD (2 weeks)
- ⏳ Phase 4: AI Classification (1-2 weeks)
- ⏳ Phase 5: Testing & Deployment (1-2 weeks)

## API Endpoints (Phase 2)

```
POST   /api/users/register      # Register new user
POST   /api/users/login         # Login + get token
GET    /api/users/me            # Get current user (auth required)
POST   /api/users/logout        # Logout
```

## Environment Variables

```env
DATABASE_URL="file:../gmark.db"
SECRET_KEY="your-secret-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=""
ANYTHINGLLM_ENDPOINT="http://localhost:3001/api/chat"
PREFER_LOCAL_AI=true
DENO_ENV="development"
```

## Browser Extension Integration

Die Deno API ist kompatibel mit bestehender Chrome Extension:

- Gleiche JWT Token Format
- Gleiche SQLite Datenbank Struktur
- Parallel Migration: FastAPI + Deno laufen zusammen während Umstellung

## Permissions

Deno führt mit diesen Permissions:

```
--allow-net      # HTTP Server
--allow-read     # Dateien lesen (.env, .db)
--allow-write    # Dateien schreiben (Prisma)
--allow-env      # Environment Variablen
```

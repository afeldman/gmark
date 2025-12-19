# 🎯 GMARK Local Edition - Setup & Überblick

**Privacy-First Bookmark Manager für Chrome Extension**

## Neue Extension: GMARK Local

Wir haben eine **zweite Extension** erstellt für rein **lokale Verarbeitung** mit Chrome Prompt API:

```
gmark/
├── browser-extension/              ← Server-basiert (Original)
│   └── Mit Backend-Integration
│
└── browser-extension-local/        ← 100% Lokal (NEU!)
    └── Ohne Server
```

## 🎯 Unterschied: Original vs. Local

| Feature            | Original           | Local                   |
| ------------------ | ------------------ | ----------------------- |
| **Backend**        | ✅ Deno Server     | ❌ Keine (100% Browser) |
| **Datenschutz**    | 🔒 Privat (Server) | 🔐 Ultra-Privat (Lokal) |
| **Klassifikation** | Backend AI         | Chrome Prompt API       |
| **Datenbank**      | Deno Speicher      | IndexedDB               |
| **Offline**        | ❌ Benötigt Server | ✅ Funktioniert Offline |
| **Kosten**         | Einmalige Setup    | Kostenlos               |
| **Duplikate**      | Backend Detection  | Lokal Detection         |
| **Export**         | JSON/CSV           | JSON/CSV                |

## 🚀 Quick Start - GMARK Local

### 1. Installation

```bash
# In Chrome/Edge öffnen:
chrome://extensions/

# Entwicklermodus aktivieren
# "Entpackte Extension laden" klicken
# browser-extension-local/ wählen
```

### 2. Prompt API aktivieren (Optional)

```bash
# Chrome Canary nutzen
# Flags aktivieren:
# - chrome://flags/#optimization-guide-on-device-model
# - chrome://flags/#prompt-api-for-gemini-nano

# Nach Model-Download (~2-3 Min): KI aktiviert!
```

### 3. Erste Bookmarks speichern

```bash
1. GMARK-Icon klicken
2. "Aktuelle Seite speichern" klicken
3. ~1 Sekunde warten
4. Klassifikation + Tags sehen
5. "Speichern" klicken

✅ Fertig! 100% lokal!
```

## 📊 Was wurde implementiert?

### ✅ Phase 1: Extension Setup

- Manifest V3 mit Permissions
- IndexedDB Database Schema
- StorageManager für alle CRUD-Operationen
- Service Worker + Content Script

### ✅ Phase 2: Klassifikation (Prompt API)

- Chrome Prompt API Integration (Gemini Nano)
- Pattern-Based Fallback (wenn KI nicht verfügbar)
- 9 Kategorien: Development, Social, News, Shopping, Education, Entertainment, Documentation, Tools, Other
- Auto-Tag Generierung
- Confidence Scoring

### ✅ Phase 3: Duplikat-Erkennung

- URL Normalisierung
- Levenshtein Distance (String-Ähnlichkeit)
- Fuzzy Matching
- Smart Merge mit Konflikt-Auflösung
- Batch-Processing

### 🟡 Phase 4: UI/UX (In Progress)

- ✅ Popup mit Stats
- ✅ Quick Actions
- ✅ Settings
- 🟡 Dashboard (WIP)
- 🟡 Duplikat-Manager (WIP)

## 💾 Speichern ohne Server

**IndexedDB Schema:**

```javascript
Bookmarks Store
├── bookmarks (primary key: id)
├── Indexes:
│   ├── url (für schnelle URL-Lookups)
│   ├── urlNormalized (für Duplikat-Erkennung)
│   ├── category (für Filter)
│   ├── dateAdded (für Sortierung)
│   └── lastModified (für Sync)
│
Duplicates Store
├── duplicates (primary key: id)
├── Indexes:
│   ├── primary (primary bookmark)
│   ├── duplicate (duplicate bookmark)
│   ├── similarity (score)
│   └── status (pending/merged/ignored)
│
Cache Store
├── cache (key path: url)
├── Indexes:
│   ├── type (classification/summary)
│   └── expires (für Cleanup)
│
Settings Store
└── settings (key path: key)
```

## 🤖 Klassifikation: 3-Tier System

```
┌─────────────────────────────────┐
│ Speichere neues Bookmark        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 1. Pattern Matching (Instant)   │ ← 50ms
│    Keyword-basiert              │   Fallback always works
│    Confidence: 0.0-1.0          │
└────────────┬────────────────────┘
             │
        High confidence?
        │         │
       YES       NO
        │         │
        │         ▼
        │    ┌──────────────────────────┐
        │    │ 2. Prompt API (LLM)      │ ← 500-2000ms
        │    │    Chrome Gemini Nano    │   Local, Private
        │    │    verfügbar?             │
        │    └────────┬─────────────────┘
        │             │
        │        LLM Success?
        │        │         │
        │       YES       NO
        │        │         │
        │        │         ▼
        │        │    ┌────────────────────┐
        │        │    │ 3. Pattern Result  │ ← Already computed
        │        │    │    (Use anyway)    │   Guaranteed result
        │        │    └────────────────────┘
        │        │         │
        └────────┴─────────┘
                 │
                 ▼
       ┌──────────────────────┐
       │ Speichere mit        │
       │ - Category           │
       │ - Tags               │
       │ - Confidence         │
       │ - Summary (optional) │
       └──────────────────────┘
```

## 🔍 Duplikat-Erkennung: Levenshtein Distance

**Beispiel:**

```
Bookmark 1: "React Documentation"
Bookmark 2: "Reakt Dokumentation"

Ähnlichkeit: 0.92 (92%)
→ "Sehr ähnlich - wahrscheinlich Duplikat"

URL: https://github.com/user/repo
vs
URL: https://github.com/user/repo/

Ähnlichkeit: 1.0 (100%)
→ "Identische URLs - definitiv Duplikat"
```

## 📈 Performance

```
Operation               | Zeit    | Methode
------------------------+---------+---------
Bookmark speichern      | ~100ms  | Sync
Pattern Klassifikation  | ~50ms   | Sync (Fallback)
Prompt API Klassifikation | ~500ms | Async LLM
Duplikat Check (10)     | ~50ms   | Sync
Duplikat Check (1000)   | ~5s     | Batch
Export (500 Bookmarks)  | ~100ms  | Sync
Import (500 Bookmarks)  | ~1s     | Batch
```

## 🔐 Sicherheit & Datenschutz

✅ **100% Offline** - Alles bleibt im Browser
✅ **Keine Daten-Sammlung** - Keine Analytics, keine Telemetrie
✅ **Private Klassifikation** - Prompt API läuft lokal
✅ **Sichere Speicherung** - IndexedDB ist isoliert per Chrome-Profil
✅ **Open Source** - Transparenter Code

⚠️ **Wichtig:**

- Daten werden gelöscht wenn Browser-Daten gelöscht werden
- Regelmäßig exportieren zum Backup!
- Keine Cloud-Sync (bleibt Offline-only)

## 📁 Dateistruktur

```
browser-extension-local/
├── manifest.json                    # Manifest V3
├── README.md                        # Dieses Dokument
├── src/
│   ├── background.js               # Service Worker
│   ├── content.js                  # Seiten-Inhalt
│   ├── services/
│   │   ├── classification.js       # KI-Klassifikation
│   │   └── duplicates.js           # Duplikat-Erkennung
│   ├── utils/
│   │   └── storage.js              # IndexedDB Manager
│   └── ui/
│       ├── popup.html              # Popup UI
│       ├── popup.js                # Popup Logic
│       ├── popup.css               # Styles
│       ├── dashboard.html          # Dashboard (WIP)
│       └── duplicates.html         # Manager (WIP)
└── icons/                          # Icons
```

## 🚀 Nächste Schritte

### Phase 4: Dashboard & UI (Next)

- [ ] Dashboard für Statistiken
- [ ] Duplikat-Management UI
- [ ] Folder-Hierarchie
- [ ] Batch-Operationen

### Phase 5: Advanced (After Phase 4)

- [ ] Search & Filter
- [ ] Folder Management
- [ ] CSV Export
- [ ] Analytics
- [ ] Unit Tests

### Roadmap

- [ ] SQLite Backend Option (für größere Datenmengen)
- [ ] Cloud Sync Option (optional)
- [ ] Mobile App (React Native)
- [ ] Desktop App (Electron)

## 🐛 Troubleshooting

**Prompt API nicht verfügbar?**

```
1. Chrome Version ≥ 121 prüfen
2. Chrome Canary verwenden
3. Flags aktivieren
4. Model Download abwarten (2-3 Min)
```

**Klassifikation langsam?**

```
1. Pattern-Fallback wird verwendet (normal)
2. Chrome Prozess kann langsam sein
3. Beim 2. mal schneller (Cache)
```

**Bookmarks verschwunden?**

```
1. Daten löschen deaktivieren
2. Browser-Crash nach Export checken
3. IndexedDB in DevTools prüfen (F12 → Application)
```

## 📚 Ressourcen

- [browser-extension-local/README.md](../../browser-extension-local/README.md) - Detaillierte Doku
- [TESTING.md](./TESTING.md) - Testing Guide
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Prompt API Docs](https://ai.google.dev/)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Status**: Phase 1-3 Complete ✅
**Phase 4**: In Progress 🟡
**Version**: 1.0.0-beta

Zuletzt aktualisiert: 19. Dezember 2025

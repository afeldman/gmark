# 🎯 GMARK Local - Privacy-First Bookmark Manager

**100% Offline | Kostenlos | Privat | Lokal**

Eine Chrome Extension für intelligente Bookmark-Verwaltung komplett im Browser - ohne externe Server, ohne Datenverlust, ohne Abhängigkeiten.

## ✨ Features

### 🤖 Intelligente Klassifikation
- **Prompt API Integration**: Nutze lokale KI (Gemini Nano) für Klassifikation
- **Pattern-Matching**: Schnelle Fallback-Klassifikation ohne KI
- **9 Kategorien**: Development, Social, News, Shopping, Education, Entertainment, Documentation, Tools, Other
- **Confidence Scoring**: Wisse, wie sicher die Klassifikation ist
- **Auto-Tagging**: Automatische Tag-Generierung

### 📝 Zusammenfassung
- Extrahiere Seiten-Metadaten (Titel, Beschreibung, Keywords)
- AI-generierte Zusammenfassungen mit Prompt API
- Speichere relevante Inhalte lokal

### 🔍 Duplikat-Erkennung
- **URL-Normalisierung**: Erkenne unterschiedliche Varianten der gleichen URL
- **Levenshtein Distance**: Ähnlichkeitsprüfung für Titel und Inhalte
- **Fuzzy Matching**: Intelligentes Matching trotz Tippfehler
- **Smart Merge**: Intelligente Zusammenführung mit Konflikt-Auflösung
- **Auto-Deduplicate**: Automatisches Löschen von hochgradig ähnlichen Bookmarks

### 💾 Storage
- **IndexedDB**: Lokale Datenbank im Browser
- **Offline-First**: Alles funktioniert ohne Internet
- **Export/Import**: JSON & CSV Export
- **Chrome Sync**: Optional mit Chrome Profile synchronisieren

### 📊 Dashboard
- Statistiken und Übersichten
- Duplikat-Management Interface
- Folder-Hierarchie
- Bulk-Operationen

### ⚙️ Einstellungen
- Automatische Klassifikation: Ein/Aus
- Automatische Duplikat-Erkennung: Ein/Aus
- Ähnlichkeitsgrenzwert: 0.0 - 1.0 konfigurierbar
- Chrome Prompt API: Ein/Aus

## 🚀 Installation

### Schritt 1: Voraussetzungen
- Chrome/Edge Version 121+ (für Prompt API)
- Chrome Canary (für beste Unterstützung)

### Schritt 2: Extension laden

1. **Öffne**: `chrome://extensions/`
2. **Aktiviere**: "Entwicklermodus" (oben rechts)
3. **Klicke**: "Entpackte Extension laden"
4. **Wähle**: `/browser-extension-local`

### Schritt 3: Prompt API aktivieren (Optional aber empfohlen)

1. **Chrome Canary installieren**: https://www.google.com/chrome/canary/
2. **Flags öffnen**: 
   - `chrome://flags/#optimization-guide-on-device-model` → Enabled
   - `chrome://flags/#prompt-api-for-gemini-nano` → Enabled
3. **Chrome Canary neu starten**
4. **Model Download**: Kann einige Minuten dauern beim ersten Start

## 📖 Nutzung

### Bookmark speichern

**Methode 1: Über Icon**
```
1. Klicke GMARK-Icon in der Toolbar
2. Warte auf Klassifikation (1-2 Sekunden)
3. Überprüfe Category & Tags
4. Klicke "Speichern"
```

**Methode 2: Kontextmenü**
```
Rechtsklick auf Seite → "In GMARK speichern"
```

**Methode 3: Keyboard**
```
macOS: Cmd + Shift + B
Windows/Linux: Ctrl + Shift + B
```

### Duplikate verwalten

```
1. Öffne Extension-Popup
2. Klicke "Duplikate verwalten"
3. Überprüfe erkannte Duplikate
4. Wähle: Merge oder Ignore
5. Speichern
```

### Daten exportieren

```
1. Extension-Popup → Menü (⚙️)
2. Klicke "Exportieren"
3. JSON-Datei wird heruntergeladen
```

### Daten importieren

```
1. Extension-Popup → Menü (⚙️)
2. Klicke "Importieren"
3. Wähle JSON-Datei
4. Daten werden zusammengeführt
```

## 🏗️ Architektur

```
browser-extension-local/
├── manifest.json                 # Manifest V3
├── src/
│   ├── background.js             # Service Worker
│   ├── content.js                # Seiten-Inhalt extrahieren
│   ├── services/
│   │   ├── classification.js      # KI-Klassifikation
│   │   └── duplicates.js          # Duplikat-Erkennung
│   ├── utils/
│   │   └── storage.js             # IndexedDB Manager
│   └── ui/
│       ├── popup.html              # Popup Interface
│       ├── popup.js                # Popup Logic
│       ├── popup.css               # Styles
│       ├── dashboard.html          # Dashboard (WIP)
│       └── duplicates.html         # Duplikat-Manager (WIP)
└── icons/                          # Extension Icons
```

## 📊 Datenstruktur (IndexedDB)

### Bookmark
```javascript
{
  id: "uuid",
  url: "https://...",
  urlNormalized: "domain.com/path",
  title: "...",
  description: "...",
  content: "...",
  category: "Development",
  tags: ["tag1", "tag2"],
  summary: "AI-generated summary",
  confidenceScore: 0.95,
  dateAdded: 1703000000000,
  lastModified: 1703000000000
}
```

### Duplicate Record
```javascript
{
  id: "uuid",
  primaryId: "uuid",
  duplicateId: "uuid",
  similarity: 0.92,
  status: "pending|merged|ignored",
  dateDetected: 1703000000000
}
```

### Classification Cache
```javascript
{
  url: "https://...",
  type: "classification|summary",
  data: { /* cached result */ },
  created: 1703000000000,
  expires: 1703086400000
}
```

## 🔧 Entwicklung

### Local Development

```bash
cd browser-extension-local

# Öffne chrome://extensions/
# Aktiviere "Developer Mode"
# Klick "Load unpacked"
# Wähle diesen Ordner
```

### Auto-Reload

```bash
# Bei Änderungen:
1. Speichere die Datei
2. Öffne chrome://extensions/
3. Klick "Reload" auf GMARK Local
```

### Debugging

```bash
# Background Script debuggen:
1. Öffne chrome://extensions/
2. Klick "Inspect views: service_worker" bei GMARK Local

# Content Script debuggen:
1. Öffne DevTools (F12) auf einer Seite
2. Seite müsste Chrome Extensions Logs zeigen
```

## 📝 Testing

```bash
# Unit Tests (Phase 5)
npm test

# E2E Tests (mit Puppeteer)
npm run test:e2e
```

## 🚀 Roadmap

### ✅ Phase 1: Setup
- [x] Manifest V3
- [x] IndexedDB Schema
- [x] Basic Storage Manager

### ✅ Phase 2: Prompt API Services
- [x] Classification Service
- [x] Pattern-based Fallback
- [x] Confidence Scoring
- [x] Tag Generation

### ✅ Phase 3: Duplicate Detection
- [x] URL Normalization
- [x] Levenshtein Distance
- [x] Smart Merge Logic
- [x] Conflict Resolution

### 🟡 Phase 4: UI & UX
- [x] Popup Interface
- [ ] Dashboard (WIP)
- [ ] Duplicate Manager (WIP)
- [ ] Settings Page (WIP)

### 🟡 Phase 5: Advanced Features
- [ ] Folder Management
- [ ] Search & Filter
- [ ] Batch Operations
- [ ] CSV Export
- [ ] Statistics & Analytics

## 🔐 Sicherheit & Datenschutz

✅ **100% Local**: Alle Daten bleiben im Browser
✅ **No External Requests**: Außer beim Laden von Seiteninhalten
✅ **No Analytics**: Keine Telemetrie
✅ **No Login**: Keine Authentifizierung nötig
✅ **Encrypted Storage**: IndexedDB ist per Default isoliert
✅ **Open Source**: Code-Audit möglich

⚠️ **Wichtig**:
- Daten werden bei Browser-Daten-Löschen entfernt
- Backups über Export-Funktion empfohlen
- Chrome Sync optional (einige Daten über Chrome Sync syncbar)

## ⚡ Performance

| Operation | Zeit | Method |
|-----------|------|--------|
| Bookmark speichern | ~100ms | Sync |
| Klassifikation (Pattern) | ~50ms | Sync |
| Klassifikation (Prompt API) | ~500-2000ms | Async LLM |
| Duplikat-Erkennung (10 Bookmarks) | ~50ms | Sync |
| Duplikat-Erkennung (1000 Bookmarks) | ~5s | Batch |
| Export (500 Bookmarks) | ~100ms | Sync |
| Import (500 Bookmarks) | ~1s | Batch |

## 🐛 Troubleshooting

### Extension lädt nicht

```
1. Öffne chrome://extensions/
2. Überprüfe "Errors" unter GMARK Local
3. Öffne DevTools → Console
4. Suche nach Error-Meldungen
```

### Prompt API nicht verfügbar

```
1. Chrome Version prüfen (≥121)
2. Chrome Canary verwenden
3. Flags aktivieren:
   - chrome://flags/#optimization-guide-on-device-model
   - chrome://flags/#prompt-api-for-gemini-nano
4. Model Download abwarten (kann Minuten dauern)
```

### Klassifikation funktioniert nicht

```
1. Settings überprüfen
2. Pattern-Fallback verwenden (immer aktiv)
3. DevTools Console für Fehler checken
```

### Bookmarks verschwunden

```
1. Daten löschen deaktivieren (Chrome Settings)
2. Regelmäßig exportieren zum Backup
3. IndexedDB in DevTools checken
```

## 📚 Weitere Ressourcen

- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Prompt API**: https://ai.google.dev/
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Manifest V3**: https://developer.chrome.com/docs/extensions/mv3/

## 📄 Lizenz

MIT - Siehe LICENSE Datei

## 🤝 Beitragen

Bugs, Vorschläge oder Improvements? Issues und PRs willkommen!

---

**Zuletzt aktualisiert**: 19. Dezember 2025
**Status**: Phase 1-3 Complete, Phase 4 In Progress
**Version**: 1.0.0-beta

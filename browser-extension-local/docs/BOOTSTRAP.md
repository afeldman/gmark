# Bootstrap Service - Bookmark Migration

Der Bootstrap-Service migriert automatisch alle bestehenden Chrome Bookmarks in GMARK Local beim ersten Start.

## Prozess

### 1. **Automatisches Starten**
- Bei Installation der Extension wird Bootstrap automatisch gestartet
- Kann auch manuell aus der Popup-UI gestartet werden

### 2. **Schritte**

```
┌─────────────────────────────────────┐
│ 1. Chrome Bookmarks auslesen        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 2. Für jedes Bookmark:              │
│    - Klassifizierung                │
│    - Duplikat-Check                 │
│    - In IndexedDB speichern         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 3. Chrome Bookmarks reorganisieren: │
│    - GMARK Local Ordner erstellen   │
│    - Kategorien-Unterordner         │
│    - Bookmarks verschieben          │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 4. Bootstrap-Flag setzen            │
│    (nicht nochmal ausführen)        │
└─────────────────────────────────────┘
```

## Features

### ✅ Was wird migriert
- ✅ Alle Chrome Bookmarks (außer Ordnern)
- ✅ Titel & URL
- ✅ Automatische Klassifikation
- ✅ Duplikat-Erkennung
- ✅ Tag-Generierung

### 🚫 Was wird NICHT migriert
- ❌ Bookmark-Ordner-Struktur (wird neu erstellt)
- ❌ Bereits in GMARK vorhandene Bookmarks (Duplikat-Check)
- ❌ Chrome Sync-Status

### 📊 Progress-Tracking
Während Bootstrap läuft:
- Live-Progress in der Popup-UI
- Statistiken (✅ Erfolgreich, ❌ Fehler, ⏭️ Übersprungen)
- Prozentuale Fortschritt

## Chrome Bookmark-Struktur nach Bootstrap

```
Bookmarks Bar
├── GMARK Local
│   ├── Development
│   │   ├── GitHub...
│   │   └── StackOverflow...
│   ├── Social
│   │   ├── Twitter...
│   │   └── LinkedIn...
│   ├── News
│   ├── Shopping
│   ├── Education
│   ├── Entertainment
│   ├── Documentation
│   ├── Tools
│   └── Other
└── (andere bestehende Ordner bleiben unverändert)
```

## API

### `BootstrapService.runBootstrap(onProgress)`

```javascript
// Starte Bootstrap mit Progress-Callback
const result = await chrome.runtime.sendMessage({
  type: "START_BOOTSTRAP"
});

// Progress-Callback (wird automatisch aufgerufen)
onProgress({
  processed: 42,           // Verarbeitete Bookmarks
  total: 100,              // Gesamt Bookmarks
  success: 40,             // Erfolgreich gespeichert
  failed: 1,               // Fehler
  skipped: 1,              // Übersprungen (Duplikate)
  percentage: 42           // 0-100
})
```

### `BootstrapService.getBootstrapStatus()`

```javascript
const status = await chrome.runtime.sendMessage({
  type: "GET_BOOTSTRAP_STATUS"
});

// Status
{
  complete: true,
  date: "2025-12-19T12:00:00.000Z",
  lastRun: Date object
}
```

### `BootstrapService.resetBootstrap()`

Setzt Bootstrap-Flag zurück (nur zum Testen):

```javascript
await chrome.runtime.sendMessage({
  type: "RESET_BOOTSTRAP"
});
```

## Fehlerbehandlung

Bootstrap ist fehlertolerant:
- ✅ Fehler bei einzelnen Bookmarks werden gefangen
- ✅ Fortsetzung mit nächsten Bookmark
- ✅ Fehlerstatistiken werden getracked
- ✅ Duplikate werden übersprungen (nicht als Fehler)

## Klassifikation während Bootstrap

Bootstrap nutzt ClassificationService mit:
1. **Pattern Matching** (schnell, offline)
2. **Chrome Prompt API** (falls verfügbar)
3. **Fallback** auf "Other" (immer funktioniert)

## Performance

- Rate Limiting: 100ms pro Bookmark (verhindert Überlastung)
- Durchschnitt: ~1000-2000 Bookmarks pro Minute
- IndexedDB Batch-Operationen
- Chrome Bookmarks API Async

## Logs

Alle Bootstrap-Aktivitäten werden in der Browser-Console geloggt:

```
🚀 Bootstrap startet...
📖 Lese Chrome Bookmarks...
📊 150 Bookmarks zum Klassifizieren
✅ [1/150] GitHub - Tipps → Development
✅ [2/150] Twitter - News Feed → Social
...
✅ Bootstrap abgeschlossen!
   Erfolg: 145
   Fehler: 2
   Übersprungen: 3
```

## Häufige Fragen

### F: Werden meine originalen Chrome Bookmarks gelöscht?
**A:** Nein! Chrome Bookmarks werden in den "GMARK Local" Ordner verschoben, aber nicht gelöscht.

### F: Kann ich Bootstrap rückgängig machen?
**A:** Die lokal gespeicherten Bookmarks können gelöscht werden. Chrome Bookmarks können manuell aus "GMARK Local" zurück an den ursprünglichen Platz verschoben werden.

### F: Wie lange dauert Bootstrap?
**A:** Bei 1000 Bookmarks ~5-10 Minuten (mit Classification).

### F: Was wenn die Extension während Bootstrap abstürzt?
**A:** Beim nächsten Start wird Bootstrap fortgesetzt (nur noch nicht verarbeitete Bookmarks).

---

**Status**: ✅ Implementiert und getestet

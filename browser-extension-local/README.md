# GMarks Browser Extension

<div align="center">
  
  **🚀 Intelligent Bookmark Manager Chrome Extension**
  
  AI-powered bookmark classification with Chrome Prompt API and Cloud Providers
  
</div>

---

## 📦 Quick Start

### Installation

1. **Lade die Extension in Chrome**
   ```bash
   # Öffne Chrome
   chrome://extensions/
   
   # Aktiviere "Entwicklermodus" (oben rechts)
   # Klicke "Entpackte Erweiterung laden"
   # Wähle diesen Ordner: browser-extension-local/
   ```

2. **Extension wird aktiviert** ✅
   - Icon erscheint in der Toolbar
   - Service Worker startet
   - Kategorien werden initialisiert

3. **Erste Schritte**
   - Klicke auf Extension-Icon → Popup öffnet sich
   - Klicke "Einstellungen" → Wähle AI Provider
   - Optional: API-Key für Cloud Provider eingeben

## 🏗️ Architektur

### Dateistruktur

```
browser-extension-local/
│
├── manifest.json              # Extension Manifest (Version 3)
├── icons/                     # Extension Icons (16, 32, 48, 128)
│
├── src/
│   ├── background.js          # Service Worker (Hauptlogik)
│   ├── content.js             # Content Script (DOM-Zugriff)
│   │
│   ├── services/              # Core Services
│   │   ├── classification.js  # AI Klassifikation & Pattern Matching
│   │   ├── bootstrap.js       # Batch Processing System
│   │   └── ai-provider.js     # Cloud AI Provider Integration
│   │
│   ├── ui/                    # User Interface
│   │   ├── popup.html/js/css  # Extension Popup (Dark Theme)
│   │   ├── dashboard.html     # Vollbild Dashboard
│   │   ├── options.html/js    # Einstellungen
│   │   └── duplicates.html    # Duplikatverwaltung
│   │
│   ├── utils/                 # Utilities
│   │   ├── storage.js         # IndexedDB Manager
│   │   ├── simple-charts.js   # Canvas-basierte Charts (Manifest V3)
│   │   ├── logger.js          # Debug Logging
│   │   └── usage.js           # Token Usage Tracking
│   │
│   ├── types/                 # Type Definitions
│   │   └── ai.js              # Chrome Prompt API Types
│   │
│   └── config/                # Konfiguration
│       └── categories.yml     # (Optional) Kategorie-Definitionen
│
└── README.md                  # Diese Datei
```

### Komponenten-Übersicht

#### 🔧 Core Services

**classification.js** - Hauptklassifikationslogik
```javascript
ClassificationService
├── initialize()               // Init: Kategorien laden, Prompt API check
├── classifyByPatterns()       // Pattern-basierte Klassifikation
├── classifyWithPromptAPI()    // Chrome Prompt API Klassifikation
├── ensureCategoryFolders()    // Kategorie-Ordner Setup
└── classifyBatch()            // Batch-Processing
```

**bootstrap.js** - Batch-Verarbeitung bestehender Bookmarks
```javascript
BootstrapService
├── startBootstrap()           // Bootstrap-Prozess starten
├── resumeBootstrap()          // Unterbrochenen Bootstrap fortsetzen
├── processBookmark()          // Einzelnes Bookmark verarbeiten
└── createTeamsMarkdown()      // Teams-Export generieren
```

**ai-provider.js** - Cloud AI Provider Management
```javascript
AIProviderSingleton
├── classifyWithProvider()     // Provider-Dispatcher
├── checkOpenAIAvailability()  // OpenAI Health Check
├── checkDeepSeekAvailability()// DeepSeek Health Check
└── classifyWithOllama()       // Lokale Ollama Integration
```

#### 💾 Storage Layer

**storage.js** - IndexedDB Manager
```javascript
StorageManager
├── initDB()                   // Datenbank initialisieren
├── addBookmark()              // Bookmark hinzufügen
├── getAllBookmarks()          // Alle Bookmarks abrufen
├── updateBookmark()           // Bookmark aktualisieren
├── deleteBookmark()           // Bookmark löschen
└── getStatistics()            // Statistiken berechnen
```

**Datenbank Schema:**
```javascript
// IndexedDB Store: "bookmarks"
{
  id: string,              // UUID
  url: string,             // Bookmark URL
  title: string,           // Titel
  category: string,        // AI-Kategorie (9 Kategorien)
  confidence: number,      // Klassifikations-Confidence (0-1)
  tags: string[],          // Auto-generierte Tags
  summary: string,         // AI-generierte Zusammenfassung
  content: string,         // HTML Body Content (erste 2000 Zeichen)
  color: string,           // Kategoriefarbe (hex)
  method: string,          // "patterns" | "prompt-api" | "cloud-ai"
  createdAt: number,       // Timestamp
  updatedAt: number        // Timestamp
}
```

#### 🎨 UI Components

**popup.js** - Extension Popup
```javascript
PopupApp
├── init()                     // Initialisierung
├── loadData()                 // Daten laden
├── initCharts()               // SimpleChart initialisieren
├── prepareActivityData()      // 7-Tage Aktivität
├── prepareCategoryData()      // Top 5 Kategorien
└── updateStats()              // Live-Updates (30s interval)
```

**SimpleChart** - Custom Canvas Charts (Manifest V3 kompatibel)
```javascript
SimpleChart
├── constructor(canvas, type, config)
├── renderLineChart()          // Aktivitäts-Chart
├── renderDoughnutChart()      // Kategorien-Chart
└── update(newConfig)          // Chart aktualisieren
```

## 🤖 AI Integration

### Chrome Prompt API (Lokal)

**Setup:**
```javascript
// In types/ai.js
export async function createLanguageModelSession(options) {
  const capabilities = await ai.languageModel.capabilities();
  if (capabilities.available === "readily") {
    return await ai.languageModel.create(options);
  }
  throw new Error("Prompt API not available");
}
```

**Klassifikation:**
```javascript
// HTML Body Content wird übergeben (erste 2000 Zeichen)
const bodyContent = bookmark.content?.substring(0, 2000);
const prompt = `
Du bist ein Bookmark-Klassifizierer...
Titel: ${bookmark.title}
URL: ${bookmark.url}
Seiten-Inhalt: ${bodyContent}

Kategorien: Development, Social, News, Shopping, Education,
            Entertainment, Documentation, Tools, Other
`;

const result = await classifyWithAI(session, prompt);
// Returns: { category, confidence, tags, summary }
```

### Cloud Providers

**Provider Konfiguration:**
```javascript
// In ai-provider.js
const PROVIDERS = {
  openai: { 
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini"
  },
  deepseek: { 
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat"
  },
  gemini: { 
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-1.5-flash"
  },
  mistral: { 
    baseURL: "https://api.mistral.ai/v1",
    model: "mistral-small-latest"
  },
  llama: { 
    baseURL: "https://api.together.xyz/v1",
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
  },
  ollama: { 
    baseURL: "http://localhost:11434",
    model: "llama3.2"
  },
  lmstudio: { 
    baseURL: "http://localhost:1234/v1",
    model: "local-model"
  }
};
```

**Health Check mit Timeout:**
```javascript
async function checkProviderAvailability(provider) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s
  
  try {
    const response = await fetch(provider.baseURL, {
      signal: controller.signal
    });
    return response.ok;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
```

## 📊 Kategorien System

### Standard-Kategorien

```javascript
const CATEGORIES = {
  Development: {
    patterns: ["github", "stackoverflow", "npm", "code", "programming"],
    color: "#4f46e5"  // Indigo
  },
  Social: {
    patterns: ["twitter", "facebook", "instagram", "linkedin", "reddit"],
    color: "#ec4899"  // Pink
  },
  News: {
    patterns: ["news", "article", "blog", "post"],
    color: "#f59e0b"  // Amber
  },
  Shopping: {
    patterns: ["amazon", "shop", "buy", "cart"],
    color: "#10b981"  // Emerald
  },
  Education: {
    patterns: ["coursera", "udemy", "learn", "course", "tutorial"],
    color: "#8b5cf6"  // Violet
  },
  Entertainment: {
    patterns: ["netflix", "youtube", "spotify", "game", "movie"],
    color: "#f43f5e"  // Rose
  },
  Documentation: {
    patterns: ["docs", "documentation", "guide", "manual"],
    color: "#06b6d4"  // Cyan
  },
  Tools: {
    patterns: ["tool", "utility", "converter", "editor"],
    color: "#64748b"  // Slate
  },
  Other: {
    patterns: ["online", "free"],
    color: "#6b7280"  // Gray
  }
};
```

### Kategorie-Ordner Auto-Setup

```javascript
// In classification.js - initialize()
async ensureCategoryFolders() {
  const categories = Object.keys(CATEGORIES);
  
  for (const category of categories) {
    const folderKey = `category_folder_${category}`;
    const folderExists = await chrome.storage.local.get(folderKey);
    
    if (!folderExists[folderKey]) {
      await chrome.storage.local.set({
        [folderKey]: {
          name: category,
          created: new Date().toISOString(),
          bookmarks: 0
        }
      });
    }
  }
}
```

## 🔄 Message Passing

### Background ↔ Content Communication

**Content Script sendet DOM-Daten:**
```javascript
// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTENT") {
    const pageData = {
      content: document.body.innerText.substring(0, 2000),
      description: document.querySelector('meta[name="description"]')?.content,
      title: document.title
    };
    sendResponse(pageData);
  }
  return true; // Async response
});
```

**Background empfängt und verarbeitet:**
```javascript
// background.js
async function saveBookmark(url, title, tabId) {
  const response = await chrome.tabs.sendMessage(tabId, {
    type: "GET_PAGE_CONTENT"
  });
  
  const classification = await ClassificationService.classify({
    title: title,
    url: url,
    content: response.content,
    description: response.description
  });
  
  await StorageManager.addBookmark({
    url, title,
    category: classification.category,
    confidence: classification.confidence,
    tags: classification.tags,
    content: response.content
  });
}
```

## 🎨 UI Features

### Dark Theme

**CSS Variables:**
```css
:root {
  --bg-primary: #0f172a;      /* Slate 900 */
  --bg-secondary: #1e293b;    /* Slate 800 */
  --text-primary: #f1f5f9;    /* Slate 100 */
  --text-secondary: #94a3b8;  /* Slate 400 */
  --accent-primary: #6366f1;  /* Indigo 500 */
  --accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Live Charts (SimpleChart)

**Activity Chart (7 Tage):**
```javascript
const activityData = prepareActivityData(bookmarks);
// Returns: [{ label: "Mo", value: 5 }, { label: "Di", value: 8 }, ...]

const chart = new SimpleChart(canvas, "line", {
  labels: activityData.map(d => d.label),
  values: activityData.map(d => d.value)
});
```

**Category Chart (Top 5):**
```javascript
const categoryData = prepareCategoryData(stats);
// Returns: { labels: ["Development", "News", ...], values: [42, 28, ...] }

const chart = new SimpleChart(canvas, "doughnut", {
  labels: categoryData.labels,
  values: categoryData.values,
  colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
});
```

## 🔧 Entwicklung

### Debugging

**Service Worker Console:**
```bash
chrome://extensions → GMarks → "Background Service Worker" → Inspect
```

**Logger aktivieren:**
```javascript
// In background.js oder jeder anderen Datei
import logger from "./utils/logger.js";

logger.setLevel('debug');  // 'debug' | 'log' | 'warn' | 'error'
logger.log("Debug message", { data: "..." });
```

**IndexedDB inspizieren:**
```bash
Chrome DevTools → Application → Storage → IndexedDB → GMarksDB
```

### Performance Monitoring

**Token Usage Tracking:**
```javascript
// In utils/usage.js
class UsageManager {
  static async consume(tokens) {
    const today = new Date().toISOString().split('T')[0];
    const usage = await this.getUsage(today);
    
    usage.tokens += tokens;
    usage.requests += 1;
    
    await chrome.storage.local.set({ [`usage_${today}`]: usage });
  }
  
  static async canConsume(tokens) {
    const dailyLimit = 50000; // 50k tokens/day
    const usage = await this.getTodayUsage();
    return (usage.tokens + tokens) <= dailyLimit;
  }
}
```

### Testing

**Manuelle Tests:**
```bash
1. Bookmark speichern
   - Klicke Extension Icon
   - "Aktuelle Seite speichern"
   - Prüfe Kategorie & Confidence

2. Dashboard testen
   - Öffne Dashboard
   - Prüfe Charts rendering
   - Teste Suche & Filter

3. Bootstrap testen
   - Einstellungen → "Bootstrap starten"
   - Prüfe Progress
   - Validiere Klassifikationen

4. Provider testen
   - Wechsle zwischen Providern
   - Prüfe API-Verbindung
   - Teste Fehlerbehandlung
```

## 🚀 Features

### Bootstrap System

**Concurrency Protection:**
```javascript
// In bootstrap.js
let isRunning = false;

async function startBootstrap() {
  if (isRunning) {
    throw new Error("Bootstrap already running");
  }
  
  isRunning = true;
  await chrome.storage.local.set({ bootstrapRunning: true });
  
  try {
    // Process bookmarks...
  } finally {
    isRunning = false;
    await chrome.storage.local.set({ bootstrapRunning: false });
  }
}
```

**Resume Capability:**
```javascript
async function resumeBootstrap() {
  const state = await chrome.storage.local.get('bootstrapState');
  
  if (state.lastProcessedIndex) {
    logger.log(`Resume from index ${state.lastProcessedIndex}`);
    // Continue from last position...
  }
}
```

### Pattern-Based Confidence

**Confidence Berechnung (5 Dezimalstellen):**
```javascript
function formatConfidence(value) {
  const num = parseFloat(value) || 0.0;
  return Math.round(num * 100000) / 100000;
}

// Pattern Matching Score
const maxScore = Math.max(...Object.values(scores), 1.0);
const rawConfidence = Math.min(bestCategory[1] / maxScore, 1.0);
const confidence = formatConfidence(rawConfidence);
// Result: 0.85432 (statt 0.9 oder 0.85)
```

## 📋 Manifest V3

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "GMarks",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "bookmarks",
    "tabs",
    "activeTab",
    "scripting"
  ],
  "background": {
    "service_worker": "src/background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["src/content.js"]
  }],
  "action": {
    "default_popup": "src/ui/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  }
}
```

## 🔒 Security

**Content Security Policy:**
- ✅ No external scripts (Manifest V3)
- ✅ No eval() or inline scripts
- ✅ Canvas-basierte Charts (kein CDN)
- ✅ HTTPS-only API calls
- ✅ Encrypted IndexedDB

**Privacy:**
- ✅ Lokale Chrome Prompt API (on-device)
- ✅ Opt-in Cloud Provider
- ✅ Keine Telemetrie
- ✅ Keine Tracker

## 📈 Roadmap

- [ ] Import/Export (JSON, HTML, Markdown)
- [ ] Volltext-Suche in Content
- [ ] Kategorien-Management UI
- [ ] Tag-Editor
- [ ] Bookmark-Notizen
- [ ] Browser-Sync
- [ ] Dark/Light Theme Toggle

## 🐛 Known Issues

- Chrome Prompt API erfordert Chrome 130+
- Ollama/LM Studio nur mit lokalem Server
- Bootstrap kann bei 10.000+ Bookmarks langsam sein

## 📞 Support

Bei Problemen:
1. Console-Logs prüfen (`chrome://extensions`)
2. IndexedDB validieren (`DevTools → Application`)
3. Provider-Status testen (Einstellungen)
4. Issue erstellen auf GitHub

---

**Made with ❤️ and 🤖**

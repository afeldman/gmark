# Chrome Prompt API Type Safety

## 📋 Übersicht

Diese Dokumentation beschreibt, wie wir die **Chrome Prompt API** mit **vollständiger Type-Safety** nutzen, dank `@types/dom-chromium-ai`.

## 🔧 Setup

### 1. Dependencies installieren

```bash
cd browser-extension-local
npm install
```

### 2. Typen verfügbar

```json
{
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "@types/dom-chromium-ai": "^1.0.0",
    "typescript": "^5.3.3"
  }
}
```

## 📝 Type Definitionen

### Global Namespace

```typescript
// Automatisch verfügbar in allen Dateien
declare global {
  interface Window {
    ai?: AI;
  }

  interface AI {
    languageModel?: LanguageModelAPI;
  }

  interface LanguageModelAPI {
    canCreateTextSession?(): Promise<"readily" | "after-download" | "no">;
    create?(
      options?: LanguageModelCreateOptions
    ): Promise<LanguageModelSession>;
  }

  interface LanguageModelSession {
    prompt(message: string): Promise<string>;
    promptStreaming(message: string): AsyncIterable<string>;
    destroy(): void;
  }
}
```

## 🛡️ Type-Safe Helper Functions

### 1. Check Availability

```typescript
import { checkCanCreateSession } from "../types/ai.d.ts";

// Mit Status-Callback
const available = await checkCanCreateSession((status) => {
  if (status === "readily") {
    console.log("✅ Ready to use");
  } else if (status === "after-download") {
    console.log("⏳ Downloading model...");
  } else {
    console.log("❌ Not available");
  }
});
```

### 2. Create Session

```typescript
import { createLanguageModelSession } from "../types/ai.d.ts";

const session = await createLanguageModelSession({
  signal: AbortSignal.timeout(60000), // 60-second timeout
});

if (!session) {
  console.error("Failed to create session");
}
```

### 3. Classify with AI

```typescript
import { classifyWithAI } from "../types/ai.d.ts";

const prompt = "Classify this bookmark...";
const result = await classifyWithAI(session, prompt);

// Result ist Type-safe:
// {
//   category: string,
//   confidence: number,
//   tags: string[],
//   summary: string
// }
```

### 4. Safe Cleanup

```typescript
import { safeDestroySession } from "../types/ai.d.ts";

// Sicheres Aufräumen (keine Fehler wenn null)
safeDestroySession(session);
```

## 🎯 Verwendungsbeispiel

```typescript
import {
  checkCanCreateSession,
  createLanguageModelSession,
  classifyWithAI,
  safeDestroySession,
} from "../types/ai.d.ts";

class ClassificationService {
  async classify(bookmark) {
    // 1. Check Verfügbarkeit
    const available = await checkCanCreateSession();
    if (!available) {
      throw new Error("Prompt API not available");
    }

    // 2. Session erstellen
    let session = null;
    try {
      session = await createLanguageModelSession({
        signal: AbortSignal.timeout(60000),
      });

      if (!session) {
        throw new Error("Failed to create session");
      }

      // 3. Klassifizieren
      const prompt = `Classify: ${bookmark.title}`;
      const result = await classifyWithAI(session, prompt);

      // Result ist Type-safe!
      return {
        category: result.category,
        confidence: result.confidence,
        tags: result.tags,
        summary: result.summary,
      };
    } finally {
      // 4. Cleanup
      safeDestroySession(session);
    }
  }
}
```

## ✅ Type-Safety Vorteile

✅ **Autocomplete**: IDE zeigt alle verfügbaren Properties
✅ **Error Detection**: Fehlerhafte Property-Namen werden erkannt
✅ **Type Checking**: `npm run type-check` validiert alles
✅ **Documentation**: Type-Definitionen sind selbstdokumentierend
✅ **Refactoring**: Sichere Änderungen dank Type-System

## 🔍 TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "types": ["chrome", "@types/dom-chromium-ai"]
  }
}
```

## 📚 Verfügbare Status

```typescript
type SessionStatus = "readily" | "after-download" | "no";

// readily: Model ist geladen und kann sofort verwendet werden
// after-download: Model wird gerade heruntergeladen (kann 2-3 Minuten dauern)
// no: Nicht verfügbar (Chrome Version zu alt, oder Flags nicht aktiviert)
```

## ⏱️ Timeout Handling

```typescript
// Mit 60-Sekunden Timeout
const session = await createLanguageModelSession({
  signal: AbortSignal.timeout(60000), // 60 Sekunden
});

// Wenn Prompt länger dauert → AbortError geworfen
try {
  const result = await classifyWithAI(session, prompt);
} catch (error) {
  if (error.name === "AbortError") {
    console.error("Classification timed out");
  }
}
```

## 🚨 Error Handling

```typescript
try {
  const session = await createLanguageModelSession();

  if (!session) {
    throw new Error("Session creation failed");
  }

  const result = await classifyWithAI(session, prompt);

  if (!result) {
    throw new Error("Classification failed");
  }
} catch (error) {
  console.error("Error:", error.message);
} finally {
  safeDestroySession(session); // Immer aufräumen!
}
```

## 🔗 Ressourcen

- [Chrome Prompt API Docs](https://developer.chrome.com/docs/ai/prompt-api)
- [@types/dom-chromium-ai](https://www.npmjs.com/package/@types/dom-chromium-ai)
- [Chrome AI Types GitHub](https://github.com/GoogleChromeLabs/chrome-ai-types)

## 💡 Best Practices

1. ✅ Immer `checkCanCreateSession()` vor Nutzung aufrufen
2. ✅ Session in `finally` Block mit `safeDestroySession()` aufräumen
3. ✅ Timeout setzen (60-120 Sekunden empfohlen)
4. ✅ Error Handling implementieren
5. ✅ Fallback zu Pattern-Matching haben
6. ✅ `npm run type-check` vor jedem Commit
7. ✅ TypeScript `strict` Mode aktiviert halten

## 🧪 Testing

```bash
# Type-Check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

---

**Zuletzt aktualisiert:** 19. Dezember 2025
**Version:** 1.0.0-beta

# Testing & Linting Guide

## Backend Testing (Deno)

### Tests laufen

```bash
# Alle Tests
deno task test

# Watch-Modus (automatische Neuladung)
deno task test:watch

# Spezifische Test-Datei
deno test --allow-net --allow-read --allow-write --allow-env src/services/user.test.ts

# Mit Decoding für bessere Output
deno test --allow-net --allow-read --allow-write --allow-env -- --reporter=pretty
```

### Test-Coverage

```bash
# Test mit Coverage-Report
deno test --allow-net --allow-read --allow-write --allow-env --coverage=./coverage

# HTML-Report generieren
deno coverage ./coverage --lcov --output=coverage.lcov
```

### Verfügbare Backend Tests

#### 1. User Service Tests (`src/services/user.test.ts`)

- ✅ User Registration
- ✅ Login Success/Failure
- ✅ User Retrieval
- ✅ Token Validation
- ✅ Duplicate Username Prevention

```bash
deno test --allow-net --allow-read --allow-write --allow-env src/services/user.test.ts
```

#### 2. HTML Service Tests (`src/services/html.test.ts`)

- ✅ Title Extraction (multiple strategies)
- ✅ Description Extraction
- ✅ Keywords Extraction
- ✅ HTML Entity Decoding

```bash
deno test --allow-net --allow-read --allow-write --allow-env src/services/html.test.ts
```

#### 3. AI Service Tests (`src/services/ai.test.ts`)

- ✅ Pattern-based Classification
- ✅ Category Detection (Development, Social, News, etc.)
- ✅ Tag Generation
- ✅ Classification Pipeline

```bash
deno test --allow-net --allow-read --allow-write --allow-env src/services/ai.test.ts
```

## Backend Linting & Formatting

### Code formatieren

```bash
# Automatic formatting
deno task format

# Check formatting (no changes)
deno task format:check

# Lint code
deno task lint

# Type checking
deno task check
```

### Lint Rules

Deno verwendet Standard-Lint-Rules:

- Keine ungenutzten Variablen
- Konsistente Formatierung
- Sicherheits-Warnungen
- Best Practice-Checks

## Browser Extension Testing

### Jest Setup

```bash
# Install Jest
npm install --save-dev jest

# Tests laufen
npm test

# Watch-Modus
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Verfügbare Extension Tests

#### Popup Tests (`__tests__/popup.test.js`)

- ✅ Authentication Detection
- ✅ Prompt API Availability
- ✅ Classification Response Handling
- ✅ Bookmark Data Creation
- ✅ Backend Communication
- ✅ Error Handling & Fallbacks

```bash
npm test -- __tests__/popup.test.js
```

## ESLint für Extension

### Linting

```bash
# Install ESLint (optional)
npm install --save-dev eslint

# Lint files
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Code Style

- Indentation: 2 spaces
- Semicolons: Required
- Quotes: Double quotes
- Max line length: implicit

## CI/CD Integration (GitHub Actions)

Erstelle `.github/workflows/test.yml`:

```yaml
name: Test & Lint

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno task lint
      - run: deno task format:check
      - run: deno task test

  extension:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

## Test-Strategien

### Unit Tests

- Isolierte Funktionsprüfung
- Mock externe Dependencies
- Schnelle Ausführung
- Hohe Abdeckung

### Integration Tests

- Mehrere Services zusammen
- API-Endpoints testen
- Datenbankoperationen
- Realistische Szenarien

### E2E Tests (Extension)

- Kompletter User-Workflow
- Prompt API Simulation
- Backend Communication
- UI Interaktion

## Best Practices

### Tests schreiben

```typescript
// ✅ Gutes Test-Beispiel
Deno.test("should classify GitHub URL as Development", () => {
  const result = classifyByPatterns("GitHub Repository", "Code repository", [
    "github",
    "code",
  ]);

  assertEquals(result.category, "Development");
});

// ❌ Schlechtes Beispiel
Deno.test("test", () => {
  const x = classifyByPatterns("a", "b", ["c"]);
  assertEquals(x.category, "Development");
});
```

### Mocks verwenden

```javascript
// ✅ Gutes Mock-Beispiel
mockChrome.storage.sync.get.mockResolvedValue({
  authToken: "valid-token",
  apiEndpoint: "http://localhost:8000",
});

// ❌ Direkter Chrome-Zugriff in Tests
// chrome.storage.sync.get([...])  // Fails in test
```

## Troubleshooting

### Deno Test-Fehler

```
error: Uncaught TypeError: Cannot find module
```

→ Check imports und Dateipfade

### Jest Fehler

```
TypeError: chrome is not defined
```

→ Mock `global.chrome` in `beforeEach`

### Linting Fehler

```
error: Unused variable `x`
```

→ `deno task format` und variable umbenennen oder mit `_` prefixen

## Performance

### Test-Ausführung

- User Service Tests: ~50ms
- HTML Service Tests: ~30ms
- AI Service Tests: ~20ms
- Extension Tests: ~200ms

### Target-Zeiten

- Unit Tests: < 5 Sekunden
- Linting: < 2 Sekunden
- Formatting: < 2 Sekunden

## Geplante Tests

- [ ] Database Integration Tests
- [ ] API Endpoint E2E Tests
- [ ] Security Tests (JWT, Password Hashing)
- [ ] Performance Benchmarks
- [ ] Extension in echtem Chrome
- [ ] Prompt API Integration Tests

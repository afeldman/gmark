# 📚 GMARK Dokumentation - Übersicht

## 🎯 Quick Links

**→ [GMARK Local (Neu! 🎉)](./GMARK_LOCAL.md)** | **→ [Schnellstart](./EXTENSION_INSTALL.md)** | **→ [Taskfile](./TASKFILE.md)** | **→ [Testing](./TESTING.md)**

---

## 📖 Dokumentations-Struktur

### 🎉 **GMARK Local Edition (NEU!)**

- [**GMARK_LOCAL.md**](./GMARK_LOCAL.md) - Neue Privacy-First Extension (100% Lokal, Offline, Kostenlos)

### 🚀 **Erste Schritte**

- [**EXTENSION_INSTALL.md**](./EXTENSION_INSTALL.md) - Original Extension installieren & konfigurieren
- [**LOAD_EXTENSION.md**](./LOAD_EXTENSION.md) - Extension laden & debuggen

### 🏗️ **Architektur & Implementierung**

- [**IMPLEMENTATION.md**](./IMPLEMENTATION.md) - Detaillierte Implementierungsübersicht
- [**EXTENSION_SUMMARY.md**](./EXTENSION_SUMMARY.md) - Extension-Zusammenfassung
- [**README_DENO.md**](./README_DENO.md) - Deno Backend-Dokumentation

### 🔧 **Workflows & Tools**

- [**TASKFILE.md**](./TASKFILE.md) - Taskfile-Kommandos & Quick Reference
- [**TESTING.md**](./TESTING.md) - Testing-Guide & Best Practices

### 🤖 **Spezialfeatures**

- [**PROMPT_API.md**](./PROMPT_API.md) - Chrome Prompt API (On-Device LLM Klassifikation)

---

## 📋 Dokumente nach Kategorie

### Installation & Setup

| Dokument                                       | Beschreibung                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| [EXTENSION_INSTALL.md](./EXTENSION_INSTALL.md) | 3-Minuten-Schnellstart für Extension-Installation |
| [LOAD_EXTENSION.md](./LOAD_EXTENSION.md)       | Debugging & Entwicklerladeoptionen                |

### Backend & API

| Dokument                                 | Beschreibung                        |
| ---------------------------------------- | ----------------------------------- |
| [README_DENO.md](./README_DENO.md)       | Deno-Backend API-Dokumentation      |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Komplette Architektur & Komponenten |

### Frontend & Features

| Dokument                                       | Beschreibung                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| [EXTENSION_SUMMARY.md](./EXTENSION_SUMMARY.md) | Extension-Features & Komponenten                  |
| [PROMPT_API.md](./PROMPT_API.md)               | Chrome Prompt API für On-Device KI-Klassifikation |

### Entwicklung & QA

| Dokument                     | Beschreibung                   |
| ---------------------------- | ------------------------------ |
| [TASKFILE.md](./TASKFILE.md) | Alle Befehle & Workflows       |
| [TESTING.md](./TESTING.md)   | Testing, Linting & CI/CD Guide |

---

## 🚀 Häufige Aufgaben

### Schnell starten

```bash
task workflow:setup
task backend:dev
# Neue Extension-Registerkarte mit GMARK-Icon
```

### Tests ausführen

```bash
task test:all              # Alle Tests
task test:quick           # Schneller Test
task backend:test:watch   # Backend Watch-Modus
```

### Code-Qualität

```bash
task quality:check        # Lint + Format-Check
task quality:fix          # Auto-Fix
```

### Dokumentation anschauen

```bash
# Dieses Dokument:
cat docs/INDEX.md

# Schnellstart:
cat docs/EXTENSION_INSTALL.md

# Taskfile-Commands:
task -l
```

---

## 🔗 Root-Verzeichnis READMEs

> Diese Dateien befinden sich im Projekt-Root

| Datei                                       | Beschreibung                          |
| ------------------------------------------- | ------------------------------------- |
| [README.md](../README.md)                   | Projekt-Übersicht                     |
| [README_COMPLETE.md](../README_COMPLETE.md) | Umfassende Dokumentation (443 Zeilen) |
| [QUICKSTART.md](../QUICKSTART.md)           | Schnelle Anleitung                    |

---

## 📊 Dokumentations-Hierarchie

```
/
├── README.md                    ← Projekt-Intro
├── README_COMPLETE.md           ← Vollständige Doku
├── QUICKSTART.md               ← Schnellstart-Übersicht
│
└── docs/                        ← Detaillierte Dokumentation
    ├── INDEX.md                 ← Du bist hier
    ├── INSTALLATION/
    │   ├── EXTENSION_INSTALL.md
    │   └── LOAD_EXTENSION.md
    ├── BACKEND/
    │   ├── README_DENO.md
    │   └── IMPLEMENTATION.md
    ├── EXTENSION/
    │   ├── EXTENSION_SUMMARY.md
    │   └── PROMPT_API.md
    └── TOOLS/
        ├── TASKFILE.md
        └── TESTING.md
```

---

## ✨ Features pro Phase

### ✅ Phase 1-3: Core

- User-Management (JWT, Authentifizierung)
- Bookmark CRUD (Ordner, Hierarchie)
- Python → Deno Migration

### ✅ Phase 4: AI Classification

- HTML-Metadaten-Extraktion
- Pattern-basierte Klassifikation
- LLM-Integration (Backend)

### ✅ Phase 4.1-4.2: Extension Integration

- UI-Integration der Klassifikation
- Chrome Prompt API (Gemini Nano On-Device)
- Intelligente Fallback-Kaskade

### ✅ Phase 5: Quality Assurance

- 35+ Unit Tests (Backend + Extension)
- ESLint & Prettier
- GitHub Actions CI/CD
- Comprehensive Testing Guide

---

## 🎓 Dokumentations-Reihenfolge

**Empfohlene Lese-Reihenfolge:**

1. **Projekt verstehen**: [README.md](../README.md) oder [README_COMPLETE.md](../README_COMPLETE.md)
2. **Schnell starten**: [EXTENSION_INSTALL.md](./EXTENSION_INSTALL.md)
3. **Architektur verstehen**: [IMPLEMENTATION.md](./IMPLEMENTATION.md)
4. **Taskfile lernen**: [TASKFILE.md](./TASKFILE.md)
5. **Testing verstehen**: [TESTING.md](./TESTING.md)
6. **Spezialfeatures**: [PROMPT_API.md](./PROMPT_API.md)

---

## 🔍 Schnelle Suche

**Wie starte ich den Backend?**
→ [EXTENSION_INSTALL.md#schritt-1](./EXTENSION_INSTALL.md)

**Wie installiere ich die Extension?**
→ [EXTENSION_INSTALL.md#schritt-2](./EXTENSION_INSTALL.md)

**Wie funktioniert die KI-Klassifikation?**
→ [PROMPT_API.md](./PROMPT_API.md)

**Wie nutze ich Taskfile?**
→ [TASKFILE.md](./TASKFILE.md)

**Wie teste ich?**
→ [TESTING.md](./TESTING.md)

**Wie ist die Architektur aufgebaut?**
→ [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

## 📞 Support

Fehler oder Fragen?

1. **Tests checken**: `task test:all`
2. **Linting prüfen**: `task quality:check`
3. **Logs anschauen**: `task info` oder `task git:log`
4. **Dokumentation lesen**: Siehe oben

---

**Zuletzt aktualisiert:** 19. Dezember 2025  
**Dokumentation:** Complete & Organized ✅

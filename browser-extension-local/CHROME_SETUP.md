# 🚀 GMARK Local - Chrome Setup Guide

## Problem

Die Chrome Prompt API (Gemini Nano) ist nicht verfügbar. Dies ist erforderlich, damit GMARK funktioniert.

## Lösung - 3 Optionen

### Option 1️⃣: Automatische Konfiguration (EMPFOHLEN)

1. **Extension laden** → Bootstrap startet
2. **Chrome-Konfiguration Dialog** appears
3. **Klicke "OK"** um Konfigurationsseiten automatisch zu öffnen
4. Führe in jedem Tab die Instruktionen durch:
   - **Prompt API Flag** → setze auf "Enabled"
   - **Optimization Guide Flag** → setze auf "Enabled BypassPerfRequirement"
   - **Chrome Components** → klicke "Check for update" für Gemini Nano
5. **Warte 5-10 Minuten** auf Gemini Nano Download
6. **Chrome vollständig neu starten** (alle Tabs schließen)
7. **Extension neu laden** (chrome://extensions)
8. **Bootstrap erneut starten**

---

### Option 2️⃣: Manuelle Konfiguration

**Chrome-Flags öffnen und konfigurieren:**

1. **Prompt API Flag:**

   - Gib in URL-Leiste ein: `chrome://flags/#prompt-api-for-gemini-nano`
   - Setze Dropdown auf: **"Enabled"**
   - Chrome neustart auffordern wird angezeigt

2. **Optimization Guide Flag:**

   - Gib in URL-Leiste ein: `chrome://flags/#optimization-guide-on-device-model`
   - Setze Dropdown auf: **"Enabled BypassPerfRequirement"**
   - Chrome neustart auffordern wird angezeigt

3. **Gemini Nano herunterladen:**

   - Gib in URL-Leiste ein: `chrome://components`
   - Suche nach: **"Optimization Guide On Device Model"**
   - Klicke auf: **"Check for update"**
   - Warte 5-10 Minuten auf Download

4. **Chrome neu starten** (alle Tabs schließen)
5. **Extension neu laden:** `chrome://extensions`
6. **Bootstrap erneut starten**

---

### Option 3️⃣: Command Line Launch (SCHNELL)

Schließe Chrome vollständig und starte es mit Kommandozeile/Terminal:

**Windows (PowerShell oder CMD):**

```powershell
chrome.exe --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano
```

**macOS (Terminal):**

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano
```

**Linux (Terminal):**

```bash
google-chrome --enable-features=OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano
```

Danach:

1. Gib in URL-Leiste ein: `chrome://components`
2. Suche **"Optimization Guide On Device Model"**
3. Klicke **"Check for update"** (warte 5-10 Minuten)
4. Öffne Extension und starte Bootstrap

---

## ✅ Überprüfung

Nach allen Schritten sollte folgendes sichtbar sein:

```
bootstrap.js:36 🔍 Prüfe Chrome Konfiguration für Prompt API...
bootstrap.js:39   📌 Prüfe Chrome Version...
bootstrap.js:42     ✅ Chrome 128+ ist kompatibel
bootstrap.js:45   📌 Prüfe Prompt API Flag...
bootstrap.js:48     ✅ Aktiviert
bootstrap.js:51   📌 Prüfe Gemini Nano Status...
bootstrap.js:54     ✅ Gemini Nano heruntergeladen
bootstrap.js:57   📌 Prüfe Optimization Guide Flag...
bootstrap.js:60     ✅ Aktiviert
bootstrap.js:63
✅ Alle Chrome-Einstellungen korrekt konfiguriert!
```

---

## 🐛 Problembehebung

### "AI object available: false"

→ Gemini Nano nicht heruntergeladen
→ Gehe zu `chrome://components` und klicke "Check for update"

### "languageModel available: false"

→ Optimization Guide Flag nicht aktiviert
→ Gehe zu `chrome://flags/#optimization-guide-on-device-model` und setze auf "Enabled BypassPerfRequirement"

### Nach allen Schritten immer noch Fehler?

→ Chrome **vollständig neu starten** (nicht nur Reload)
→ Alle Tabs schließen
→ Chrome erneut öffnen
→ Extension neu laden

---

## 📋 Systemanforderungen

- **Chrome Version:** 128+ (neueste Version)
- **RAM:** Mindestens 4GB
- **Speicherplatz:** 500MB für Gemini Nano
- **Internetverbindung:** Für Gemini Nano Download

---

## 🎯 Nächste Schritte

Nach erfolgreicher Konfiguration:

1. **Bootstrap ausführen** - migriert alle Chrome Bookmarks
2. **KI-Klassifikation** - Bookmarks werden automatisch kategorisiert
3. **Duplikat-Erkennung** - ähnliche Bookmarks werden erkannt
4. **Omnibox-Suche** - suche Bookmarks mit `gm` in der Adressleiste

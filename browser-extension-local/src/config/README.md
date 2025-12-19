# Kategorien-Konfiguration

Die Bookmark-Kategorien werden aus der Datei `categories.yml` geladen.

## Struktur

```yaml
categories:
  KategorieName:
    patterns:
      - pattern1
      - pattern2
      - pattern3
    color: "#hexcolor"
```

## Felder

- **patterns**: Liste von Suchbegriffen, die in URL, Titel oder Beschreibung gesucht werden
- **color**: Farbe für die Kategorie im UI (Hex-Format)

## Neue Kategorie hinzufügen

Einfach einen neuen Eintrag zur `categories.yml` Datei hinzufügen:

```yaml
categories:
  # ... bestehende Kategorien ...

  Finance:
    patterns:
      - banking
      - stock
      - crypto
      - finance
      - investment
      - trading
      - paypal
      - stripe
    color: "#22c55e"
```

## Pattern-Matching

- Patterns sind **case-insensitive** (Groß-/Kleinschreibung egal)
- Patterns werden als **Wortgrenzen** gesucht (`\b pattern \b`)
- Je mehr Matches, desto höher die Confidence

## Kategorien anpassen

Du kannst jederzeit:

- Neue Patterns zu bestehenden Kategorien hinzufügen
- Farben ändern
- Neue Kategorien erstellen
- Kategorien entfernen (außer "Other" als Fallback)

Nach Änderungen: Extension neu laden (chrome://extensions → Reload)

## Beispiele

### Development

```yaml
Development:
  patterns:
    - github
    - gitlab
    - stackoverflow
    - npm
    - docker
    - kubernetes
  color: "#4f46e5"
```

### Social

```yaml
Social:
  patterns:
    - twitter
    - facebook
    - linkedin
    - reddit
    - mastodon
  color: "#ec4899"
```

## Tipps

1. **Spezifische Patterns**: Verwende Domain-Namen für eindeutige Zuordnungen
2. **Mehrere Varianten**: Füge ähnliche Begriffe hinzu (z.B. "code", "programming", "coding")
3. **Farben**: Nutze unterschiedliche Farben für bessere visuelle Unterscheidung
4. **Testing**: Nach Änderungen die Pattern-Matching-Scores im Console-Log prüfen

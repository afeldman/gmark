# GMARK Taskfile - Quick Reference

## Installation

```bash
# Install Task (Taskfile runner)
# macOS
brew install go-task/tap/go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Windows
choco install task
```

## Getting Started

```bash
# Show all available tasks
task -l

# Show help with descriptions
task help

# Show project info
task info

# Setup entire project
task workflow:setup
```

## 🎯 Common Commands

### Development

```bash
task dev:backend           # Start Deno backend (auto-reload)
task dev:all              # Setup full dev environment
task extension:test:watch # Watch extension tests
```

### Testing

```bash
task test:all             # All tests (backend + extension)
task backend:test         # Backend tests only
task backend:test:watch   # Backend tests (watch mode)
task extension:test       # Extension tests only
task extension:test:watch # Extension tests (watch mode)
```

### Code Quality

```bash
task quality:check        # Check all (lint + format)
task quality:fix          # Auto-fix all issues
task backend:lint         # Lint backend
task backend:format       # Format backend
task extension:lint       # Lint extension
task extension:format     # Format extension
```

### Backend

```bash
task backend:dev          # Dev server
task backend:start        # Production server
task backend:test         # Run tests
task backend:lint         # Lint code
task backend:format       # Auto-format
task backend:check        # Type check
task backend:validate     # All checks
```

### Extension

```bash
task extension:install    # npm install
task extension:test       # Jest tests
task extension:lint       # ESLint
task extension:format     # Prettier
task extension:validate   # All checks
```

## 🧪 Advanced Testing

```bash
task test:backend:user    # User service tests only
task test:backend:html    # HTML service tests only
task test:backend:ai      # AI service tests only
task test:extension:popup # Popup tests only
```

## 📦 Build & Deployment

```bash
task build:backend        # Build backend (checks + lint)
task build:extension      # Build extension (checks)
task deploy:validate      # Full deployment validation
task build:docker         # Build Docker image
```

## 🔧 Utilities

```bash
task status               # Project status & commits
task info                 # Show all useful commands
task git:status          # Git status
task git:log             # Recent commits
task clean               # Clean build artifacts
```

## 🔄 Workflow Presets

```bash
task workflow:setup              # Complete project setup
task workflow:quick-test         # Fast test run
task workflow:full-validation    # Full validation (pre-deployment)
task workflow:ci                 # CI pipeline (all checks)
```

## 📝 Task Categories

### Backend (deno) - 9 tasks

- dev, start, test, test:watch, lint, format, format:check, check, validate

### Extension - 9 tasks

- install, test, test:watch, test:coverage, lint, lint:fix, format, format:check, validate

### Testing - 7 tasks

- all, backend:unit, backend:user, backend:html, backend:ai, extension:popup

### Code Quality - 2 tasks

- check, fix

### Development - 3 tasks

- backend, extension:test, all

### Build & Deploy - 5 tasks

- backend, extension, docker, docker:run, docker:stop

### Utilities - 4 tasks

- status, info, clean, help

### Workflows - 4 tasks

- setup, quick-test, full-validation, ci

### Git Helpers - 3 tasks

- status, log, commit:lint

---

## Examples

### Local Development

```bash
# Terminal 1: Start backend
task backend:dev

# Terminal 2: Run tests in watch mode
task backend:test:watch

# Terminal 3: Run extension tests in watch mode
task extension:test:watch
```

### Before Committing

```bash
task workflow:full-validation
git add -A
git commit -m "Your message"
```

### Before Deploying

```bash
task deploy:validate
task build:docker
task docker:run
```

### Quick Quality Check

```bash
task quality:check
```

---

## Tips & Tricks

1. **List all tasks with descriptions:**

   ```bash
   task -l
   ```

2. **Get help for specific task:**

   ```bash
   task help
   ```

3. **Dry run (see what would execute):**

   ```bash
   task -d backend:dev
   ```

4. **Run multiple tasks in sequence:**

   ```bash
   task backend:lint && task backend:test
   ```

5. **Watch a task (re-run on file changes):**

   ```bash
   task -w backend:test
   ```

6. **Parallel task execution:**
   ```bash
   task -p test:all
   ```

## Environment Variables

Set in `.env` or `deno/.env`:

```env
PORT=8000
SECRET_KEY=your-secret
OPENAI_API_KEY=optional
```

## Troubleshooting

**Task command not found:**

- Install go-task: https://taskfile.dev/installation/

**Dependencies not installed:**

```bash
task extension:install
```

**Tests failing:**

```bash
task workflow:full-validation
```

**Code not formatted:**

```bash
task quality:fix
```

---

**💡 Tip:** Use `task info` to see all available tasks and examples!

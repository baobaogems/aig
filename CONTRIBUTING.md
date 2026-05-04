# Contributing to AIG

Welcome. This guide explains how to navigate the project, what conventions to follow, and what state files to read before any work.

---

## Anchor Context Files (READ FIRST)

Before starting **any** task on this project — whether human or AI agent — read these 3 JSON anchor files at repo root in a single batch:

| File | Purpose |
|------|---------|
| [`architecture_AIG.json`](./architecture_AIG.json) | System map — components, data flow, key design decisions |
| [`roadmap_AIG.json`](./roadmap_AIG.json) | Phase tracking with current status |
| [`status_AIG.json`](./status_AIG.json) | Append-only work journal (most recent context) |

Together they replace the need to re-discover context from scratch each session.

### Append to `status_AIG.json` after every meaningful change

After completing **any** task that produces a meaningful change (code, content, ops, brand, docs, plan), append a new entry to `status_AIG.json` → `logs[]` array.

**Rules:**
- **Append-only.** Never delete or modify existing entries.
- Use ISO 8601 timestamps with timezone (`+07:00` for Asia/Saigon).
- Keep entries concise but specific (file paths, commit hashes, unresolved concerns).

**Entry schema** (see `status_AIG.json` → `usage.logEntrySchema` for canonical version):

| Field | Required | Values / Notes |
|-------|----------|----------------|
| `timestamp` | ✓ | ISO 8601 + timezone |
| `type` | ✓ | `feature` \| `fix` \| `docs` \| `chore` \| `brand` \| `ops` \| `research` \| `plan` \| `refactor` |
| `title` | ✓ | One-line summary |
| `what` | ✓ | What was done (concise) |
| `files` | ✓ | Array of paths touched |
| `status` | ✓ | `done` \| `done_with_concerns` \| `blocked` \| `in_progress` |
| `why` | optional | Reason / trigger |
| `commits` | optional | Array of git commit hashes |
| `concerns` | optional | Follow-ups, blockers, technical debt |

### Update architecture/roadmap when state shifts

If `architecture_AIG.json` or `roadmap_AIG.json` falls out of sync with reality after a meaningful change (new component, phase status flip, breaking design decision, deprecated module), update them too. They describe **current state**, not history. Only `status_AIG.json` is append-only.

---

## Project Documentation

| Document | Purpose |
|----------|---------|
| [`README.md`](./README.md) | Project overview, quick start, env vars |
| [`docs/system-architecture.md`](./docs/system-architecture.md) | Detailed architecture (canonical source for `architecture_AIG.json`) |
| [`docs/development-roadmap.md`](./docs/development-roadmap.md) | Phase planning detail (canonical source for `roadmap_AIG.json`) |
| [`docs/project-changelog.md`](./docs/project-changelog.md) | Detailed change history |
| [`docs/codebase-summary.md`](./docs/codebase-summary.md) | Module-by-module file responsibilities |
| [`docs/brand-guidelines.md`](./docs/brand-guidelines.md) | Voice, visual identity, positioning, messaging |
| [`assets/brand/logo/README.md`](./assets/brand/logo/README.md) | Logo variants and usage rules |

---

## Branching & Commits

- **Main branch:** `main`
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`)
- **No AI references in commit messages.**
- **No force-pushes to `main`.**

---

## Code Standards

See [`docs/code-standards.md`](./docs/code-standards.md) for full conventions. Key rules:

- File naming: kebab-case with descriptive names
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase
- TypeScript strict mode
- File size: <200 lines; split when larger

---

## Workflows

- Plans live in [`plans/`](./plans/) with timestamped directories: `YYMMDD-HHMM-{slug}/`
- Reports go to [`plans/reports/`](./plans/reports/) with naming: `{type}-{date}-{slug}.md`
- Markdown documents must live under `plans/` or `docs/` unless explicitly requested otherwise

---

## Pre-commit / Pre-push

- Run linting before committing
- Run tests before pushing
- Never commit secrets (`.env*`, private keys, service-role tokens)
- Verify your change is reflected in `status_AIG.json` before pushing

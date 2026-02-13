# work pipeline

## Project Overview
A terminal dashboard CLI (`work`) that aggregates work items from Trello, Linear, and Jira.
Built with TypeScript, React Ink (terminal UI), and Node.js.

## Tech Stack
- **Runtime**: Node.js (ES2022)
- **Language**: TypeScript (strict mode)
- **UI**: React 18 + Ink 5 (terminal rendering)
- **Build**: tsup
- **Test**: vitest
- **Package manager**: npm

## Project Structure
```
src/
  model/          — Type definitions (WorkItem, Agent, TimeEntry)
  providers/      — Work item providers (Linear, Trello, Jira)
  agents/         — Agent dispatch system (store, branch utils, prompt builder)
  webhooks/       — Webhook server and handlers
  persistence/    — Data storage (TimeStore, AgentStore)
  config/         — Configuration (TOML loader, board mappings)
  ui/             — React Ink components and hooks
  commands/       — CLI command entry points
  utils/          — Utility functions
```

## Conventions
- ESM modules (`"type": "module"` in package.json)
- Imports use `.js` extension (e.g., `import { foo } from "./bar.js"`)
- No default exports — use named exports
- Zod for runtime validation at system boundaries
- Models in `src/model/`, providers in `src/providers/`, UI in `src/ui/`
- Data stored in `~/.localpipeline/`

## Testing
- Test files: `src/__tests__/*.test.ts` or `src/__tests__/*.test.tsx`
- Use `describe/it/expect` from vitest
- Mock external APIs, use real file system with temp directories
- Run: `npm test`

## Commit Format
- Short imperative subject line (e.g., "Add login validation")
- Reference the work item ID in the commit body

## Agent Identity
You are **Ember**, an autonomous agent working in a git worktree.
Your changes will be submitted as a pull request for review.

## Commands
- `fm` or `fm start` — Launch dashboard
- `fm time stats` — Show time tracking stats
- `fm webhook` — Start webhook server (port 7890)

## Keybindings (Dashboard)
- `↑/↓` — Navigate items
- `Enter` — Start/stop timer
- `d` — Dispatch selected item to an agent
- `a` — Toggle agent panel
- `t` — Toggle time analytics
- `r` — Refresh work items
- `c` — Complete/stop timer
- `q/Esc` — Quit

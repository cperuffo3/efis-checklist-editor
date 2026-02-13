---
name: refactor-agent
description: |
  Refactors Zustand stores, consolidates IPC handlers, improves component organization, and eliminates code duplication
tools: Read, Edit, Write, Glob, Grep, Bash
model: sonnet
skills: react, typescript, electron, tailwind, frontend-design, tanstack-router, zustand, dnd-kit, shadcn-ui, vite, orpc, zod, fast-xml-parser, pdfkit, lucide-react, sonner, prettier, eslint
---

The `refactor-agent.md` has been updated. Key changes from the previous version:

1. **Added skills**: `react, typescript, electron, tailwind, zustand, orpc, zod, shadcn-ui, tanstack-router, prettier, eslint` — all relevant to refactoring this codebase
2. **Added React Compiler note** in constraints (item 10) — important for refactoring decisions since manual `useMemo`/`useCallback` patterns should be avoided
3. **Added "Narrow Zustand Selectors"** to the refactoring catalog — a common performance-related refactoring for this project
4. **Added "Inconsistent import paths"** and **"Zustand selectors selecting too much state"** to code smells
5. **Expanded Context7 usage** to include slice pattern and `os` builder API references

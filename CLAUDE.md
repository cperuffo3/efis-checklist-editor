# EFIS Checklist Editor

A native desktop application for creating, editing, importing, and exporting aircraft checklist files used by EFIS (Electronic Flight Instrument System) avionics. Think "VS Code for aircraft checklists" — a dark-themed, IDE-style three-panel layout with keyboard-driven editing, drag-and-drop reordering, and multi-format support (Garmin ACE, JSON, PDF for MVP).

> Full specs: @.context/PROJECT_BRIEF.md | @.context/UI_UX_SPEC.md | @.context/IMPLEMENTATION_PLAN.md
> Architecture deep-dive: @.context/STARTER_GUIDE.md

## Tech Stack

| Layer       | Technology                         | Purpose                                         |
| ----------- | ---------------------------------- | ----------------------------------------------- |
| Runtime     | Electron 39                        | Desktop shell with native OS integration        |
| Build       | electron-vite 5 + Vite 7           | Unified build for main/preload/renderer         |
| Packaging   | electron-builder 26                | ASAR, Electron Fuses, multi-platform installers |
| UI          | React 19 + TypeScript 5.x (strict) | Component UI with React Compiler (babel plugin) |
| Styling     | Tailwind CSS 4 + shadcn/ui         | Utility-first CSS, 21+ pre-built components     |
| Routing     | TanStack Router (file-based)       | Type-safe routes with auto code-splitting       |
| IPC         | oRPC (over MessagePort)            | Type-safe RPC between main ↔ renderer           |
| State       | Zustand (planned)                  | Lightweight store with undo/redo                |
| Drag & Drop | @dnd-kit (planned)                 | Sortable items and checklists                   |
| Updates     | electron-updater                   | GitHub Releases auto-updates (private repo)     |

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm
pnpm install

# Development (hot reload on http://localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Lint & format
pnpm run lint         # ESLint check + auto-fix
pnpm run format       # Prettier format

# Package & distribute
pnpm run package      # Build + package (no installer)
pnpm run make:win     # Windows NSIS installer
pnpm run make:mac     # macOS ZIP (x64 + arm64)
pnpm run make:linux   # Linux DEB + RPM

# Utilities
pnpm run generate-icons           # Generate icons from assets/icons/icon.svg
pnpm run bump-shadcn-components   # Update shadcn/ui components
pnpm run release                  # Interactive version bump + changelog
```

## Project Structure

```
src/
├── main.ts                        # Electron main process entry point
├── preload.ts                     # Preload script (contextBridge, MessagePort forwarding)
├── renderer.ts                    # Renderer entry (imports App)
├── App.tsx                        # React root (ThemeProvider → Router → Toaster)
├── actions/                       # Renderer-side IPC wrapper functions
│   ├── app.ts, shell.ts, theme.ts, window.ts
├── components/
│   ├── home/                      # Welcome page components (barrel: index.ts)
│   ├── shared/                    # Shared components (barrel: index.ts)
│   │   ├── drag-window-region.tsx # Custom frameless title bar
│   │   ├── external-link.tsx
│   │   └── update-notification.tsx
│   └── ui/                        # shadcn/ui (21+ components)
├── constants/index.ts             # IPC channels, localStorage keys
├── ipc/                           # IPC system (main process)
│   ├── context.ts                 # IPCContext (mainWindow ref)
│   ├── handler.ts                 # oRPC RPCHandler setup
│   ├── manager.ts                 # IPCManager (renderer-side oRPC client)
│   ├── router.ts                  # Aggregated router {theme, window, app, shell, updater}
│   └── <domain>/                  # Per-domain: handlers.ts, schemas.ts, index.ts
├── layouts/base-layout.tsx        # Root layout (title bar + content + footer)
├── routes/                        # TanStack Router file-based routes
│   ├── __root.tsx                 # Root route (wraps BaseLayout + Outlet)
│   └── index.tsx                  # Welcome/home page
├── routeTree.gen.ts               # Auto-generated route tree (DO NOT EDIT)
├── styles/global.css              # Tailwind imports, CSS variables, base styles
├── types/                         # TypeScript type definitions
└── utils/
    ├── cn.ts                      # clsx + tailwind-merge utility
    └── routes.ts                  # TanStack Router instance (memory history)
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                MAIN PROCESS                      │
│  src/main.ts — lifecycle, window, auto-update    │
│  src/ipc/*/handlers.ts — domain logic            │
│  src/ipc/handler.ts — RPCHandler (oRPC server)   │
└────────────────────┬────────────────────────────┘
                     │ MessagePort (oRPC)
┌────────────────────┴────────────────────────────┐
│               PRELOAD SCRIPT                     │
│  src/preload.ts — forwards MessagePort,          │
│  exposes updateAPI via contextBridge             │
└────────────────────┬────────────────────────────┘
                     │ contextBridge
┌────────────────────┴────────────────────────────┐
│             RENDERER PROCESS                     │
│  src/App.tsx — React root                        │
│  src/ipc/manager.ts — IPCManager (oRPC client)   │
│  src/actions/*.ts — typed IPC wrappers           │
│  src/routes/*.tsx — pages                        │
│  src/components/ — UI components                 │
└─────────────────────────────────────────────────┘
```

### IPC Pattern (oRPC)

Every IPC domain follows this pattern:

```typescript
// 1. Schema — src/ipc/<domain>/schemas.ts
import z from "zod";
export const myInputSchema = z.object({ name: z.string() });

// 2. Handler — src/ipc/<domain>/handlers.ts
import { os } from "@orpc/server";
import { myInputSchema } from "./schemas";
export const myHandler = os.input(myInputSchema).handler(({ input }) => {
  /* main process code */
});

// 3. Barrel — src/ipc/<domain>/index.ts
export const myDomain = { myHandler };

// 4. Router — src/ipc/router.ts (add domain)
export const router = { ...existing, myDomain };

// 5. Action — src/actions/<domain>.ts (renderer wrapper)
import { ipc } from "@/ipc/manager";
export function myAction(name: string) {
  return ipc.client.myDomain.myHandler({ name });
}
```

### Adding Routes

Create `src/routes/<name>.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/<name>")({
  component: MyPage,
});

function MyPage() {
  return <div>My Page</div>;
}
```

The router uses **memory history** (not browser history) for Electron. Route tree auto-generates to `src/routeTree.gen.ts` — never edit manually.

## Development Guidelines

### Styling Rules (Critical)

**ALWAYS use Tailwind CSS classes. NEVER use:**

- Inline styles (`style={{ }}`)
- Custom CSS files or `<style>` tags
- Hardcoded color values (hex, rgb, hsl, oklch)
- CSS-in-JS solutions

Use design system tokens via Tailwind: `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`. Use `cn()` from `@/utils/cn` for conditional classes.

### Theme System

All theming in `src/styles/global.css`:

- CSS variables in `:root` (light) and `.dark` (dark) — colors use **OKLCH**
- Mapped to Tailwind via `@theme inline` block
- No `tailwind.config` file — Tailwind 4 CSS-first configuration
- Font: Inter Variable (`@fontsource-variable/inter`)

### File Naming

| Category         | Convention        | Examples                                     |
| ---------------- | ----------------- | -------------------------------------------- |
| Components       | kebab-case `.tsx` | `drag-window-region.tsx`, `hero-section.tsx` |
| IPC/Action files | kebab-case `.ts`  | `handlers.ts`, `schemas.ts`, `theme.ts`      |
| Route files      | kebab-case `.tsx` | `index.tsx`, `__root.tsx`                    |
| Barrel exports   | `index.ts`        | `src/components/home/index.ts`               |

### Code Naming

| Identifier       | Convention                  | Example                                     |
| ---------------- | --------------------------- | ------------------------------------------- |
| Components       | PascalCase named export     | `export function HeroSection()`             |
| Layouts          | PascalCase default export   | `export default function BaseLayout()`      |
| Functions        | camelCase                   | `handleTestToast()`, `syncWithLocalTheme()` |
| Variables        | camelCase                   | `const mainWindow`, `let isDarkMode`        |
| Constants        | SCREAMING_SNAKE in objects  | `IPC_CHANNELS.START_ORPC_SERVER`            |
| Types/Interfaces | PascalCase                  | `interface DragWindowRegionProps`           |
| IPC handlers     | camelCase const             | `export const getCurrentThemeMode`          |
| Zod schemas      | camelCase + `Schema` suffix | `openExternalLinkInputSchema`               |

### Import Order

```typescript
// 1. External packages
import { os } from "@orpc/server";
import z from "zod";
// 2. Internal absolute (@/ alias)
import { ipc } from "@/ipc/manager";
import { Button } from "@/components/ui/button";
// 3. Relative imports
import { myInputSchema } from "./schemas";
// 4. Types (with type keyword)
import type { UpdateInfo } from "./ipc/updater/types";
```

Path alias: `@/*` maps to `./src/*` (in tsconfig.json and electron.vite.config.ts).

### Component Patterns

- Barrel exports via `index.ts` for component groups
- Use shadcn/ui components from `@/components/ui/*` as building blocks
- Shared components: `src/components/shared/`
- Feature components: `src/components/<feature>/`
- Props interfaces named `<Component>Props`, defined inline above component

### Formatting

- **Prettier**: double quotes, trailing commas, 2-space indent, semicolons, tailwind class sorting
- **ESLint**: flat config with TypeScript, React, React Hooks, `tailwind-canonical-classes`
- Run `pnpm run lint` and `pnpm run format` before committing

## Environment Variables

| Variable                    | Required               | Description                             |
| --------------------------- | ---------------------- | --------------------------------------- |
| `GITHUB_TOKEN` / `GH_TOKEN` | For releases & updates | GitHub PAT (Contents R/W, Releases R/W) |

See @.env.example for template. Production uses bundled `update-config.json`.

## Build & Packaging

**electron-vite** config (@electron.vite.config.ts) builds three targets:

- Main process → `dist/main/`
- Preload script → `dist/preload/`
- Renderer (React) → `dist/renderer/`
- Vite plugins: TanStack Router, Tailwind CSS, React with React Compiler

**electron-builder** config (@electron-builder.yml):

- ASAR packaging with integrity validation
- Electron Fuses for security hardening
- Windows: NSIS installer (not WiX/Squirrel)
- macOS: ZIP (x64 + arm64)
- Linux: DEB + RPM
- Auto-updates from GitHub Releases

## MVP Scope

The editor is being built in 15 phases (see @.context/IMPLEMENTATION_PLAN.md):

**In scope**: Garmin ACE (.ace) + JSON import/export, PDF export, dark theme only, Zustand state with undo/redo, @dnd-kit drag-and-drop, command palette (Ctrl+K), keyboard shortcuts, 4-panel IDE layout (files sidebar, checklist tree, editor, properties panel)

**Out of scope for MVP**: Light theme, cloud sync, AFS/Dynon/ForeFlight/GRT/Garmin Pilot format parsers

## Skill Usage Guide

When working on tasks involving these technologies, invoke the corresponding skill:

| Skill           | Invoke When                                                        |
| --------------- | ------------------------------------------------------------------ |
| tailwind        | Applies Tailwind CSS 4 utility classes and theme tokens            |
| electron        | Configures Electron app shell, main process, and IPC communication |
| typescript      | Enforces TypeScript strict mode and type safety throughout         |
| frontend-design | Designs IDE-style dark theme UI with Tailwind CSS and shadcn/ui    |
| react           | Manages React 19 components, hooks, and functional patterns        |
| zustand         | Manages application state with Zustand store and undo/redo         |
| tanstack-router | Implements file-based routing with TanStack Router                 |
| dnd-kit         | Implements drag-and-drop reordering for items and checklists       |
| zod             | Validates IPC handler inputs and schemas with Zod                  |
| vite            | Configures Vite build system for main, preload, and renderer       |
| shadcn-ui       | Builds component library using shadcn/ui primitives                |
| orpc            | Implements type-safe RPC communication via oRPC MessagePort        |
| sonner          | Displays toast notifications for user feedback                     |
| prettier        | Formats code with double quotes and trailing commas                |
| pdfkit          | Generates PDF exports of checklist files                           |
| fast-xml-parser | Parses and generates Garmin ACE XML checklist format               |
| lucide-react    | Provides icon library for UI components                            |
| eslint          | Enforces code quality with flat config and Tailwind rules          |

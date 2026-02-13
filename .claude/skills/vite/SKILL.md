---
name: vite
description: |
  Configures electron-vite build system for Electron main, preload, and renderer processes.
  Use when: modifying electron.vite.config.ts, adding Vite plugins, configuring path aliases,
  adjusting build outputs, troubleshooting HMR or build errors, adding environment variables,
  or understanding how the three-process Electron build works.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# Vite Skill

This project uses **electron-vite 5** (not plain Vite) — a single `electron.vite.config.ts` configures three separate Vite builds for Electron's main, preload, and renderer processes. The renderer uses Vite 7 with React, Tailwind CSS 4, TanStack Router, and React Compiler.

## Project Config

The unified config lives at `electron.vite.config.ts`:

```typescript
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      rollupOptions: { input: { index: resolve(__dirname, "src/main.ts") } },
    },
    resolve: { alias: { "@": resolve(__dirname, "./src") } },
  },
  preload: {
    build: {
      outDir: "dist/preload",
      rollupOptions: { input: { index: resolve(__dirname, "src/preload.ts") } },
    },
  },
  renderer: {
    root: ".",
    build: {
      outDir: "dist/renderer",
      rollupOptions: { input: { index: resolve(__dirname, "index.html") } },
    },
    publicDir: false,
    plugins: [
      viteStaticCopy({ targets: [{ src: "assets", dest: "." }] }),
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      tailwindcss(),
      react({ babel: { plugins: ["babel-plugin-react-compiler"] } }),
    ],
    resolve: {
      preserveSymlinks: true,
      alias: { "@": resolve(__dirname, "./src") },
    },
  },
});
```

## Key Concepts

| Concept        | Detail                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Three builds   | `main` (Node.js), `preload` (bridge), `renderer` (browser/React)          |
| Entry points   | `src/main.ts`, `src/preload.ts`, `index.html` → `src/renderer.ts`         |
| Output dirs    | `dist/main/`, `dist/preload/`, `dist/renderer/`                           |
| Path alias     | `@/` → `./src/` (configured in main + renderer, NOT preload)              |
| Dev server     | `http://localhost:5173` (renderer only)                                   |
| CSS            | Tailwind CSS 4 via `@tailwindcss/vite` plugin — no `tailwind.config` file |
| Routing        | TanStack Router plugin auto-generates `src/routeTree.gen.ts`              |
| React Compiler | Enabled via `babel-plugin-react-compiler` in the React plugin             |

## Common Tasks

### Adding a Vite Plugin (renderer only)

Add to the `renderer.plugins` array. Plugin order matters — TanStack Router and static copy should run before React.

### Adding a Path Alias

Must be added in BOTH `electron.vite.config.ts` (resolve.alias) AND `tsconfig.json` (paths):

```typescript
// electron.vite.config.ts — main and renderer sections
resolve: { alias: { "@": resolve(__dirname, "./src") } }
```

```json
// tsconfig.json
{ "paths": { "@/*": ["./src/*"] } }
```

### Environment Variables

electron-vite uses prefixed env vars in `.env` files:

- `MAIN_VITE_*` — main process only
- `PRELOAD_VITE_*` — preload only
- `RENDERER_VITE_*` — renderer only
- `VITE_*` — shared across all processes

This project loads `.env` manually via `dotenv` in `src/main.ts` instead.

### Running Dev Server

```bash
pnpm run dev     # electron-vite dev — starts all three builds + Electron window
pnpm run build   # electron-vite build — production build to dist/
```

## WARNING: Preload Has No Path Alias

The preload config does NOT have `@/` alias. Imports in `src/preload.ts` use relative paths or direct module imports. This is intentional — preload runs in a restricted context.

## WARNING: No `tailwind.config` File

Tailwind CSS 4 uses CSS-first configuration. All theme tokens live in `src/styles/global.css` inside `@theme inline {}`. See the **tailwind** skill.

## See Also

- [Configuration Details](references/configuration.md)
- [Plugins](references/plugins.md)
- [Build & Packaging](references/build.md)
- [Troubleshooting](references/troubleshooting.md)

## Related Skills

- See the **electron** skill for main/preload process patterns
- See the **tailwind** skill for CSS-first theme configuration
- See the **tanstack-router** skill for file-based routing and auto-generated route tree
- See the **react** skill for React Compiler and component patterns
- See the **typescript** skill for tsconfig and path alias setup

## Documentation Resources

> Fetch latest electron-vite documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "electron-vite"
2. Query with `mcp__context7__query-docs` using the resolved library ID

**Library IDs:**

- electron-vite docs: `/alex8088/electron-vite-docs`
- Vite core docs: `/websites/vite_dev`

**Recommended Queries:**

- "electron-vite configuration main preload renderer"
- "electron-vite environment variables and modes"
- "electron-vite externalize dependencies plugin"
- "vite build options and rollup configuration"

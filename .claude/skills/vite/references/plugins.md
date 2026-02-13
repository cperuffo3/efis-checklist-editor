# Vite Plugins Reference

## Contents

- Active Plugins
- Plugin Order
- Adding New Plugins
- Plugin-Specific Configuration
- Anti-Patterns

## Active Plugins

All plugins are in the **renderer** config only. Main and preload have no plugins.

| Plugin           | Package                        | Purpose                                        |
| ---------------- | ------------------------------ | ---------------------------------------------- |
| `viteStaticCopy` | `vite-plugin-static-copy`      | Copies `assets/` to build output               |
| `tanstackRouter` | `@tanstack/router-plugin/vite` | Auto-generates route tree from `src/routes/`   |
| `tailwindcss`    | `@tailwindcss/vite`            | Tailwind CSS 4 processing (no PostCSS needed)  |
| `react`          | `@vitejs/plugin-react`         | React JSX transform + React Compiler via Babel |

## Plugin Order

Plugin order in the array matters. The current order is correct:

```typescript
plugins: [
  viteStaticCopy({ ... }),    // 1. Asset copying (runs early)
  tanstackRouter({ ... }),    // 2. Route generation (before React transform)
  tailwindcss(),              // 3. CSS processing
  react({ ... }),             // 4. React transform (must be last)
],
```

**Rule of thumb:** Code generation plugins (router, static copy) before transform plugins (CSS, React).

## Adding New Plugins

Add to the `renderer.plugins` array in `electron.vite.config.ts`:

```typescript
import newPlugin from "new-vite-plugin";

// In renderer config
plugins: [
  viteStaticCopy({ ... }),
  tanstackRouter({ ... }),
  newPlugin({ /* options */ }),  // Add before tailwindcss/react
  tailwindcss(),
  react({ ... }),
],
```

## Plugin-Specific Configuration

### TanStack Router Plugin

```typescript
tanstackRouter({
  target: "react",
  autoCodeSplitting: true, // Lazy-loads route components
});
```

- Watches `src/routes/` for file changes
- Auto-generates `src/routeTree.gen.ts` — NEVER edit this file manually
- See the **tanstack-router** skill for route patterns

### React Plugin with React Compiler

```typescript
react({
  babel: {
    plugins: ["babel-plugin-react-compiler"],
  },
});
```

- React Compiler auto-memoizes components — you rarely need `useMemo`/`useCallback`
- If React Compiler causes issues with a specific component, add `"use no memo"` directive
- See the **react** skill for React Compiler patterns

### Tailwind CSS 4 Plugin

```typescript
tailwindcss();
```

- No configuration needed — Tailwind 4 uses CSS-first config
- All theme tokens in `src/styles/global.css` inside `@theme inline {}`
- No `tailwind.config.js/ts` file exists or should be created
- See the **tailwind** skill for theme customization

### Static Copy Plugin

```typescript
viteStaticCopy({
  targets: [{ src: "assets", dest: "." }],
});
```

- Copies the `assets/` directory (icons, images) into the renderer build output
- Required because `publicDir` is disabled (`publicDir: false`)

## Anti-Patterns

### WARNING: Adding PostCSS for Tailwind

**The Problem:**

```typescript
// BAD — Tailwind 4 doesn't need PostCSS
css: {
  postcss: {
    plugins: [require("tailwindcss"), require("autoprefixer")],
  },
}
```

**Why This Breaks:** Tailwind CSS 4 uses the `@tailwindcss/vite` plugin directly. PostCSS configuration is unnecessary and can conflict.

**The Fix:** Just use the Vite plugin:

```typescript
plugins: [tailwindcss()];
```

### WARNING: Duplicate React Transforms

**The Problem:**

```typescript
// BAD — two React plugins
plugins: [
  react(),
  reactSwc(), // Conflicts with @vitejs/plugin-react
];
```

**Why This Breaks:** Only one React transform plugin should exist. This project uses `@vitejs/plugin-react` (Babel-based) specifically because React Compiler requires Babel.

**The Fix:** Use only `@vitejs/plugin-react` with the React Compiler babel plugin.

### WARNING: Importing Renderer Modules in Main Process

**The Problem:**

```typescript
// src/main.ts
import { Button } from "@/components/ui/button"; // BAD
```

**Why This Breaks:** Main process is Node.js — it cannot import React components, CSS, or browser APIs. The `@/` alias resolves to the same `src/` directory, but the build contexts are completely separate.

**The Fix:** Main process should only import from:

- `@/ipc/*` (handler logic)
- `@/constants/*` (shared constants)
- Node.js built-in modules
- Electron APIs

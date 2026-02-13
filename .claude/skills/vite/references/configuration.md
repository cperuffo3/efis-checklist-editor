# Vite Configuration Reference

## Contents

- Three-Process Architecture
- Path Aliases
- Environment Variables
- Adding New Entry Points
- Common Configuration Patterns
- Anti-Patterns

## Three-Process Architecture

electron-vite builds three separate bundles from one config. Each section accepts standard Vite config options:

| Process    | Entry            | Output                  | Node APIs | Browser APIs |
| ---------- | ---------------- | ----------------------- | --------- | ------------ |
| `main`     | `src/main.ts`    | `dist/main/index.js`    | Yes       | No           |
| `preload`  | `src/preload.ts` | `dist/preload/index.js` | Limited   | Limited      |
| `renderer` | `index.html`     | `dist/renderer/`        | No        | Yes          |

The main process loads the renderer in production via:

```typescript
mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
```

In dev, it loads the Vite dev server:

```typescript
mainWindow.loadURL("http://localhost:5173");
```

## Path Aliases

The `@/` alias resolves to `./src/`. It is configured in two places that MUST stay in sync:

```typescript
// electron.vite.config.ts — main section
main: {
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
}
// electron.vite.config.ts — renderer section
renderer: {
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### WARNING: Missing Alias in Preload

The preload process does NOT have the `@/` alias. This is deliberate — preload should have minimal imports. If you need shared constants, use relative imports:

```typescript
// BAD — will fail in preload
import { IPC_CHANNELS } from "@/constants";

// GOOD — relative path from src/preload.ts
import { IPC_CHANNELS } from "./constants";
```

## Environment Variables

This project uses `dotenv` manually in `src/main.ts` rather than electron-vite's built-in env loading. The main process searches for `.env` in multiple locations:

```typescript
const possibleEnvPaths = [
  path.join(process.cwd(), ".env"),
  path.join(__dirname, "../../.env"),
  path.join(app.getAppPath(), ".env"),
];
```

For renderer-side env vars, expose them through IPC handlers — never access `process.env` directly in the renderer.

### electron-vite Built-in Env Prefixes (available but unused)

| Prefix            | Scope             |
| ----------------- | ----------------- |
| `MAIN_VITE_*`     | Main process only |
| `PRELOAD_VITE_*`  | Preload only      |
| `RENDERER_VITE_*` | Renderer only     |
| `VITE_*`          | All processes     |

## Adding New Entry Points

If you need a second preload script or a worker:

```typescript
preload: {
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/preload.ts"),
        worker: resolve(__dirname, "src/worker-preload.ts"),
      },
    },
  },
},
```

## Common Configuration Patterns

### Externalizing Node Dependencies (main/preload)

When adding Node.js-only packages to main or preload, use `externalizeDepsPlugin` to avoid bundling them:

```typescript
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
});
```

This project does NOT currently use it — all deps are bundled. If you add native modules (e.g., `better-sqlite3`), you'll need this.

### Conditional Config by Mode

```typescript
export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";
  return {
    renderer: {
      define: {
        __DEV__: JSON.stringify(isDev),
      },
    },
  };
});
```

## Anti-Patterns

### WARNING: Putting Renderer Plugins in Main/Preload

**The Problem:**

```typescript
// BAD — tailwindcss and react plugins in main process config
main: {
  plugins: [tailwindcss(), react()],
}
```

**Why This Breaks:** Main process is Node.js — it has no DOM, no CSS, no React. These plugins will error or produce garbage output.

**The Fix:** Renderer-only plugins go in `renderer.plugins` only.

### WARNING: Using `publicDir` Without Understanding electron-vite

**The Problem:**

```typescript
renderer: {
  publicDir: "public",  // BAD — conflicts with electron-vite asset handling
}
```

**Why This Breaks:** electron-vite handles static assets differently than plain Vite. This project uses `vite-plugin-static-copy` instead and sets `publicDir: false`.

**The Fix:** Use `vite-plugin-static-copy` for assets that need to be in the output:

```typescript
viteStaticCopy({ targets: [{ src: "assets", dest: "." }] });
```

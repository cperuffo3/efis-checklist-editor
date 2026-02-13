# Vite Troubleshooting Reference

## Contents

- Common Errors
- Process Boundary Issues
- Development Server Problems
- Build Failures
- Validation Workflow

## Common Errors

### `__dirname is not defined`

**Cause:** electron-vite main/preload builds use ESM by default, where `__dirname` doesn't exist.

**Fix:** electron-vite provides `__dirname` polyfills automatically. If you see this error, ensure your code is in a file that electron-vite builds (listed in `rollupOptions.input`), not a standalone script.

### `Cannot use import statement outside a module`

**Cause:** A dependency uses ESM syntax but is being loaded in a CommonJS context.

**Fix for main/preload:** Use `externalizeDepsPlugin` to exclude the module from bundling, or ensure the module is in `dependencies` (not `devDependencies`).

```typescript
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ["esm-only-package"] })],
  },
});
```

### `Module not found: @/some/path` in preload

**Cause:** The preload config does not have the `@/` path alias.

**Fix:** Use relative imports in `src/preload.ts`:

```typescript
// In src/preload.ts
import { IPC_CHANNELS } from "./constants"; // Not "@/constants"
```

### `ReferenceError: document is not defined` in main process

**Cause:** Importing a React component or DOM-dependent module in the main process.

**Fix:** Check your import graph. Main process files should never import from `@/components/`, `@/routes/`, or any file that imports React.

## Process Boundary Issues

### Shared Code Between Main and Renderer

Only certain files can be safely imported by both processes:

| Safe to share          | Not safe to share        |
| ---------------------- | ------------------------ |
| `src/constants/`       | `src/components/`        |
| `src/types/`           | `src/routes/`            |
| Pure utility functions | Anything importing React |
| Zod schemas            | CSS/style imports        |

### WARNING: Importing IPC Handlers in Renderer

**The Problem:**

```typescript
// src/routes/index.tsx
import { readChecklistFile } from "@/ipc/checklist/handlers"; // BAD
```

**Why This Breaks:** IPC handlers run in the main process and use Node.js APIs (`fs`, `path`, `dialog`). Importing them in the renderer will fail because those APIs don't exist in the browser context.

**The Fix:** Use action wrappers that call the IPC client:

```typescript
// src/actions/checklist.ts (renderer-safe)
import { ipc } from "@/ipc/manager";
export function readChecklistFile(path: string) {
  return ipc.client.checklist.readChecklistFile({ path });
}
```

## Development Server Problems

### Port 5173 already in use

```bash
# Find and kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <pid> /F

# Or change the port in electron.vite.config.ts:
renderer: {
  server: { port: 5174 },
}
```

### Electron window shows blank page

1. Check the dev server is running (look for `http://localhost:5173` in terminal output)
2. Open DevTools (`Ctrl+Shift+I`) and check the Console for errors
3. Verify `index.html` has the correct script entry:
   ```html
   <script type="module" src="/src/renderer.ts"></script>
   ```
4. Check CSP — `script-src 'self'` blocks external scripts

### Hot reload not working

- **CSS changes:** Ensure `@tailwindcss/vite` is in plugins
- **Route changes:** TanStack Router plugin may need a restart if `routeTree.gen.ts` is corrupted — delete it and restart
- **Main process changes:** Main process does NOT hot-reload. The entire Electron app restarts on main/preload changes.

## Build Failures

### `rollup failed to resolve import`

Usually means a missing dependency or wrong import path. Steps:

1. Check the import path exists
2. Check the module is in `package.json` dependencies
3. If it's a Node.js built-in (like `fs`, `path`), it should only be in main/preload — never renderer

### TypeScript errors during build

electron-vite runs TypeScript type checking. Fix all TS errors before building:

```bash
pnpm run lint   # Catches many issues
npx tsc --noEmit  # Full type check without emitting
```

### Build succeeds but app crashes on launch

Check the output bundle paths match what `src/main.ts` expects:

```typescript
// These paths are relative to dist/main/index.js
const preload = path.join(__dirname, "../preload/index.js");
mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
```

If you change `outDir` in the config, these paths must be updated.

## Validation Workflow

Copy this checklist when making Vite config changes:

- [ ] Run `pnpm run dev` — verify app starts without errors
- [ ] Check browser console for import/module errors
- [ ] If adding a plugin, verify it's in the correct process config (usually renderer only)
- [ ] If changing aliases, update BOTH `electron.vite.config.ts` AND `tsconfig.json`
- [ ] Run `pnpm run build` — verify production build succeeds
- [ ] Run `pnpm run package` — verify packaged app launches correctly

### Iterate-Until-Pass Pattern

1. Make config changes
2. Run `pnpm run dev`
3. If dev fails, check terminal output for the specific error
4. Fix and repeat step 2
5. Once dev works, run `pnpm run build`
6. If build fails, fix and repeat step 5
7. Only proceed when both dev and build pass

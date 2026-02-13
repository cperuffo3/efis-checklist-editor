# Electron Workflows Reference

## Contents

- Adding a New IPC Domain
- Development Workflow
- Build and Package
- Electron Fuses and Security
- Adding Native Dialogs

---

## Adding a New IPC Domain

Copy this checklist when adding a new IPC domain (e.g., `checklist`, `dialog`):

```
- [ ] Step 1: Create `src/ipc/<domain>/schemas.ts` with Zod input schemas
- [ ] Step 2: Create `src/ipc/<domain>/handlers.ts` with os.handler() definitions
- [ ] Step 3: Create `src/ipc/<domain>/index.ts` barrel export
- [ ] Step 4: Add domain to `src/ipc/router.ts`
- [ ] Step 5: Create `src/actions/<domain>.ts` renderer wrappers
- [ ] Step 6: Verify: `pnpm run dev` — no TypeScript errors
```

### Step-by-Step Example: Adding `dialog` Domain

**Schema:**

```typescript
// src/ipc/dialog/schemas.ts
import z from "zod";

export const openFileDialogInputSchema = z.object({
  filters: z
    .array(
      z.object({
        name: z.string(),
        extensions: z.array(z.string()),
      }),
    )
    .optional(),
});
```

**Handler (uses BrowserWindow for native dialog):**

```typescript
// src/ipc/dialog/handlers.ts
import { os } from "@orpc/server";
import { dialog } from "electron";
import { ipcContext } from "@/ipc/context";
import { openFileDialogInputSchema } from "./schemas";

export const openFileDialog = os
  .input(openFileDialogInputSchema)
  .use(ipcContext.mainWindowContext)
  .handler(async ({ input, context }) => {
    const result = await dialog.showOpenDialog(context.window, {
      properties: ["openFile"],
      filters: input.filters ?? [
        { name: "All Supported", extensions: ["ace", "json"] },
      ],
    });
    return result;
  });
```

**Barrel:**

```typescript
// src/ipc/dialog/index.ts
import { openFileDialog } from "./handlers";
export const dialog = { openFileDialog };
```

**Router update:**

```typescript
// src/ipc/router.ts
import { dialog } from "./dialog";
export const router = { theme, window, app, shell, updater, dialog };
```

**Renderer action:**

```typescript
// src/actions/dialog.ts
import { ipc } from "@/ipc/manager";

export async function openFileDialog(
  filters?: Array<{ name: string; extensions: string[] }>,
) {
  return ipc.client.dialog.openFileDialog({ filters });
}
```

---

## Development Workflow

### Starting Dev Mode

```bash
pnpm run dev
```

This starts electron-vite which:

1. Builds main process → `dist/main/`
2. Builds preload script → `dist/preload/`
3. Starts Vite dev server for renderer on `http://localhost:5173`
4. Launches Electron loading from the dev server

**Hot reload behavior:**

- Renderer changes: instant HMR via Vite
- Main process changes: full restart required (electron-vite handles this)
- Preload changes: full restart required

### Build Check

```bash
pnpm run build
```

1. Validate: No TypeScript errors in any process
2. Validate: All three builds succeed (main, preload, renderer)
3. If build fails, fix issues and repeat

### Lint and Format

```bash
pnpm run lint    # ESLint with auto-fix
pnpm run format  # Prettier
```

See the **eslint** and **prettier** skills for configuration details.

---

## Build and Package

### Build Pipeline

```
electron-vite build → dist/main/   dist/preload/   dist/renderer/
                           ↓
electron-builder → ASAR archive → installer (NSIS / ZIP / DEB+RPM)
```

### Package Commands

```bash
pnpm run package      # Build + package (no installer, outputs to out/)
pnpm run make:win     # Windows NSIS installer
pnpm run make:mac     # macOS ZIP (x64 + arm64)
pnpm run make:linux   # Linux DEB + RPM
```

### Configuration Files

| File                      | Controls                                  |
| ------------------------- | ----------------------------------------- |
| `electron.vite.config.ts` | Build targets, Vite plugins, path aliases |
| `electron-builder.yml`    | ASAR, Fuses, platform targets, installers |

### electron-vite Three-Target Build

```typescript
// electron.vite.config.ts
export default defineConfig({
  main: {
    build: { outDir: "dist/main" },
    resolve: { alias: { "@": resolve(__dirname, "./src") } },
  },
  preload: {
    build: { outDir: "dist/preload" },
  },
  renderer: {
    root: ".",
    build: { outDir: "dist/renderer" },
    plugins: [tanstackRouter(), tailwindcss(), react()],
    resolve: { alias: { "@": resolve(__dirname, "./src") } },
  },
});
```

**Key:** The `@` alias must be configured in both `main` and `renderer` sections. Preload doesn't need it since it only imports from `./constants` and `electron`.

### Release Flow

```bash
pnpm run release          # Interactive version bump
pnpm run release:patch    # 0.1.0 → 0.1.1
```

1. Runs lint + format checks
2. Bumps version in `package.json`
3. Generates CHANGELOG.md
4. Creates git tag
5. Pushes to GitHub → triggers CI build

---

## Electron Fuses and Security

Fuses are compile-time security flags in `electron-builder.yml`:

```yaml
electronFuses:
  runAsNode: false # Block ELECTRON_RUN_AS_NODE
  enableCookieEncryption: true # Encrypt Chromium cookies
  enableNodeOptionsEnvironmentVariable: false # Block NODE_OPTIONS injection
  enableNodeCliInspectArguments: false # Block --inspect debugging
  enableEmbeddedAsarIntegrityValidation: true # Validate ASAR hasn't been tampered
  onlyLoadAppFromAsar: true # Prevent loading unpacked app
```

**Why these matter:** Without fuses, a shipped Electron app can be trivially modified by an attacker replacing files in the ASAR or injecting Node.js flags.

### Additional Security in BrowserWindow

```typescript
webPreferences: {
  contextIsolation: true,           // Separate main/renderer contexts
  nodeIntegration: true,            // Required for oRPC MessagePort
  nodeIntegrationInSubFrames: false, // Block iframes from getting Node
  devTools: inDevelopment,          // Disable DevTools in production
}
```

---

## Adding Native Dialogs

Native dialogs (file open, save, message boxes) MUST run in the main process. Use the `dialog` module from Electron inside IPC handlers.

### File Open Dialog

```typescript
import { os } from "@orpc/server";
import { dialog } from "electron";
import { ipcContext } from "@/ipc/context";

export const openFileDialog = os
  .use(ipcContext.mainWindowContext)
  .handler(async ({ context }) => {
    const result = await dialog.showOpenDialog(context.window, {
      properties: ["openFile"],
      filters: [
        { name: "Checklist Files", extensions: ["ace", "json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
```

### File Save Dialog

```typescript
export const saveFileDialog = os
  .input(
    z.object({
      defaultName: z.string(),
      format: z.enum(["ace", "json", "pdf"]),
    }),
  )
  .use(ipcContext.mainWindowContext)
  .handler(async ({ input, context }) => {
    const result = await dialog.showSaveDialog(context.window, {
      defaultPath: input.defaultName,
      filters: [
        { name: input.format.toUpperCase(), extensions: [input.format] },
      ],
    });
    if (result.canceled) return null;
    return result.filePath;
  });
```

### WARNING: Calling dialog from Renderer

```typescript
// BAD — dialog is a main-process module
import { dialog } from "electron"; // Fails in renderer
```

**Always** wrap dialog calls in IPC handlers. The renderer calls them via actions:

```typescript
// src/actions/dialog.ts
export async function openFileDialog() {
  return ipc.client.dialog.openFileDialog();
}
```

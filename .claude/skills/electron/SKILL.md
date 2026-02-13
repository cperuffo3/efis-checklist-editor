---
name: electron
description: |
  Configures Electron 39 app shell, main process lifecycle, window management, and oRPC-based IPC communication.
  Use when: creating or modifying main process code, adding IPC handlers, configuring window behavior,
  setting up auto-updates, working with preload scripts, or packaging/building the app.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# Electron Skill

This project uses Electron 39 with a **frameless window**, **oRPC over MessagePort** for type-safe IPC (not `ipcMain.handle`), and **electron-vite** for unified builds. The main process lives in `src/main.ts`, IPC domains in `src/ipc/<domain>/`, and the renderer is a React 19 app.

## Process Architecture

```
Main (src/main.ts)  ←── MessagePort (oRPC) ──→  Preload (src/preload.ts)  ←── contextBridge ──→  Renderer
```

| Process  | Entry             | Has Node.js | Has DOM |
| -------- | ----------------- | ----------- | ------- |
| Main     | `src/main.ts`     | Yes         | No      |
| Preload  | `src/preload.ts`  | Limited     | Yes     |
| Renderer | `src/renderer.ts` | No          | Yes     |

## Adding a New IPC Domain

Every domain follows: **schema → handler → barrel → router → action**.

```typescript
// 1. src/ipc/checklist/schemas.ts
import z from "zod";
export const readFileInputSchema = z.object({ path: z.string() });

// 2. src/ipc/checklist/handlers.ts
import { os } from "@orpc/server";
import { readFileInputSchema } from "./schemas";
export const readChecklistFile = os
  .input(readFileInputSchema)
  .handler(async ({ input }) => {
    /* Node.js file I/O here */
  });

// 3. src/ipc/checklist/index.ts
export const checklist = { readChecklistFile };

// 4. src/ipc/router.ts — add to router object
import { checklist } from "./checklist";
export const router = { theme, window, app, shell, updater, checklist };

// 5. src/actions/checklist.ts — renderer wrapper
import { ipc } from "@/ipc/manager";
export async function readChecklistFile(path: string) {
  return ipc.client.checklist.readChecklistFile({ path });
}
```

## Key Concepts

| Concept         | Location                         | Notes                                            |
| --------------- | -------------------------------- | ------------------------------------------------ |
| Window creation | `src/main.ts:createWindow()`     | Frameless, context isolation, platform title bar |
| oRPC setup      | `src/main.ts:setupORPC()`        | Receives MessagePort, upgrades to RPC handler    |
| IPC context     | `src/ipc/context.ts`             | Singleton providing BrowserWindow to handlers    |
| Auto-updater    | `src/main.ts:setupAutoUpdater()` | GitHub Releases, private repo token support      |
| Constants       | `src/constants/index.ts`         | `IPC_CHANNELS`, `UPDATE_CHANNELS`                |
| Build config    | `electron.vite.config.ts`        | Three targets: main, preload, renderer           |
| Package config  | `electron-builder.yml`           | ASAR, Fuses, NSIS/ZIP/DEB+RPM                    |

## Accessing BrowserWindow in Handlers

Use the `ipcContext.mainWindowContext` middleware:

```typescript
import { os } from "@orpc/server";
import { ipcContext } from "@/ipc/context";

export const myHandler = os
  .use(ipcContext.mainWindowContext)
  .handler(({ context }) => {
    const { window } = context; // BrowserWindow instance
    window.minimize();
  });
```

## See Also

- [patterns](references/patterns.md) — IPC patterns, security, window management
- [workflows](references/workflows.md) — Adding domains, packaging, dev workflow

## Related Skills

- See the **orpc** skill for oRPC handler/client patterns
- See the **zod** skill for input schema validation
- See the **vite** skill for build configuration
- See the **react** skill for renderer-side components
- See the **typescript** skill for type conventions

## Documentation Resources

> Fetch latest Electron documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "electron"
2. **Prefer website documentation** (`/websites/electronjs`) over source code
3. Query with `mcp__context7__query-docs` using the resolved library ID

**Library ID:** `/websites/electronjs`

**Recommended Queries:**

- "BrowserWindow options and security"
- "context isolation and preload scripts"
- "auto updater configuration"
- "ipcMain and MessagePort"

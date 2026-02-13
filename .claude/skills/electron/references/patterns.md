# Electron Patterns Reference

## Contents

- IPC Domain Pattern (oRPC)
- BrowserWindow Context Middleware
- Preload Security Model
- Window Creation and Security
- Auto-Update Token Resolution
- Anti-Patterns

---

## IPC Domain Pattern (oRPC)

This codebase uses oRPC over MessagePort — NOT `ipcMain.handle`/`ipcRenderer.invoke`. Every IPC domain has this structure:

```
src/ipc/<domain>/
├── handlers.ts   # os.handler() definitions (main process)
├── schemas.ts    # Zod input schemas
└── index.ts      # Barrel: export const domain = { handler1, handler2 }
```

### Handler Without Input

```typescript
// src/ipc/theme/handlers.ts
import { os } from "@orpc/server";
import { nativeTheme } from "electron";

export const getCurrentThemeMode = os.handler(() => {
  return nativeTheme.themeSource;
});
```

### Handler With Validated Input

```typescript
// src/ipc/shell/handlers.ts
import { os } from "@orpc/server";
import { openExternalLinkInputSchema } from "./schemas";
import { shell } from "electron";

export const openExternalLink = os
  .input(openExternalLinkInputSchema)
  .handler(async ({ input }) => {
    shell.openExternal(input.url);
  });
```

See the **zod** skill for schema patterns. Schemas use `camelCase` + `Schema` suffix:

```typescript
// src/ipc/shell/schemas.ts
import z from "zod";
export const openExternalLinkInputSchema = z.object({ url: z.url() });
```

### Barrel Export

```typescript
// src/ipc/shell/index.ts
import { openExternalLink } from "./handlers";
export const shell = { openExternalLink };
```

### Router Registration

```typescript
// src/ipc/router.ts
import { checklist } from "./checklist";
export const router = { theme, window, app, shell, updater, checklist };
```

### Renderer Action Wrapper

```typescript
// src/actions/window.ts
import { ipc } from "@/ipc/manager";

export async function minimizeWindow() {
  await ipc.client.window.minimizeWindow();
}
```

---

## BrowserWindow Context Middleware

Handlers that need the BrowserWindow use `ipcContext.mainWindowContext`:

```typescript
// src/ipc/window/hadlers.ts
import { os } from "@orpc/server";
import { ipcContext } from "../context";

export const maximizeWindow = os
  .use(ipcContext.mainWindowContext)
  .handler(({ context }) => {
    const { window } = context;
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });
```

The context is a singleton set during window creation:

```typescript
// src/main.ts
ipcContext.setMainWindow(mainWindow);
```

---

## Preload Security Model

The preload script (`src/preload.ts`) does exactly two things:

**1. Forward the oRPC MessagePort to main process:**

```typescript
window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
    const [serverPort] = event.ports;
    ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [serverPort]);
  }
});
```

**2. Expose update event listeners via contextBridge:**

```typescript
contextBridge.exposeInMainWorld("updateAPI", {
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_: Electron.IpcRendererEvent, info: UpdateInfo) =>
      callback(info);
    ipcRenderer.on(UPDATE_CHANNELS.AVAILABLE, handler);
    return () => ipcRenderer.removeListener(UPDATE_CHANNELS.AVAILABLE, handler);
  },
  // ... other events
});
```

Each listener returns an unsubscribe function for React cleanup.

---

## Window Creation and Security

```typescript
// src/main.ts
const mainWindow = new BrowserWindow({
  width: 1540,
  height: 1080,
  webPreferences: {
    devTools: inDevelopment,
    contextIsolation: true,
    nodeIntegration: true,
    nodeIntegrationInSubFrames: false,
    preload: path.join(__dirname, "../preload/index.js"),
  },
  titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
});
```

**Platform differences:**

- macOS: `hiddenInset` title bar with native traffic lights at `{ x: 5, y: 5 }`
- Windows/Linux: `hidden` title bar with custom window control buttons

**Dev vs Production URL loading:**

```typescript
if (!app.isPackaged) {
  mainWindow.loadURL("http://localhost:5173");
} else {
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}
```

---

## Auto-Update Token Resolution

Supports both dev (.env) and production (bundled config):

```typescript
function getUpdateToken(): string {
  // Dev: from .env (GH_TOKEN or GITHUB_TOKEN)
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) return token;

  // Production: from extraResources/update-config.json
  const configPath = path.join(process.resourcesPath, "update-config.json");
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return config.token || "";
  }
  return "";
}
```

Auto-check runs 3 seconds after startup (production only, non-portable):

```typescript
if (!inDevelopment && !isPortable) {
  setTimeout(() => autoUpdater.checkForUpdates(), 3000);
}
```

---

## Anti-Patterns

### WARNING: Using ipcMain.handle/ipcRenderer.invoke Directly

**The Problem:**

```typescript
// BAD — bypasses oRPC type safety
ipcMain.handle("read-file", async (event, path) => {
  return readFileSync(path, "utf-8");
});
```

**Why This Breaks:**

1. No input validation — any string passes through
2. No type safety — renderer has no knowledge of return type
3. Inconsistent with all other IPC in this codebase

**The Fix:** Use the oRPC handler pattern (schema → handler → barrel → router → action).

### WARNING: Exposing ipcRenderer in Preload

**The Problem:**

```typescript
// BAD — exposes full IPC surface to renderer
contextBridge.exposeInMainWorld("electron", { ipcRenderer });
```

**Why This Breaks:**

1. Renderer can call ANY IPC channel, including ones meant for internal use
2. Defeats the purpose of context isolation
3. XSS vulnerabilities gain full main-process access

**The Fix:** Only expose specific, typed APIs. This codebase forwards a single MessagePort for oRPC and exposes only update event listeners.

### WARNING: Importing Electron APIs in Renderer Code

**The Problem:**

```typescript
// BAD — renderer files cannot import from "electron"
import { dialog } from "electron";
```

**Why This Breaks:**

1. `contextIsolation: true` prevents direct access
2. Build will fail — electron is externalized for main process only
3. Even if it worked, it's a security violation

**The Fix:** All Electron API usage goes through IPC handlers in `src/ipc/<domain>/handlers.ts`. Renderer calls them via `ipc.client.<domain>.<method>()`.

### WARNING: Hardcoding Asset Paths

**The Problem:**

```typescript
// BAD — breaks in production builds
const iconPath = path.join(__dirname, "assets/icons/icon.png");
```

**Why This Breaks:** In production, assets are inside the ASAR archive at `process.resourcesPath`.

**The Fix:**

```typescript
function getIconPath() {
  if (!app.isPackaged) {
    return path.join(__dirname, "../../assets/icons/icon.png");
  }
  return path.join(process.resourcesPath, "assets/icons/icon.png");
}
```

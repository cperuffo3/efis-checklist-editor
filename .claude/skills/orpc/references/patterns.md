# oRPC Patterns Reference

## Contents

- Handler Definition Patterns
- Schema Patterns
- Context and Middleware
- Client-Side Patterns
- Error Handling
- Anti-Patterns

---

## Handler Definition Patterns

### Synchronous Handler (No Input)

```typescript
// src/ipc/app/handlers.ts
import { os } from "@orpc/server";
import { app } from "electron";

export const appVersion = os.handler(() => {
  return app.getVersion();
});
```

### Handler with Zod Input

```typescript
// src/ipc/theme/handlers.ts
import { os } from "@orpc/server";
import { nativeTheme } from "electron";
import { setThemeModeInputSchema } from "./schemas";

export const setThemeMode = os
  .input(setThemeModeInputSchema)
  .handler(({ input: mode }) => {
    nativeTheme.themeSource = mode;
    return nativeTheme.themeSource;
  });
```

### Async Handler with Error Result

Return a typed result object instead of throwing — the renderer gets a clean response.

```typescript
// src/ipc/updater/handlers.ts
export const downloadUpdate = os.handler(
  async (): Promise<UpdateDownloadResult> => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  },
);
```

### Handler with Context Middleware

Use `os.use()` to inject BrowserWindow or other main-process dependencies.

```typescript
// src/ipc/window/handlers.ts
import { os } from "@orpc/server";
import { ipcContext } from "@/ipc/context";

export const minimizeWindow = os
  .use(ipcContext.mainWindowContext)
  .handler(({ context }) => {
    context.window.minimize();
  });
```

---

## Schema Patterns

Schemas live in `src/ipc/<domain>/schemas.ts`. See the **zod** skill for full Zod patterns.

### Enum Input

```typescript
// src/ipc/theme/schemas.ts
import z from "zod";

export const setThemeModeInputSchema = z.enum(["light", "dark", "system"]);
```

### Object Input with Validation

```typescript
// src/ipc/shell/schemas.ts
import z from "zod";

export const openExternalLinkInputSchema = z.object({
  url: z.url(),
});
```

### Complex Object for File Operations

```typescript
// src/ipc/checklist/schemas.ts
import z from "zod";

export const writeChecklistFileInputSchema = z.object({
  filePath: z.string().min(1),
  data: z.string(),
});

export const exportFileInputSchema = z.object({
  format: z.enum(["ace", "json", "pdf"]),
  filePath: z.string().min(1),
  content: z.string(),
});
```

---

## Context and Middleware

### IPCContext Singleton

The context class holds a reference to the main BrowserWindow and provides it as oRPC middleware.

```typescript
// src/ipc/context.ts
import { os } from "@orpc/server";
import { BrowserWindow } from "electron";

class IPCContext {
  public mainWindow: BrowserWindow | undefined;

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  public get mainWindowContext() {
    if (!this.mainWindow) {
      throw new Error("Main window is not set in IPC context.");
    }
    return os.middleware(({ next }) =>
      next({ context: { window: this.mainWindow! } }),
    );
  }
}

export const ipcContext = new IPCContext();
```

Call `ipcContext.setMainWindow(mainWindow)` in `src/main.ts` after creating the BrowserWindow.

---

## Client-Side Patterns

### Action Wrappers

Actions are thin wrappers that call `ipc.client`. They can add renderer-side logic (localStorage, DOM updates).

```typescript
// src/actions/shell.ts — thin wrapper
import { ipc } from "@/ipc/manager";

export function openExternalLink(url: string) {
  return ipc.client.shell.openExternalLink({ url });
}

// src/actions/theme.ts — wrapper with side effects
export async function toggleTheme() {
  const isDarkMode = await ipc.client.theme.toggleThemeMode();
  const newTheme = isDarkMode ? "dark" : "light";
  document.documentElement.classList.toggle("dark", isDarkMode);
  localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
}
```

### Usage in Components

Always import from `@/actions/`, never from `@/ipc/manager` directly.

```typescript
import { toggleTheme } from "@/actions/theme";

export function ThemeButton() {
  return <button onClick={toggleTheme}>Toggle</button>;
}
```

---

## Error Handling

### Result Objects (Preferred)

For operations that can fail (file I/O, network), return a result object:

```typescript
// Handler
export const importFile = os
  .input(importFileInputSchema)
  .handler(async ({ input }) => {
    try {
      const content = await readFile(input.filePath, "utf-8");
      return { success: true as const, data: content };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Read failed",
      };
    }
  });

// Action wrapper
export async function importFile(filePath: string) {
  const result = await ipc.client.checklist.importFile({ filePath });
  if (!result.success) {
    toast.error(`Import failed: ${result.error}`);
    return null;
  }
  return result.data;
}
```

---

## Anti-Patterns

### WARNING: Calling ipc.client Directly in Components

**The Problem:**

```typescript
// BAD — raw IPC call in component
import { ipc } from "@/ipc/manager";

function MyComponent() {
  const handleClick = async () => {
    await ipc.client.theme.setThemeMode("dark");
    localStorage.setItem("theme", "dark");
  };
}
```

**Why This Breaks:**

1. Scattered IPC calls make refactoring painful — change the handler, update every component
2. Side effects (localStorage, DOM) get duplicated across components
3. No single place to add error handling or logging

**The Fix:**

```typescript
// GOOD — use action wrapper
import { setTheme } from "@/actions/theme";

function MyComponent() {
  const handleClick = () => setTheme("dark");
}
```

### WARNING: Handlers Without Input Validation

**The Problem:**

```typescript
// BAD — trusting renderer input
export const writeFile = os.handler(async ({ input }) => {
  await fs.writeFile(input.path, input.data); // path could be anything
});
```

**Why This Breaks:** The renderer is untrusted. Without Zod validation, a compromised renderer could write to arbitrary paths.

**The Fix:**

```typescript
// GOOD — validate with Zod schema
export const writeFile = os
  .input(
    z.object({
      path: z
        .string()
        .min(1)
        .refine((p) => p.startsWith(allowedDir)),
      data: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    await fs.writeFile(input.path, input.data);
  });
```

### WARNING: Putting Renderer Logic in Handlers

Handlers run in the main process. Never import React, DOM APIs, or renderer-only modules.

```typescript
// BAD — DOM access in main process handler
export const saveAndNotify = os.handler(() => {
  document.title = "Saved"; // crashes — no DOM in main
});

// GOOD — return data, let renderer handle UI
export const save = os.handler(async () => {
  await writeFile(path, data);
  return { savedAt: Date.now() };
});
```

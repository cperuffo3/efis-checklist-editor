# TypeScript Patterns Reference

## Contents

- Type Inference Over Annotation
- Const Assertions
- Discriminated Unions
- Async Handler Patterns
- Error Handling Conventions
- Module Augmentation
- Anti-Patterns

---

## Type Inference Over Annotation

Let TypeScript infer return types when the implementation makes them obvious. Add explicit annotations only when the inferred type is too wide or for public API clarity.

```typescript
// GOOD — inferred return: { themeSource: string }
export const getCurrentThemeMode = os.handler(() => {
  return nativeTheme.themeSource;
});

// GOOD — explicit return for complex async with multiple branches
export const checkForUpdates = os.handler(
  async (): Promise<UpdateCheckResult> => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, data: result.updateInfo };
    } catch {
      return { success: false, error: "Check failed" };
    }
  },
);
```

**Rule:** If the function has one return path, let inference work. If it has multiple return paths or complex branching, annotate explicitly.

---

## Const Assertions

Use `as const` on constant objects to get literal types instead of widened strings.

```typescript
// GOOD — each value is a string literal type
export const UPDATE_CHANNELS = {
  CHECKING: "update:checking",
  AVAILABLE: "update:available",
  ERROR: "update:error",
} as const;
// typeof UPDATE_CHANNELS.CHECKING = "update:checking" (not string)

// BAD — values widen to string
export const UPDATE_CHANNELS = {
  CHECKING: "update:checking",
};
// typeof UPDATE_CHANNELS.CHECKING = string
```

**When to use:** Constants objects, enum-like maps, channel names, action types.

---

## Discriminated Unions

Use a shared `type` or `success` field for safe narrowing without type assertions.

```typescript
// From src/ipc/updater/types.ts
interface UpdateCheckResult {
  success: boolean;
  data?: UpdateInfo;
  error?: string;
}

// Usage with narrowing
const result = await checkForUpdates();
if (result.success) {
  // TypeScript knows data may exist here
  console.log(result.data?.version);
} else {
  console.error(result.error);
}
```

For complex state machines, use string literal unions:

```typescript
type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date"
  | "not-configured";
```

---

## Async Handler Patterns

### oRPC Handlers

Three patterns used in this codebase. See the **orpc** skill for full details.

```typescript
// 1. No input, sync return
export const appVersion = os.handler(() => app.getVersion());

// 2. Validated input
export const setThemeMode = os
  .input(setThemeModeInputSchema)
  .handler(({ input: mode }) => {
    /* mode is typed from Zod */
  });

// 3. Context middleware (BrowserWindow access)
export const minimizeWindow = os
  .use(ipcContext.mainWindowContext)
  .handler(({ context }) => {
    context.window.minimize(); // window is typed as BrowserWindow
  });
```

### Action Wrappers

Actions are thin typed wrappers. Keep logic in handlers (main process), not actions (renderer).

```typescript
// GOOD — thin wrapper, type flows from handler
export function getAppVersion() {
  return ipc.client.app.appVersion();
}

// GOOD — adds renderer-specific logic
export async function setTheme(newTheme: ThemeMode) {
  await ipc.client.theme.setThemeMode(newTheme);
  localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
  updateDocumentTheme(newTheme === "dark");
}
```

---

## Error Handling Conventions

### instanceof Guard

```typescript
const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
```

### Error Classification

```typescript
interface ErrorDetails {
  type: "dev-mode" | "network" | "permission" | "generic";
  friendlyMessage: string;
  suggestion: string;
}

function classifyError(errorMessage: string): ErrorDetails {
  const lower = errorMessage.toLowerCase();
  if (lower.includes("development mode")) {
    return { type: "dev-mode", friendlyMessage: "Dev Mode", suggestion: "..." };
  }
  return {
    type: "generic",
    friendlyMessage: "Error",
    suggestion: errorMessage,
  };
}
```

### Context Hook with Required Provider

```typescript
const UpdateContext = createContext<UpdateContextValue | null>(null);

export function useUpdateNotification() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error(
      "useUpdateNotification must be used within UpdateNotificationProvider",
    );
  }
  return context;
}
```

---

## Module Augmentation

Extend third-party library types without modifying source:

```typescript
// src/utils/routes.ts
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

This enables type-safe `<Link to="/editor">` and `useParams()` throughout the app. See the **tanstack-router** skill.

---

## Anti-Patterns

### WARNING: Type Assertion Abuse

**The Problem:**

```typescript
// BAD — casting away type safety
const data = response as ChecklistFile;
const items = (json as any).items;
```

**Why This Breaks:**

1. Runtime crashes when the actual shape doesn't match
2. Defeats the purpose of strict mode
3. Hides real type mismatches that indicate bugs

**The Fix:**

```typescript
// GOOD — validate with Zod at system boundaries
const parsed = checklistFileSchema.parse(json);

// GOOD — type guard for narrowing
function isChecklistFile(data: unknown): data is ChecklistFile {
  return typeof data === "object" && data !== null && "groups" in data;
}
```

**Acceptable assertion:** `localStorage.getItem("theme") as ThemeMode | null` — localStorage always returns `string | null`.

### WARNING: Non-Null Assertion Without Guard

```typescript
// BAD — no preceding null check
this.mainWindow!.minimize();

// GOOD — guard before assertion (as done in context.ts)
if (!this.mainWindow) {
  throw new Error("Main window is not set in IPC context.");
}
return os.middleware(({ next }) =>
  next({ context: { window: this.mainWindow! } }),
);
```

### WARNING: Implicit any in Catch Blocks

```typescript
// BAD — err is unknown in strict mode, but easy to misuse
try { ... } catch (err) {
  console.error(err.message); // Error: 'err' is of type 'unknown'
}

// GOOD
try { ... } catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

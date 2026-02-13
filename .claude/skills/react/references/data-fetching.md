# Data Fetching Reference

## Contents

- Architecture Overview
- IPC Action Pattern
- Loading and Error States
- Event Subscriptions
- WARNING: useEffect for Data Fetching
- WARNING: Missing Error Handling
- TanStack Query Integration

## Architecture Overview

This is an Electron app. There is **no HTTP data fetching**. All I/O flows through oRPC IPC:

```
React Component → Action Function → ipc.client.domain.method() → Main Process Handler → Result
```

- **Action functions** live in `src/actions/*.ts` (renderer wrapper)
- **IPC handlers** live in `src/ipc/<domain>/handlers.ts` (main process)
- **Router** aggregates handlers in `src/ipc/router.ts`

See the **orpc** skill for the full IPC pattern and the **electron** skill for process architecture.

## IPC Action Pattern

Action functions are thin async wrappers around the oRPC client. Components import actions, not `ipc` directly.

```tsx
// src/actions/theme.ts
import { ipc } from "@/ipc/manager";

export async function getCurrentTheme() {
  const currentTheme = await ipc.client.theme.getCurrentThemeMode();
  const localTheme = localStorage.getItem("theme") as ThemeMode | null;
  return { system: currentTheme, local: localTheme };
}

export async function setTheme(newTheme: ThemeMode) {
  await ipc.client.theme.setThemeMode(newTheme);
  localStorage.setItem("theme", newTheme);
  updateDocumentTheme(newTheme === "dark");
}
```

```tsx
// src/actions/window.ts — minimal wrappers
export async function minimizeWindow() {
  await ipc.client.window.minimizeWindow();
}
```

**Rule:** Actions can combine IPC calls with localStorage or DOM side effects. Components should not call `ipc.client` directly.

## Loading and Error States

### Simple: Version Fetch

```tsx
const [version, setVersion] = useState<string>("");
const [versionError, setVersionError] = useState<boolean>(false);

useEffect(() => {
  ipc.client.app
    .appVersion()
    .then((v) => {
      if (!v || v === "0.0.0") {
        setVersionError(true);
        setVersion("?.?.?");
      } else {
        setVersion(v);
      }
    })
    .catch(() => {
      setVersionError(true);
      setVersion("?.?.?");
    });
}, []);
```

### Complex: State Machine

For multi-step operations, use a discriminated union state:

```tsx
type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

const [state, setState] = useState<UpdateState>("idle");
const [error, setError] = useState<string | null>(null);

const checkForUpdates = useCallback(async () => {
  setState("checking");
  setError(null);
  try {
    const result = await ipc.client.updater.checkForUpdates();
    if (result && !result.success) {
      setError(result.error ?? "Unknown error");
      setState("error");
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to check");
    setState("error");
  }
}, []);
```

Render UI based on state:

```tsx
{
  state === "checking" && <Spinner />;
}
{
  state === "error" && <p className="text-destructive">{error}</p>;
}
{
  state === "available" && <DownloadButton />;
}
```

## Event Subscriptions

For real-time data from the main process (e.g., update progress), use the preload-bridged event API:

```tsx
useEffect(() => {
  const unsubProgress = window.updateAPI.onUpdateProgress((progress) => {
    setProgress(progress);
  });
  const unsubDownloaded = window.updateAPI.onUpdateDownloaded((info) => {
    setUpdateInfo(info);
    setState("ready");
  });

  return () => {
    unsubProgress();
    unsubDownloaded();
  };
}, []);
```

Each `on*` method returns an unsubscribe function. Always call it in cleanup.

## WARNING: useEffect for Data Fetching

**The Problem:**

```tsx
// BAD - race conditions, no caching, no deduplication
useEffect(() => {
  fetch("/api/data")
    .then((r) => r.json())
    .then(setData);
}, []);
```

**Why This Breaks:**

1. Race conditions on fast navigation (stale data overwrites fresh)
2. No caching — every mount re-fetches
3. No loading/error states without boilerplate
4. No request deduplication
5. Memory leaks if component unmounts mid-request

**The Fix for This Codebase:**

This project has **no HTTP endpoints** — all data goes through IPC. For IPC calls in useEffect, use the active-flag pattern:

```tsx
// GOOD - IPC with cleanup guard
useEffect(() => {
  let active = true;
  getRecentFiles().then((files) => {
    if (!active) return;
    setRecentFiles(files);
  });
  return () => {
    active = false;
  };
}, []);
```

For complex data flows, consider TanStack Query (already installed) wrapping IPC calls.

## WARNING: Missing Error Handling

**The Problem:**

```tsx
// BAD - silent failure
useEffect(() => {
  ipc.client.checklist.readChecklistFile({ path }).then(setFile);
}, [path]);
```

**Why This Breaks:**

1. File might not exist, path might be invalid
2. Main process handler might throw
3. User sees no feedback — just a blank or stale UI
4. Debugging is impossible without error state

**The Fix:**

```tsx
// GOOD - always handle errors
useEffect(() => {
  let active = true;
  ipc.client.checklist
    .readChecklistFile({ path })
    .then((file) => {
      if (!active) return;
      setFile(file);
    })
    .catch((err) => {
      if (!active) return;
      toast.error("Failed to read file", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    });
  return () => {
    active = false;
  };
}, [path]);
```

Use `sonner` toast notifications for user-facing errors. See the **sonner** skill.

## TanStack Query Integration

`@tanstack/react-query` is installed in this project. Use it for IPC calls that need caching, automatic refetching, or complex loading states.

```tsx
import { useQuery } from "@tanstack/react-query";
import { getRecentFiles } from "@/actions/checklist";

function RecentFilesList() {
  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recentFiles"],
    queryFn: getRecentFiles,
  });

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-destructive">Failed to load</p>;
  return <FileList files={files} />;
}
```

Benefits over raw useEffect:

- Automatic caching and deduplication
- Loading/error states built-in
- `staleTime` / `refetchOnWindowFocus` for freshness
- `useMutation` for write operations with optimistic updates

### When to Use Each

| Pattern              | Use Case                                     |
| -------------------- | -------------------------------------------- |
| Raw useEffect + IPC  | One-time setup (platform detection, version) |
| TanStack Query + IPC | Repeated reads (file list, checklist data)   |
| Zustand store        | UI state, selections, panel visibility       |
| Event subscriptions  | Real-time updates (download progress)        |

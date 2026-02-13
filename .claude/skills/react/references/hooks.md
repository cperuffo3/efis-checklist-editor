# Hooks Reference

## Contents

- useEffect with IPC Calls
- Cleanup Patterns
- Custom Context Hooks
- useCallback for Stable References
- WARNING: Stale Closure in Async Effects
- WARNING: Missing Cleanup on Subscriptions

## useEffect with IPC Calls

The primary data-fetching pattern in this codebase. All I/O goes through oRPC IPC actions (see the **orpc** skill), never HTTP.

```tsx
// src/layouts/base-layout.tsx — fetch app version on mount
const [version, setVersion] = useState<string>("");

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

Always handle both success and error paths. IPC calls can fail if the main process is busy or the handler throws.

## Cleanup Patterns

### Active Flag for Async Effects

Prevents setState on unmounted components when async operations complete after navigation.

```tsx
// src/components/shared/drag-window-region.tsx
useEffect(() => {
  let active = true;

  getPlatform()
    .then((value) => {
      if (!active) return;
      setPlatform(value);
    })
    .catch((error) => {
      console.error("Failed to detect platform", error);
    });

  return () => {
    active = false;
  };
}, []);
```

### Event Subscription Cleanup

The update notification system subscribes to Electron IPC events and returns unsubscribe functions.

```tsx
// src/components/shared/update-notification.tsx
useEffect(() => {
  const unsubChecking = window.updateAPI.onUpdateChecking(() => {
    setState("checking");
  });
  const unsubAvailable = window.updateAPI.onUpdateAvailable((info) => {
    setUpdateInfo(info);
    setState("available");
  });
  const unsubError = window.updateAPI.onUpdateError((err) => {
    setError(err);
    setState("error");
  });

  return () => {
    unsubChecking();
    unsubAvailable();
    unsubError();
  };
}, []);
```

Every subscription MUST return a cleanup function. Leaked listeners cause memory leaks and ghost updates.

## Custom Context Hooks

Pattern: `createContext(null)` + Provider component + guarded hook.

```tsx
// Pattern from update-notification.tsx
type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

interface UpdateContextValue {
  state: UpdateState;
  checkForUpdates: () => Promise<void>;
  dismiss: () => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<UpdateState>("idle");

  const checkForUpdates = useCallback(async () => {
    setState("checking");
    try {
      await ipc.client.updater.checkForUpdates();
    } catch (err) {
      setState("error");
    }
  }, []);

  return (
    <UpdateContext.Provider
      value={{ state, checkForUpdates, dismiss: () => setState("idle") }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

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

The `null` default + runtime guard catches misuse at development time. Never provide a fake default value.

## useCallback for Stable References

Use `useCallback` when passing functions to child components or including them in dependency arrays.

```tsx
const checkForUpdates = useCallback(async () => {
  setState("checking");
  setError(null);
  try {
    const result = await ipc.client.updater.checkForUpdates();
    if (result && !result.success && result.error) {
      setError(result.error);
      setState("error");
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to check");
    setState("error");
  }
}, []);
```

Note: With React Compiler enabled in this project, manual `useCallback` is less critical. The compiler auto-memoizes. Still use it for callbacks passed to non-React APIs (event listeners, timers).

## WARNING: Stale Closure in Async Effects

**The Problem:**

```tsx
// BAD - setState after unmount causes warning and potential bugs
useEffect(() => {
  getPlatform().then((value) => {
    setPlatform(value); // Component may have unmounted
  });
}, []);
```

**Why This Breaks:**

1. User navigates away before the IPC call completes
2. setState fires on an unmounted component
3. In React 18+, this is a no-op but indicates a logic bug

**The Fix:**

```tsx
// GOOD - active flag prevents stale updates
useEffect(() => {
  let active = true;
  getPlatform().then((value) => {
    if (!active) return;
    setPlatform(value);
  });
  return () => {
    active = false;
  };
}, []);
```

## WARNING: Missing Cleanup on Subscriptions

**The Problem:**

```tsx
// BAD - event listener leaks
useEffect(() => {
  window.updateAPI.onUpdateAvailable((info) => {
    setUpdateInfo(info);
  });
}, []);
```

**Why This Breaks:**

1. Every mount adds a new listener without removing the old one
2. After hot-reload or navigation, multiple listeners fire simultaneously
3. Memory grows unbounded in long-running Electron sessions

**The Fix:**

```tsx
// GOOD - store and call unsubscribe in cleanup
useEffect(() => {
  const unsub = window.updateAPI.onUpdateAvailable((info) => {
    setUpdateInfo(info);
  });
  return () => unsub();
}, []);
```

**When You Might Be Tempted:** Any time you register a listener, subscribe to a store, or set up a timer. Always pair setup with teardown.

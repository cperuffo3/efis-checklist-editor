# State Management Reference

## Contents

- State Categories
- useState for UI State
- Context for Shared Component State
- Zustand for App Data
- Derived State
- WARNING: State for Derived Values
- WARNING: Prop Drilling Past 3 Levels

## State Categories

| Category               | Tool                          | Example                                 |
| ---------------------- | ----------------------------- | --------------------------------------- |
| UI state (local)       | `useState`                    | Modal open, input value, hover state    |
| Shared component state | Context + hook                | Update notification state, theme        |
| App data               | Zustand store                 | Checklist files, selections, undo stack |
| Server state (IPC)     | TanStack Query or useEffect   | File reads, recent files                |
| URL state              | TanStack Router search params | Filters, pagination                     |

## useState for UI State

Keep state local when only one component (or its direct children) needs it.

```tsx
// Local toggle
const [showDetails, setShowDetails] = useState(false);

// Local form input
const [searchQuery, setSearchQuery] = useState("");

// Async result
const [version, setVersion] = useState<string>("");
const [versionError, setVersionError] = useState(false);
```

### State Machine Pattern

For components with multiple exclusive states, use a discriminated union instead of multiple booleans:

```tsx
// BAD - boolean soup
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isReady, setIsReady] = useState(false);

// GOOD - single state machine
type Status =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";
const [status, setStatus] = useState<Status>("idle");
```

This prevents impossible states (e.g., `isLoading && isError` simultaneously).

## Context for Shared Component State

Use React Context when 2+ components in a subtree need the same state, but the state doesn't belong in a global store.

```tsx
// Provider wraps a subtree
export function UpdateNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const checkForUpdates = useCallback(async () => {
    setState("checking");
    try {
      await ipc.client.updater.checkForUpdates();
    } catch {
      setState("error");
    }
  }, []);

  return (
    <UpdateContext.Provider value={{ state, updateInfo, checkForUpdates }}>
      {children}
    </UpdateContext.Provider>
  );
}

// Consumer hook with guard
export function useUpdateNotification() {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error("Must be used within UpdateNotificationProvider");
  return ctx;
}
```

Mount the provider in the layout, consume in any descendant:

```tsx
// Layout
export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <UpdateNotificationProvider>
      <BaseLayoutContent>{children}</BaseLayoutContent>
    </UpdateNotificationProvider>
  );
}

// Any descendant component
function Footer() {
  const { state, checkForUpdates } = useUpdateNotification();
  return <button onClick={checkForUpdates}>{state}</button>;
}
```

## Zustand for App Data

See the **zustand** skill for full patterns. Summary:

```tsx
// src/stores/checklist-store.ts (planned)
import { create } from "zustand";

interface ChecklistStore {
  files: Map<string, ChecklistFile>;
  activeFileId: string | null;
  setActiveFile: (id: string) => void;
  addFile: (file: ChecklistFile) => void;
}

export const useChecklistStore = create<ChecklistStore>((set) => ({
  files: new Map(),
  activeFileId: null,
  setActiveFile: (id) => set({ activeFileId: id }),
  addFile: (file) =>
    set((state) => {
      const files = new Map(state.files);
      files.set(file.id, file);
      return { files };
    }),
}));
```

Consume with selectors to minimize re-renders:

```tsx
// GOOD - only re-renders when activeFileId changes
const activeFileId = useChecklistStore((s) => s.activeFileId);

// BAD - re-renders on ANY store change
const store = useChecklistStore();
```

## Derived State

Compute values during render instead of storing them in state.

```tsx
// GOOD - derived during render
function ChecklistEditor({ items }: { items: ChecklistItem[] }) {
  const visibleItems = items.filter((item) => !collapsedIds.has(item.parentId));
  const itemCount = visibleItems.length;

  return <div>{itemCount} items</div>;
}
```

For expensive computations, use `useMemo`:

```tsx
const visibleItems = useMemo(
  () => items.filter((item) => !collapsedIds.has(item.parentId)),
  [items, collapsedIds],
);
```

## WARNING: State for Derived Values

**The Problem:**

```tsx
// BAD - syncing derived state
const [items, setItems] = useState<ChecklistItem[]>([]);
const [itemCount, setItemCount] = useState(0);

useEffect(() => {
  setItemCount(items.length);
}, [items]);
```

**Why This Breaks:**

1. Extra render cycle for the sync effect
2. Brief inconsistency where `items` changed but `itemCount` hasn't yet
3. Unnecessary complexity — the value is trivially computable

**The Fix:**

```tsx
// GOOD - compute during render
const [items, setItems] = useState<ChecklistItem[]>([]);
const itemCount = items.length; // Always in sync, no extra render
```

**When You Might Be Tempted:** Anytime you write `useEffect` that only calls `setState` based on other state. That's always a derived value.

## WARNING: Prop Drilling Past 3 Levels

**The Problem:**

```tsx
// BAD - threading activeFileId through 4 components
<EditorLayout activeFileId={activeFileId}>
  <ChecklistTree activeFileId={activeFileId}>
    <TreeGroup activeFileId={activeFileId}>
      <TreeItem activeFileId={activeFileId} />
    </TreeGroup>
  </ChecklistTree>
</EditorLayout>
```

**Why This Breaks:**

1. Every intermediate component must know about `activeFileId`
2. Renaming the prop requires changes in all 4 files
3. Adding a new consumer requires threading through the entire chain

**The Fix:**

Use Zustand (for app data) or Context (for subtree state):

```tsx
// GOOD - read directly from store
function TreeItem({ itemId }: { itemId: string }) {
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const isActive = activeFileId === itemId;
  return <div className={cn(isActive && "bg-accent-dim")} />;
}
```

**Rule of thumb:** If a prop passes through 3+ components without being used, extract it to a store or context.

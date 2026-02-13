# Performance Reference

## Contents

- React Compiler
- Memoization Guidelines
- Preventing Unnecessary Re-renders
- Zustand Selector Pattern
- List Rendering
- Code Splitting
- WARNING: Inline Object Props
- WARNING: Index as Key in Dynamic Lists

## React Compiler

This project has **React Compiler** enabled via `babel-plugin-react-compiler` in the Vite config. The compiler automatically memoizes components and values, reducing the need for manual `React.memo`, `useMemo`, and `useCallback`.

**What this means:**

- You do NOT need `React.memo()` on most components
- You do NOT need `useMemo` for simple computations
- You do NOT need `useCallback` for callbacks passed to React components
- The compiler handles these optimizations at build time

**When you still need manual memoization:**

- Callbacks passed to **non-React APIs** (event listeners, timers, third-party libs)
- Values passed to `useEffect` dependency arrays where stability matters
- Heavy computations that the compiler can't analyze (rare)

## Memoization Guidelines

### useCallback — Only for Non-React Consumers

```tsx
// GOOD - callback passed to non-React event system
const checkForUpdates = useCallback(async () => {
  setState("checking");
  try {
    await ipc.client.updater.checkForUpdates();
  } catch {
    setState("error");
  }
}, []);
```

```tsx
// UNNECESSARY with React Compiler - compiler handles this
// const handleClick = useCallback(() => { ... }, []);
// Just write:
function handleClick() {
  setActiveFileId(file.id);
}
```

### useMemo — Only for Expensive Operations

```tsx
// GOOD - filtering a large list is expensive
const visibleItems = useMemo(
  () => items.filter((item) => !collapsedIds.has(item.parentId)),
  [items, collapsedIds],
);

// UNNECESSARY - trivial computation
// const itemCount = useMemo(() => items.length, [items]);
// Just write:
const itemCount = items.length;
```

## Preventing Unnecessary Re-renders

### Zustand Selectors

The most impactful optimization. Zustand re-renders components only when the selected slice changes.

```tsx
// GOOD - only re-renders when activeFileId changes
const activeFileId = useChecklistStore((s) => s.activeFileId);

// BAD - re-renders on ANY store change (items added, metadata changed, etc.)
const { activeFileId } = useChecklistStore();
```

See the **zustand** skill for advanced selector patterns.

### Split Large Components

When a parent component has many state variables, children re-render on every parent state change. Extract stateful sections:

```tsx
// BAD - entire toolbar re-renders when any state changes
function Toolbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { state } = useUpdateNotification();
  const activeFile = useChecklistStore((s) => s.activeFile);
  // ALL children re-render when any of these change
  return (
    <div>
      <SearchButton open={searchOpen} />
      <FileInfo file={activeFile} />
      <UpdateButton state={state} />
    </div>
  );
}

// GOOD - each section manages its own state
function Toolbar() {
  return (
    <div>
      <SearchSection />
      <FileInfoSection />
      <UpdateSection />
    </div>
  );
}

function SearchSection() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <SearchButton
      open={searchOpen}
      onToggle={() => setSearchOpen(!searchOpen)}
    />
  );
}
```

## List Rendering

### Stable Keys

Use unique, stable IDs from the data model. Checklist items have `id` fields.

```tsx
// GOOD - stable unique ID
{
  items.map((item) => <ChecklistItemRow key={item.id} item={item} />);
}
```

### Virtualization for Long Lists

If a checklist has 100+ items, consider virtualization. Not needed for MVP (most checklists have 10-30 items), but plan for it:

```tsx
// Future: use @tanstack/react-virtual for large lists
import { useVirtualizer } from "@tanstack/react-virtual";
```

## Code Splitting

TanStack Router supports lazy route loading. See the **tanstack-router** skill.

```tsx
// Routes are already code-split by file
// src/routes/editor.tsx loads only when navigating to /editor
export const Route = createFileRoute("/editor")({
  component: EditorPage,
});
```

For heavy components within a route, use `React.lazy`:

```tsx
const CommandPalette = React.lazy(
  () => import("@/components/editor/command-palette"),
);

function EditorLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <>
      {/* Main layout */}
      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setPaletteOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

## WARNING: Inline Object Props

**The Problem:**

```tsx
// BAD - new object reference every render
<ChecklistItemRow
  style={{ indent: item.indent, isLast: index === items.length - 1 }}
  item={item}
/>
```

**Why This Breaks:**

1. Creates a new object on every render
2. Child component sees a "new" prop and re-renders
3. React Compiler can often catch this, but not always (especially with spread)

**The Fix:**

```tsx
// GOOD - pass individual props
<ChecklistItemRow
  item={item}
  indent={item.indent}
  isLast={index === items.length - 1}
/>;

// OR extract to a stable reference if the object is genuinely needed
const renderConfig = useMemo(
  () => ({ indent: item.indent, isLast: index === items.length - 1 }),
  [item.indent, index, items.length],
);
```

**When You Might Be Tempted:** Passing "config" objects or "options" as props. Flatten them into individual props instead.

## WARNING: Index as Key in Dynamic Lists

**The Problem:**

```tsx
// BAD - items can be reordered, added, removed
{
  items.map((item, index) => <ChecklistItemRow key={index} item={item} />);
}
```

**Why This Breaks:**

1. User drags item from position 2 to position 5
2. React sees key `2` is now a different item, but doesn't know that
3. State (edit mode, focus, animations) leaks between items
4. Drag-and-drop with @dnd-kit depends on stable keys for correct behavior

**The Fix:**

```tsx
// GOOD - use the item's stable unique ID
{
  items.map((item) => <ChecklistItemRow key={item.id} item={item} />);
}
```

See the **dnd-kit** skill — `useSortable` requires stable IDs as keys.

## Performance Checklist

Copy this when building a new panel or list component:

- [ ] Zustand selectors pick only needed slices
- [ ] List items use stable `id` as key (never index)
- [ ] Heavy computations wrapped in `useMemo` if not auto-optimized
- [ ] State is local to the smallest possible component
- [ ] Large components split into independent stateful sections
- [ ] Conditional rendering avoids mounting hidden components

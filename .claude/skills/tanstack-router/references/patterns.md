# TanStack Router Patterns Reference

## Contents

- Router Instance Setup
- Root Route and Layout Nesting
- File-Based Route Convention
- Navigation Patterns
- Route-Specific Layouts
- Anti-Patterns

---

## Router Instance Setup

The router uses memory history for Electron. Defined once in `src/utils/routes.ts`:

```typescript
import { routeTree } from "@/routeTree.gen";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const router = createRouter({
  defaultPendingMinMs: 0,
  routeTree,
  history: createMemoryHistory({
    initialEntries: ["/"],
  }),
});
```

**Why `defaultPendingMinMs: 0`:** Desktop apps should feel instant. No artificial loading delay.

**Why module augmentation:** The `Register` interface enables fully typed `useNavigate()`, `<Link>`, and route params across the entire app. Without it, navigation targets are `string` instead of union types.

---

## Root Route and Layout Nesting

`src/routes/__root.tsx` wraps every route. Use `<Outlet />` to render child routes:

```typescript
import BaseLayout from "@/layouts/base-layout";
import { Outlet, createRootRoute } from "@tanstack/react-router";

function Root() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}

export const Route = createRootRoute({
  component: Root,
});
```

**Key rule:** `<Outlet />` is mandatory in root. Without it, child routes render nothing.

### When to Use Root Layout vs Route-Specific Layout

| Scenario                                         | Approach                                                  |
| ------------------------------------------------ | --------------------------------------------------------- |
| Shared chrome (title bar, status bar)            | Root layout in `__root.tsx`                               |
| Unique layout per page (e.g., editor vs welcome) | Route component renders its own layout                    |
| Mix: shared title bar, different body            | Root renders title bar + `<Outlet />`, routes render body |

For this project, the editor route uses its own `EditorLayout` while the welcome page uses the default `BaseLayout` from root.

---

## File-Based Route Convention

Routes live in `src/routes/`. The Vite plugin discovers them automatically:

```
src/routes/
├── __root.tsx          → Root layout (wraps all)
├── index.tsx           → /
├── editor.tsx          → /editor
├── settings.tsx        → /settings
├── users/
│   ├── index.tsx       → /users
│   └── $userId.tsx     → /users/:userId (dynamic param)
```

### Route File Template

Every route file exports a `Route` constant:

```typescript
import { createFileRoute } from "@tanstack/react-router";

function MyPage() {
  return <div>Page content</div>;
}

export const Route = createFileRoute("/my-page")({
  component: MyPage,
});
```

**The path string in `createFileRoute()` MUST match the file path.** The Vite plugin validates this. Mismatches cause build errors.

### Dynamic Route Parameters

```typescript
// src/routes/checklists/$checklistId.tsx
import { createFileRoute } from "@tanstack/react-router";

function ChecklistPage() {
  const { checklistId } = Route.useParams();
  return <div>Checklist: {checklistId}</div>;
}

export const Route = createFileRoute("/checklists/$checklistId")({
  component: ChecklistPage,
});
```

See the **typescript** skill for typing route params.

---

## Navigation Patterns

### Programmatic (useNavigate)

Used in event handlers, effects, and callbacks:

```typescript
import { useNavigate } from "@tanstack/react-router";

function NavigationExample() {
  const navigate = useNavigate();

  const goToEditor = () => navigate({ to: "/editor" });
  const goToChecklist = (id: string) =>
    navigate({ to: "/checklists/$checklistId", params: { checklistId: id } });

  return <button onClick={goToEditor}>Open Editor</button>;
}
```

### Declarative (Link)

Used in JSX for clickable navigation elements:

```typescript
import { Link } from "@tanstack/react-router";

<Link to="/editor" className="text-accent hover:underline">
  Open Editor
</Link>
```

### Active Link Styling

```typescript
<Link
  to="/editor"
  activeProps={{ className: "bg-accent-dim text-accent" }}
  inactiveProps={{ className: "text-muted-foreground" }}
>
  Editor
</Link>
```

---

## Route-Specific Layouts

For the EFIS editor, the editor route uses a completely different layout from the welcome page:

```typescript
// src/routes/editor.tsx
import { createFileRoute } from "@tanstack/react-router";
import EditorLayout from "@/layouts/editor-layout";

export const Route = createFileRoute("/editor")({
  component: EditorLayout,
});
```

The `EditorLayout` replaces the root's `BaseLayout` content entirely — the root layout's `<Outlet />` renders `EditorLayout` inside `BaseLayout`. If the editor needs to bypass `BaseLayout`, restructure the root route. See the **react** skill for layout composition patterns.

---

## Anti-Patterns

### WARNING: Browser History in Electron

**The Problem:**

```typescript
// BAD — Electron has no URL bar or browser navigation
import { createBrowserHistory } from "@tanstack/react-router";
const router = createRouter({
  routeTree,
  history: createBrowserHistory(),
});
```

**Why This Breaks:**

1. Electron's renderer is loaded from `file://` protocol — browser history APIs expect `http://`
2. Back/forward navigation doesn't exist in a frameless desktop window
3. URL-based state is invisible to users without a URL bar

**The Fix:** Always use `createMemoryHistory` with explicit `initialEntries`.

---

### WARNING: Editing routeTree.gen.ts

**The Problem:** Manually adding routes to the generated file.

**Why This Breaks:** The Vite plugin overwrites this file on every route change or build. Your edits vanish silently.

**The Fix:** Create route files in `src/routes/`. The tree regenerates automatically.

---

### WARNING: Missing Outlet in Layout Routes

**The Problem:**

```typescript
// BAD — child routes never render
function Root() {
  return <BaseLayout>Hello</BaseLayout>;
}
```

**Why This Breaks:** Without `<Outlet />`, nested route components have nowhere to mount. The page appears frozen on the layout content.

**The Fix:**

```typescript
// GOOD — children render inside Outlet
function Root() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
```

---

### WARNING: Hardcoded Path Strings

**The Problem:**

```typescript
// BAD — no type checking, typos cause silent 404s
navigate({ to: "/editro" });
```

**Why This Breaks:** TanStack Router's type safety only works when the `Register` interface is set up. Without it, any string is accepted.

**The Fix:** Ensure module augmentation is in `src/utils/routes.ts`. TypeScript will then error on invalid paths:

```typescript
// GOOD — TypeScript catches typos at build time
navigate({ to: "/editor" }); // ✓ valid route
navigate({ to: "/editro" }); // ✗ TypeScript error
```

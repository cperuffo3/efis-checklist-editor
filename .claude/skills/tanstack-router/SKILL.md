---
name: tanstack-router
description: |
  Implements file-based routing with TanStack Router in an Electron + React desktop app using memory history.
  Use when: creating new routes, adding navigation, modifying route layouts, working with route parameters,
  configuring the router instance, or debugging route tree generation issues.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# TanStack Router Skill

File-based, type-safe routing for the EFIS Checklist Editor Electron app. Uses **memory history** (not browser history) since Electron has no URL bar. Routes auto-generate a typed route tree via a Vite plugin — never edit `src/routeTree.gen.ts` manually.

## Quick Start

### Creating a New Route

Create a file in `src/routes/`. The filename determines the URL path:

```typescript
// src/routes/editor.tsx
import { createFileRoute } from "@tanstack/react-router";

function EditorPage() {
  return <div className="flex h-full">Editor content</div>;
}

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});
```

The route tree regenerates automatically. No manual registration needed.

### Programmatic Navigation

```typescript
import { useNavigate } from "@tanstack/react-router";

function MyComponent() {
  const navigate = useNavigate();
  return <button onClick={() => navigate({ to: "/editor" })}>Open Editor</button>;
}
```

### Declarative Navigation

```typescript
import { Link } from "@tanstack/react-router";

<Link to="/editor">Open Editor</Link>
```

## Key Concepts

| Concept         | This Project                | Notes                                                |
| --------------- | --------------------------- | ---------------------------------------------------- |
| History         | `createMemoryHistory`       | Required for Electron — no browser URL bar           |
| Route discovery | File-based in `src/routes/` | Vite plugin auto-generates route tree                |
| Root layout     | `src/routes/__root.tsx`     | Wraps ALL routes with `<Outlet />`                   |
| Code splitting  | Automatic                   | Enabled via `autoCodeSplitting: true` in Vite config |
| Type safety     | Module augmentation         | `Register` interface in `src/utils/routes.ts`        |
| Route tree      | `src/routeTree.gen.ts`      | **NEVER edit** — auto-generated                      |

## Common Patterns

### Route with Custom Layout

Routes can use their own layout instead of the root `BaseLayout`:

```typescript
// src/routes/editor.tsx
import { createFileRoute } from "@tanstack/react-router";
import EditorLayout from "@/layouts/editor-layout";

function EditorPage() {
  return <EditorLayout />;
}

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});
```

### Route File Naming

| File                      | Route Path              |
| ------------------------- | ----------------------- |
| `src/routes/index.tsx`    | `/`                     |
| `src/routes/editor.tsx`   | `/editor`               |
| `src/routes/settings.tsx` | `/settings`             |
| `src/routes/__root.tsx`   | Root layout (wraps all) |

## WARNING: Common Anti-Patterns

### NEVER use browser history in Electron

```typescript
// BAD — breaks in Electron
import { createBrowserHistory } from "@tanstack/react-router";
const router = createRouter({ history: createBrowserHistory() });

// GOOD — memory history for Electron
import { createMemoryHistory } from "@tanstack/react-router";
const router = createRouter({
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
```

### NEVER edit routeTree.gen.ts

This file is regenerated on every build. Changes are overwritten silently.

## See Also

- [patterns](references/patterns.md) — Route patterns, layouts, navigation
- [workflows](references/workflows.md) — Adding routes, debugging, route guards

## Related Skills

- See the **react** skill for component patterns used in route pages
- See the **typescript** skill for type safety patterns with route params
- See the **vite** skill for the TanStack Router Vite plugin configuration
- See the **electron** skill for why memory history is required

## Documentation Resources

> Fetch latest TanStack Router documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "tanstack-router"
2. Query with `mcp__context7__query-docs` using the resolved library ID

**Library ID:** `/tanstack/router` _(benchmark score 94.5, 3,146 snippets)_
**Alternative:** `/websites/tanstack_router` _(website docs, 2,334 snippets)_

**Recommended Queries:**

- "file-based routing setup with createFileRoute"
- "createMemoryHistory for non-browser environments"
- "route layout nesting with Outlet"
- "type-safe navigation with useNavigate"

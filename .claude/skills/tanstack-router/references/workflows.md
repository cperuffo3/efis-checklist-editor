# TanStack Router Workflows Reference

## Contents

- Adding a New Route
- Adding a Route with Its Own Layout
- Adding Route Parameters
- Debugging Route Generation
- Redirecting Between Routes
- Route Guards and Data Loading

---

## Adding a New Route

Copy this checklist and track progress:

- [ ] Step 1: Create route file in `src/routes/<name>.tsx`
- [ ] Step 2: Export `Route` using `createFileRoute`
- [ ] Step 3: Verify route tree regenerated (check `src/routeTree.gen.ts`)
- [ ] Step 4: Add navigation link or programmatic navigation
- [ ] Step 5: Test navigation in dev mode (`pnpm run dev`)

### Step 1: Create the Route File

```typescript
// src/routes/settings.tsx
import { createFileRoute } from "@tanstack/react-router";

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
```

### Step 2: Verify Route Tree

After saving, the Vite plugin regenerates `src/routeTree.gen.ts`. Confirm the new route appears:

```typescript
// In routeTree.gen.ts, you should see:
import { Route as SettingsRouteImport } from "./routes/settings";
```

If the route doesn't appear, restart the dev server: `pnpm run dev`.

### Step 3: Navigate

```typescript
import { Link } from "@tanstack/react-router";
<Link to="/settings">Settings</Link>
```

### Validation Loop

1. Create the route file
2. Validate: Check that `routeTree.gen.ts` includes the new import
3. If missing, restart dev server and check again
4. Only proceed to navigation when the route tree includes your route

---

## Adding a Route with Its Own Layout

For the EFIS editor, the `/editor` route uses `EditorLayout` instead of the default `BaseLayout`. The root route still wraps it, but the editor route renders its own full-screen layout inside `<Outlet />`.

```typescript
// src/routes/editor.tsx
import { createFileRoute } from "@tanstack/react-router";
import EditorLayout from "@/layouts/editor-layout";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  return <EditorLayout />;
}
```

The `EditorLayout` is a full-height flex column that replaces the normal page content. See the **react** skill for layout component patterns.

### Bypassing the Root Layout

If a route needs to completely bypass `BaseLayout` (no title bar, no footer), restructure the root:

```typescript
// src/routes/__root.tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";

function Root() {
  // Minimal root — no shared chrome
  return <Outlet />;
}

export const Route = createRootRoute({
  component: Root,
});
```

Then each route is responsible for its own full-screen layout. This is the pattern when the editor and welcome page have fundamentally different shells.

---

## Adding Route Parameters

### Dynamic Segments

Prefix a filename with `$` to create a dynamic parameter:

```typescript
// src/routes/files/$fileId.tsx
import { createFileRoute } from "@tanstack/react-router";

function FilePage() {
  const { fileId } = Route.useParams();
  return <div>File: {fileId}</div>;
}

export const Route = createFileRoute("/files/$fileId")({
  component: FilePage,
});
```

### Search Parameters (Query Strings)

For state that belongs in the URL (filters, selections):

```typescript
// src/routes/editor.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const editorSearchSchema = z.object({
  checklistId: z.string().optional(),
  itemId: z.string().optional(),
});

export const Route = createFileRoute("/editor")({
  validateSearch: editorSearchSchema,
  component: EditorPage,
});

function EditorPage() {
  const { checklistId, itemId } = Route.useSearch();
  // Use search params...
}
```

See the **zod** skill for schema validation patterns.

**Note:** In this Electron app with memory history, search params work but aren't visible in a URL bar. Prefer Zustand store state for editor selections instead of search params. Search params are better suited for shareable/bookmarkable state in web apps.

---

## Debugging Route Generation

### Route Not Appearing

**Symptoms:** Navigation to a new route shows blank or 404.

**Checklist:**

1. File is in `src/routes/` (not a subdirectory like `src/components/`)
2. File exports `Route` as a named export (not default)
3. Path string in `createFileRoute()` matches the file path
4. Dev server is running (route tree generates on file change)
5. Check `src/routeTree.gen.ts` for the import

**Fix:** Restart the dev server if the route tree is stale:

```bash
# Stop dev server, then restart
pnpm run dev
```

### Type Errors After Adding Route

**Symptoms:** TypeScript errors about route paths or params.

**Cause:** The route tree type declarations in `routeTree.gen.ts` are out of date.

**Fix:** The Vite plugin should regenerate on save. If not, delete and restart:

```bash
rm src/routeTree.gen.ts
pnpm run dev
```

The file regenerates immediately on dev server start.

### Path Mismatch Error

**Symptoms:** Build error saying the path doesn't match the file location.

```
Error: Route path "/edtior" does not match file path "src/routes/editor.tsx"
```

**Fix:** The path string in `createFileRoute()` must exactly match the file's location relative to `src/routes/`:

```typescript
// File: src/routes/editor.tsx
// BAD
export const Route = createFileRoute("/edtior")({ ... });
// GOOD
export const Route = createFileRoute("/editor")({ ... });
```

---

## Redirecting Between Routes

### On App Start

Set the initial route in memory history:

```typescript
// src/utils/routes.ts
export const router = createRouter({
  routeTree,
  history: createMemoryHistory({
    initialEntries: ["/editor"], // Start on editor page instead of welcome
  }),
});
```

### Conditional Redirect from a Route

```typescript
// src/routes/index.tsx — redirect to editor if files are loaded
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const hasFiles = checkIfFilesLoaded(); // Your logic
    if (hasFiles) {
      throw redirect({ to: "/editor" });
    }
  },
  component: WelcomePage,
});
```

### Programmatic Redirect

```typescript
import { useNavigate } from "@tanstack/react-router";

function WelcomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate({ to: "/editor" });
  };

  return <button onClick={handleGetStarted}>Get Started</button>;
}
```

---

## Route Guards and Data Loading

### beforeLoad for Route Protection

```typescript
export const Route = createFileRoute("/editor")({
  beforeLoad: async () => {
    // Runs before the component mounts
    // Throw redirect() to prevent access
    // Return data to pass to the component
  },
  component: EditorPage,
});
```

### loader for Data Fetching

```typescript
export const Route = createFileRoute("/editor")({
  loader: async () => {
    // Fetch data before rendering
    const recentFiles = await getRecentFiles();
    return { recentFiles };
  },
  component: EditorPage,
});

function EditorPage() {
  const { recentFiles } = Route.useLoaderData();
  // Use loaded data...
}
```

**Note for this project:** Most data loading happens through IPC actions and Zustand store, not route loaders. Route loaders are appropriate for data that a route absolutely needs before rendering (like loading a file from a URL param). For general app state, use Zustand. See the **zustand** skill.

---

## Vite Plugin Configuration

The TanStack Router plugin is configured in `electron.vite.config.ts`:

```typescript
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// In renderer plugins array:
tanstackRouter({
  target: "react",
  autoCodeSplitting: true,
}),
```

**Plugin order matters.** TanStack Router must come before Tailwind and React plugins:

```typescript
plugins: [
  viteStaticCopy({ ... }),
  tanstackRouter({ ... }),  // 1st — generates route tree
  tailwindcss(),             // 2nd — processes styles
  react({ ... }),            // 3rd — compiles JSX
],
```

See the **vite** skill for full build configuration details.

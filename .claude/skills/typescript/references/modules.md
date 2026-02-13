# TypeScript Modules Reference

## Contents

- Import Order Convention
- Path Alias
- Barrel Exports
- IPC Domain Module Structure
- Type-Only Imports
- Anti-Patterns

---

## Import Order Convention

Enforced by **eslint** and **prettier** (see those skills). Follow this order:

```typescript
// 1. External packages
import { os } from "@orpc/server";
import { z } from "zod";

// 2. Internal absolute imports (@/ alias)
import { ipc } from "@/ipc/manager";
import { Button } from "@/components/ui/button";

// 3. Relative imports
import { setThemeModeInputSchema } from "./schemas";

// 4. Type-only imports (with `type` keyword)
import type { UpdateInfo } from "./types";
```

---

## Path Alias

`@/*` maps to `./src/*`. Configured in both `tsconfig.json` and `electron.vite.config.ts`.

```typescript
// GOOD — absolute from src root
import { ipc } from "@/ipc/manager";
import { cn } from "@/utils/cn";
import { LOCAL_STORAGE_KEYS } from "@/constants";

// BAD — deep relative paths
import { ipc } from "../../../ipc/manager";
```

**Rule:** Use `@/` for cross-directory imports. Use relative `./` only within the same module (same IPC domain folder, same component folder).

---

## Barrel Exports

Each component group and IPC domain has an `index.ts` barrel file.

### Component Barrel

```typescript
// src/components/shared/index.ts
export { DragWindowRegion } from "./drag-window-region";
export { ExternalLink } from "./external-link";
export {
  UpdateNotificationProvider,
  UpdateNotification,
} from "./update-notification";
```

### IPC Domain Barrel

```typescript
// src/ipc/theme/index.ts
import { getCurrentThemeMode, setThemeMode, toggleThemeMode } from "./handlers";

export const theme = {
  getCurrentThemeMode,
  setThemeMode,
  toggleThemeMode,
};
```

### Types Barrel

```typescript
// src/types/index.ts
export type { ThemeMode } from "./theme-mode";
export type {
  ChecklistFile,
  ChecklistGroup,
  Checklist,
  ChecklistItem,
} from "./checklist";
```

**Rule:** Use `export type` in barrel files for types/interfaces to enable tree-shaking and avoid circular import issues.

---

## IPC Domain Module Structure

Every IPC domain follows the same 3-file pattern. See the **orpc** skill for details.

```
src/ipc/<domain>/
├── handlers.ts   # oRPC handler implementations
├── schemas.ts    # Zod input schemas
└── index.ts      # Barrel export as domain object
```

### schemas.ts

```typescript
// src/ipc/shell/schemas.ts
import z from "zod";

export const openExternalLinkInputSchema = z.object({
  url: z.url(),
});
```

### handlers.ts

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

### index.ts

```typescript
// src/ipc/shell/index.ts
import { openExternalLink } from "./handlers";

export const shell = { openExternalLink };
```

### Router Registration

```typescript
// src/ipc/router.ts
import { shell } from "./shell";
import { theme } from "./theme";
// ...

export const router = { theme, shell /* ... */ };
```

**Checklist for adding a new IPC domain:**

Copy this checklist and track progress:

- [ ] Create `src/ipc/<domain>/schemas.ts` with Zod schemas
- [ ] Create `src/ipc/<domain>/handlers.ts` with oRPC handlers
- [ ] Create `src/ipc/<domain>/index.ts` barrel export
- [ ] Add domain to `src/ipc/router.ts`
- [ ] Create `src/actions/<domain>.ts` renderer wrapper
- [ ] Verify type safety: `ipc.client.<domain>.<method>()` autocompletes

---

## Type-Only Imports

Use `import type` when importing only types/interfaces. This ensures they're erased at compile time and prevents circular dependency issues.

```typescript
// GOOD — type-only import
import type { UpdateInfo, DownloadProgress } from "./types";
import type { ThemeMode } from "@/types/theme-mode";

// GOOD — mixed import (values + types)
import { z } from "zod";
import type { ZodSchema } from "zod";

// BAD — importing types without the type keyword
// (works but prevents tree-shaking and can cause circular import issues)
import { UpdateInfo } from "./types";
```

**Rule:** If the import is only used in type positions (type annotations, interfaces, generics), use `import type`.

---

## Anti-Patterns

### WARNING: Circular Imports

**The Problem:**

```typescript
// src/stores/checklist-store.ts
import { writeFile } from "@/actions/checklist"; // action imports ipc manager

// src/actions/checklist.ts
import { useChecklistStore } from "@/stores/checklist-store"; // CIRCULAR
```

**Why This Breaks:**

1. Module initialization order becomes unpredictable
2. One module gets `undefined` at import time
3. Runtime errors that are hard to debug

**The Fix:** Maintain unidirectional dependency flow:

```
types → schemas → handlers → router → manager → actions → stores → components
```

Actions call IPC. Components call actions and read stores. Stores never import actions.

### WARNING: Re-exporting Everything

```typescript
// BAD — barrel file re-exports everything including internal helpers
export * from "./handlers";
export * from "./schemas";
export * from "./utils";

// GOOD — explicit public API
import { openExternalLink } from "./handlers";
export const shell = { openExternalLink };
```

### WARNING: Default Exports (Except Layouts)

```typescript
// BAD — default exports lose type inference in refactoring
export default function ChecklistTree() { ... }

// GOOD — named exports
export function ChecklistTree() { ... }
```

**Exception:** Layout components use `export default` per TanStack Router convention. See the **tanstack-router** skill.

### WARNING: Importing from `dist/` or Generated Files

```typescript
// BAD — importing from build output
import { something } from "../../dist/main/index";

// BAD — editing auto-generated file
import { routeTree } from "@/routeTree.gen"; // OK to import, NEVER edit

// GOOD — import from source
import { something } from "@/ipc/handler";
```

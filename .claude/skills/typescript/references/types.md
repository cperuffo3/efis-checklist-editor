# TypeScript Types Reference

## Contents

- Type Definition Conventions
- Interface vs Type Alias
- Generics
- Utility Types
- Zod-Inferred Types
- Component Prop Types
- Anti-Patterns

---

## Type Definition Conventions

| Kind           | Convention                     | Example                                          |
| -------------- | ------------------------------ | ------------------------------------------------ |
| Interfaces     | PascalCase, descriptive suffix | `UpdateCheckResult`, `DragWindowRegionProps`     |
| Type aliases   | PascalCase, usually for unions | `type ThemeMode = "dark" \| "light" \| "system"` |
| Enums          | PascalCase members             | `ChecklistItemType.ChallengeResponse`            |
| Generic params | Single letter or descriptive   | `<T>`, `<T = void>`                              |

### Where Types Live

- **Domain types**: `src/types/<domain>.ts` (e.g., `checklist.ts`, `theme-mode.ts`)
- **IPC-specific types**: `src/ipc/<domain>/types.ts` (e.g., `updater/types.ts`)
- **Component props**: Inline above the component in the same file
- **Barrel exports**: `src/types/index.ts`

---

## Interface vs Type Alias

**Use interfaces** for object shapes that may be extended or implemented:

```typescript
// src/ipc/updater/types.ts
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string | ReleaseNoteInfo[];
  releaseName?: string;
}

export interface UpdateCheckResult {
  success: boolean;
  data?: UpdateInfo;
  error?: string;
}
```

**Use type aliases** for unions, intersections, mapped types, and primitives:

```typescript
// src/types/theme-mode.ts
export type ThemeMode = "dark" | "light" | "system";

// Finite state unions
type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";
```

**Rule:** If it's an object shape, use `interface`. If it involves `|`, `&`, conditional types, or mapped types, use `type`.

---

## Generics

### Conditional Callback Type

```typescript
// src/ipc/updater/types.ts
export type UpdateEventCallback<T = void> = T extends void
  ? () => void
  : (data: T) => void;

// Usage
type OnProgress = UpdateEventCallback<DownloadProgress>; // (data: DownloadProgress) => void
type OnComplete = UpdateEventCallback; // () => void
```

### RouterClient Type Inference

The oRPC system infers the full client type from the router object:

```typescript
// src/ipc/manager.ts
import { RouterClient } from "@orpc/server";
import { router } from "./router";

type RPCClient = RouterClient<typeof router>;
// RPCClient has fully typed methods: client.theme.setThemeMode(mode)
```

This is the core type-safety mechanism. See the **orpc** skill.

---

## Utility Types

Use built-in utility types instead of manual type manipulation:

```typescript
// Pick specific fields
type ChecklistSummary = Pick<ChecklistFile, "id" | "name" | "format">;

// Make fields optional for updates
type ChecklistFileUpdate = Partial<ChecklistFileMetadata>;

// Omit fields for creation
type NewChecklist = Omit<Checklist, "id">;

// Record for maps
type ParserRegistry = Record<ChecklistFormat, FormatParser>;

// Extract from union
type NormalCategory = Extract<ChecklistGroupCategory, "Normal">;

// Required — opposite of Partial
type CompleteMetadata = Required<ChecklistFileMetadata>;
```

### WARNING: Don't Redefine What Utility Types Provide

```typescript
// BAD — manually redefining Partial
interface OptionalMetadata {
  aircraftRegistration?: string;
  makeModel?: string;
  copyright?: string;
}

// GOOD
type OptionalMetadata = Partial<ChecklistFileMetadata>;
```

---

## Zod-Inferred Types

See the **zod** skill for full patterns. Zod schemas produce both runtime validation and TypeScript types.

```typescript
import { z } from "zod";

export const setThemeModeInputSchema = z.enum(["light", "dark", "system"]);

// Infer the type from the schema — single source of truth
type SetThemeModeInput = z.infer<typeof setThemeModeInputSchema>;
// Result: "light" | "dark" | "system"

// oRPC handlers infer input types automatically from schemas
export const setThemeMode = os
  .input(setThemeModeInputSchema)
  .handler(({ input: mode }) => {
    // mode is typed as "light" | "dark" | "system" without annotation
  });
```

**Rule:** When a Zod schema exists, use `z.infer<typeof schema>` instead of a separate type definition.

---

## Component Prop Types

### Reuse HTML Element Props

```typescript
import { ComponentProps } from "react";

// Inherits all <a> props: href, className, children, onClick, etc.
export function ExternalLink({
  children,
  className,
  href,
  ...props
}: ComponentProps<"a">) {
  // ...
}
```

### Custom Props Interface

Name it `<Component>Props`, define inline above the component:

```typescript
interface UpdateNotificationProps {
  version: string;
}

export function UpdateNotification({ version }: UpdateNotificationProps) {
  // ...
}
```

### Context Value Interface

```typescript
interface UpdateContextValue {
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  dismiss: () => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);
```

See the **react** skill for more component typing patterns.

---

## Anti-Patterns

### WARNING: Using Enums When Union Types Suffice

```typescript
// BAD for simple string sets — enums add runtime overhead
enum ItemType {
  ChallengeResponse = "ChallengeResponse",
  Title = "Title",
  Note = "Note",
}

// GOOD — zero runtime cost, same type safety
type ItemType = "ChallengeResponse" | "Title" | "Note";
```

**When enums ARE appropriate:** When you need reverse mapping (numeric enums), iteration over members, or the value differs from the key name. For this project, prefer string unions for data model types and `as const` objects for constants.

### WARNING: Redundant Type Annotations

```typescript
// BAD — TypeScript infers this
const name: string = "Preflight";
const items: ChecklistItem[] = [];
const isActive: boolean = true;

// GOOD — let inference work
const name = "Preflight";
const items: ChecklistItem[] = []; // Array type annotation IS needed for empty arrays
const isActive = true;
```

**Exception:** Empty arrays and function parameters always need annotations.

### WARNING: Using `object` or `{}` as Types

```typescript
// BAD — accepts anything
function process(data: object) { ... }
function process(data: {}) { ... }

// GOOD — be specific
function process(data: ChecklistFile) { ... }
function process(data: Record<string, unknown>) { ... }
```

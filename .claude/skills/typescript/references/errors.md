# TypeScript Errors Reference

## Contents

- Common Type Errors and Fixes
- Strict Mode Errors
- Zod/oRPC Type Errors
- React Component Type Errors
- Type Narrowing Fixes
- Validation Workflow

---

## Common Type Errors and Fixes

### TS2322: Type 'X' is not assignable to type 'Y'

Most common error. Usually means a type mismatch at an assignment or function call.

```typescript
// Error: Type 'string' is not assignable to type 'ThemeMode'
const theme: ThemeMode = someString;

// Fix: Validate at the boundary
const theme = setThemeModeInputSchema.parse(someString); // Zod validates
```

### TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'

Function was called with wrong argument types.

```typescript
// Error: ipc.client.theme.setThemeMode expects the Zod schema type
await ipc.client.theme.setThemeMode("invalid-mode");

// Fix: Use the correct value
await ipc.client.theme.setThemeMode("dark");
```

### TS2532: Object is possibly 'undefined'

Strict null checks caught an unguarded access.

```typescript
// Error
this.mainWindow.minimize();

// Fix: Guard first
if (!this.mainWindow) {
  throw new Error("Main window is not set.");
}
this.mainWindow.minimize();
```

### TS7006: Parameter 'x' implicitly has an 'any' type

`noImplicitAny` is enabled. Every parameter needs a type.

```typescript
// Error
function processItems(items) { ... }

// Fix
function processItems(items: ChecklistItem[]) { ... }

// For event handlers
function handleClick(e: React.MouseEvent<HTMLButtonElement>) { ... }

// For catch blocks
try { ... } catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
}
```

---

## Strict Mode Errors

This project has `"strict": true` which enables all of these:

| Flag                           | What It Catches                                         |
| ------------------------------ | ------------------------------------------------------- |
| `strictNullChecks`             | `null` and `undefined` aren't assignable to other types |
| `noImplicitAny`                | Parameters and variables must have explicit types       |
| `strictFunctionTypes`          | Contravariant parameter checking                        |
| `strictPropertyInitialization` | Class properties must be initialized                    |
| `noImplicitThis`               | `this` must have a type                                 |
| `alwaysStrict`                 | Emits `"use strict"`                                    |

### strictPropertyInitialization

```typescript
// Error: Property 'mainWindow' has no initializer
class IPCContext {
  public mainWindow: BrowserWindow;
}

// Fix: Use undefined union
class IPCContext {
  public mainWindow: BrowserWindow | undefined;
}
```

### strictNullChecks with Optional Chaining

```typescript
// Error: 'data' is possibly undefined
const version = result.data.version;

// Fix: Optional chaining
const version = result.data?.version;

// Fix: Nullish coalescing
const notes = result.data?.releaseNotes ?? undefined;
```

---

## Zod/oRPC Type Errors

### Schema Mismatch with Handler

```typescript
// Error: handler input doesn't match schema shape
const schema = z.object({ path: z.string() });
const handler = os.input(schema).handler(({ input }) => {
  input.filePath; // Error: Property 'filePath' does not exist
});

// Fix: Use the field name from the schema
const handler = os.input(schema).handler(({ input }) => {
  input.path; // Correct
});
```

### RouterClient Type Not Updating

If `ipc.client.<domain>.<method>` doesn't autocomplete after adding a new handler:

1. Check the domain is exported from its `index.ts`
2. Check the domain is added to `src/ipc/router.ts`
3. Restart the TypeScript language server (VS Code: Ctrl+Shift+P → "Restart TS Server")

```typescript
// Ensure the router includes the new domain
export const router = {
  theme,
  window,
  app,
  shell,
  updater,
  checklist, // Must be added here
};
```

---

## React Component Type Errors

### TS2786: Component cannot be used as a JSX component

Usually a React version mismatch or conflicting `@types/react`.

```bash
# Fix: Ensure one version of React types
pnpm ls @types/react
# If duplicates, dedupe
pnpm dedupe
```

### Children Type

```typescript
// Error: 'children' is missing in props
interface PanelProps {
  title: string;
}

// Fix: Include children explicitly or use PropsWithChildren
import { PropsWithChildren } from "react";

interface PanelProps {
  title: string;
  children: React.ReactNode;
}
// OR
type PanelProps = PropsWithChildren<{ title: string }>;
```

### Event Handler Types

```typescript
// Error: Parameter 'e' implicitly has an 'any' type
<button onClick={(e) => handleClick(e)} />

// Fix: Type the handler
function handleClick(e: React.MouseEvent<HTMLButtonElement>) { ... }

// Or let TypeScript infer from inline usage (no separate function needed)
<button onClick={(e) => {
  e.preventDefault();
  doSomething();
}} />
```

See the **react** skill for component patterns.

---

## Type Narrowing Fixes

### Unknown to Specific Type

```typescript
// Error: Property 'message' does not exist on type 'unknown'
catch (err) {
  console.error(err.message);
}

// Fix: instanceof guard
catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

### Union Type Narrowing

```typescript
// Error: Property 'note' does not exist on type 'string | ReleaseNoteInfo[]'
const notes: string | ReleaseNoteInfo[] = info.releaseNotes;
notes.forEach(...); // Can't call forEach on string

// Fix: typeof guard
if (Array.isArray(notes)) {
  notes.forEach(n => console.log(n.note));
} else {
  console.log(notes);
}
```

### Nullable Object Access

```typescript
// Error: Cannot read properties of null
const ctx = useContext(UpdateContext); // UpdateContextValue | null
ctx.state; // Error

// Fix: Null check (pattern from this codebase)
export function useUpdateNotification() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("Must be used within UpdateNotificationProvider");
  }
  return context; // Now typed as UpdateContextValue (no null)
}
```

---

## Validation Workflow

When you encounter type errors during development:

1. Run the type checker: `pnpm exec tsc --noEmit`
2. Fix errors reported by the compiler
3. If errors persist, restart TS server in your editor
4. Only proceed to `pnpm run lint` when `tsc` passes

```bash
# Full validation sequence
pnpm exec tsc --noEmit        # Type check only (no emit)
pnpm run lint                  # ESLint with TypeScript rules
pnpm run format                # Prettier formatting
```

Iterate-until-pass:

1. Make changes
2. Run `pnpm exec tsc --noEmit`
3. If type errors remain, fix them and repeat step 2
4. Only proceed to lint/format when types pass

### WARNING: Don't Suppress Errors

```typescript
// NEVER DO THIS
// @ts-ignore
someUntypedCall();

// @ts-expect-error — slightly better but still wrong
someUntypedCall();

// INSTEAD: Fix the underlying type issue or add proper types
```

**The only acceptable `@ts-expect-error`:** In test files, when deliberately testing runtime behavior with bad input. This project has no test files yet, so there should be zero instances.

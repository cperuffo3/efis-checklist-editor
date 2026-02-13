# Prettier Patterns

## Contents

- String Quotes
- Trailing Commas
- Tailwind Class Sorting
- Import Formatting
- JSX Formatting
- Common Mistakes

## String Quotes

This project uses double quotes. Prettier auto-corrects single quotes.

```typescript
// GOOD
import { Button } from "@/components/ui/button";
const message = "Hello world";

// BAD — Prettier will fix this, but write it correctly
import { Button } from "@/components/ui/button";
const message = "Hello world";
```

Template literals are unaffected:

```typescript
// GOOD — backticks for interpolation
const title = `EFIS Editor — ${fileName}`;
```

## Trailing Commas

`"trailingComma": "all"` adds trailing commas everywhere valid — objects, arrays, function parameters, type parameters.

```typescript
// GOOD — trailing commas in all positions
const config = {
  name: "checklist",
  format: "ace",
};

function createItem(type: ChecklistItemType, text: string, indent: number) {
  // ...
}

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

**Why trailing commas everywhere:** Cleaner git diffs. Adding a new item only shows one changed line instead of two (the new line + the comma on the previous line).

### WARNING: Removing Trailing Commas

**The Problem:**

```typescript
// BAD — missing trailing comma after last property
const metadata = {
  registration: "N172SP",
  makeModel: "Cessna 172S",
};
```

**Why This Breaks:** Prettier will re-add the comma on format. If you commit without formatting, ESLint (via `eslint-plugin-prettier`) will flag it. Inconsistent diffs in PRs.

**The Fix:** Always include trailing commas, or run `pnpm run format` before committing.

## Tailwind Class Sorting

`prettier-plugin-tailwindcss` sorts classes into Tailwind's canonical order. This removes debates about class ordering.

```tsx
// GOOD — Prettier will sort these automatically
<div className="border-border bg-surface flex items-center gap-2 border-b px-3.5 py-3">
  <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
    CHECKLIST FILES
  </span>
</div>
```

### Classes Inside `cn()` Are Also Sorted

```tsx
// GOOD — cn() calls are auto-detected
<button
  className={cn(
    "bg-transparent text-muted-foreground",
    isActive && "bg-active text-foreground",
    isDisabled && "cursor-not-allowed opacity-40",
  )}
>
```

### WARNING: Tailwind Plugin Conflicts

**The Problem:**

```tsx
// BAD — string concatenation breaks plugin detection
<div className={"flex " + (isActive ? "bg-active" : "bg-transparent")}>
```

**Why This Breaks:** The Tailwind plugin cannot parse dynamic string concatenation. Classes won't be sorted, and you lose the formatting benefit.

**The Fix:** Use `cn()` for conditional classes:

```tsx
// GOOD
<div className={cn("flex", isActive ? "bg-active" : "bg-transparent")}>
```

## Import Formatting

Prettier handles import line wrapping but does NOT sort imports. Import order follows the project convention in CLAUDE.md:

```typescript
// 1. External packages
import { os } from "@orpc/server";
import { z } from "zod";

// 2. Internal absolute (@/ alias)
import { ipc } from "@/ipc/manager";
import { Button } from "@/components/ui/button";

// 3. Relative imports
import { myInputSchema } from "./schemas";

// 4. Types (with type keyword)
import type { ChecklistFile } from "@/types/checklist";
```

Prettier wraps long named imports:

```typescript
// Prettier wraps this automatically when line exceeds print width
import {
  ChecklistFile,
  ChecklistGroup,
  ChecklistItem,
  ChecklistItemType,
} from "@/types/checklist";
```

## JSX Formatting

Prettier handles JSX attribute line breaks based on line length:

```tsx
// Short — single line
<Button variant="ghost" size="sm" onClick={handleClick}>

// Long — one attribute per line (Prettier decides)
<ChecklistItemRow
  item={item}
  isSelected={item.id === activeItemId}
  isEditing={item.id === editingItemId}
  onSelect={() => setActiveItem(item.id)}
  onDoubleClick={() => setEditingItem(item.id)}
/>
```

## Common Mistakes

### Forgetting to Format After Generating Code

Auto-generated code (shadcn components, route tree) may not match project style. Always run `pnpm run format` after:

- Adding shadcn components (`npx shadcn@latest add ...`)
- Any code generation tool

### Formatting Conflicts With ESLint

See the **eslint** skill. This project uses `eslint-config-prettier` to disable ESLint rules that conflict with Prettier. If you see conflicting rules, the ESLint config may be misconfigured — check that `eslintPluginPrettierRecommended` is included in `eslint.config.mjs`.

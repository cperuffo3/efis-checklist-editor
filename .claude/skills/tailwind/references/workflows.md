# Tailwind CSS Workflows Reference

## Contents

- Adding New Color Tokens
- Adding New Font Families
- Class Sorting and Linting
- Debugging Class Conflicts
- Creating Variant Components

## Adding New Color Tokens

When the EFIS spec requires a new color (e.g., `--bg-elevated`):

Copy this checklist and track progress:

- [ ] Step 1: Add CSS variable to `.dark` block in `src/styles/global.css`
- [ ] Step 2: (Optional) Add to `:root` block if light theme is needed
- [ ] Step 3: Map to Tailwind in `@theme inline` block
- [ ] Step 4: Verify with `pnpm run dev` — the class should autocomplete in IDE

```css
/* src/styles/global.css */

/* Step 1: Add variable */
.dark {
  --bg-elevated: #1c2333;
}

/* Step 3: Map to Tailwind utility */
@theme inline {
  /* existing entries... */
  --color-bg-elevated: var(--bg-elevated);
}
```

**Result:** `bg-bg-elevated`, `text-bg-elevated`, `border-bg-elevated` are now available.

### Naming Convention

| Token Type | CSS Variable Pattern | Tailwind Mapping               | Usage                  |
| ---------- | -------------------- | ------------------------------ | ---------------------- |
| Background | `--bg-*`             | `--color-bg-*`                 | `bg-bg-surface`        |
| Text       | `--text-*`           | `--color-text-*`               | `text-text-primary`    |
| Semantic   | `--green`, `--red`   | `--color-green`, `--color-red` | `text-green`, `bg-red` |
| Border     | `--border-*`         | `--color-border-*`             | `border-border-light`  |

**Note:** Tokens like `--color-foreground` map directly (no prefix duplication) because shadcn/ui established the convention: `bg-foreground`, `text-foreground`.

## Adding New Font Families

JetBrains Mono needs to be added for monospace elements (dot leaders, file extensions):

Copy this checklist and track progress:

- [ ] Step 1: Install `@fontsource-variable/jetbrains-mono`
- [ ] Step 2: Import in `global.css`
- [ ] Step 3: Add `--font-mono` to `@theme inline`
- [ ] Step 4: Use as `font-mono` in components

```bash
pnpm add @fontsource-variable/jetbrains-mono
```

```css
/* src/styles/global.css */
@import "@fontsource-variable/jetbrains-mono";

@theme inline {
  --font-sans: "Inter Variable", sans-serif;
  --font-mono: "JetBrains Mono Variable", monospace;
}
```

```tsx
// Dot leaders in challenge/response items
<span className="text-muted font-mono text-xs tracking-[2px]">····</span>
```

## Class Sorting and Linting

This project enforces Tailwind class ordering with two tools:

### Prettier (Auto-Sort on Format)

`prettier-plugin-tailwindcss` automatically sorts classes in canonical order. See the **prettier** skill.

```bash
pnpm run format
```

### ESLint (Canonical Classes Warning)

`eslint-plugin-tailwind-canonical-classes` warns when classes aren't in canonical order. See the **eslint** skill.

```bash
pnpm run lint
```

### Validation Loop

1. Write component with Tailwind classes
2. Run `pnpm run format` — auto-sorts classes
3. Run `pnpm run lint` — checks for remaining issues
4. If lint fails on class ordering, re-run format and check again

## Debugging Class Conflicts

When classes don't seem to apply:

### Problem: Specificity Conflict

```tsx
// cn() resolves conflicts — last class wins for same property
cn("px-2 px-4"); // → "px-4" (tailwind-merge deduplicates)
cn("bg-primary", "bg-secondary"); // → "bg-secondary"
```

### Problem: Arbitrary Value Not Working

```tsx
// BAD — arbitrary values may conflict with theme tokens
<div className="bg-[#0d1117]" />

// GOOD — if the color is needed, add it as a token first
// Then: <div className="bg-bg-base" />
```

### Problem: Class Not Generating

If a Tailwind class doesn't produce CSS:

1. Check the class exists in Tailwind CSS 4 (some v3 classes changed)
2. Check if it's a custom token — verify it's in `@theme inline`
3. Check for typos in the `--color-*` mapping
4. Restart the dev server: `pnpm run dev`

### Problem: Dark Mode Not Applying

This project uses `@custom-variant dark (&:is(.dark *))`:

```tsx
// BAD — v3 dark: prefix pattern
<div className="bg-white dark:bg-slate-900" />

// GOOD — tokens handle dark/light via CSS variables
<div className="bg-background" />
// The --background variable changes value in .dark {} block
```

## Creating Variant Components

For components with multiple visual states, use `cva()` from `class-variance-authority`. See the **shadcn-ui** skill for full details.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/tailwind";

const itemVariants = cva(
  // Base classes applied to all variants
  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors",
  {
    variants: {
      state: {
        default: "text-muted-foreground",
        hover: "bg-hover text-foreground",
        active: "bg-active text-foreground",
        selected: "bg-accent-dim text-accent",
      },
      type: {
        normal: "border-l-2 border-green",
        emergency: "border-l-2 border-red",
        abnormal: "border-l-2 border-yellow",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

interface ItemProps extends VariantProps<typeof itemVariants> {
  className?: string;
}

function Item({ state, type, className }: ItemProps) {
  return <div className={cn(itemVariants({ state, type }), className)} />;
}
```

### EFIS Button Patterns

The toolbar uses specific button states from the UI spec:

```tsx
// Ghost toolbar button
<button className={cn(
  "flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs",
  "bg-transparent text-muted-foreground",
  "hover:bg-hover hover:text-foreground",
  "active:bg-active",
  "disabled:cursor-not-allowed disabled:opacity-40",
)} />

// Primary toolbar button (Quick Export)
<button className={cn(
  "flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs",
  "border border-accent/25 bg-accent-dim text-accent",
  "hover:bg-accent/20 hover:text-accent-hover",
)} />
```

## Responsive Panel Behavior

The EFIS editor adapts to window width with conditional rendering. Since this is an Electron app, use fixed widths and store-driven visibility rather than CSS breakpoints:

```tsx
// Panel visibility controlled by Zustand store, not CSS media queries
// See the **zustand** skill for panel state management

<aside
  className={cn(
    "border-border bg-surface shrink-0 border-r transition-none",
    sidebarVisible ? "w-[260px]" : "hidden",
  )}
/>
```

**Why not CSS breakpoints?** Electron window size changes trigger React re-renders. Using store-driven visibility with `hidden` class is simpler and avoids layout thrashing from CSS-only responsive approaches.

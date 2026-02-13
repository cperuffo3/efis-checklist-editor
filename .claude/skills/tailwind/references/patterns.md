# Tailwind CSS Patterns Reference

## Contents

- Theme Token Architecture
- Color Token Mapping
- EFIS-Specific Tokens (Planned)
- Class Composition with cn()
- Anti-Patterns
- Component Styling Patterns

## Theme Token Architecture

Tailwind CSS 4 uses CSS-first configuration. This project has **no `tailwind.config` file**. All customization happens in `src/styles/global.css`:

1. **CSS variables** in `:root` (light) and `.dark` (dark) define values
2. **`@theme inline`** block maps variables to Tailwind utilities
3. **`@custom-variant dark`** enables the `.dark` class selector

```css
/* Step 1: Define the variable */
:root {
  --accent: oklch(0.97 0 0);
}
.dark {
  --accent: oklch(0.371 0 0);
}

/* Step 2: Map to Tailwind utility in @theme inline */
@theme inline {
  --color-accent: var(--accent);
}

/* Step 3: Use in JSX */
/* <div className="bg-accent text-accent-foreground" /> */
```

## Color Token Mapping

The `@theme inline` block uses a specific naming convention to generate utilities:

| CSS Variable in `@theme inline` | Generated Tailwind Utilities                            |
| ------------------------------- | ------------------------------------------------------- |
| `--color-background`            | `bg-background`, `text-background`, `border-background` |
| `--color-primary`               | `bg-primary`, `text-primary`, `border-primary`          |
| `--color-muted-foreground`      | `text-muted-foreground`, `bg-muted-foreground`          |
| `--font-sans`                   | `font-sans`                                             |
| `--radius-lg`                   | `rounded-lg`                                            |

## EFIS-Specific Tokens (Planned)

The UI spec defines custom tokens not yet in `global.css`. When adding them, follow this pattern:

```css
/* In .dark block (dark-only MVP) */
.dark {
  --bg-base: #0d1117;
  --bg-surface: #161b22;
  --bg-elevated: #1c2333;
  --bg-hover: #292e3e;
  --green: #3fb950;
  --green-dim: #1a3a2a;
  --red: #f85149;
  --red-dim: #3d1418;
}

/* In @theme inline */
@theme inline {
  /* existing entries... */
  --color-bg-base: var(--bg-base);
  --color-bg-surface: var(--bg-surface);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-hover: var(--bg-hover);
  --color-green: var(--green);
  --color-green-dim: var(--green-dim);
  --color-red: var(--red);
  --color-red-dim: var(--red-dim);
}
```

This generates: `bg-bg-base`, `bg-bg-surface`, `text-green`, `bg-green-dim`, etc.

## Class Composition with cn()

Always use `cn()` from `@/utils/tailwind` for dynamic classes:

```tsx
import { cn } from "@/utils/tailwind";

// Conditional classes
<div
  className={cn(
    "flex items-center px-3.5 py-1.5 text-xs",
    isActive ? "bg-active text-foreground" : "text-muted-foreground",
    className, // Always pass through for composability
  )}
/>;
```

### When to Use cn()

- Component accepts a `className` prop (always merge it)
- Conditional styling based on state/props
- Combining `cva()` output with additional classes

### When NOT to Use cn()

- Static class strings with no conditions — just use a string literal
- No `className` prop passthrough needed

## Anti-Patterns

### WARNING: Hardcoded Color Values

**The Problem:**

```tsx
// BAD — bypasses theme system, won't respond to dark/light mode
<div className="bg-[#0d1117] text-[#e6edf3]" />
<div style={{ backgroundColor: "#161b22" }} />
```

**Why This Breaks:**

1. Colors won't adapt to theme changes
2. No single source of truth — scattered magic values
3. ESLint `tailwind-canonical-classes` may flag arbitrary values

**The Fix:**

```tsx
// GOOD — uses design tokens
<div className="bg-background text-foreground" />

// If you need a custom color, add it to global.css first
// Then reference it: <div className="bg-bg-surface" />
```

### WARNING: Inline Styles

**The Problem:**

```tsx
// BAD — NEVER use inline styles in this project
<div style={{ display: "flex", gap: "8px", padding: "16px" }} />
```

**Why This Breaks:**

1. Violates project's CLAUDE.md styling rules (hard requirement)
2. Not sorted by Prettier, not validated by ESLint
3. Can't be purged or optimized by Tailwind

**The Fix:**

```tsx
// GOOD
<div className="flex gap-2 p-4" />
```

### WARNING: String Concatenation Instead of cn()

**The Problem:**

```tsx
// BAD — template literals don't handle undefined/false/null safely
className={`px-2 ${isActive ? "bg-primary" : ""} ${className}`}
```

**Why This Breaks:**

1. Produces extra spaces and `undefined` in class strings
2. Conflicting classes aren't merged (e.g., `px-2` and `px-4` both stay)
3. `tailwind-merge` deduplication is bypassed

**The Fix:**

```tsx
// GOOD — cn() handles all edge cases
className={cn("px-2", isActive && "bg-primary", className)}
```

### WARNING: Using Tailwind v3 Syntax

**The Problem:**

```tsx
// BAD — v3 dark: prefix doesn't work with this config
<div className="bg-white dark:bg-gray-900" />
```

**Why This Breaks:**

- This project uses `@custom-variant dark (&:is(.dark *))` — the dark mode variant works via CSS variables, not the `dark:` prefix on individual utilities
- Theme colors already adapt via CSS variables in the `.dark` block

**The Fix:**

```tsx
// GOOD — semantic tokens handle light/dark automatically
<div className="bg-background" />
// bg-background resolves to different oklch values in :root vs .dark
```

## Component Styling Patterns

### Panel Layout (EFIS 4-Panel)

```tsx
// Outer layout — full viewport, no overflow
<div className="flex h-screen flex-col overflow-hidden">
  {/* Fixed toolbar */}
  <div className="border-border bg-surface h-[44px] shrink-0 border-b" />

  {/* Main content row */}
  <div className="flex min-h-0 flex-1">
    <aside className="border-border bg-surface w-[260px] shrink-0 border-r" />
    <main className="bg-base min-w-0 flex-1" />
    <aside className="border-border bg-surface w-[280px] shrink-0 border-l" />
  </div>

  {/* Fixed status bar */}
  <div className="border-border bg-surface h-[26px] shrink-0 border-t" />
</div>
```

### Interactive List Items

```tsx
<div
  className={cn(
    "flex items-center gap-2 px-3.5 py-1.5 text-xs transition-colors duration-150",
    "text-muted-foreground hover:bg-hover hover:text-foreground",
    isActive && "bg-active text-foreground",
  )}
/>
```

### Section Headers (EFIS Style)

```tsx
<h3 className="text-muted-foreground px-3.5 py-3 text-[11px] font-semibold tracking-wide uppercase">
  Checklist Files
</h3>
```

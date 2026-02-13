# Aesthetics Reference

## Contents

- Color System
- Typography
- Visual Identity
- Icon System
- WARNING: Hardcoded Colors

## Color System

The EFIS editor uses a GitHub-dark-inspired palette. All colors are defined as CSS variables in `src/styles/global.css` and mapped to Tailwind via `@theme inline`.

### Background Scale (7 levels)

Dark UI needs clear depth hierarchy. Each level serves a specific purpose:

```
#010409  bg-base-deepest   Title bar (deepest)
#0d1117  bg-base            Editor body, main content
#161b22  bg-surface         Sidebar, toolbar, status bar, properties
#1c2333  bg-elevated        Inputs, modal body, cards
#21283b  bg-overlay         Badges, floating overlays
#292e3e  bg-hover           Interactive hover state
#2d3548  bg-active          Active/pressed state
```

### Semantic Accent Colors

Each accent color has a `dim` variant for backgrounds:

```tsx
// Normal group (green)
<div className="bg-green-dim text-green">✓</div>

// Emergency group (red)
<div className="bg-red-dim text-red">!</div>

// Abnormal group (yellow)
<div className="bg-yellow-dim text-yellow">⚠</div>

// Accent (blue) — selection, links
<div className="bg-accent-dim text-accent">Selected</div>
```

| Color  | Foreground | Background (dim) | Usage                                 |
| ------ | ---------- | ---------------- | ------------------------------------- |
| Green  | `#3fb950`  | `#1a3a2a`        | Normal group, success, save indicator |
| Red    | `#f85149`  | `#3d1418`        | Emergency group, errors, delete       |
| Yellow | `#d29922`  | `#3d2e00`        | Abnormal group, warnings              |
| Orange | `#db6d28`  | —                | Caution items, GRT format             |
| Purple | `#a371f7`  | —                | Title/section items, Dynon format     |
| Cyan   | `#39d2c0`  | —                | ForeFlight format                     |
| Accent | `#58a6ff`  | `#1f3a5f`        | Links, selection, primary actions     |

### Text Hierarchy

Three tiers only. Do not invent intermediate levels:

```tsx
// Primary — main content, active items
<span className="text-foreground">Parking Brake</span>    // #e6edf3

// Secondary — labels, supporting text
<span className="text-muted-foreground">24 items</span>   // #8b949e (mapped to --text-secondary)

// Muted — placeholders, disabled, dot leaders
<span className="text-muted">Search checklists...</span>  // #5a6370 (mapped to --text-muted)
```

### Border Tokens

```tsx
// Standard border — panels, dividers, inputs
<div className="border border-border" />     // #30363d

// Emphasis border — hover states
<div className="border border-border-light" /> // #3a4250
```

## Typography

### Fonts

- **Inter Variable** — all UI text. Already installed via `@fontsource-variable/inter`.
- **JetBrains Mono** — dot leaders, file extensions, monospace content. Install via `@fontsource-variable/jetbrains-mono`.

### Size Scale

The editor uses explicit pixel sizes, not Tailwind's `text-sm`/`text-base` scale:

| Size | Usage                                          | Tailwind Class             |
| ---- | ---------------------------------------------- | -------------------------- |
| 18px | Checklist name in editor header                | `text-lg font-semibold`    |
| 13px | Body text, item content, challenge/response    | `text-[13px]`              |
| 12px | File list items, secondary text                | `text-[12px]` or `text-xs` |
| 11px | Labels, captions, section headers, breadcrumbs | `text-[11px]`              |
| 10px | Badges, format pills                           | `text-[10px]`              |

### Section Header Pattern

All panel/section headers use the same typography:

```tsx
<span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
  ITEM PROPERTIES
</span>
```

## Visual Identity

What makes this editor distinctive:

1. **IDE-density** — 13px base font, tight padding (`py-1.5`), dense info display
2. **GitHub-dark palette** — not generic dark gray; specifically `#0d1117` base
3. **Colored semantic markers** — green/red/yellow group icons, purple titles, blue accent
4. **Dot leaders** — monospace dots between challenge and response text
5. **Indent guides** — vertical lines with tick connectors (VS Code-style)

### WARNING: Generic Dark Theme

**The Problem:** Using generic dark grays (`#1a1a1a`, `#2d2d2d`, `#333`) instead of the GitHub-dark palette.

**Why This Breaks:** The 7-level background scale creates intentional depth. Random grays destroy the visual hierarchy and make the interface feel flat and unpolished.

**The Fix:** Always use the defined background tokens. If you need a new shade, it should fit between existing levels and be added to the theme system.

## Icon System

The project currently uses FontAwesome (`@fortawesome/react-fontawesome`). The implementation plan specifies migrating to **Lucide React** for consistency with shadcn/ui.

See the **lucide-react** skill for icon sizing and usage conventions.

### Icon Sizing in EFIS Context

```tsx
// Toolbar buttons — standard
<Import className="size-3.5" />

// Tree panel group icons — 18x18 rounded square
<div className="flex size-[18px] items-center justify-center rounded-sm bg-green-dim">
  <Check className="size-3 text-green" />
</div>

// Status bar — small
<Circle className="size-2 fill-green text-green" />
```

## WARNING: Hardcoded Colors

**The Problem:**

```tsx
// BAD — hardcoded hex values
<div className="bg-[#161b22] text-[#e6edf3] border-[#30363d]">
```

**Why This Breaks:**

1. Bypasses the design token system — no single source of truth
2. Cannot be updated globally if palette changes
3. Inconsistent when multiple developers add similar-but-different values

**The Fix:**

```tsx
// GOOD — use design tokens
<div className="bg-bg-surface text-foreground border-border">
```

**When You Might Be Tempted:** When a color from the UI spec doesn't have a token yet. Instead of hardcoding, add the token to `global.css` first.

# Patterns Reference

## Contents

- Design Rules
- DO/DON'T Pairs
- Anti-Patterns
- New Component Checklist
- IDE Density Guidelines
- Indent Guide System

## Design Rules

1. **Token-first** — every color, spacing value, and font size should reference a design token
2. **Dark-only MVP** — do not add `:root` / light mode values for new EFIS tokens
3. **IDE density** — 13px body, tight padding, maximize information per pixel
4. **Consistent depth** — background level communicates hierarchy (deepest = title bar, surface = panels)
5. **Semantic color** — green = normal/success, red = emergency/error, yellow = abnormal/warning
6. **Show on hover** — drag handles, action buttons, and secondary controls appear on row hover
7. **Instant selection** — no transition on selected state, keyboard navigation must feel immediate

## DO/DON'T Pairs

### DO: Use the background scale for depth

```tsx
// GOOD — clear visual hierarchy
<div className="bg-bg-base-deepest">     {/* Title bar */}
  <div className="bg-bg-surface">        {/* Toolbar */}
    <div className="bg-bg-base">          {/* Editor body */}
      <div className="bg-bg-elevated">    {/* Input field */}
```

### DON'T: Use random dark grays

```tsx
// BAD — arbitrary grays with no relationship
<div className="bg-[#1a1a1a]">
  <div className="bg-[#2a2a2a]">
    <div className="bg-[#333]">
```

### DO: Use explicit pixel sizes for text

```tsx
// GOOD — matches the design spec exactly
<span className="text-[13px]">Body text</span>
<span className="text-[11px] font-semibold uppercase tracking-wide">LABEL</span>
<span className="text-[10px]">Badge text</span>
```

### DON'T: Use Tailwind's default text scale

```tsx
// BAD — text-sm is 14px, text-xs is 12px, neither matches 13px or 11px
<span className="text-sm">Body text</span>
<span className="text-xs font-semibold uppercase">LABEL</span>
```

**Exception:** `text-xs` (12px) is fine for file list items and secondary text where 12px is the spec.

### DO: Use group/hover for revealing actions

```tsx
// GOOD — actions hidden until row hover
<div className="group flex items-center">
  <span>{name}</span>
  <div className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    <Button variant="ghost" size="icon-xs">
      <Trash2 className="size-3" />
    </Button>
  </div>
</div>
```

### DON'T: Show all actions all the time

```tsx
// BAD — cluttered, overwhelming in dense lists
<div className="flex items-center">
  <span>{name}</span>
  <Button size="icon-xs">
    <Pencil />
  </Button>
  <Button size="icon-xs">
    <Copy />
  </Button>
  <Button size="icon-xs">
    <Trash2 />
  </Button>
</div>
```

### DO: Use cn() for conditional classes

```tsx
// GOOD — clean conditional styling
<div className={cn(
  "flex items-center px-3.5 py-1.5",
  isActive && "bg-accent-dim text-accent",
  !isActive && "text-muted-foreground hover:bg-hover hover:text-foreground"
)}>
```

### DON'T: Use ternary expressions inline

```tsx
// BAD — hard to read, error-prone
<div className={`flex items-center px-3.5 py-1.5 ${isActive ? "bg-accent-dim text-accent" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`}>
```

### DO: Use Separator for toolbar dividers

```tsx
// GOOD — consistent with shadcn/ui patterns
<Separator orientation="vertical" className="mx-1 h-5" />
```

### DON'T: Use border or custom divs

```tsx
// BAD — inconsistent divider styling
<div className="mx-1 h-5 w-px bg-gray-600" />
```

## Anti-Patterns

### WARNING: Inline Styles

**The Problem:**

```tsx
// BAD — inline style for any reason
<div style={{ backgroundColor: "#161b22", height: 44 }}>
```

**Why This Breaks:**

1. Cannot be overridden with Tailwind's responsive/state modifiers
2. Not checked by ESLint `tailwind-canonical-classes` rule
3. Bypasses the `cn()` merge system — class conflicts unresolved
4. Not compatible with Prettier's tailwind class sorting

**The Fix:**

```tsx
// GOOD — Tailwind classes only
<div className="h-11 bg-bg-surface">
```

**One Exception:** `WebkitAppRegion: "no-drag"` for Electron window button regions — no Tailwind equivalent exists.

### WARNING: Inconsistent Panel Headers

**The Problem:** Panel headers styled differently across sidebar, tree, and properties panels.

**The Fix:** Extract a shared pattern:

```tsx
// Consistent section header used across all panels
function SectionHeader({
  children,
  action,
}: {
  children: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border flex items-center justify-between border-b px-3.5 py-3">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {children}
      </span>
      {action}
    </div>
  );
}
```

### WARNING: Missing Focus States

**The Problem:** Interactive elements without visible focus indicators break keyboard navigation.

**The Fix:** shadcn/ui components include focus states by default. For custom interactive elements:

```tsx
// Custom focusable element
<button className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
```

## New Component Checklist

Copy this checklist when building a new editor component:

- [ ] File created in `src/components/editor/`
- [ ] Props interface defined with `<Component>Props` naming
- [ ] Uses `cn()` for conditional classes
- [ ] All colors use design tokens (no hardcoded hex)
- [ ] Text sizes use explicit pixel values (`text-[13px]`, `text-[11px]`)
- [ ] Interactive states: hover (`bg-hover`), active (`bg-active`), selected (`bg-accent-dim`)
- [ ] Hover-reveal elements use `group` + `opacity-0 group-hover:opacity-100`
- [ ] Focus states present on all interactive elements
- [ ] Transitions use 150ms ease (not `transition-all`)
- [ ] Component exported from barrel `index.ts` if in a group

## IDE Density Guidelines

### Spacing Scale

The EFIS editor is denser than typical web apps:

| Context       | Vertical Padding          | Horizontal Padding |
| ------------- | ------------------------- | ------------------ |
| Item rows     | `py-1.5` (6px)            | `px-3.5` (14px)    |
| Panel headers | `py-2.5`-`py-3` (10-12px) | `px-3.5` (14px)    |
| Editor header | `pt-4 pb-3` (16px/12px)   | `px-6` (24px)      |
| Toolbar       | centered in `h-11`        | `px-2` (8px)       |
| Status bar    | centered in `h-[26px]`    | `px-3` (12px)      |

### Row Heights

| Element       | Height | Notes            |
| ------------- | ------ | ---------------- |
| Title bar     | 38px   | `h-[38px]`       |
| Toolbar       | 44px   | `h-11`           |
| Item row      | 32px   | `h-8`            |
| File list row | auto   | `py-1.5` (~28px) |
| Status bar    | 26px   | `h-[26px]`       |

## Indent Guide System

Each indent level adds a 20px guide column with vertical lines and tick connectors:

```tsx
interface IndentGuidesProps {
  depth: number;
  isLast: boolean;
}

export function IndentGuides({ depth, isLast }: IndentGuidesProps) {
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <div key={i} className="relative flex w-5 items-stretch justify-center">
          {/* Vertical guide line */}
          {i < depth - 1 && <div className="bg-border w-px opacity-50" />}
          {/* Last column: vertical line + tick connector */}
          {i === depth - 1 && (
            <>
              <div
                className={cn("bg-border w-px opacity-50", isLast && "h-1/2")}
              />
              <div className="bg-border absolute bottom-1/2 left-1/2 h-px w-2 opacity-50" />
            </>
          )}
        </div>
      ))}
    </>
  );
}
```

The indent system is purely visual. Item hierarchy is inferred from position + indent level in the flat array. See the **zustand** skill for state management of checklist items.

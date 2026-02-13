# Motion Reference

## Contents

- Animation Philosophy
- Transition Timing
- CSS Transitions
- Modal Animations
- Collapse/Expand
- Drag & Drop Motion
- WARNING: Over-Animating

## Animation Philosophy

The EFIS editor is a productivity tool. Motion serves two purposes:

1. **Feedback** — confirming user actions happened (hover, press, toggle)
2. **Orientation** — showing spatial relationships (expand, collapse, modal entry)

Motion should never delay the user. Keep durations short (150-200ms) and use `ease` timing.

## Transition Timing

| Element              | Duration | Easing | Notes                    |
| -------------------- | -------- | ------ | ------------------------ |
| Button hover         | 150ms    | ease   | Background color change  |
| Modal open           | 200ms    | ease   | Scale + fade + translate |
| Modal close          | 150ms    | ease   | Faster than open         |
| Collapse chevron     | 150ms    | ease   | Rotate 0 to -90deg       |
| Collapse children    | 200ms    | ease   | Height animation         |
| Drag handle appear   | 150ms    | ease   | Opacity 0 to 1           |
| Hover actions appear | 150ms    | ease   | Opacity 0 to 1           |
| Toast notification   | 200ms    | ease   | Slide from bottom-right  |
| Shortcuts hint       | 300ms    | ease   | Opacity fade             |
| Selected item        | 0ms      | —      | Instant, no transition   |
| Panel toggle         | 0ms      | —      | Instant show/hide        |

## CSS Transitions

### Button Hover State

```tsx
// Already handled by shadcn Button's transition-all
// Just apply different background colors
<Button
  variant="ghost"
  className="text-muted-foreground hover:bg-hover hover:text-foreground"
>
```

### Hover-Reveal Elements (Drag Handles, Actions)

```tsx
// Parent uses group, child transitions opacity
<div className="group flex items-center">
  {/* Drag handle — hidden until row hover */}
  <div className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    <GripVertical className="text-muted size-3.5" />
  </div>

  {/* Content */}
  <span>{item.name}</span>

  {/* Action buttons — hidden until row hover */}
  <div className="ml-auto opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    <Button variant="ghost" size="icon-xs">
      <Pencil className="size-3" />
    </Button>
  </div>
</div>
```

### Active File Indicator

The left accent bar on the active file appears instantly (no transition):

```tsx
<div className={cn(
  "flex items-center px-3.5 py-1.5",
  isActive && "border-l-[3px] border-accent bg-active text-foreground",
  !isActive && "text-muted-foreground hover:bg-hover hover:text-foreground"
)}>
```

## Modal Animations

shadcn/ui Dialog uses Radix data attributes for animation state. The existing component handles enter/exit animations via `tw-animate-css`:

```tsx
// DialogOverlay
// data-open:animate-in data-open:fade-in-0
// data-closed:animate-out data-closed:fade-out-0

// DialogContent
// data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-left-1/2 data-open:slide-in-from-top-[48%]
// data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-left-1/2 data-closed:slide-out-to-top-[48%]
```

The EFIS Export Modal uses the same Dialog component. No custom animation needed — shadcn handles it.

### Toast Notifications

Sonner handles toast animations. Configure position and theme:

```tsx
// In App.tsx or editor layout
<Toaster position="bottom-right" theme="dark" />
```

See the **sonner** skill for toast usage patterns.

## Collapse/Expand

### Chevron Rotation

```tsx
// Chevron rotates between expanded (0deg) and collapsed (-90deg)
<ChevronDown
  className={cn(
    "size-3.5 transition-transform duration-150",
    isCollapsed && "-rotate-90",
  )}
/>
```

### Section Children Height Animation

For collapsible sections (title items with children), animate height:

```tsx
// Simple CSS approach — works for known-height content
<div
  className={cn(
    "overflow-hidden transition-[grid-template-rows] duration-200",
    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
  )}
>
  <div className="min-h-0">{children}</div>
</div>
```

Alternative: use `grid-template-rows` trick for animating to/from `auto` height:

```tsx
// Grid-based height animation
<div className="grid" style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}>
  <div className="overflow-hidden transition-[grid-template-rows] duration-200">
    {children}
  </div>
</div>
```

**Note:** For MVP, panel toggle is instant (no animation). Only item collapse within the editor needs height animation.

## Drag & Drop Motion

See the **dnd-kit** skill for implementation details. Motion-specific considerations:

### Drag Preview

```tsx
// Item being dragged — reduced opacity with shadow
<div className={cn(
  "flex items-center",
  isDragging && "opacity-70 shadow-lg"
)}>
```

### Drop Indicator

```tsx
// Horizontal line showing where item will drop
<div className="bg-accent h-0.5" />
```

### Drag Cursor

```tsx
// Drag handle uses grab cursor
<div className="cursor-grab active:cursor-grabbing">
  <GripVertical className="size-3.5" />
</div>
```

## WARNING: Over-Animating

**The Problem:**

```tsx
// BAD — transition on everything, including selection
<div className="transition-all duration-300">
  {/* Item row with background transition on select */}
</div>
```

**Why This Breaks:**

1. Selection must be instant — 300ms delay feels laggy when keyboard-navigating with arrow keys
2. `transition-all` animates layout properties (width, height) causing jank
3. Dense lists with many animated items hurt performance

**The Fix:**

```tsx
// GOOD — only transition what needs animating
<div
  className={cn(
    isSelected && "bg-accent-dim", // Instant — no transition class
    !isSelected && "hover:bg-elevated", // Hover gets transition from Button defaults
  )}
>
  {/* Only opacity/transform transitions on specific children */}
  <div className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    {/* hover-reveal content */}
  </div>
</div>
```

**Rule of thumb:**

- `transition-opacity` — safe, always performant
- `transition-transform` — safe, GPU-accelerated
- `transition-colors` — safe for buttons, avoid on large surfaces
- `transition-all` — AVOID in lists and dense UI

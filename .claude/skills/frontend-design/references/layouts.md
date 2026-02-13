# Layouts Reference

## Contents

- 4-Panel IDE Layout
- Panel Sizing
- Title Bar
- Toolbar
- Status Bar
- Responsive Behavior
- WARNING: Flex Layout Pitfalls

## 4-Panel IDE Layout

The editor uses a vertical flex column with a horizontal flex row for the main content:

```
┌──────────────────────────────────────────────────────┐
│ Title Bar (38px, bg-base-deepest)                     │
├──────────────────────────────────────────────────────┤
│ Toolbar (44px, bg-surface)                            │
├──────────┬────────────┬──────────────┬───────────────┤
│ Files    │ Checklist  │ Editor       │ Properties    │
│ Sidebar  │ Tree       │ (flex-1)     │ Panel         │
│ (260px)  │ (280px)    │              │ (280px)       │
│ bg-      │ bg-base    │ bg-base      │ bg-surface    │
│ surface  │            │              │               │
├──────────┴────────────┴──────────────┴───────────────┤
│ Status Bar (26px, bg-surface)                         │
└──────────────────────────────────────────────────────┘
```

### EditorLayout Implementation

```tsx
export default function EditorLayout() {
  const { propertiesPanelVisible, sidebarVisible } = useUiStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Title bar — deepest background, drag region */}
      <DragWindowRegion title="EFIS Editor" subtitle={activeFileName} />

      {/* Toolbar — fixed 44px height */}
      <Toolbar />

      {/* Main content — horizontal flex, takes remaining space */}
      <div className="flex min-h-0 flex-1">
        {sidebarVisible && <FilesSidebar />}
        <ChecklistTree />
        <ChecklistEditor />
        {propertiesPanelVisible && <PropertiesPanel />}
      </div>

      {/* Status bar — fixed 26px height */}
      <StatusBar />
    </div>
  );
}
```

**Critical:** `min-h-0` on the flex row prevents content overflow. Without it, flex children with scrollable content will blow out the layout.

## Panel Sizing

### Fixed-Width Panels

```tsx
// Files sidebar — 260px, surface background, right border
<div className="flex w-[260px] flex-col border-r border-border bg-bg-surface">

// Checklist tree — 280px, base background, right border
<div className="flex w-[280px] flex-col border-r border-border bg-bg-base">

// Properties panel — 280px, surface background, left border
<div className="flex w-[280px] flex-col border-l border-border bg-bg-surface">
```

### Flexible Editor Panel

```tsx
// Editor — takes all remaining horizontal space
<div className="flex min-w-0 flex-1 flex-col bg-bg-base">
```

### Panel Internal Structure

Every panel follows the same vertical pattern:

```tsx
<div className="border-border bg-bg-surface flex w-[280px] flex-col border-r">
  {/* Fixed header */}
  <div className="border-border border-b px-3.5 py-2.5">
    {/* Header content */}
  </div>

  {/* Scrollable body */}
  <ScrollArea className="flex-1">{/* Panel content */}</ScrollArea>
</div>
```

## Title Bar

```tsx
// 38px tall, deepest background, drag region
<div className="draglayer border-border bg-bg-base-deepest flex h-[38px] items-center border-b px-4">
  <span className="text-foreground text-xs font-semibold">EFIS Editor</span>
  <span className="text-muted-foreground text-xs"> — </span>
  <span className="text-muted-foreground text-xs">{activeFileName}</span>

  {/* Window controls (Windows/Linux only) — not draggable */}
  <div className="ml-auto flex" style={{ WebkitAppRegion: "no-drag" }}>
    <WindowControls />
  </div>
</div>
```

**Note:** Window buttons use the one exception to the "no inline styles" rule — `WebkitAppRegion: "no-drag"` is required by Electron and has no Tailwind equivalent for the `no-drag` value. The `.draglayer` class in `global.css` handles the `drag` value.

## Toolbar

```tsx
// 44px tall, surface background, horizontal flex with dividers
<div className="border-border bg-bg-surface flex h-11 items-center gap-1 border-b px-2">
  {/* Group: Import/Export */}
  <ToolbarButton>
    <Upload className="size-3.5" />
    Import
  </ToolbarButton>
  <ToolbarButton>
    <Download className="size-3.5" />
    Export
  </ToolbarButton>

  <Separator orientation="vertical" className="mx-1 h-5" />

  {/* Group: Undo/Redo */}
  <Button variant="ghost" size="icon-sm" disabled={!canUndo}>
    <Undo2 className="size-3.5" />
  </Button>
  <Button variant="ghost" size="icon-sm" disabled={!canRedo}>
    <Redo2 className="size-3.5" />
  </Button>

  <Separator orientation="vertical" className="mx-1 h-5" />

  {/* Group: Add */}
  <ToolbarButton>
    <Plus className="size-3.5" />
    Item
  </ToolbarButton>
  <ToolbarButton>
    <ListPlus className="size-3.5" />
    Checklist
  </ToolbarButton>

  {/* Spacer */}
  <div className="flex-1" />

  {/* Search trigger */}
  <button className="border-border bg-bg-elevated text-muted flex min-w-[220px] items-center gap-2 rounded-md border px-3 py-1 text-[12px]">
    <Search className="size-3.5" />
    Search checklists...
    <kbd className="border-border ml-auto rounded border px-1 text-[10px]">
      ⌘K
    </kbd>
  </button>

  <div className="flex-1" />

  {/* Right actions */}
  <ToolbarButton>Properties</ToolbarButton>
  <Button className="border-accent/25 bg-accent-dim text-accent">
    Quick Export
  </Button>
</div>
```

## Status Bar

```tsx
// 26px tall, surface background
<div className="border-border bg-bg-surface text-muted flex h-[26px] items-center border-t px-3 text-[11px]">
  {/* Left items */}
  <div className="flex items-center gap-3">
    <span className="flex items-center gap-1.5">
      <Circle className="fill-green text-green size-2" />
      Saved
    </span>
    <span>24 items</span>
    <span>Item 2 of 24</span>
  </div>

  {/* Spacer */}
  <div className="flex-1" />

  {/* Right items */}
  <div className="flex items-center gap-3">
    <span>v1.0.0</span>
    <button className="hover:text-foreground flex items-center gap-1">
      <Keyboard className="size-3" />
      Shortcuts
    </button>
  </div>
</div>
```

## Responsive Behavior

Panel visibility based on window width (Electron desktop):

| Width       | Sidebar      | Tree   | Editor | Properties |
| ----------- | ------------ | ------ | ------ | ---------- |
| >1400px     | 260px        | 280px  | flex-1 | 280px      |
| 1100-1400px | 260px        | 280px  | flex-1 | hidden     |
| 800-1100px  | 40px (icons) | 280px  | flex-1 | hidden     |
| <800px      | hidden       | hidden | flex-1 | hidden     |

Minimum window size: `800 x 600` (set in Electron `BrowserWindow`).

Panel toggle state is stored in the **zustand** UI store. See the **zustand** skill.

## WARNING: Flex Layout Pitfalls

**The Problem:**

```tsx
// BAD — missing min-h-0 causes overflow
<div className="flex flex-1">
  <div className="flex-1">
    <ScrollArea>{/* Long content */}</ScrollArea>
  </div>
</div>
```

**Why This Breaks:** Flex items default to `min-height: auto`, which means they cannot shrink below their content size. ScrollArea inside a flex container without `min-h-0` on the flex parent will cause the entire layout to overflow instead of scrolling.

**The Fix:**

```tsx
// GOOD — min-h-0 allows flex child to shrink
<div className="flex min-h-0 flex-1">
  <div className="flex min-w-0 flex-1 flex-col">
    <ScrollArea className="flex-1">{/* Long content */}</ScrollArea>
  </div>
</div>
```

**When You Might Be Tempted:** Every time you nest scrollable content inside flex layouts. This is the #1 layout bug in the editor.

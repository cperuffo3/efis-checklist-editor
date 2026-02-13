# Components Reference

## Contents

- Component Styling Architecture
- Button Variants for EFIS
- Input & Form Fields
- Badges & Indicators
- Type Indicator Component
- Checklist Item Row Anatomy
- WARNING: Modifying shadcn/ui Components

## Component Styling Architecture

All EFIS components follow this hierarchy:

1. **shadcn/ui primitives** (`src/components/ui/`) — never modify directly
2. **EFIS editor components** (`src/components/editor/`) — custom components using shadcn/ui
3. **Shared components** (`src/components/shared/`) — reusable across routes

Use `cn()` from `@/utils/cn` for conditional classes. Use CVA for components with multiple variants. See the **shadcn-ui** skill for component library details.

## Button Variants for EFIS

The toolbar uses two button styles not covered by default shadcn variants:

### Toolbar Button (Ghost with Label)

```tsx
// Standard toolbar button — ghost style, icon + label
<Button
  variant="ghost"
  size="sm"
  className="text-muted-foreground hover:bg-hover hover:text-foreground gap-1.5"
>
  <Upload className="size-3.5" />
  <span className="text-[12px]">Import</span>
</Button>
```

### Primary Toolbar Button (Quick Export)

```tsx
// Accent-styled primary action
<Button
  variant="outline"
  size="sm"
  className="border-accent/25 bg-accent-dim text-accent hover:bg-accent/20 hover:text-accent-hover"
>
  <Download className="size-3.5" />
  <span className="text-[12px]">Quick Export</span>
</Button>
```

### Disabled State

```tsx
// Undo/Redo when stack is empty
<Button
  variant="ghost"
  size="icon-sm"
  disabled={!canUndo}
  className="text-muted-foreground"
>
  <Undo className="size-3.5" />
</Button>
// shadcn/ui applies: opacity-50 pointer-events-none cursor-not-allowed
```

## Input & Form Fields

Properties panel inputs use consistent EFIS styling:

```tsx
// Label + Input pattern for properties panel
<div className="space-y-1">
  <label className="text-muted-foreground text-[11px]">Challenge Text</label>
  <Input
    className="border-border bg-bg-elevated text-foreground focus:border-accent h-7 rounded-[4px] px-2.5 py-1.5 text-xs focus:outline-none"
    value={challengeText}
    onChange={(e) => updateItem({ challengeText: e.target.value })}
  />
</div>
```

### Select Dropdowns

```tsx
// Type selector in properties panel
<div className="space-y-1">
  <label className="text-muted-foreground text-[11px]">Type</label>
  <Select value={itemType} onValueChange={setItemType}>
    <SelectTrigger className="border-border bg-bg-elevated h-7 rounded-[4px] text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ChallengeResponse">Challenge / Response</SelectItem>
      <SelectItem value="ChallengeOnly">Challenge Only</SelectItem>
      <SelectItem value="Title">Title / Section</SelectItem>
      <SelectItem value="Note">Note</SelectItem>
      <SelectItem value="Warning">Warning</SelectItem>
      <SelectItem value="Caution">Caution</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Badges & Indicators

### Format Badge (File Extension Pill)

```tsx
// Colored pill showing file format
interface FormatBadgeProps {
  format: ChecklistFormat;
}

export function FormatBadge({ format }: FormatBadgeProps) {
  const config = {
    Ace: { label: ".ace", className: "bg-green-dim text-green" },
    Json: { label: ".json", className: "bg-accent-dim text-accent" },
    Pdf: { label: ".pdf", className: "bg-overlay text-muted-foreground" },
  };
  const { label, className } = config[format];

  return (
    <span className={cn("rounded-full px-1.5 text-[10px]", className)}>
      {label}
    </span>
  );
}
```

### Group Category Icon

```tsx
// 18x18 colored icon for Normal/Emergency/Abnormal groups
const groupStyles = {
  Normal: { bg: "bg-green-dim", text: "text-green", icon: "✓" },
  Emergency: { bg: "bg-red-dim", text: "text-red", icon: "!" },
  Abnormal: { bg: "bg-yellow-dim", text: "text-yellow", icon: "⚠" },
};

export function GroupIcon({ category }: { category: ChecklistGroupCategory }) {
  const style = groupStyles[category];
  return (
    <div
      className={cn(
        "flex size-[18px] items-center justify-center rounded-sm text-[11px] font-bold",
        style.bg,
        style.text,
      )}
    >
      {style.icon}
    </div>
  );
}
```

### Item Count Badge

```tsx
// Small count shown next to checklists/sections
<span className="bg-overlay text-muted-foreground rounded-full px-1.5 text-[10px]">
  {itemCount}
</span>
```

## Type Indicator Component

Each checklist item type has a distinct visual indicator:

```tsx
export function TypeIndicator({ type }: { type: ChecklistItemType }) {
  if (type === "Title") {
    // Bar indicator for sections
    return <div className="bg-purple h-[3px] w-[14px] rounded-full" />;
  }

  // Circle indicator for all other types
  const colorMap = {
    ChallengeResponse: "bg-green",
    ChallengeOnly: "bg-accent",
    Note: "bg-muted",
    Warning: "bg-yellow",
    Caution: "bg-orange",
  };

  return <div className={cn("size-1.5 rounded-full", colorMap[type])} />;
}
```

## Checklist Item Row Anatomy

The item row is the most complex component. Its horizontal structure:

```
[24px drag] [32px type] [20px×depth indent] [18px collapse?] [flex-1 content] [auto actions]
```

```tsx
<div
  className={cn(
    "group flex h-8 items-center",
    isSelected && "bg-accent-dim",
    !isSelected && "hover:bg-elevated",
  )}
>
  {/* Drag handle — visible on hover */}
  <div className="flex w-6 items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    <GripVertical className="text-muted size-3.5 cursor-grab" />
  </div>

  {/* Type indicator */}
  <div className="flex w-8 items-center justify-center">
    <TypeIndicator type={item.type} />
  </div>

  {/* Indent guides */}
  <IndentGuides depth={item.indent} isLast={isLastChild} />

  {/* Content — varies by type */}
  <div className="flex min-w-0 flex-1 items-center">
    {/* ... type-specific content rendering */}
  </div>

  {/* Hover actions */}
  <div className="flex gap-0.5 pr-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    <Button variant="ghost" size="icon-xs">
      <Pencil className="size-3" />
    </Button>
    <Button variant="ghost" size="icon-xs">
      <Trash2 className="text-red size-3" />
    </Button>
  </div>
</div>
```

## WARNING: Modifying shadcn/ui Components

**The Problem:**

```tsx
// BAD — editing src/components/ui/button.tsx directly
// Adding EFIS-specific styles to the base component
```

**Why This Breaks:**

1. Running `pnpm run bump-shadcn-components` overwrites your changes
2. Mixes generic library code with project-specific design
3. Other shadcn components depend on stable base behavior

**The Fix:**

Create wrapper components in `src/components/editor/` or use `className` prop:

```tsx
// GOOD — wrapper component
export function ToolbarButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:bg-hover hover:text-foreground gap-1.5"
      {...props}
    >
      {children}
    </Button>
  );
}
```

**When You Might Be Tempted:** When you need a new variant that applies across the whole app. Even then, create a wrapper — the shadcn component is a primitive, not a domain component.

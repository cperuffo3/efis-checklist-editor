# State Reference

## Contents

- Icon Selection Based on State
- Zustand Selectors for Icon Rendering
- Collapse/Expand State
- Panel Visibility Icons
- Anti-Patterns

## Icon Selection Based on State

Icons frequently change based on application state from Zustand stores. See the **zustand** skill for store patterns.

### Save Indicator (Status Bar)

```tsx
import { Circle } from "lucide-react";
import { useChecklistStore } from "@/stores/checklist-store";
import { cn } from "@/utils/cn";

function SaveIndicator() {
  const isDirty = useChecklistStore((s) => s.isDirty);
  return (
    <div className="flex items-center gap-1.5">
      <Circle
        className={cn(
          "size-2",
          isDirty ? "fill-yellow text-yellow" : "fill-green text-green",
        )}
      />
      <span className="text-muted text-[11px]">
        {isDirty ? "Unsaved" : "Saved"}
      </span>
    </div>
  );
}
```

### Undo/Redo Button State

```tsx
import { Undo2, Redo2 } from "lucide-react";
import { useChecklistStore } from "@/stores/checklist-store";

function UndoRedoButtons() {
  const canUndo = useChecklistStore((s) => s.canUndo);
  const canRedo = useChecklistStore((s) => s.canRedo);
  const undo = useChecklistStore((s) => s.undo);
  const redo = useChecklistStore((s) => s.redo);

  return (
    <>
      <button
        onClick={undo}
        disabled={!canUndo}
        className="p-1.5 disabled:opacity-40"
      >
        <Undo2 className="text-muted-foreground size-4" />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className="p-1.5 disabled:opacity-40"
      >
        <Redo2 className="text-muted-foreground size-4" />
      </button>
    </>
  );
}
```

## Collapse/Expand State

Chevron icons rotate to indicate expand/collapse state. The collapsed item IDs are tracked in the Zustand store.

```tsx
import { ChevronRight } from "lucide-react";
import { useChecklistStore } from "@/stores/checklist-store";
import { cn } from "@/utils/cn";

function CollapsibleHeader({
  itemId,
  label,
}: {
  itemId: string;
  label: string;
}) {
  const isCollapsed = useChecklistStore((s) => s.collapsedItemIds.has(itemId));
  const toggleCollapsed = useChecklistStore((s) => s.toggleCollapsed);

  return (
    <button
      onClick={() => toggleCollapsed(itemId)}
      className="flex items-center gap-1"
    >
      <ChevronRight
        className={cn(
          "text-muted-foreground size-3.5 transition-transform duration-150",
          !isCollapsed && "rotate-90",
        )}
      />
      <span className="text-purple text-xs font-bold tracking-wide uppercase">
        {label}
      </span>
    </button>
  );
}
```

**Key pattern:** Use `rotate-90` with `transition-transform duration-150` for the chevron animation. The spec calls for 150ms ease for collapse/expand.

## Panel Visibility Icons

The properties panel toggles via the UI store. The toolbar button icon reflects the current state.

```tsx
import { SlidersHorizontal } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/utils/cn";

function PropertiesToggle() {
  const visible = useUiStore((s) => s.propertiesPanelVisible);
  const toggle = useUiStore((s) => s.togglePropertiesPanel);

  return (
    <button
      onClick={toggle}
      className={cn(
        "rounded-[4px] p-1.5",
        visible
          ? "bg-active text-foreground"
          : "text-muted-foreground hover:bg-hover hover:text-foreground",
      )}
    >
      <SlidersHorizontal className="size-4" />
    </button>
  );
}
```

## WARNING: Deriving Icon from Non-Primitive Selector

**The Problem:**

```tsx
// BAD — creates new object every render, causes infinite re-renders
const { icon, color } = useChecklistStore((s) => ({
  icon: s.activeFile ? FileText : FilePlus,
  color: s.activeFile ? "text-green" : "text-muted",
}));
```

**Why This Breaks:**
Zustand uses `Object.is` for equality checks. Returning a new object from the selector means it's always "different," triggering a re-render every time any store value changes.

**The Fix:**

```tsx
// GOOD — select primitives, derive icon in render
const hasActiveFile = useChecklistStore((s) => !!s.activeFileId);
const Icon = hasActiveFile ? FileText : FilePlus;
const color = hasActiveFile ? "text-green" : "text-muted";
```

Select the minimum primitive value from the store. Derive the icon component in the render body.

## Item Type Icons in Properties Panel

The properties panel shows a type selector dropdown. Each option includes an icon indicator:

```tsx
import type { ChecklistItemType } from "@/types/checklist";
import { cn } from "@/utils/cn";

const TYPE_LABELS: Record<
  ChecklistItemType,
  { label: string; dotClass: string }
> = {
  ChallengeResponse: { label: "Challenge / Response", dotClass: "bg-green" },
  ChallengeOnly: { label: "Challenge Only", dotClass: "bg-accent" },
  Title: { label: "Title / Section Header", dotClass: "bg-purple" },
  Note: { label: "Note / Plaintext", dotClass: "bg-muted" },
  Warning: { label: "Warning", dotClass: "bg-yellow" },
  Caution: { label: "Caution", dotClass: "bg-orange" },
};

function TypeOption({ type }: { type: ChecklistItemType }) {
  const { label, dotClass } = TYPE_LABELS[type];
  return (
    <div className="flex items-center gap-2">
      <div className={cn("size-2 rounded-full", dotClass)} />
      <span>{label}</span>
    </div>
  );
}
```

Note: Type indicators use CSS dots (not Lucide icons) because the UI spec defines specific shapes and sizes for each type.

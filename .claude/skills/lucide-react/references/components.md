# Components Reference

## Contents

- Icon in Toolbar Buttons
- Type Indicator Component
- Group Icon Component
- Format Badge with Icon
- Drag Handle
- Anti-Patterns

## Icon in Toolbar Buttons

Toolbar buttons follow a consistent pattern: ghost button with icon + optional label, grouped by function with separators. See the **shadcn-ui** skill for `Button` and `Separator` components.

```tsx
import { Upload, Download, Undo2, Redo2, Plus, ListPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function Toolbar() {
  return (
    <div className="border-border bg-surface flex h-11 items-center gap-0.5 border-b px-2">
      {/* Import/Export group */}
      <ToolbarButton icon={Upload} label="Import" />
      <ToolbarButton icon={Download} label="Export" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      {/* Undo/Redo group */}
      <ToolbarButton icon={Undo2} disabled />
      <ToolbarButton icon={Redo2} disabled />
      <Separator orientation="vertical" className="mx-1 h-5" />
      {/* Add group */}
      <ToolbarButton icon={Plus} label="Item" />
      <ToolbarButton icon={ListPlus} label="Checklist" />
    </div>
  );
}
```

### ToolbarButton Pattern

```tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-muted-foreground flex items-center gap-1.5 rounded-[4px] px-2 py-1.5 text-xs",
        "hover:bg-hover hover:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <Icon className="size-3.5" />
      {label && <span>{label}</span>}
    </button>
  );
}
```

**Key pattern:** Accept `LucideIcon` type for the `icon` prop. This is the correct TypeScript type for any Lucide component. NEVER type it as `React.FC` or `React.ComponentType`.

## Type Indicator Component

Renders the colored dot or bar that indicates checklist item type. Does not use Lucide icons — uses pure CSS shapes. Included here for completeness since it's part of the icon system.

```tsx
import { cn } from "@/utils/cn";
import type { ChecklistItemType } from "@/types/checklist";

const TYPE_STYLES: Record<ChecklistItemType, string> = {
  ChallengeResponse: "size-1.5 rounded-full bg-green",
  ChallengeOnly: "size-1.5 rounded-full bg-accent",
  Title: "h-[3px] w-3.5 rounded-sm bg-purple",
  Note: "size-1.5 rounded-full bg-muted",
  Warning: "size-1.5 rounded-full bg-yellow",
  Caution: "size-1.5 rounded-full bg-orange",
};

function TypeIndicator({ type }: { type: ChecklistItemType }) {
  return <div className={cn("shrink-0", TYPE_STYLES[type])} />;
}
```

## Group Icon Component

Colored icon badges for checklist group categories (Normal, Emergency, Abnormal):

```tsx
import { Check, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ChecklistGroupCategory } from "@/types/checklist";

const GROUP_CONFIG: Record<
  ChecklistGroupCategory,
  { icon: LucideIcon; bg: string; text: string }
> = {
  Normal: { icon: Check, bg: "bg-green-dim", text: "text-green" },
  Emergency: { icon: AlertCircle, bg: "bg-red-dim", text: "text-red" },
  Abnormal: { icon: AlertTriangle, bg: "bg-yellow-dim", text: "text-yellow" },
};

function GroupIcon({ category }: { category: ChecklistGroupCategory }) {
  const { icon: Icon, bg, text } = GROUP_CONFIG[category];
  return (
    <div
      className={cn(
        "flex size-[18px] items-center justify-center rounded-sm",
        bg,
      )}
    >
      <Icon className={cn("size-3", text)} />
    </div>
  );
}
```

## Drag Handle

The 6-dot grip that appears on hover for reorderable items. See the **dnd-kit** skill for sortable integration.

```tsx
import { GripVertical } from "lucide-react";

function DragHandle({ listeners }: { listeners?: Record<string, unknown> }) {
  return (
    <button
      className="flex w-6 cursor-grab items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      {...listeners}
    >
      <GripVertical className="text-muted size-3.5" />
    </button>
  );
}
```

**Key pattern:** The parent row uses `group` class so hover reveals the handle via `group-hover:opacity-100`.

## WARNING: Mixing FontAwesome and Lucide

**The Problem:**

```tsx
// BAD — two icon libraries in the same component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { Plus } from "lucide-react";

<FontAwesomeIcon icon={faSearch} className="size-4" />
<Plus className="size-4" />
```

**Why This Breaks:**

1. Bundle includes both icon libraries (~50KB+ unnecessary)
2. Visual inconsistency (FontAwesome and Lucide have different stroke styles)
3. Two different APIs for the same concept creates confusion

**The Fix:**

```tsx
// GOOD — Lucide only
import { Search, Plus } from "lucide-react";

<Search className="size-4" />
<Plus className="size-4" />
```

## WARNING: Hardcoded Colors on Icons

**The Problem:**

```tsx
// BAD — hardcoded hex colors
<Check className="size-4" color="#3fb950" />
<AlertTriangle size={16} color="#d29922" />
```

**Why This Breaks:**

1. Bypasses the design token system — colors won't update with theme changes
2. Uses `color` prop (sets `stroke`) when you often want `fill` or `className`
3. Mixes prop-based and class-based styling

**The Fix:**

```tsx
// GOOD — Tailwind classes using design tokens
<Check className="size-4 text-green" />
<AlertTriangle className="size-4 text-yellow" />
```

## Icon Sizing Convention

All icons in this project use Tailwind sizing classes. NEVER use the `size` prop.

| Context                  | Class      | Pixels |
| ------------------------ | ---------- | ------ |
| Toolbar icon-only button | `size-4`   | 16px   |
| Toolbar with label       | `size-3.5` | 14px   |
| Status bar               | `size-3`   | 12px   |
| Group icon badge         | `size-3`   | 12px   |
| Inline text icon         | `size-3.5` | 14px   |
| Drag handle              | `size-3.5` | 14px   |
| Modal close button       | `size-4`   | 16px   |

See the **tailwind** skill for the project's size token system.

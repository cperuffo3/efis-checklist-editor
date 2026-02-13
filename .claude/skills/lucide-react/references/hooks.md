# Hooks Reference

## Contents

- Icon Wrapper Hook
- Platform-Aware Icon Hook
- Dynamic Icon Resolution
- Anti-Patterns

## Icon Wrapper Hook

No custom hooks are needed for basic icon rendering. Lucide icons are plain React components. However, a hook is useful when icons need to respond to platform or state.

### Platform-Specific Icon Rendering

macOS uses `Cmd` modifier, Windows/Linux uses `Ctrl`. Icons in toolbar tooltips should match.

```tsx
import { useEffect, useState } from "react";
import { getCurrentPlatform } from "@/actions/app";

function usePlatformModifier() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    getCurrentPlatform().then((p) => setIsMac(p === "darwin"));
  }, []);

  return { isMac, modifier: isMac ? "\u2318" : "Ctrl" };
}
```

Use this hook alongside icon tooltips for keyboard shortcuts. See the **electron** skill for platform detection patterns.

### Toggle Icon Hook

For icons that switch between two states (expand/collapse, light/dark):

```tsx
import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

function useToggleIcon(initial = false) {
  const [expanded, setExpanded] = useState(initial);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);
  const Icon = expanded ? ChevronDown : ChevronRight;
  return { expanded, toggle, Icon };
}

// Usage in checklist tree group
function GroupHeader({ name }: { name: string }) {
  const { expanded, toggle, Icon } = useToggleIcon(true);
  return (
    <button onClick={toggle} className="flex items-center gap-1">
      <Icon className="text-muted-foreground size-3.5 transition-transform duration-150" />
      <span>{name}</span>
    </button>
  );
}
```

### Dynamic Icon by Name

AVOID using `DynamicIcon` for static, known icons. It defeats tree-shaking and pulls in the entire icon set.

```tsx
// BAD — imports all icons into the bundle
import { DynamicIcon } from "lucide-react/dynamic";
<DynamicIcon name="camera" />;

// GOOD — named import, tree-shakable
import { Camera } from "lucide-react";
<Camera className="size-4" />;
```

The only valid use case for `DynamicIcon` is rendering user-provided icon names (e.g., from a database or config file). This project has no such requirement.

## WARNING: useEffect for Icon Loading

**The Problem:**

```tsx
// BAD — unnecessary async loading for static icons
const [IconComponent, setIconComponent] = useState(null);
useEffect(() => {
  import(`lucide-react`).then((mod) => {
    setIconComponent(() => mod["Camera"]);
  });
}, []);
```

**Why This Breaks:**

1. Icons are static assets — they don't need async loading
2. Defeats tree-shaking entirely
3. Causes layout shift (icon pops in after render)

**The Fix:**

```tsx
// GOOD — static import at module level
import { Camera } from "lucide-react";
```

## Icon Color from Zustand State

When icon color depends on application state (e.g., save indicator in status bar):

```tsx
import { Circle } from "lucide-react";
import { useChecklistStore } from "@/stores/checklist-store";

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

See the **zustand** skill for store selector patterns.

## Integration with Keyboard Shortcuts

Icons in toolbar buttons should show their keyboard shortcut in a tooltip. Use the **shadcn-ui** `Tooltip` component:

```tsx
import { Undo2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function UndoButton({
  onUndo,
  canUndo,
}: {
  onUndo: () => void;
  canUndo: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="text-muted-foreground hover:bg-hover hover:text-foreground p-1.5 disabled:opacity-40"
        >
          <Undo2 className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
    </Tooltip>
  );
}
```

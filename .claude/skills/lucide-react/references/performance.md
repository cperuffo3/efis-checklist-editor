# Performance Reference

## Contents

- Tree-Shaking
- Bundle Size
- Memoization Patterns
- Virtualized Lists with Icons
- Migration Checklist
- Anti-Patterns

## Tree-Shaking

Lucide-react is tree-shakable by default when using named imports. Only icons you import are included in the bundle.

```tsx
// GOOD — only Camera and Search are bundled (~1KB each)
import { Camera, Search } from "lucide-react";

// BAD — imports the entire icon set (~200KB+)
import * as icons from "lucide-react";
```

Each Lucide icon is approximately **~1KB gzipped**. The entire library contains 1500+ icons. Named imports keep the bundle lean.

### Verify Tree-Shaking

After build, check the renderer bundle size:

```bash
pnpm run build
# Check dist/renderer/ for bundle sizes
```

See the **vite** skill for bundle analysis configuration.

## Bundle Size: Lucide vs FontAwesome

| Library                           | Per-icon     | Full library | Tree-shakable       |
| --------------------------------- | ------------ | ------------ | ------------------- |
| lucide-react                      | ~1KB         | ~250KB       | Yes (named imports) |
| @fortawesome/free-solid-svg-icons | ~0.5KB       | ~400KB       | Partially           |
| @fortawesome/react-fontawesome    | ~15KB (core) | N/A          | N/A                 |

After migration, removing FontAwesome saves **~15KB** core overhead plus unused icons. The net effect depends on how many icons you use.

## WARNING: Importing All Icons

**The Problem:**

```tsx
// BAD — dynamic access requires importing everything
import * as LucideIcons from "lucide-react";

function IconByName({ name }: { name: string }) {
  const Icon = LucideIcons[name as keyof typeof LucideIcons];
  return Icon ? <Icon className="size-4" /> : null;
}
```

**Why This Breaks:**

1. Bundles ALL 1500+ icons (~250KB uncompressed)
2. Eliminates tree-shaking benefits entirely
3. No TypeScript safety on the icon name

**The Fix:**

Create an explicit icon map with only the icons you need:

```tsx
import {
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  Search,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  file: FileText,
  upload: Upload,
  download: Download,
  add: Plus,
  delete: Trash2,
  search: Search,
  check: Check,
};

function IconByName({ name }: { name: keyof typeof ICON_MAP }) {
  const Icon = ICON_MAP[name];
  return <Icon className="size-4" />;
}
```

## Memoization Patterns

Lucide icons are lightweight React components. In most cases, React Compiler (enabled in this project via `babel-plugin-react-compiler`) handles memoization automatically.

### When Memoization Matters

Only memoize icon-containing rows in virtualized lists with hundreds of items:

```tsx
import { memo } from "react";
import { GripVertical } from "lucide-react";
import type { ChecklistItem } from "@/types/checklist";

// Memoize the row component — not the icon
const ChecklistItemRow = memo(function ChecklistItemRow({
  item,
}: {
  item: ChecklistItem;
}) {
  return (
    <div className="group flex items-center">
      <GripVertical className="text-muted size-3.5 opacity-0 group-hover:opacity-100" />
      <span>{item.challengeText}</span>
    </div>
  );
});
```

See the **react** skill for React Compiler behavior and when manual memoization is needed.

### WARNING: Memoizing Icon Components Directly

```tsx
// BAD — useless, Lucide components are already lightweight
const MemoizedSearch = memo(Search);

// BAD — wrapping icons in useMemo
const icon = useMemo(() => <Search className="size-4" />, []);
```

**Why:** Lucide icons render to simple SVG elements. The cost of rendering an SVG is negligible. Memoizing the icon itself adds overhead without benefit. Memoize the **parent component** if needed, not individual icons.

## Virtualized Lists with Icons

The checklist editor can have 100+ items. Each row includes icons (drag handle, type indicator, action buttons). Use `memo` on the row component to avoid re-rendering all rows when selection changes.

```tsx
import { memo } from "react";
import { GripVertical, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface ItemRowProps {
  id: string;
  text: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ItemRow = memo(function ItemRow({
  id,
  text,
  isSelected,
  onSelect,
}: ItemRowProps) {
  return (
    <div
      onClick={() => onSelect(id)}
      className={cn(
        "group flex items-center gap-1 px-2 py-1",
        isSelected && "bg-accent-dim",
      )}
    >
      <GripVertical className="text-muted size-3.5 cursor-grab opacity-0 group-hover:opacity-100" />
      <span className="flex-1 text-[13px]">{text}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
        <Pencil className="text-muted-foreground size-3" />
        <Trash2 className="text-muted-foreground size-3" />
      </div>
    </div>
  );
});
```

## FontAwesome to Lucide Migration Checklist

Copy this checklist and track progress:

- [ ] Step 1: Install lucide-react — `pnpm add lucide-react`
- [ ] Step 2: Update shadcn/ui components (8 files) — replace FA imports with Lucide
- [ ] Step 3: Update home components (4 files)
- [ ] Step 4: Update layout components (1 file)
- [ ] Step 5: Update shared components (1 file)
- [ ] Step 6: Remove FontAwesome — `pnpm remove @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome`
- [ ] Step 7: Verify build — `pnpm run build`
- [ ] Step 8: Visual regression check — compare before/after screenshots

### Validation Loop

1. Replace icons in one component file
2. Run `pnpm run dev` and verify visually
3. If icons look wrong (size, alignment, stroke weight), adjust `className`
4. Repeat for next file

**Stroke weight note:** Lucide default `strokeWidth` is 2. FontAwesome icons are filled. Lucide icons may look thinner. Use `strokeWidth={2.5}` if needed for visual parity, but the spec calls for Lucide's default weight.

---
name: lucide-react
description: |
  Provides the Lucide icon library for React components in this Electron app.
  Use when: adding icons to UI components, replacing FontAwesome icons with Lucide equivalents,
  customizing icon size/color/stroke, or working with shadcn/ui components that expect Lucide icons.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# Lucide React

Lucide is the icon library specified for this project (configured in `components.json`). The codebase currently uses FontAwesome but is migrating to lucide-react per the implementation plan. All new components MUST use lucide-react. shadcn/ui CLI generates Lucide imports by default.

## Quick Start

### Install

```bash
pnpm add lucide-react
```

### Basic Usage

```tsx
import { FileText, ChevronDown, Plus } from "lucide-react";

function Toolbar() {
  return (
    <button className="text-muted-foreground flex items-center gap-1.5">
      <Plus className="size-4" />
      <span>Add Item</span>
    </button>
  );
}
```

### With Tailwind Sizing (Project Convention)

```tsx
// GOOD — Use Tailwind size classes
<Camera className="size-4" />
<Camera className="size-3" />
<Camera className="h-4 w-4" />

// BAD — Don't use size/color props when Tailwind works
<Camera size={16} color="#58a6ff" />
```

## Key Concepts

| Concept           | Usage                                    | Example                                 |
| ----------------- | ---------------------------------------- | --------------------------------------- |
| Named imports     | Tree-shakable, one per icon              | `import { Search } from "lucide-react"` |
| Tailwind sizing   | Use `size-*` or `h-* w-*` classes        | `className="size-4"`                    |
| Color inheritance | Icons inherit `currentColor`             | Parent `text-accent` colors the icon    |
| strokeWidth       | Prop for line thickness (default 2)      | `strokeWidth={1.5}`                     |
| Dynamic icons     | Use `DynamicIcon` for name-based loading | Avoid in static UI — hurts tree-shaking |

## FontAwesome to Lucide Migration Map

| FontAwesome             | Lucide          | Context                      |
| ----------------------- | --------------- | ---------------------------- |
| `faXmark`               | `X`             | Dialog close                 |
| `faSearch`              | `Search`        | Command palette              |
| `faCheck`               | `Check`         | Select checkmarks            |
| `faSpinner`             | `Loader2`       | Loading (use `animate-spin`) |
| `faChevronUp`           | `ChevronUp`     | Select, number input         |
| `faChevronDown`         | `ChevronDown`   | Select, tree expand          |
| `faCalendar`            | `Calendar`      | Date picker                  |
| `faHome`                | `Home`          | Navigation                   |
| `faSun` / `faMoon`      | `Sun` / `Moon`  | Theme toggle                 |
| `faRocket`              | `Rocket`        | Quick start                  |
| `faTerminal`            | `Terminal`      | Scripts                      |
| `faCode`                | `Code`          | Features                     |
| `faPalette`             | `Palette`       | Customization                |
| `faPlug`                | `Plug`          | Integrations                 |
| `faCog`                 | `Settings`      | Settings                     |
| `faCircleCheck`         | `CircleCheck`   | Toast success                |
| `faCircleXmark`         | `CircleX`       | Toast error                  |
| `faTriangleExclamation` | `TriangleAlert` | Toast warning                |
| `faCircleInfo`          | `Info`          | Toast info                   |

## EFIS Editor Icons (New Components)

Icons needed for the editor panels per UI/UX spec:

| Purpose         | Lucide Icon                    | Component                      |
| --------------- | ------------------------------ | ------------------------------ |
| Drag handle     | `GripVertical`                 | `checklist-item-row.tsx`       |
| Expand/Collapse | `ChevronRight` / `ChevronDown` | Tree groups, collapsible items |
| File icon       | `FileText`                     | Files sidebar                  |
| Import          | `Upload`                       | Toolbar                        |
| Export          | `Download`                     | Toolbar                        |
| Undo / Redo     | `Undo2` / `Redo2`              | Toolbar                        |
| Add item        | `Plus`                         | Toolbar, editor                |
| Delete          | `Trash2`                       | Context menus                  |
| Edit            | `Pencil`                       | Inline edit trigger            |
| Properties      | `SlidersHorizontal`            | Toolbar toggle                 |
| Keyboard        | `Keyboard`                     | Status bar shortcuts           |
| Warning         | `TriangleAlert`                | Warning items                  |
| New file        | `FilePlus`                     | Sidebar header                 |

## See Also

- [hooks](references/hooks.md) — Icon wrapper hooks
- [components](references/components.md) — Icon component patterns
- [data-fetching](references/data-fetching.md) — N/A (icons are static)
- [state](references/state.md) — Icon state patterns
- [forms](references/forms.md) — Icons in form fields
- [performance](references/performance.md) — Tree-shaking, bundle size

## Related Skills

- See the **shadcn-ui** skill — shadcn components expect Lucide icons by default
- See the **tailwind** skill — icon sizing/coloring via Tailwind classes
- See the **react** skill — component patterns for icon wrappers

## Documentation Resources

> Fetch latest lucide-react documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "lucide-react"
2. Prefer website documentation (IDs starting with `/websites/`)
3. Query with `mcp__context7__query-docs` using the resolved library ID

**Library ID:** `/websites/lucide_dev_guide_packages`

**Recommended Queries:**

- "lucide-react icon props customization"
- "lucide-react dynamic icon loading"
- "lucide-react tree-shaking best practices"

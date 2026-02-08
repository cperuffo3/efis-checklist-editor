# UI/UX Specification — EFIS Checklist Editor

## Design System

- **Framework**: shadcn/ui components with Tailwind CSS 4
- **Font**: Inter (primary UI), JetBrains Mono (monospace elements like dot leaders, file extensions)
- **Icons**: Lucide React (consistent with shadcn/ui ecosystem)
- **Theme**: Dark mode only for MVP (GitHub-dark inspired palette)
- **Style**: IDE-inspired three-panel layout with dense, information-rich interface
- **Border radius**: 6px (standard), 4px (small elements like buttons)
- **Transitions**: 150ms ease for all interactive state changes
- **Font size base**: 13px body text, 12px secondary text, 11px labels/captions

## Overall Application Layout

```
+==================================================================+
| [Title Bar — draggable, frameless window]              [- □ X]   |
+==================================================================+
| [Import] [Export] | [↶ ↷] | [+ Item] [+ Checklist] | 🔍 Search |
| checklists… ⌘K     | [Properties] [Quick Export ▼]               |
+==================================================================+
|          |              |                        |               |
| FILES    | CHECKLIST    |   EDITOR               | PROPERTIES   |
| SIDEBAR  | TREE         |                        | PANEL        |
| (260px)  | (280px)      |   (flex-1)             | (280px)      |
|          |              |                        |               |
| [file1]  | ▼ Normal  5  |   Preflight Inspect.   | Item Props   |
| [file2]  |   ✓ Prefl 24 |   Normal › Preflight   | ----------   |
| [file3]  |   ✓ Befor 12 |                        | Type: [    ] |
| [file4]  |   ✓ Engin  8 |   ⠿ ■ ▼ CABIN    4i   | Challenge:   |
|          |   ✓ Befor 15 |   ⠿ · │ ParkBrk  SET  | [          ] |
|          |   ✓ After 10 |   ⠿ · │ Hobbs    REC  | Response:    |
|          | ▼ Emergency 4|   ⠿ · │ Docs     CHK  | [          ] |
|          |   ! EngFa  7 |   ⠿ · └ CtrlLock REM  | ----------   |
|          |   ! EngFi  9 |   ⠿ ■ ▼ LEFT WING 6i  | Formatting   |
| [Drop    |   ! Elect 11 |   ⠿ · │ WingEdge CHK  | Indent: [1 ] |
|  file to |   ! Emerg  6 |   ⠿ · │ FuelSump D&C  | ☐ Centered   |
|  import] | ▼ Abnormal 3 |   ⠿ · │ Note: ...     | ☐ Collapsible|
|          |   ⚠ LowOi  5 |   ⠿ · │ ⚠ Fuel cap.. | ----------   |
|          |   ⚠ Alter  8 |   ⠿ · └ Wingtip  CHK  | Compat.      |
|          |   ⚠ Pitot  4 |                        | G3X: ✓       |
|          |              |   [+ Add section/item]  | AFS: ✓       |
|          |              |                        | FF:  ✓       |
+==================================================================+
| ● Saved | 24 items | Item 2 of 24       v1.0.0 | ⌨ Shortcuts  |
+==================================================================+
```

## Screen 1: Title Bar

```
+==================================================================+
| EFIS Editor — N172SP Checklists                       [- □ X]   |
+==================================================================+
```

### Behavior

- Frameless Electron window with custom title bar
- Entire bar is a drag region (CSS `-webkit-app-region: drag`)
- Title shows app name (bold) + separator " — " + active file name (regular weight)
- Windows: minimize/maximize/close buttons on the right
- macOS: uses native traffic light buttons (positioned by Electron)
- Height: 38px
- Background: `bg-base-deepest` (darkest shade, distinct from toolbar)

### Tailwind Implementation

```
bg-[#010409] border-b border-[#1b1f27] h-[38px]
text-muted-foreground text-xs font-medium
title text: text-foreground font-semibold
```

## Screen 2: Toolbar

```
+==================================================================+
| [↑Import] [↓Export] │ [↶] [↷] │ [+Item] [+Checklist] │         |
|                                   🔍 Search checklists… ⌘K       |
|                                        │ [⚙ Properties] [▼ Quick Export] |
+==================================================================+
```

### Layout

- Height: 44px
- Background: `bg-surface`
- Bottom border: `border-border`
- Horizontal flex with groups separated by 1px vertical dividers
- Groups: Import/Export | Undo/Redo | Add Item/Add Checklist | (spacer) | Search trigger | (spacer) | Properties toggle, Quick Export

### Components

| Element        | Type                     | Notes                                       |
| -------------- | ------------------------ | ------------------------------------------- |
| Import         | `tb-btn` (ghost button)  | Icon + label, opens file dialog             |
| Export         | `tb-btn`                 | Icon + label, opens export modal            |
| Undo / Redo    | `tb-btn` (icon only)     | Disabled when stack is empty                |
| Add Item       | `tb-btn`                 | Icon + label                                |
| Add Checklist  | `tb-btn`                 | Icon + label                                |
| Search trigger | Custom input-like button | Min-width 220px, shows `⌘K` kbd hint        |
| Properties     | `tb-btn`                 | Toggles properties panel visibility         |
| Quick Export   | `tb-btn.primary`         | Accent-colored, exports to last-used format |

### Button States

- **Default**: `text-muted-foreground bg-transparent`
- **Hover**: `bg-hover text-foreground`
- **Active/Pressed**: `bg-active`
- **Disabled**: `opacity-40 cursor-not-allowed`
- **Primary variant** (Quick Export): `bg-accent-dim text-accent border border-accent/25` → hover: `bg-accent/20 text-accent-hover`

## Screen 3: Files Sidebar (Left Panel)

```
+------------------------+
| CHECKLIST FILES    [+] |
+------------------------+
| 📄 N172SP Checklists   .ace |
| 📄 RV-10 SkyView       .txt |
| 📄 ForeFlight Backup    .fmd |
| 📄 GRT Checklists       .txt |
|                        |
|                        |
| ┌────────────────────┐ |
| │   ↑ Drop file to   │ |
| │   import or click   │ |
| │   to browse         │ |
| └────────────────────┘ |
+------------------------+
```

### Layout

- Width: 260px (fixed, not resizable for MVP)
- Background: `bg-surface`
- Right border: `border-border`
- Three sections: header, file list (scrollable), drop zone

### Header

- Uppercase label "CHECKLIST FILES" — `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`
- "+" button on the right to create a new empty file
- Padding: `px-3.5 py-3`
- Bottom border: `border-border`

### File List Items

- Padding: `px-3.5 py-1.5`
- Icon (file icon, colored by format type), file name, format badge
- Font size: 12px
- **Default**: `text-muted-foreground`
- **Hover**: `bg-hover text-foreground`
- **Active**: `bg-active text-foreground` + 3px left accent bar (`bg-accent`)
- Format badge: `text-[10px] bg-overlay rounded-full px-1.5`

### Format Icon Colors

| Format            | Color                   |
| ----------------- | ----------------------- |
| Garmin (.ace)     | `text-green` (#3fb950)  |
| Dynon (.txt)      | `text-purple` (#a371f7) |
| ForeFlight (.fmd) | `text-cyan` (#39d2c0)   |
| GRT (.txt)        | `text-orange` (#db6d28) |
| JSON (.json)      | `text-accent` (#58a6ff) |

### Drop Zone

- Dashed border: `border-2 border-dashed border-border`
- Centered text + upload icon
- Hover: `border-accent text-muted-foreground`
- Margin: `mx-3 my-2`
- Padding: `p-6`
- Acts as both drag-drop target and click-to-browse button

## Screen 4: Checklist Tree Panel

```
+----------------------------+
| N172SP Checklists    [ACE] |
+----------------------------+
| ▼ Normal               5  |
|   ✓ Preflight Inspect  24 |  ← active (highlighted)
|   ✓ Before Engine Sta  12 |
|   ✓ Engine Start        8 |
|   ✓ Before Takeoff     15 |
|   ✓ After Landing      10 |
| ▼ Emergency             4  |
|   ! Engine Failure       7 |
|   ! Engine Fire          9 |
|   ! Electrical Fire     11 |
|   ! Emergency Landing    6 |
| ▼ Abnormal              3  |
|   ⚠ Low Oil Pressure    5 |
|   ⚠ Alternator Failure  8 |
|   ⚠ Pitot/Static Fail   4 |
+----------------------------+
```

### Layout

- Width: 280px (fixed)
- Background: `bg-base`
- Right border: `border-border`

### Header

- File name (bold, 13px) + format badge (pill, colored)
- Format badge colors: same green-dim/green style as reference
- Padding: `px-3.5 py-2.5`
- Bottom border: `border-border`

### Groups

- Group header: chevron icon + group name (uppercase, 11px, semibold, tracking-wide) + count badge
- Clickable to expand/collapse
- Color: `text-muted-foreground` → hover: `text-foreground`

### Checklist Items

- Indented under groups: `pl-8`
- Icon (18x18 rounded square) + name + item count
- Icon colors by group type:
  - **Normal**: green-dim bg, green text, "✓" symbol
  - **Emergency**: red-dim bg, red text, "!" symbol
  - **Abnormal**: yellow-dim bg, yellow text, "⚠" symbol
- **Default**: `text-muted-foreground`
- **Hover**: `bg-hover text-foreground`
- **Active**: `bg-accent-dim text-accent`
- Drag handle appears on hover (6-dot grip icon, left side)

### Context Menu (Right-click)

- Rename checklist
- Duplicate checklist
- Move to group...
- Delete checklist

## Screen 5: Checklist Editor (Center Panel)

### Editor Header

```
+--------------------------------------------------+
| Preflight Inspection      [Normal]               |
| N172SP Checklists › Normal › Preflight Inspect.  |
|                        [Duplicate] [🗑 Delete]   |
+--------------------------------------------------+
```

- Checklist name: 18px, semibold
- Group badge: colored pill (same as tree panel icons)
- Breadcrumb: `text-[11px] text-muted` with `›` separators
- Action buttons: Duplicate, Delete (red tint)
- Padding: `px-6 pt-4 pb-3`
- Bottom border: `border-border`

### Editor Body — Checklist Items

```
+--------------------------------------------------+
| ⠿  ■  ▼ CABIN                         4 items   |
| ⠿  ●  │  Parking Brake ········· SET            |
| ⠿  ●  │  Hobbs / Tach ·········· RECORD    [✎] |
| ⠿  ●  │  Required Docs (AROW) ·· CHECK         |
| ⠿  ●  └  Control Lock ·········· REMOVE         |
|                                                   |
| ⠿  ■  ▼ LEFT WING                     6 items   |
| ⠿  ●  │  Wing Leading Edge ····· CHECK          |
| ⠿  ●  │  Fuel Tank Sump ········ DRAIN & CHECK  |
| ⠿  ○  │  Check for blue color...   (note)       |
| ⠿  ◉  │  ⚠ Ensure fuel cap...     (warning)    |
| ⠿  ■  │  ▼ Control Surfaces       5 items       |
| ⠿  ●  │  │  ▼ Ailerons            2 sub-checks  |
| ⠿  ●  │  │  │  Hinges ··········· FREE & PINNED |
| ⠿  ●  │  │  └  Linkages ········· TIGHT & CONN  |
| ⠿  ●  └  Wingtip & Nav Light ···· CHECK         |
|                                                   |
| ⠿  ■  ▶ NOSE / ENGINE          8 items collapsed |
| ⠿  ■  ▶ RIGHT WING             6 items collapsed |
| ⠿  ■  ▶ EMPENNAGE              5 items collapsed |
|                                                   |
| ┌──────────────────────────────────────────────┐ |
| │         + Add section or item                 │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
```

### Item Row Structure

Each checklist item row has this horizontal structure:

```
[drag-handle] [type-indicator] [indent-guides] [collapse-toggle?] [content] [actions]
```

| Element         | Width         | Description                                                       |
| --------------- | ------------- | ----------------------------------------------------------------- |
| Drag handle     | 24px          | 6-dot grip icon, `opacity-0` → hover `opacity-100`, `cursor-grab` |
| Type indicator  | 32px centered | Colored dot/bar showing item type                                 |
| Indent guides   | 20px × depth  | Vertical lines with tick connectors                               |
| Collapse toggle | 18px          | Chevron, only for parent items with children                      |
| Content         | flex-1        | Challenge/response or text based on type                          |
| Actions         | auto          | Edit, indent/outdent, add child — appear on hover                 |

### Type Indicators

| Type                 | Indicator              | Color                 |
| -------------------- | ---------------------- | --------------------- |
| Challenge/Response   | 6px circle             | `bg-green` (#3fb950)  |
| Challenge Only       | 6px circle             | `bg-accent` (#58a6ff) |
| Title/Section Header | 14px × 3px rounded bar | `bg-purple` (#a371f7) |
| Note/Plaintext       | 6px circle             | `bg-muted` (#5a6370)  |
| Warning              | 6px circle             | `bg-yellow` (#d29922) |
| Caution              | 6px circle             | `bg-orange` (#db6d28) |

### Content Variants

**Challenge/Response** (most common):

```
[challenge-text] [dot-leader ····] [response-text]
```

- Challenge: `text-foreground text-[13px]`, flex-1, ellipsis overflow
- Dots: `text-muted font-mono text-xs tracking-[2px]`, fixed width
- Response: `text-accent font-medium text-[13px]`, right-aligned, max-width 40%

**Title/Section Header**:

- `font-bold uppercase text-[12px] tracking-wide text-purple`
- Shows child count badge: `text-[10px] bg-overlay rounded-full px-1.5`

**Note/Plaintext**:

- `text-muted-foreground italic text-[13px]`

**Warning**:

- `text-yellow text-[13px]` with "⚠" prefix

**Caution**:

- `text-orange text-[13px]`

### Indentation System

- Each indent level adds a 20px-wide guide column
- Guide columns show a vertical line (`border-border opacity-50`) at center
- Tick connectors: horizontal line from guide to content
- Last-child guides: vertical line stops at midpoint + tick

### Item States

- **Default**: transparent background
- **Hover**: `bg-elevated`
- **Selected**: `bg-accent-dim`
- **Dragging**: `opacity-70 shadow-lg` with drop indicator line
- **Editing**: inline input fields replace text content

### Collapse/Expand

- Parent items show a chevron toggle (▼ expanded, ▶ collapsed)
- Collapsed state hides all children and shows a "collapsed" badge
- Chevron rotation: 0deg (expanded) → -90deg (collapsed), 150ms transition

### Add Item Row

- Dashed border row at bottom of editor body
- Text: "+ Add section or item"
- Hover: `border-accent text-accent bg-accent-dim`

### Inline Editing

When a user double-clicks or presses Enter on a selected item:

- Challenge text becomes an input field
- Response text becomes an input field
- Press Enter to commit, Escape to cancel
- Tab moves between challenge and response fields

## Screen 6: Properties Panel (Right Panel)

```
+---------------------------+
| ITEM PROPERTIES           |
+---------------------------+
| SELECTED ITEM             |
| Type                      |
| [Challenge / Response ▼]  |
| Challenge Text            |
| [Parking Brake        ]   |
| Response Text             |
| [SET                  ]   |
+---------------------------+
| FORMATTING                |
| Indent Level              |
| [1 — Under section   ▼]  |
| Centered        [toggle]  |
| Collapsible     [toggle]  |
+---------------------------+
| FORMAT COMPATIBILITY      |
| Garmin G3X       ✓ Supp.  |
| AFS / Dynon      ✓ Supp.  |
| ForeFlight       ✓ Supp.  |
| Garmin Pilot     ✓ Supp.  |
| GRT              ✓ Supp.  |
| PDF              ✓ Supp.  |
+---------------------------+
| CHECKLIST METADATA        |
| Aircraft Registration     |
| [N172SP               ]   |
| Aircraft Make & Model     |
| [Cessna 172S Skyhawk  ]   |
| Copyright                 |
| [                     ]   |
+---------------------------+
```

### Layout

- Width: 280px (fixed)
- Background: `bg-surface`
- Left border: `border-border`
- Toggle visibility via Properties button in toolbar
- Scrollable body with fixed header

### Sections

Each section has:

- Header: `text-[11px] font-semibold uppercase tracking-wide text-muted`
- Margin bottom: 20px between sections

### Form Fields

- Label: `text-[11px] text-muted-foreground` above input
- Input: `bg-elevated border border-border rounded-[4px] px-2.5 py-1.5 text-xs text-foreground`
- Input focus: `border-accent outline-none`
- Select: same styling as input, with `cursor-pointer`

### Toggle Switches

- 34px × 18px rounded pill
- Off: `bg-border`
- On: `bg-accent`
- Thumb: 14px white circle, slides 16px

### Format Compatibility

- Row: format name (left) + status (right)
- Supported: `text-green` with "✓ Supported"
- Unsupported: `text-muted` with "✗ Unsupported"
- Shows real-time compatibility based on selected item's type/formatting

## Screen 7: Status Bar

```
+==================================================================+
| ● Saved | 24 items | Item 2 of 24          v1.0.0 | ⌨ Shortcuts |
+==================================================================+
```

### Layout

- Height: 26px
- Background: `bg-surface`
- Top border: `border-border`
- Flex with items left and right
- Font size: 11px
- Color: `text-muted`

### Left Items

| Element        | Description                                     |
| -------------- | ----------------------------------------------- |
| Save indicator | Green dot + "Saved" (or yellow dot + "Unsaved") |
| Item count     | "24 items" — total items in active checklist    |
| Selection      | "Item 2 of 24 selected"                         |

### Right Items

| Element   | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| Version   | "v1.0.0" — clickable to check for updates                        |
| Shortcuts | Keyboard icon + "Shortcuts" — clickable to show shortcut overlay |

## Screen 8: Export Modal

```
+------------------------------------------+
|  Export Checklists                   [X]  |
+------------------------------------------+
|  ┌──────────────┐ ┌──────────────┐       |
|  │ Garmin G3X   │ │ Garmin Pilot │       |
|  │ .ace         │ │ .gplt        │       |
|  │ G3X, G3X     │ │ Unencrypted  │       |
|  │ Touch, GTN   │ │ format       │       |
|  └──────────────┘ └──────────────┘       |
|  ┌──────────────┐ ┌──────────────┐       |
|  │ AFS / Dynon  │ │ ForeFlight   │       |
|  │ .afd / .txt  │ │ .fmd         │       |
|  │ SkyView,     │ │ Jeppesen     │       |
|  │ AF-5000      │ │ ForeFlight   │       |
|  └──────────────┘ └──────────────┘       |
|  ┌──────────────┐ ┌──────────────┐       |
|  │ GRT          │ │ Printable PDF│       |
|  │ .txt         │ │ .pdf         │       |
|  │ Grand Rapids │ │ Paper backup │       |
|  └──────────────┘ └──────────────┘       |
|  ┌──────────────┐                        |
|  │ JSON Backup  │                        |
|  │ .json        │                        |
|  │ Lossless     │                        |
|  │ internal fmt │                        |
|  └──────────────┘                        |
+------------------------------------------+
```

### Layout

- Centered modal, 480px wide
- Backdrop: `bg-black/60 backdrop-blur-sm`
- Modal: `bg-elevated border border-border rounded-xl shadow-2xl`
- Entry animation: fade in + scale from 96% + translate Y 8px (200ms ease)

### Header

- Title: "Export Checklists" — 16px semibold
- Close button: X icon, top right

### Export Grid

- 2-column CSS grid, 8px gap
- Each option: bordered card with name (13px bold), extension (11px mono, muted), description (11px, secondary)
- Hover: `border-accent bg-accent-dim`
- Click: triggers native save dialog for that format

### Note on MVP

For MVP, only Garmin ACE, JSON, and PDF options will be functional. Others show as disabled with "Coming soon" text.

## Screen 9: Command Palette

```
+------------------------------------------+
|  🔍 Search checklists and items...       |
+------------------------------------------+
|  CHECKLISTS                              |
|  ✓  Preflight Inspection         Normal  |
|  ✓  Before Engine Start          Normal  |
|  !  Engine Failure on Takeoff  Emergency |
+------------------------------------------+
|  ITEMS                                   |
|  ●  Parking Brake ··· SET    Preflight   |
|  ●  Hobbs / Tach ···· RECORD  Preflight  |
+------------------------------------------+
```

### Implementation

- Use existing shadcn `command.tsx` component (wraps cmdk)
- Triggered by: Ctrl+K (Windows/Linux), ⌘K (macOS), or clicking the search trigger in toolbar
- Searches both checklist names and item text
- Results grouped: "Checklists" section, then "Items" section
- Selecting a checklist navigates to it in the tree
- Selecting an item navigates to the checklist and selects that item

## Component Inventory

### New Components to Build

| Component                 | Path                                           | Description                                               |
| ------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `EditorLayout`            | `src/layouts/editor-layout.tsx`                | Main 4-panel layout replacing BaseLayout for editor route |
| `Toolbar`                 | `src/components/editor/toolbar.tsx`            | Top toolbar with all action buttons                       |
| `FilesSidebar`            | `src/components/editor/files-sidebar.tsx`      | Left panel with file list and drop zone                   |
| `ChecklistTree`           | `src/components/editor/checklist-tree.tsx`     | Center-left panel with groups/checklists                  |
| `ChecklistEditor`         | `src/components/editor/checklist-editor.tsx`   | Center panel with item list                               |
| `ChecklistItemRow`        | `src/components/editor/checklist-item-row.tsx` | Single item row with all variants                         |
| `PropertiesPanel`         | `src/components/editor/properties-panel.tsx`   | Right panel for item/metadata editing                     |
| `StatusBar`               | `src/components/editor/status-bar.tsx`         | Bottom status bar                                         |
| `ExportModal`             | `src/components/editor/export-modal.tsx`       | Export format selection dialog                            |
| `ImportDialog`            | `src/components/editor/import-dialog.tsx`      | Import file handling                                      |
| `ChecklistCommandPalette` | `src/components/editor/command-palette.tsx`    | ⌘K search palette                                         |
| `IndentGuides`            | `src/components/editor/indent-guides.tsx`      | Vertical line + tick indent visualization                 |
| `TypeIndicator`           | `src/components/editor/type-indicator.tsx`     | Colored dot/bar for item type                             |
| `FormatBadge`             | `src/components/editor/format-badge.tsx`       | Colored pill for file format                              |
| `GroupIcon`               | `src/components/editor/group-icon.tsx`         | Colored icon for checklist group type                     |
| `ToggleSwitch`            | `src/components/ui/toggle-switch.tsx`          | Custom toggle switch (or use shadcn Switch)               |

### Existing shadcn/ui Components to Use

| Component    | Usage                                      |
| ------------ | ------------------------------------------ |
| `Button`     | Toolbar buttons, action buttons            |
| `Dialog`     | Export modal, delete confirmations         |
| `Input`      | Properties panel fields, inline editing    |
| `Select`     | Type selector, indent level                |
| `Command`    | Command palette (⌘K)                       |
| `Popover`    | Context menus, dropdowns                   |
| `Tooltip`    | Button tooltips, keyboard shortcut hints   |
| `ScrollArea` | All scrollable panels                      |
| `Separator`  | Toolbar dividers                           |
| `Badge`      | Format badges, group badges                |
| `Alert`      | Disclaimer, warnings                       |
| `Sonner`     | Toast notifications (save, export, errors) |

## Color Tokens

All colors defined as CSS variables in the Tailwind theme, extending the existing shadcn/ui setup.

### Backgrounds

| Token               | Value     | Usage                                    |
| ------------------- | --------- | ---------------------------------------- |
| `--bg-base`         | `#0d1117` | Main content areas, editor body          |
| `--bg-base-deepest` | `#010409` | Title bar                                |
| `--bg-surface`      | `#161b22` | Sidebar, toolbar, status bar, properties |
| `--bg-elevated`     | `#1c2333` | Inputs, modal body, hover states         |
| `--bg-overlay`      | `#21283b` | Badges, overlays                         |
| `--bg-hover`        | `#292e3e` | Interactive hover state                  |
| `--bg-active`       | `#2d3548` | Active/pressed state                     |

### Borders

| Token            | Value     | Usage                  |
| ---------------- | --------- | ---------------------- |
| `--border`       | `#30363d` | Standard borders       |
| `--border-light` | `#3a4250` | Hover emphasis borders |

### Text

| Token              | Value     | Usage                    |
| ------------------ | --------- | ------------------------ |
| `--text-primary`   | `#e6edf3` | Primary text             |
| `--text-secondary` | `#8b949e` | Secondary text, labels   |
| `--text-muted`     | `#5a6370` | Muted text, placeholders |

### Accent Colors

| Token            | Value     | Usage                                              |
| ---------------- | --------- | -------------------------------------------------- |
| `--accent`       | `#58a6ff` | Links, selected items, challenge dots              |
| `--accent-dim`   | `#1f3a5f` | Selected item backgrounds                          |
| `--accent-hover` | `#79c0ff` | Accent hover state                                 |
| `--green`        | `#3fb950` | Success, normal group, check items, save indicator |
| `--green-dim`    | `#1a3a2a` | Normal group badge background                      |
| `--yellow`       | `#d29922` | Warnings, abnormal group                           |
| `--yellow-dim`   | `#3d2e00` | Abnormal group badge background                    |
| `--red`          | `#f85149` | Errors, emergency group, delete actions            |
| `--red-dim`      | `#3d1418` | Emergency group badge background                   |
| `--orange`       | `#db6d28` | Caution items, GRT format                          |
| `--purple`       | `#a371f7` | Title/section items, Dynon format                  |
| `--cyan`         | `#39d2c0` | Sub-section titles, ForeFlight format              |

## Keyboard Shortcuts

| Key                    | Action                       | Context                      |
| ---------------------- | ---------------------------- | ---------------------------- |
| `↑` / `↓`              | Navigate between items       | Editor body focused          |
| `Enter`                | Begin editing selected item  | Item selected                |
| `Enter`                | Commit edit                  | Editing item                 |
| `Escape`               | Cancel edit / deselect       | Editing or selected          |
| `Delete` / `Backspace` | Delete selected item         | Item selected (with confirm) |
| `Tab`                  | Indent item one level        | Item selected                |
| `Shift+Tab`            | Outdent item one level       | Item selected                |
| `Ctrl+N`               | Add new item after selection | Editor focused               |
| `Ctrl+Shift+N`         | Add new checklist            | Anywhere                     |
| `Ctrl+Z`               | Undo                         | Anywhere                     |
| `Ctrl+Shift+Z`         | Redo                         | Anywhere                     |
| `Ctrl+K`               | Open command palette         | Anywhere                     |
| `Ctrl+S`               | Save / export current file   | Anywhere                     |
| `Ctrl+O`               | Open / import file           | Anywhere                     |
| `Ctrl+Shift+E`         | Quick export                 | Anywhere                     |
| `Ctrl+D`               | Duplicate selected item      | Item selected                |
| `Ctrl+/`               | Toggle properties panel      | Anywhere                     |

(macOS: `Ctrl` → `⌘`, `Alt` → `⌥`)

### Keyboard Shortcuts Hint

- Fixed position overlay at bottom-right, above status bar
- Shows on first app launch for 5 seconds, then fades out
- Can be re-shown by clicking "Shortcuts" in status bar
- Background: `bg-overlay border border-border rounded-md`
- Shows key hints: `↑↓ Navigate  Enter Edit  Del Remove  ⌘K Search`

## Animations

| Element                  | Animation                                   | Duration   |
| ------------------------ | ------------------------------------------- | ---------- |
| Button hover             | Background color transition                 | 150ms ease |
| Modal open               | Fade in + scale(0.96→1) + translateY(8px→0) | 200ms ease |
| Modal close              | Fade out + scale(1→0.96)                    | 150ms ease |
| Collapse/expand chevron  | Rotate 0deg ↔ -90deg                        | 150ms ease |
| Collapse/expand children | Height auto (CSS or React-spring)           | 200ms ease |
| Drag handle appear       | Opacity 0→1                                 | 150ms ease |
| Action buttons appear    | Opacity 0→1 on row hover                    | 150ms ease |
| Selected item            | Instant background change (no transition)   | —          |
| Toast notifications      | Slide in from bottom-right                  | 200ms ease |
| Drag reorder             | Item follows cursor, drop indicator line    | Smooth     |
| Shortcuts hint           | Opacity fade in/out                         | 300ms ease |
| Panel toggle             | Instant show/hide (no animation for MVP)    | —          |

## Error States

| Scenario                                | Display                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| File import fails (corrupt/unsupported) | Toast notification (red): "Failed to import: [reason]"                                                 |
| File export fails (permission denied)   | Toast notification (red): "Export failed: [reason]"                                                    |
| Item validation error                   | Inline red border on invalid field + tooltip with message                                              |
| File not found (recent files)           | Gray out entry in file list, tooltip "File not found"                                                  |
| Format incompatibility warning          | Yellow indicator in format compatibility section                                                       |
| Empty state — no files                  | Full-panel empty state with icon + "Create or import a checklist file to get started" + action buttons |
| Empty state — no checklists in file     | Center panel: "This file has no checklists yet. Click + to add one."                                   |
| Empty state — no items in checklist     | Editor body: "This checklist is empty. Add your first item."                                           |
| Unsaved changes on close                | Confirm dialog: "You have unsaved changes. Save before closing?"                                       |

## Responsive Behavior

Since this is a desktop Electron app, "responsive" means adapting to different window sizes:

| Window Width    | Behavior                                                            |
| --------------- | ------------------------------------------------------------------- |
| **> 1400px**    | All four panels visible (sidebar + tree + editor + properties)      |
| **1100–1400px** | Properties panel hidden by default (toggle to overlay)              |
| **800–1100px**  | Sidebar collapsed to icon-only (40px), properties hidden            |
| **< 800px**     | Minimum usable width — sidebar + tree collapse, only editor visible |

### Panel Priorities (when space is limited)

1. Editor (always visible, flex-1)
2. Checklist tree (280px, can be toggled)
3. Files sidebar (260px, can be collapsed)
4. Properties panel (280px, can be toggled)

### Minimum Window Size

- Width: 800px
- Height: 600px
- Set in Electron `BrowserWindow` options

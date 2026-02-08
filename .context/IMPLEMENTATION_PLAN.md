# Implementation Plan — EFIS Checklist Editor

## Phase Overview

| Phase | Name | Description | Dependencies |
|-------|------|-------------|--------------|
| 1 | Theme & Foundation | Custom color tokens, fonts, base CSS | None |
| 2 | Data Model & State | TypeScript types, Zustand store, undo/redo | None |
| 3 | IPC Layer | File I/O handlers, dialog handlers, format detection | Phase 2 |
| 4 | Layout Shell | EditorLayout, panel structure, routing | Phase 1 |
| 5 | Files Sidebar | File list, new file, drag-and-drop import | Phases 3, 4 |
| 6 | Checklist Tree | Groups, checklists, selection, reordering | Phases 2, 4 |
| 7 | Checklist Editor | Item list, item rows, type variants, indentation | Phases 2, 4, 6 |
| 8 | Item Editing | Inline editing, add/remove, indent/outdent | Phase 7 |
| 9 | Properties Panel | Item properties, metadata, format compatibility | Phases 2, 7 |
| 10 | Toolbar & Status Bar | All toolbar actions, status indicators | Phases 5–9 |
| 11 | Drag & Drop | Reorder items, reorder checklists | Phases 7, 8 |
| 12 | Command Palette | Search checklists and items | Phases 6, 7 |
| 13 | Export & Import | Format parsers, export modal, import flow | Phases 2, 3 |
| 14 | Keyboard Shortcuts | All shortcut bindings | Phases 7–12 |
| 15 | Persistence & Polish | Autosave, recent files, empty states, error handling | All above |

---

## Phase 1: Theme & Foundation

### Color Tokens & CSS (`src/styles/`)

- [ ] Add EFIS-specific color tokens to `src/styles/global.css` `@theme inline` block:
  - Background scale: `--bg-base`, `--bg-base-deepest`, `--bg-surface`, `--bg-elevated`, `--bg-overlay`, `--bg-hover`, `--bg-active`
  - Border tokens: `--border`, `--border-light`
  - Text tokens: `--text-primary`, `--text-secondary`, `--text-muted`
  - Accent colors: `--accent`, `--accent-dim`, `--accent-hover`, `--green`, `--green-dim`, `--yellow`, `--yellow-dim`, `--red`, `--red-dim`, `--orange`, `--purple`, `--cyan`
- [ ] Map new tokens as Tailwind utility classes in the `@theme inline` block (e.g., `--color-bg-base: #0d1117`)
- [ ] Add Inter and JetBrains Mono font imports (Inter already present, add JetBrains Mono via `@fontsource-variable/jetbrains-mono` or CDN)
- [ ] Set JetBrains Mono as `--font-mono` in theme

### Dependencies

- [ ] Install `lucide-react` (icon library)
- [ ] Install `@fontsource-variable/jetbrains-mono` (if not using CDN)

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/styles/global.css` | Add color tokens, font-mono, EFIS theme variables |
| Modify | `package.json` | Add lucide-react, jetbrains-mono dependencies |

---

## Phase 2: Data Model & State

### TypeScript Types (`src/types/`)

- [ ] Create `src/types/checklist.ts` with all type definitions:
  - `ChecklistItemType` enum: `ChallengeResponse`, `ChallengeOnly`, `Title`, `Note`, `Warning`, `Caution`
  - `ChecklistItem` interface: `id`, `type`, `challengeText`, `responseText`, `indent` (0–3), `centered`, `children` (nested items array)
  - `Checklist` interface: `id`, `name`, `items` (flat array with indent/parent relationships)
  - `ChecklistGroupCategory` enum: `Normal`, `Emergency`, `Abnormal`
  - `ChecklistGroup` interface: `id`, `name`, `category`, `checklists`
  - `ChecklistFileMetadata` interface: `aircraftRegistration`, `makeModel`, `copyright`
  - `ChecklistFile` interface: `id`, `name`, `format`, `filePath?`, `groups`, `metadata`, `lastModified`
  - `ChecklistFormat` enum: `Ace`, `Gplt`, `AfsDynon`, `ForeFlight`, `Grt`, `Json`, `Pdf`
- [ ] Create `src/types/editor.ts` with editor state types:
  - `EditorState` interface: selected file ID, selected checklist ID, selected item ID, editing item ID, properties panel visible, collapsed item IDs set
- [ ] Create `src/types/index.ts` barrel export

### Zustand Store (`src/stores/`)

- [ ] Create `src/stores/checklist-store.ts`:
  - State: `files` (Map<string, ChecklistFile>), `activeFileId`, `activeChecklistId`, `activeItemId`, `editingItemId`
  - Actions: `addFile`, `removeFile`, `setActiveFile`, `updateFileMetadata`
  - Actions: `addGroup`, `removeGroup`, `renameGroup`, `reorderGroups`
  - Actions: `addChecklist`, `removeChecklist`, `renameChecklist`, `reorderChecklists`, `moveChecklist`
  - Actions: `addItem`, `removeItem`, `updateItem`, `reorderItems`, `indentItem`, `outdentItem`
  - Actions: `toggleCollapsed`, `setEditingItem`
  - Derived: `activeFile`, `activeChecklist`, `activeItem` (computed getters)
- [ ] Create `src/stores/undo-store.ts`:
  - Undo/redo middleware for Zustand (`temporal` middleware or custom)
  - `undo()`, `redo()`, `canUndo`, `canRedo`
- [ ] Create `src/stores/ui-store.ts`:
  - State: `propertiesPanelVisible`, `sidebarVisible`, `treePanelVisible`
  - Actions: `togglePropertiesPanel`, `toggleSidebar`, `toggleTreePanel`
- [ ] Create `src/stores/index.ts` barrel export

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/types/checklist.ts` | All checklist data types |
| Create | `src/types/editor.ts` | Editor UI state types |
| Create | `src/types/index.ts` | Barrel export |
| Create | `src/stores/checklist-store.ts` | Main data store with all CRUD actions |
| Create | `src/stores/undo-store.ts` | Undo/redo middleware |
| Create | `src/stores/ui-store.ts` | UI panel visibility state |
| Create | `src/stores/index.ts` | Barrel export |
| Modify | `package.json` | Add `zustand` dependency |

---

## Phase 3: IPC Layer

### File I/O Handlers (`src/ipc/checklist/`)

- [ ] Create `src/ipc/checklist/handlers.ts`:
  - `readChecklistFile` — reads a JSON checklist file from disk, returns parsed `ChecklistFile`
  - `writeChecklistFile` — writes `ChecklistFile` as JSON to disk
  - `importFile` — opens file dialog, reads file, detects format by extension, parses to internal model
  - `exportFile` — takes `ChecklistFile` + target format + path, serializes and writes
  - `getRecentFiles` — reads recent files list from app data
  - `addRecentFile` — adds a file path to recent files list
- [ ] Create `src/ipc/checklist/schemas.ts` — Zod schemas for handler inputs
- [ ] Create `src/ipc/checklist/index.ts` — barrel export

### Dialog Handlers (`src/ipc/dialog/`)

- [ ] Create `src/ipc/dialog/handlers.ts`:
  - `openFileDialog` — show native open dialog with format filters
  - `saveFileDialog` — show native save dialog with format-specific extension
- [ ] Create `src/ipc/dialog/schemas.ts` — Zod schemas
- [ ] Create `src/ipc/dialog/index.ts` — barrel export

### Format Parsers (`src/ipc/parsers/`)

- [ ] Create `src/ipc/parsers/types.ts` — shared parser interface: `parse(content: string): ChecklistFile`, `serialize(file: ChecklistFile): string`
- [ ] Create `src/ipc/parsers/json-parser.ts` — JSON parse/serialize (trivial)
- [ ] Create `src/ipc/parsers/ace-parser.ts` — Garmin ACE XML parse/serialize
- [ ] Create `src/ipc/parsers/index.ts` — parser registry keyed by `ChecklistFormat`

### Router Update

- [ ] Update `src/ipc/router.ts` to include `checklist` and `dialog` domains

### Actions (`src/actions/`)

- [ ] Create `src/actions/checklist.ts`:
  - `readChecklistFile(path)`, `writeChecklistFile(file, path)`, `importFile()`, `exportFile(file, format, path)`, `getRecentFiles()`, `addRecentFile(path)`
- [ ] Create `src/actions/dialog.ts`:
  - `openFileDialog(filters)`, `saveFileDialog(defaultName, format)`

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/ipc/checklist/handlers.ts` | File I/O and import/export handlers |
| Create | `src/ipc/checklist/schemas.ts` | Zod validation schemas |
| Create | `src/ipc/checklist/index.ts` | Barrel export |
| Create | `src/ipc/dialog/handlers.ts` | Native dialog handlers |
| Create | `src/ipc/dialog/schemas.ts` | Zod schemas |
| Create | `src/ipc/dialog/index.ts` | Barrel export |
| Create | `src/ipc/parsers/types.ts` | Parser interface |
| Create | `src/ipc/parsers/json-parser.ts` | JSON parser |
| Create | `src/ipc/parsers/ace-parser.ts` | Garmin ACE XML parser |
| Create | `src/ipc/parsers/index.ts` | Parser registry |
| Modify | `src/ipc/router.ts` | Add checklist, dialog domains |
| Create | `src/actions/checklist.ts` | Renderer-side checklist action wrappers |
| Create | `src/actions/dialog.ts` | Renderer-side dialog action wrappers |
| Modify | `package.json` | Add `fast-xml-parser` dependency |

---

## Phase 4: Layout Shell

### Editor Layout (`src/layouts/`)

- [ ] Create `src/layouts/editor-layout.tsx`:
  - Full-height flex column: TitleBar → Toolbar → Main (flex row) → StatusBar
  - Main area: FilesSidebar | ChecklistTree | ChecklistEditor | PropertiesPanel
  - Reads panel visibility from `ui-store`
  - Wraps in `UpdateNotificationProvider`

### Title Bar Update

- [ ] Modify `src/components/shared/drag-window-region.tsx`:
  - Update styling to use EFIS dark theme colors (`bg-[#010409]`)
  - Show dynamic title: "EFIS Editor — {active file name}"
  - Accept `subtitle` prop for the file name

### Route Setup

- [ ] Create `src/routes/editor.tsx`:
  - New route at `/editor` using `createFileRoute`
  - Renders the `EditorLayout` with all panels
  - This is the main working route (replaces the welcome page as primary)
- [ ] Update `src/routes/__root.tsx`:
  - Keep `BaseLayout` for the root, but the editor route will use its own layout
- [ ] Update `src/routes/index.tsx`:
  - Simplify to a landing/welcome that redirects to `/editor` or provides a "Get Started" button

### Placeholder Components

- [ ] Create `src/components/editor/toolbar.tsx` — placeholder with correct height and background
- [ ] Create `src/components/editor/files-sidebar.tsx` — placeholder with correct width and background
- [ ] Create `src/components/editor/checklist-tree.tsx` — placeholder with correct width and background
- [ ] Create `src/components/editor/checklist-editor.tsx` — placeholder with flex-1
- [ ] Create `src/components/editor/properties-panel.tsx` — placeholder with correct width
- [ ] Create `src/components/editor/status-bar.tsx` — placeholder with correct height

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/layouts/editor-layout.tsx` | Main editor 4-panel layout |
| Modify | `src/components/shared/drag-window-region.tsx` | EFIS theme, dynamic title |
| Create | `src/routes/editor.tsx` | Editor route |
| Modify | `src/routes/__root.tsx` | Route structure update |
| Modify | `src/routes/index.tsx` | Simplify to landing page |
| Create | `src/components/editor/toolbar.tsx` | Placeholder |
| Create | `src/components/editor/files-sidebar.tsx` | Placeholder |
| Create | `src/components/editor/checklist-tree.tsx` | Placeholder |
| Create | `src/components/editor/checklist-editor.tsx` | Placeholder |
| Create | `src/components/editor/properties-panel.tsx` | Placeholder |
| Create | `src/components/editor/status-bar.tsx` | Placeholder |

---

## Phase 5: Files Sidebar

### Full Implementation (`src/components/editor/files-sidebar.tsx`)

- [ ] Implement sidebar header with "CHECKLIST FILES" label and "+" new file button
- [ ] Implement file list from Zustand store (`files` map)
- [ ] Create `src/components/editor/format-badge.tsx` — format extension pill
- [ ] File list items: icon (colored by format), name, format badge
- [ ] Active file highlighting with left accent bar
- [ ] Click to select file (updates `activeFileId` in store)
- [ ] Right-click context menu: Rename, Close, Delete
- [ ] Implement drop zone at bottom:
  - Drag-and-drop file detection (HTML5 drag events)
  - Click to trigger import via IPC `openFileDialog`
  - On drop: call IPC `importFile` with dropped file path
- [ ] New file button: creates empty `ChecklistFile` with one empty group and checklist

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/files-sidebar.tsx` | Full implementation |
| Create | `src/components/editor/format-badge.tsx` | Format extension pill component |

---

## Phase 6: Checklist Tree

### Full Implementation (`src/components/editor/checklist-tree.tsx`)

- [ ] Implement tree header: active file name + format badge
- [ ] Create `src/components/editor/group-icon.tsx` — colored icon for group category (Normal/Emergency/Abnormal)
- [ ] Implement group sections:
  - Collapsible group headers (chevron + name + checklist count)
  - Group category determines icon color
- [ ] Implement checklist items within groups:
  - Group icon + name + item count
  - Click to select checklist (updates `activeChecklistId`)
  - Active state: `bg-accent-dim text-accent`
- [ ] Right-click context menu on checklists:
  - Rename (inline edit)
  - Duplicate
  - Move to group (submenu)
  - Delete (with confirmation)
- [ ] Right-click context menu on groups:
  - Rename (inline edit)
  - Add checklist
  - Delete group (with confirmation)
- [ ] Add checklist button at bottom or in group context

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/checklist-tree.tsx` | Full implementation |
| Create | `src/components/editor/group-icon.tsx` | Group category icon component |

---

## Phase 7: Checklist Editor

### Editor Header

- [ ] Implement editor header in `src/components/editor/checklist-editor.tsx`:
  - Checklist name (18px, semibold)
  - Group badge (colored pill)
  - Breadcrumb: File name › Group name › Checklist name
  - Action buttons: Duplicate, Delete

### Item Row Component

- [ ] Create `src/components/editor/checklist-item-row.tsx`:
  - Drag handle (6-dot grip, visible on hover)
  - Type indicator dot/bar (colored by item type)
  - Content area (varies by type — see below)
  - Action buttons (visible on hover): Edit, Indent/Outdent, Add child, Delete
- [ ] Create `src/components/editor/type-indicator.tsx`:
  - Renders colored circle (6px) or bar (14×3px) based on `ChecklistItemType`
- [ ] Create `src/components/editor/indent-guides.tsx`:
  - Takes `depth` (number) and `isLastChild` (boolean)
  - Renders N vertical guide columns with optional tick connectors

### Content Variants in Item Row

- [ ] Challenge/Response: challenge text + dot leader + response text
- [ ] Challenge Only: challenge text only
- [ ] Title/Section Header: uppercase bold text, purple color, collapse toggle + child count
- [ ] Note/Plaintext: italic muted text
- [ ] Warning: yellow text with "⚠" prefix
- [ ] Caution: orange text

### Collapse/Expand

- [ ] Parent items (items with children) show chevron toggle
- [ ] Collapsed state hides all descendant items
- [ ] "Collapsed" badge appears on collapsed parents
- [ ] Track collapsed item IDs in Zustand store

### Item List Rendering

- [ ] Implement flat list rendering in `checklist-editor.tsx`:
  - Flatten the hierarchical item structure for rendering
  - Skip hidden (collapsed) items
  - "Add section or item" button at bottom

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/checklist-editor.tsx` | Full implementation with header + item list |
| Create | `src/components/editor/checklist-item-row.tsx` | Item row with all variants |
| Create | `src/components/editor/type-indicator.tsx` | Type dot/bar component |
| Create | `src/components/editor/indent-guides.tsx` | Indent visualization component |

---

## Phase 8: Item Editing

### Inline Editing

- [ ] Add inline editing mode to `checklist-item-row.tsx`:
  - Double-click or Enter on selected item enters edit mode
  - Challenge text → input field
  - Response text → input field (for Challenge/Response type)
  - Single text field for Note, Warning, Caution, Title types
  - Enter commits, Escape cancels
  - Tab moves between challenge and response fields
  - Track `editingItemId` in store

### Add/Remove Items

- [ ] "Add section or item" button at bottom of editor:
  - Opens a type selector (dropdown or small palette)
  - Creates new item of chosen type after current selection
- [ ] Add child item button on parent rows
- [ ] Delete selected item (with confirmation for non-empty parents)

### Indent/Outdent

- [ ] Tab key or button: increase indent level (max 3)
- [ ] Shift+Tab or button: decrease indent level (min 0)
- [ ] Validate: cannot indent deeper than parent + 1

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/checklist-item-row.tsx` | Add inline editing mode |
| Modify | `src/components/editor/checklist-editor.tsx` | Add item CRUD operations, type selector |

---

## Phase 9: Properties Panel

### Full Implementation (`src/components/editor/properties-panel.tsx`)

- [ ] Section: **Selected Item**
  - Type selector (dropdown): Challenge/Response, Challenge Only, Title, Note, Warning, Caution
  - Challenge text input
  - Response text input (visible only for Challenge/Response type)
- [ ] Section: **Formatting**
  - Indent level selector (0–3 with labels)
  - Centered toggle switch
  - Collapsible parent toggle switch
- [ ] Section: **Format Compatibility**
  - Grid of format names + supported/unsupported status
  - Dynamically computed based on current item's type and formatting
- [ ] Section: **Checklist Metadata** (always visible, updates file metadata)
  - Aircraft Registration input
  - Aircraft Make & Model input
  - Copyright input
- [ ] All fields bidirectionally bound to Zustand store
- [ ] Empty state when no item is selected: "Select an item to view its properties"

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/properties-panel.tsx` | Full implementation with all sections |

---

## Phase 10: Toolbar & Status Bar

### Toolbar (`src/components/editor/toolbar.tsx`)

- [ ] Import button: triggers `openFileDialog` → `importFile` IPC flow
- [ ] Export button: opens Export Modal
- [ ] Undo button: calls `undo()` from undo store, disabled when `!canUndo`
- [ ] Redo button: calls `redo()` from undo store, disabled when `!canRedo`
- [ ] Add Item button: adds new item after selection
- [ ] Add Checklist button: adds new checklist to active group
- [ ] Search trigger button: opens command palette
- [ ] Properties toggle button: toggles properties panel via `ui-store`
- [ ] Quick Export button (primary style): exports to last-used format and path
- [ ] Button groups separated by `Separator` components

### Status Bar (`src/components/editor/status-bar.tsx`)

- [ ] Left: save indicator (green/yellow dot + text), item count, selection info
- [ ] Right: version number (clickable, check for updates), shortcuts button
- [ ] Save indicator reads from store dirty state

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/toolbar.tsx` | Full implementation |
| Modify | `src/components/editor/status-bar.tsx` | Full implementation |

---

## Phase 11: Drag & Drop

### Item Reordering

- [ ] Install and configure `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] Wrap editor item list with `DndContext` and `SortableContext`
- [ ] Make each `ChecklistItemRow` sortable via `useSortable` hook
- [ ] Drag handle activates drag (6-dot grip icon)
- [ ] Show drop indicator line between items during drag
- [ ] Handle cross-depth drops (moving item to different indent level)
- [ ] Update item order in Zustand store on drop

### Checklist Reordering (Tree Panel)

- [ ] Make checklist items in tree panel sortable within groups
- [ ] Make groups reorderable within the file
- [ ] Update store on drop

### Files

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/components/editor/checklist-editor.tsx` | Add DndContext wrapper |
| Modify | `src/components/editor/checklist-item-row.tsx` | Add useSortable hook |
| Modify | `src/components/editor/checklist-tree.tsx` | Add sortable for checklists and groups |
| Modify | `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## Phase 12: Command Palette

### Implementation (`src/components/editor/command-palette.tsx`)

- [ ] Use existing shadcn `Command` component (cmdk wrapper)
- [ ] Open via Ctrl+K or toolbar search button
- [ ] Search input at top
- [ ] Results grouped in two sections:
  - **Checklists**: match checklist names, show group badge
  - **Items**: match item challenge/response text, show parent checklist name
- [ ] Selecting a checklist: navigate to it (set `activeChecklistId`)
- [ ] Selecting an item: navigate to its checklist and select it (set `activeChecklistId` + `activeItemId`)
- [ ] Keyboard navigation: up/down arrows, Enter to select, Escape to close

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/components/editor/command-palette.tsx` | Full command palette implementation |
| Modify | `src/layouts/editor-layout.tsx` | Mount command palette in layout |

---

## Phase 13: Export & Import

### Export Modal (`src/components/editor/export-modal.tsx`)

- [ ] Use shadcn `Dialog` component
- [ ] 2-column grid of export format options
- [ ] Each option: format name, file extension, description
- [ ] MVP: only Garmin ACE, JSON, PDF active. Others show "Coming soon" disabled state
- [ ] Clicking an option:
  1. Opens native save dialog (via IPC `saveFileDialog`)
  2. Serializes active file to chosen format (via IPC `exportFile`)
  3. Shows success/error toast

### Import Flow

- [ ] Create `src/components/editor/import-dialog.tsx`:
  - Triggered by Import toolbar button or drag-and-drop
  - Detects format from file extension
  - Calls IPC `importFile`
  - Adds parsed file to store
  - Shows success toast with file name and format detected

### PDF Export (MVP)

- [ ] Create `src/ipc/parsers/pdf-generator.ts`:
  - Uses `pdfkit` (main process) to generate PDF
  - Basic layout: group titles as headers, checklist names as sub-headers, items as rows
  - Letter page size (default)
- [ ] Wire up PDF export in `exportFile` handler

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/components/editor/export-modal.tsx` | Export format selection modal |
| Create | `src/components/editor/import-dialog.tsx` | Import feedback/confirmation |
| Create | `src/ipc/parsers/pdf-generator.ts` | PDF generation using pdfkit |
| Modify | `src/ipc/checklist/handlers.ts` | Wire up PDF export path |
| Modify | `package.json` | Add `pdfkit` dependency |

---

## Phase 14: Keyboard Shortcuts

### Global Shortcut Handler

- [ ] Create `src/hooks/use-keyboard-shortcuts.ts`:
  - Register global keydown listener
  - Map key combos to actions (respecting platform: Ctrl vs ⌘)
  - Prevent default browser behavior for captured shortcuts
  - Context-aware: some shortcuts only active when editor/item is focused
- [ ] Implement all shortcuts from UI/UX spec:
  - Navigation: ↑/↓ move between items
  - Editing: Enter to edit, Escape to cancel, Delete to remove
  - Indent: Tab / Shift+Tab
  - Commands: Ctrl+Z/Ctrl+Shift+Z (undo/redo), Ctrl+K (palette), Ctrl+S (save), Ctrl+O (open), Ctrl+Shift+E (quick export), Ctrl+D (duplicate), Ctrl+N (new item), Ctrl+Shift+N (new checklist), Ctrl+/ (toggle properties)

### Shortcuts Hint Overlay

- [ ] Create `src/components/editor/shortcuts-hint.tsx`:
  - Fixed position overlay, bottom-right, above status bar
  - Shows on first launch for 5 seconds
  - Re-shows when "Shortcuts" clicked in status bar
  - Displays key hints with `<kbd>` elements

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/hooks/use-keyboard-shortcuts.ts` | Global keyboard shortcut handler |
| Create | `src/components/editor/shortcuts-hint.tsx` | Keyboard hint overlay |
| Modify | `src/layouts/editor-layout.tsx` | Mount shortcut hook and hint overlay |

---

## Phase 15: Persistence & Polish

### Autosave

- [ ] Create `src/hooks/use-autosave.ts`:
  - Watches Zustand store for changes (debounced, 2 second delay)
  - Writes all open files to app data directory as JSON
  - Updates "last modified" timestamp
- [ ] On app start: load previously open files from app data directory
- [ ] Track dirty state (unsaved changes) per file

### Recent Files

- [ ] Store recent file paths in a JSON file in app data
- [ ] Show recent files in a "Recent" section of the files sidebar (or welcome page)
- [ ] Validate that recent file paths still exist on disk

### Window State Persistence

- [ ] Save window position, size, and panel visibility on close
- [ ] Restore on next launch

### Empty States

- [ ] No files open: full-panel empty state with "Create or import a checklist" + action buttons
- [ ] File has no checklists: center panel message + "Add checklist" button
- [ ] Checklist has no items: editor body message + "Add first item" button
- [ ] No item selected: properties panel shows "Select an item to view properties"

### Error Handling

- [ ] File import errors: toast notification with error message
- [ ] File export errors: toast notification with error message
- [ ] Unsaved changes on close: confirmation dialog
- [ ] File not found (recent files): gray out and show tooltip

### UI Polish

- [ ] Ensure all transitions match spec (150ms ease for buttons, 200ms for modals)
- [ ] Tooltip on all toolbar buttons with keyboard shortcut hints
- [ ] Scroll areas with custom scrollbar styling (thin, matching theme)
- [ ] Focus management: ensure keyboard navigation works naturally

### Files

| Action | File | Changes |
|--------|------|---------|
| Create | `src/hooks/use-autosave.ts` | Autosave hook |
| Modify | `src/layouts/editor-layout.tsx` | Mount autosave hook, load persisted state |
| Modify | `src/components/editor/files-sidebar.tsx` | Recent files section, empty state |
| Modify | `src/components/editor/checklist-editor.tsx` | Empty states |
| Modify | `src/components/editor/properties-panel.tsx` | Empty state for no selection |
| Modify | `src/main.ts` | Window state persistence, restore on launch |

---

## Full File Inventory

### New Files (40)

| File | Purpose |
|------|---------|
| `src/types/checklist.ts` | Checklist data type definitions |
| `src/types/editor.ts` | Editor state types |
| `src/types/index.ts` | Types barrel export |
| `src/stores/checklist-store.ts` | Main checklist data Zustand store |
| `src/stores/undo-store.ts` | Undo/redo middleware |
| `src/stores/ui-store.ts` | UI panel visibility store |
| `src/stores/index.ts` | Stores barrel export |
| `src/ipc/checklist/handlers.ts` | Checklist file I/O IPC handlers |
| `src/ipc/checklist/schemas.ts` | Zod validation schemas |
| `src/ipc/checklist/index.ts` | Barrel export |
| `src/ipc/dialog/handlers.ts` | Native dialog IPC handlers |
| `src/ipc/dialog/schemas.ts` | Zod schemas |
| `src/ipc/dialog/index.ts` | Barrel export |
| `src/ipc/parsers/types.ts` | Parser interface |
| `src/ipc/parsers/json-parser.ts` | JSON format parser |
| `src/ipc/parsers/ace-parser.ts` | Garmin ACE XML parser |
| `src/ipc/parsers/pdf-generator.ts` | PDF export generator |
| `src/ipc/parsers/index.ts` | Parser registry |
| `src/actions/checklist.ts` | Renderer-side checklist IPC wrappers |
| `src/actions/dialog.ts` | Renderer-side dialog IPC wrappers |
| `src/layouts/editor-layout.tsx` | Main 4-panel editor layout |
| `src/routes/editor.tsx` | Editor route |
| `src/components/editor/toolbar.tsx` | Top toolbar |
| `src/components/editor/files-sidebar.tsx` | Files sidebar panel |
| `src/components/editor/checklist-tree.tsx` | Checklist tree panel |
| `src/components/editor/checklist-editor.tsx` | Main checklist editor panel |
| `src/components/editor/checklist-item-row.tsx` | Individual item row component |
| `src/components/editor/properties-panel.tsx` | Properties panel |
| `src/components/editor/status-bar.tsx` | Bottom status bar |
| `src/components/editor/export-modal.tsx` | Export format selection modal |
| `src/components/editor/import-dialog.tsx` | Import feedback dialog |
| `src/components/editor/command-palette.tsx` | ⌘K search palette |
| `src/components/editor/type-indicator.tsx` | Item type colored dot/bar |
| `src/components/editor/indent-guides.tsx` | Indent visualization |
| `src/components/editor/format-badge.tsx` | File format pill badge |
| `src/components/editor/group-icon.tsx` | Group category icon |
| `src/components/editor/shortcuts-hint.tsx` | Keyboard shortcuts overlay |
| `src/hooks/use-keyboard-shortcuts.ts` | Global keyboard shortcut handler |
| `src/hooks/use-autosave.ts` | Autosave debounced hook |

### Modified Files (9)

| File | Changes |
|------|---------|
| `src/styles/global.css` | EFIS color tokens, JetBrains Mono font |
| `src/ipc/router.ts` | Add checklist and dialog domains |
| `src/routes/__root.tsx` | Route structure for editor layout |
| `src/routes/index.tsx` | Simplify to landing page |
| `src/components/shared/drag-window-region.tsx` | EFIS theme, dynamic title |
| `src/main.ts` | Window state persistence, minimum size |
| `package.json` | New dependencies |

---

## Dependencies to Install

### npm Packages

```bash
pnpm add zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react fast-xml-parser pdfkit
pnpm add -D @types/pdfkit
```

### shadcn/ui Components to Add (if not present)

```bash
npx shadcn@latest add switch context-menu dropdown-menu
```

Check if these are already installed before adding:
- `switch` — for toggle switches in properties panel
- `context-menu` — for right-click menus on tree items and files
- `dropdown-menu` — for toolbar dropdown menus

---

## Implementation Notes

### Key Patterns

1. **Zustand store structure**: Use a single `checklist-store` for all data with computed selectors for active items. Separate `ui-store` for panel state to avoid unnecessary re-renders.

2. **Item hierarchy**: Items are stored in a flat array per checklist with `indent` level (0–3). Parent-child relationships are inferred from position + indent level: an item is a child of the nearest preceding item with a lower indent level.

3. **IPC for file operations only**: All file I/O goes through IPC (main process). The renderer handles only UI state and data manipulation in memory. This keeps the architecture clean and secure.

4. **Parser architecture**: Each format parser implements a common interface (`parse` / `serialize`). New formats can be added by creating a new parser file and registering it in the parser index.

5. **Undo/redo scope**: Undo/redo tracks checklist item mutations (add, remove, edit, reorder, indent). File-level operations (create, delete file) are not undoable.

6. **Font loading**: Inter is already loaded via `@fontsource-variable/inter`. JetBrains Mono should be loaded the same way for consistency.

### Constraints

- **No inline styles** — all styling via Tailwind classes per CLAUDE.md rules
- **OKLCH color space** — existing theme uses OKLCH. New tokens should be added as hex values that get mapped through Tailwind's `@theme inline` block
- **oRPC pattern** — all IPC follows the existing handler → router → action pattern
- **File-based routing** — all routes in `src/routes/` following TanStack Router conventions
- **Path alias** — use `@/` prefix for all imports (maps to `./src/`)

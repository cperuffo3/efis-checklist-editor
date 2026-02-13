# Implementation Plan — EFIS Checklist Editor

## Phase Overview

| Phase | Name                 | Description                                          | Dependencies   | Status       |
| ----- | -------------------- | ---------------------------------------------------- | -------------- | ------------ |
| 1     | Theme & Foundation   | Custom color tokens, fonts, base CSS                 | None           | **COMPLETE** |
| 2     | Data Model & State   | TypeScript types, Zustand store, undo/redo           | None           | **COMPLETE** |
| 3     | IPC Layer            | File I/O handlers, dialog handlers, format detection | Phase 2        | **COMPLETE** |
| 4     | Layout Shell         | EditorLayout, panel structure, routing               | Phase 1        | **COMPLETE** |
| 5     | Files Sidebar        | File list, new file, drag-and-drop import            | Phases 3, 4    | **COMPLETE** |
| 6     | Checklist Tree       | Groups, checklists, selection, reordering            | Phases 2, 4    | **COMPLETE** |
| 7     | Checklist Editor     | Item list, item rows, type variants, indentation     | Phases 2, 4, 6 | **COMPLETE** |
| 8     | Item Editing         | Inline editing, add/remove, indent/outdent           | Phase 7        | **COMPLETE** |
| 9     | Properties Panel     | Item properties, metadata, format compatibility      | Phases 2, 7    | **COMPLETE** |
| 10    | Toolbar & Status Bar | All toolbar actions, status indicators               | Phases 5–9     | **COMPLETE** |
| 11    | Drag & Drop          | Reorder items, reorder checklists                    | Phases 7, 8    | **COMPLETE** |
| 12    | Command Palette      | Search checklists and items                          | Phases 6, 7    | **COMPLETE** |
| 13    | Export & Import      | Format parsers, export modal, import flow            | Phases 2, 3    | **COMPLETE** |
| 14    | Keyboard Shortcuts   | All shortcut bindings                                | Phases 7–12    | **COMPLETE** |
| 15    | Persistence & Polish | Autosave, recent files, empty states, error handling | All above      | **COMPLETE** |

---

## Phase 1: Theme & Foundation — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-1-theme--foundation) for implementation details.

- [x] Add EFIS-specific color tokens to `src/styles/global.css`
- [x] Map new tokens as Tailwind utility classes in the `@theme inline` block
- [x] Add Inter and JetBrains Mono font imports
- [x] Set JetBrains Mono as `--font-mono` in theme
- [x] Install `lucide-react` (icon library)
- [x] Install `@fontsource-variable/jetbrains-mono`

---

## Phase 2: Data Model & State — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-2-data-model--state) for implementation details.

- [x] Create `src/types/checklist.ts` with all type definitions
- [x] Create `src/types/editor.ts` with editor state types
- [x] Create `src/types/index.ts` barrel export
- [x] Create `src/stores/checklist-store.ts` with immer + zundo middleware
- [x] Create `src/stores/ui-store.ts` with panel visibility state
- [x] Create `src/stores/index.ts` barrel export
- [x] Install `zustand`, `immer`, `zundo` dependencies

---

## Phase 3: IPC Layer — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-3-ipc-layer) for implementation details.

- [x] Create `src/ipc/parsers/types.ts` — `FormatParser` interface + `ParsedChecklistFile` type
- [x] Create `src/ipc/parsers/json-parser.ts` — JSON parse/serialize
- [x] Create `src/ipc/parsers/ace-parser.ts` — Garmin ACE stub (binary format, deferred to Phase 13)
- [x] Create `src/ipc/parsers/index.ts` — parser registry with `getParser()` + `detectFormat()`
- [x] Create `src/ipc/checklist/types.ts` — `RecentFileEntry` interface
- [x] Create `src/ipc/checklist/schemas.ts` — Zod input schemas
- [x] Create `src/ipc/checklist/handlers.ts` — 6 handlers (read, write, import, export, getRecent, addRecent)
- [x] Create `src/ipc/checklist/index.ts` — barrel export
- [x] Create `src/ipc/dialog/schemas.ts` — Zod schemas for dialog options
- [x] Create `src/ipc/dialog/handlers.ts` — `openFileDialog`, `saveFileDialog`
- [x] Create `src/ipc/dialog/index.ts` — barrel export
- [x] Update `src/ipc/router.ts` — add `checklist` and `dialog` domains
- [x] Create `src/actions/checklist.ts` — 6 renderer-side wrappers
- [x] Create `src/actions/dialog.ts` — 2 renderer-side wrappers

---

## Phase 4: Layout Shell — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-4-layout-shell) for implementation details.

- [x] Create `src/layouts/editor-layout.tsx`
- [x] Modify `src/components/shared/drag-window-region.tsx`
- [x] Create `src/routes/editor.tsx`
- [x] Update `src/routes/__root.tsx`
- [x] Update `src/routes/index.tsx`
- [x] Create `src/components/editor/toolbar.tsx`
- [x] Create `src/components/editor/files-sidebar.tsx`
- [x] Create `src/components/editor/checklist-tree.tsx`
- [x] Create `src/components/editor/checklist-editor.tsx`
- [x] Create `src/components/editor/properties-panel.tsx`
- [x] Create `src/components/editor/status-bar.tsx`

### Files

| Action | File                                           | Changes                    |
| ------ | ---------------------------------------------- | -------------------------- |
| Create | `src/layouts/editor-layout.tsx`                | Main editor 4-panel layout |
| Modify | `src/components/shared/drag-window-region.tsx` | EFIS theme, dynamic title  |
| Create | `src/routes/editor.tsx`                        | Editor route               |
| Modify | `src/routes/__root.tsx`                        | Route structure update     |
| Modify | `src/routes/index.tsx`                         | Simplify to landing page   |
| Create | `src/components/editor/toolbar.tsx`            | Placeholder                |
| Create | `src/components/editor/files-sidebar.tsx`      | Placeholder                |
| Create | `src/components/editor/checklist-tree.tsx`     | Placeholder                |
| Create | `src/components/editor/checklist-editor.tsx`   | Placeholder                |
| Create | `src/components/editor/properties-panel.tsx`   | Placeholder                |
| Create | `src/components/editor/status-bar.tsx`         | Placeholder                |

---

## Phase 5: Files Sidebar — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-5-files-sidebar) for implementation details.

- [x] Implement sidebar header with "CHECKLIST FILES" label and "+" new file button
- [x] Implement file list from Zustand store (`files` map)
- [x] Create `src/components/editor/format-badge.tsx` — format extension pill
- [x] File list items: icon (colored by format), name, format badge
- [x] Active file highlighting with left accent bar
- [x] Click to select file (updates `activeFileId` in store)
- [x] Right-click context menu: Rename, Close, Delete
- [x] Implement drop zone at bottom:
  - Drag-and-drop file detection (HTML5 drag events)
  - Click to trigger import via IPC `openFileDialog`
  - On drop: call IPC `importFile` with dropped file path
- [x] New file button: creates empty `ChecklistFile` with one empty group and checklist

### Files

| Action | File                                      | Changes                         |
| ------ | ----------------------------------------- | ------------------------------- |
| Modify | `src/components/editor/files-sidebar.tsx` | Full implementation             |
| Create | `src/components/editor/format-badge.tsx`  | Format extension pill component |

---

## Phase 6: Checklist Tree — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-6-checklist-tree) for implementation details.

- [x] Implement tree header: active file name + format badge
- [x] Create `src/components/editor/group-icon.tsx` — colored icon for group category (Normal/Emergency/Abnormal)
- [x] Implement group sections:
  - Collapsible group headers (chevron + name + checklist count)
  - Group category determines icon color
- [x] Implement checklist items within groups:
  - Group icon + name + item count
  - Click to select checklist (updates `activeChecklistId`)
  - Active state: `bg-efis-accent-dim text-efis-accent`
- [x] Right-click context menu on checklists:
  - Rename (inline edit)
  - Duplicate
  - Move to group (submenu)
  - Delete (with confirmation)
- [x] Right-click context menu on groups:
  - Rename (inline edit)
  - Add checklist
  - Delete group (with confirmation)
- [x] Add checklist button at bottom or in group context

### Files

| Action | File                                       | Changes                       |
| ------ | ------------------------------------------ | ----------------------------- |
| Modify | `src/components/editor/checklist-tree.tsx` | Full implementation           |
| Create | `src/components/editor/group-icon.tsx`     | Group category icon component |

---

## Phase 7: Checklist Editor — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-7-checklist-editor) for implementation details.

### Editor Header

- [x] Implement editor header in `src/components/editor/checklist-editor.tsx`:
  - Checklist name (18px, semibold)
  - Group badge (colored pill)
  - Breadcrumb: File name › Group name › Checklist name
  - Action buttons: Duplicate, Delete

### Item Row Component

- [x] Create `src/components/editor/checklist-item-row.tsx`:
  - Drag handle (6-dot grip, visible on hover)
  - Type indicator dot/bar (colored by item type)
  - Content area (varies by type — see below)
  - Action buttons (visible on hover): Edit, Indent/Outdent, Add child, Delete
- [x] Create `src/components/editor/type-indicator.tsx`:
  - Renders colored circle (6px) or bar (14×3px) based on `ChecklistItemType`
- [x] Create `src/components/editor/indent-guides.tsx`:
  - Takes `depth` (number) and `isLastChild` (boolean)
  - Renders N vertical guide columns with optional tick connectors

### Content Variants in Item Row

- [x] Challenge/Response: challenge text + dot leader + response text
- [x] Challenge Only: challenge text only
- [x] Title/Section Header: uppercase bold text, purple color, collapse toggle + child count
- [x] Note/Plaintext: italic muted text
- [x] Warning: yellow text with "⚠" prefix
- [x] Caution: orange text

### Collapse/Expand

- [x] Parent items (items with children) show chevron toggle
- [x] Collapsed state hides all descendant items
- [x] "Collapsed" badge appears on collapsed parents
- [x] Track collapsed item IDs in Zustand store

### Item List Rendering

- [x] Implement flat list rendering in `checklist-editor.tsx`:
  - Flatten the hierarchical item structure for rendering
  - Skip hidden (collapsed) items
  - "Add section or item" button at bottom

### Files

| Action | File                                           | Changes                                     |
| ------ | ---------------------------------------------- | ------------------------------------------- |
| Modify | `src/components/editor/checklist-editor.tsx`   | Full implementation with header + item list |
| Create | `src/components/editor/checklist-item-row.tsx` | Item row with all variants                  |
| Create | `src/components/editor/type-indicator.tsx`     | Type dot/bar component                      |
| Create | `src/components/editor/indent-guides.tsx`      | Indent visualization component              |

---

## Phase 8: Item Editing — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-8-item-editing) for implementation details.

### Inline Editing

- [x] Add inline editing mode to `checklist-item-row.tsx`:
  - Double-click or Enter on selected item enters edit mode
  - Challenge text → input field
  - Response text → input field (for Challenge/Response type)
  - Single text field for Note, Warning, Caution, Title types
  - Enter commits, Escape cancels
  - Tab moves between challenge and response fields
  - Track `editingItemId` in store

### Add/Remove Items

- [x] "Add section or item" button at bottom of editor:
  - Opens a type selector (dropdown or small palette)
  - Creates new item of chosen type after current selection
- [x] Add child item button on parent rows
- [x] Delete selected item (with confirmation for non-empty parents)

### Indent/Outdent

- [x] Tab key or button: increase indent level (max 3)
- [x] Shift+Tab or button: decrease indent level (min 0)
- [x] Validate: cannot indent deeper than parent + 1

### Files

| Action | File                                           | Changes                                 |
| ------ | ---------------------------------------------- | --------------------------------------- |
| Modify | `src/components/editor/checklist-item-row.tsx` | Add inline editing mode                 |
| Modify | `src/components/editor/checklist-editor.tsx`   | Add item CRUD operations, type selector |

---

## Phase 9: Properties Panel — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-9-properties-panel) for implementation details.

### Full Implementation (`src/components/editor/properties-panel.tsx`)

- [x] Section: **Selected Item**
  - Type selector (dropdown): Challenge/Response, Challenge Only, Title, Note, Warning, Caution
  - Challenge text input
  - Response text input (visible only for Challenge/Response type)
- [x] Section: **Formatting**
  - Indent level selector (0–3 with labels)
  - Centered toggle switch
  - Collapsible parent toggle switch
- [x] Section: **Format Compatibility**
  - Grid of format names + supported/unsupported status
  - Dynamically computed based on current item's type and formatting
- [x] Section: **Checklist Metadata** (always visible, updates file metadata)
  - Aircraft Registration input
  - Aircraft Make & Model input
  - Copyright input
- [x] All fields bidirectionally bound to Zustand store
- [x] Empty state when no item is selected: "Select an item to view its properties"

### Files

| Action | File                                         | Changes                               |
| ------ | -------------------------------------------- | ------------------------------------- |
| Modify | `src/components/editor/properties-panel.tsx` | Full implementation with all sections |

---

## Phase 10: Toolbar & Status Bar — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-10-toolbar--status-bar) for implementation details.

### Toolbar (`src/components/editor/toolbar.tsx`)

- [x] Import button: triggers `openFileDialog` → `importFile` IPC flow
- [x] Export button: opens Export Modal
- [x] Undo button: calls `undo()` from undo store, disabled when `!canUndo`
- [x] Redo button: calls `redo()` from undo store, disabled when `!canRedo`
- [x] Add Item button: adds new item after selection
- [x] Add Checklist button: adds new checklist to active group
- [x] Search trigger button: opens command palette
- [x] Properties toggle button: toggles properties panel via `ui-store`
- [x] Quick Export button (primary style): exports to last-used format and path
- [x] Button groups separated by `Separator` components

### Status Bar (`src/components/editor/status-bar.tsx`)

- [x] Left: save indicator (green/yellow dot + text), item count, selection info
- [x] Right: version number (clickable, check for updates), shortcuts button
- [x] Save indicator reads from store dirty state

### Files

| Action | File                                   | Changes             |
| ------ | -------------------------------------- | ------------------- |
| Modify | `src/components/editor/toolbar.tsx`    | Full implementation |
| Modify | `src/components/editor/status-bar.tsx` | Full implementation |

---

## Phase 11: Drag & Drop — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-11-drag--drop) for implementation details.

### Item Reordering

- [x] Install and configure `@dnd-kit/core` + `@dnd-kit/sortable`
- [x] Wrap editor item list with `DndContext` and `SortableContext`
- [x] Make each `ChecklistItemRow` sortable via `useSortable` hook
- [x] Drag handle activates drag (6-dot grip icon)
- [x] Show drop indicator line between items during drag
- [x] Handle cross-depth drops (moving item to different indent level)
- [x] Update item order in Zustand store on drop

### Checklist Reordering (Tree Panel)

- [x] Make checklist items in tree panel sortable within groups
- [x] Make groups reorderable within the file
- [x] Update store on drop

### Files

| Action | File                                           | Changes                                                        |
| ------ | ---------------------------------------------- | -------------------------------------------------------------- |
| Modify | `src/components/editor/checklist-editor.tsx`   | Add DndContext wrapper                                         |
| Modify | `src/components/editor/checklist-item-row.tsx` | Add useSortable hook                                           |
| Modify | `src/components/editor/checklist-tree.tsx`     | Add sortable for checklists and groups                         |
| Modify | `package.json`                                 | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## Phase 12: Command Palette — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-12-command-palette) for implementation details.

### Implementation (`src/components/editor/command-palette.tsx`)

- [x] Use existing shadcn `Command` component (cmdk wrapper)
- [x] Open via Ctrl+K or toolbar search button
- [x] Search input at top
- [x] Results grouped in two sections:
  - **Checklists**: match checklist names, show group badge
  - **Items**: match item challenge/response text, show parent checklist name
- [x] Selecting a checklist: navigate to it (set `activeChecklistId`)
- [x] Selecting an item: navigate to its checklist and select it (set `activeChecklistId` + `activeItemId`)
- [x] Keyboard navigation: up/down arrows, Enter to select, Escape to close

### Files

| Action | File                                        | Changes                             |
| ------ | ------------------------------------------- | ----------------------------------- |
| Create | `src/components/editor/command-palette.tsx` | Full command palette implementation |
| Modify | `src/layouts/editor-layout.tsx`             | Mount command palette in layout     |

---

## Phase 13: Export & Import — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-13-export--import) for implementation details.

### Export Modal (`src/components/editor/export-modal.tsx`)

- [x] Use shadcn `Dialog` component
- [x] 2-column grid of export format options
- [x] Each option: format name, file extension, description
- [x] MVP: only Garmin ACE, JSON, PDF active. Others show "Coming soon" disabled state
- [x] Clicking an option:
  1. Opens native save dialog (via IPC `saveFileDialog`)
  2. Serializes active file to chosen format (via IPC `exportFile`)
  3. Shows success/error toast

### Import Flow

- [x] Create `src/components/editor/import-dialog.tsx`:
  - Triggered by Import toolbar button or drag-and-drop
  - Detects format from file extension
  - Calls IPC `importFile`
  - Adds parsed file to store
  - Shows success toast with file name and format detected

### PDF Export (MVP)

- [x] Create `src/ipc/parsers/pdf-generator.ts`:
  - Uses `pdfkit` (main process) to generate PDF
  - Basic layout: group titles as headers, checklist names as sub-headers, items as rows
  - Letter page size (default)
- [x] Wire up PDF export in `exportFile` handler

### Files

| Action | File                                      | Changes                       |
| ------ | ----------------------------------------- | ----------------------------- |
| Create | `src/components/editor/export-modal.tsx`  | Export format selection modal |
| Create | `src/components/editor/import-dialog.tsx` | Import feedback/confirmation  |
| Create | `src/ipc/parsers/pdf-generator.ts`        | PDF generation using pdfkit   |
| Modify | `src/ipc/checklist/handlers.ts`           | Wire up PDF export path       |
| Modify | `package.json`                            | Add `pdfkit` dependency       |

---

## Phase 14: Keyboard Shortcuts — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-14-keyboard-shortcuts) for implementation details.

### Global Shortcut Handler

- [x] Create `src/hooks/use-keyboard-shortcuts.ts`:
  - Register global keydown listener
  - Map key combos to actions (respecting platform: Ctrl vs ⌘)
  - Prevent default browser behavior for captured shortcuts
  - Context-aware: some shortcuts only active when editor/item is focused
- [x] Implement all shortcuts from UI/UX spec:
  - Navigation: ↑/↓ move between items
  - Editing: Enter to edit, Escape to cancel, Delete to remove
  - Indent: Tab / Shift+Tab
  - Commands: Ctrl+Z/Ctrl+Shift+Z (undo/redo), Ctrl+K (palette), Ctrl+S (save), Ctrl+O (open), Ctrl+Shift+E (quick export), Ctrl+D (duplicate), Ctrl+N (new item), Ctrl+Shift+N (new checklist), Ctrl+/ (toggle properties)

### Shortcuts Hint Overlay

- [x] Create `src/components/editor/shortcuts-hint.tsx`:
  - Fixed position overlay, bottom-right, above status bar
  - Shows on first launch for 5 seconds
  - Re-shows when "Shortcuts" clicked in status bar
  - Displays key hints with `<kbd>` elements

### Files

| Action | File                                       | Changes                              |
| ------ | ------------------------------------------ | ------------------------------------ |
| Create | `src/hooks/use-keyboard-shortcuts.ts`      | Global keyboard shortcut handler     |
| Create | `src/components/editor/shortcuts-hint.tsx` | Keyboard hint overlay                |
| Modify | `src/layouts/editor-layout.tsx`            | Mount shortcut hook and hint overlay |

---

## Phase 15: Persistence & Polish — COMPLETE

> Completed. See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md#phase-15-persistence--polish) for implementation details.

### Autosave

- [x] Create `src/hooks/use-autosave.ts`:
  - Watches Zustand store for changes (debounced, 2 second delay)
  - Writes all open files to app data directory as JSON
  - Updates "last modified" timestamp
- [x] On app start: load previously open files from app data directory
- [x] Track dirty state (unsaved changes) per file

### Recent Files

- [x] Store recent file paths in a JSON file in app data
- [x] Show recent files in a "Recent" section of the files sidebar (or welcome page)
- [x] Validate that recent file paths still exist on disk

### Window State Persistence

- [x] Save window position, size, and panel visibility on close
- [x] Restore on next launch

### Empty States

- [x] No files open: full-panel empty state with "Create or import a checklist" + action buttons
- [x] File has no checklists: center panel message + "Add checklist" button
- [x] Checklist has no items: editor body message + "Add first item" button
- [x] No item selected: properties panel shows "Select an item to view properties"

### Error Handling

- [x] File import errors: toast notification with error message
- [x] File export errors: toast notification with error message
- [x] Unsaved changes on close: confirmation dialog
- [x] File not found (recent files): gray out and show tooltip

### UI Polish

- [x] Ensure all transitions match spec (150ms ease for buttons, 200ms for modals)
- [x] Tooltip on all toolbar buttons with keyboard shortcut hints
- [x] Scroll areas with custom scrollbar styling (thin, matching theme)
- [x] Focus management: ensure keyboard navigation works naturally

### Files

| Action | File                                         | Changes                                     |
| ------ | -------------------------------------------- | ------------------------------------------- |
| Create | `src/hooks/use-autosave.ts`                  | Autosave hook                               |
| Modify | `src/layouts/editor-layout.tsx`              | Mount autosave hook, load persisted state   |
| Modify | `src/components/editor/files-sidebar.tsx`    | Recent files section, empty state           |
| Modify | `src/components/editor/checklist-editor.tsx` | Empty states                                |
| Modify | `src/components/editor/properties-panel.tsx` | Empty state for no selection                |
| Modify | `src/main.ts`                                | Window state persistence, restore on launch |

---

## Full File Inventory

### New Files (40)

| File                                           | Purpose                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `src/types/checklist.ts`                       | Checklist data type definitions                              |
| `src/types/editor.ts`                          | Editor state types                                           |
| `src/types/index.ts`                           | Types barrel export                                          |
| `src/stores/checklist-store.ts`                | Main checklist data Zustand store (includes zundo undo/redo) |
| `src/stores/ui-store.ts`                       | UI panel visibility store                                    |
| `src/stores/index.ts`                          | Stores barrel export                                         |
| `src/ipc/checklist/handlers.ts`                | Checklist file I/O IPC handlers                              |
| `src/ipc/checklist/schemas.ts`                 | Zod validation schemas                                       |
| `src/ipc/checklist/index.ts`                   | Barrel export                                                |
| `src/ipc/dialog/handlers.ts`                   | Native dialog IPC handlers                                   |
| `src/ipc/dialog/schemas.ts`                    | Zod schemas                                                  |
| `src/ipc/dialog/index.ts`                      | Barrel export                                                |
| `src/ipc/parsers/types.ts`                     | Parser interface                                             |
| `src/ipc/parsers/json-parser.ts`               | JSON format parser                                           |
| `src/ipc/parsers/ace-parser.ts`                | Garmin ACE XML parser                                        |
| `src/ipc/parsers/pdf-generator.ts`             | PDF export generator                                         |
| `src/ipc/parsers/index.ts`                     | Parser registry                                              |
| `src/actions/checklist.ts`                     | Renderer-side checklist IPC wrappers                         |
| `src/actions/dialog.ts`                        | Renderer-side dialog IPC wrappers                            |
| `src/layouts/editor-layout.tsx`                | Main 4-panel editor layout                                   |
| `src/routes/editor.tsx`                        | Editor route                                                 |
| `src/components/editor/toolbar.tsx`            | Top toolbar                                                  |
| `src/components/editor/files-sidebar.tsx`      | Files sidebar panel                                          |
| `src/components/editor/checklist-tree.tsx`     | Checklist tree panel                                         |
| `src/components/editor/checklist-editor.tsx`   | Main checklist editor panel                                  |
| `src/components/editor/checklist-item-row.tsx` | Individual item row component                                |
| `src/components/editor/properties-panel.tsx`   | Properties panel                                             |
| `src/components/editor/status-bar.tsx`         | Bottom status bar                                            |
| `src/components/editor/export-modal.tsx`       | Export format selection modal                                |
| `src/components/editor/import-dialog.tsx`      | Import feedback dialog                                       |
| `src/components/editor/command-palette.tsx`    | ⌘K search palette                                            |
| `src/components/editor/type-indicator.tsx`     | Item type colored dot/bar                                    |
| `src/components/editor/indent-guides.tsx`      | Indent visualization                                         |
| `src/components/editor/format-badge.tsx`       | File format pill badge                                       |
| `src/components/editor/group-icon.tsx`         | Group category icon                                          |
| `src/components/editor/shortcuts-hint.tsx`     | Keyboard shortcuts overlay                                   |
| `src/hooks/use-keyboard-shortcuts.ts`          | Global keyboard shortcut handler                             |
| `src/hooks/use-autosave.ts`                    | Autosave debounced hook                                      |

### Modified Files (9)

| File                                           | Changes                                |
| ---------------------------------------------- | -------------------------------------- |
| `src/styles/global.css`                        | EFIS color tokens, JetBrains Mono font |
| `src/ipc/router.ts`                            | Add checklist and dialog domains       |
| `src/routes/__root.tsx`                        | Route structure for editor layout      |
| `src/routes/index.tsx`                         | Simplify to landing page               |
| `src/components/shared/drag-window-region.tsx` | EFIS theme, dynamic title              |
| `src/main.ts`                                  | Window state persistence, minimum size |
| `package.json`                                 | New dependencies                       |

---

## Dependencies to Install

### npm Packages

```bash
pnpm add zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react pdfkit
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

# Completed Phases — EFIS Checklist Editor

This document records implementation details for completed phases of the [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

---

## Phase 1: Theme & Foundation

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Color Tokens (`src/styles/global.css`)

All EFIS-specific color tokens were added to the `.dark` selector block and mapped as Tailwind utility classes in the `@theme inline` block.

**Background scale** (7 tokens):
| CSS Variable | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--bg-base` | `#0d1117` | `bg-bg-base` | Main content areas, editor body |
| `--bg-base-deepest` | `#010409` | `bg-bg-base-deepest` | Title bar |
| `--bg-surface` | `#161b22` | `bg-bg-surface` | Sidebar, toolbar, status bar, properties |
| `--bg-elevated` | `#1c2333` | `bg-bg-elevated` | Inputs, modal body, hover states |
| `--bg-overlay` | `#21283b` | `bg-bg-overlay` | Badges, overlays |
| `--bg-hover` | `#292e3e` | `bg-bg-hover` | Interactive hover state |
| `--bg-active` | `#2d3548` | `bg-bg-active` | Active/pressed state |

**Border tokens** (1 new token, `--border` already existed):
| CSS Variable | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--border-light` | `#3a4250` | `border-border-light` | Hover emphasis borders |

**Text tokens** (3 tokens):
| CSS Variable | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--text-primary` | `#e6edf3` | `text-text-primary` | Primary text |
| `--text-secondary` | `#8b949e` | `text-text-secondary` | Secondary text, labels |
| `--text-muted` | `#5a6370` | `text-text-muted` | Muted text, placeholders |

**Accent colors** (12 tokens, prefixed `--efis-*`):
| CSS Variable | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--efis-accent` | `#58a6ff` | `text-efis-accent` / `bg-efis-accent` | Links, selected items |
| `--efis-accent-dim` | `#1f3a5f` | `bg-efis-accent-dim` | Selected item backgrounds |
| `--efis-accent-hover` | `#79c0ff` | `text-efis-accent-hover` | Accent hover state |
| `--efis-green` | `#3fb950` | `text-efis-green` | Success, normal group |
| `--efis-green-dim` | `#1a3a2a` | `bg-efis-green-dim` | Normal group badge bg |
| `--efis-yellow` | `#d29922` | `text-efis-yellow` | Warnings, abnormal group |
| `--efis-yellow-dim` | `#3d2e00` | `bg-efis-yellow-dim` | Abnormal group badge bg |
| `--efis-red` | `#f85149` | `text-efis-red` | Errors, emergency group |
| `--efis-red-dim` | `#3d1418` | `bg-efis-red-dim` | Emergency group badge bg |
| `--efis-orange` | `#db6d28` | `text-efis-orange` | Caution items, GRT format |
| `--efis-purple` | `#a371f7` | `text-efis-purple` | Title/section items, Dynon format |
| `--efis-cyan` | `#39d2c0` | `text-efis-cyan` | Sub-section titles, ForeFlight format |

**shadcn/ui base tokens** were also overridden in the `.dark` block to match the EFIS GitHub-dark palette (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-1..5, sidebar-\*).

#### Fonts

- **Inter Variable** — already installed via `@fontsource-variable/inter`, mapped as `--font-sans`
- **JetBrains Mono Variable** — installed via `@fontsource-variable/jetbrains-mono` (v5.2.8), mapped as `--font-mono`
- Both imported at the top of `global.css`

#### Dependencies installed

| Package                               | Version  | Purpose                                         |
| ------------------------------------- | -------- | ----------------------------------------------- |
| `lucide-react`                        | ^0.563.0 | Icon library (consistent with shadcn/ui)        |
| `@fontsource-variable/jetbrains-mono` | ^5.2.8   | Monospace font for dot leaders, file extensions |

#### Files modified

| File                    | Changes                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/global.css` | Added `.dark` block with all EFIS tokens, `@theme inline` Tailwind mappings, JetBrains Mono import and `--font-mono` variable |
| `package.json`          | Added `lucide-react` and `@fontsource-variable/jetbrains-mono` to dependencies                                                |

### Design decisions

1. **Accent color prefix**: EFIS accent colors use the `--efis-*` prefix (e.g., `--efis-accent`, `--efis-green`) to avoid collision with shadcn/ui's own `--accent` token. The Tailwind classes are `bg-efis-accent`, `text-efis-green`, etc.

2. **Dark-only tokens**: All EFIS tokens are defined inside the `.dark` selector only. The `:root` (light) block retains the original shadcn/ui defaults. Since the MVP is dark-theme only, this is sufficient.

3. **Hex values, not OKLCH**: The EFIS tokens use hex values (from the UI/UX spec) rather than OKLCH. The existing shadcn/ui light-mode tokens still use OKLCH. This is fine because the `.dark` block overrides everything when dark mode is active.

4. **Font loading**: Used `@fontsource-variable` packages for both fonts (self-hosted, no external CDN dependency). This is consistent with how Inter was already set up.

---

## Phase 2: Data Model & State

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### TypeScript Types (`src/types/`)

**`src/types/checklist.ts`** — All checklist data model types:

| Type                     | Kind      | Values / Fields                                                                                 |
| ------------------------ | --------- | ----------------------------------------------------------------------------------------------- |
| `ChecklistItemType`      | enum      | `ChallengeResponse`, `ChallengeOnly`, `Title`, `Note`, `Warning`, `Caution`                     |
| `ChecklistItem`          | interface | `id`, `type`, `challengeText`, `responseText`, `indent` (0\|1\|2\|3), `centered`, `collapsible` |
| `Checklist`              | interface | `id`, `name`, `items: ChecklistItem[]`                                                          |
| `ChecklistGroupCategory` | enum      | `Normal`, `Emergency`, `Abnormal`                                                               |
| `ChecklistGroup`         | interface | `id`, `name`, `category`, `checklists: Checklist[]`                                             |
| `ChecklistFileMetadata`  | interface | `aircraftRegistration`, `makeModel`, `copyright`                                                |
| `ChecklistFormat`        | enum      | `Ace`, `Gplt`, `AfsDynon`, `ForeFlight`, `Grt`, `Json`, `Pdf`                                   |
| `ChecklistFile`          | interface | `id`, `name`, `format`, `filePath?`, `groups`, `metadata`, `lastModified`, `dirty`              |

**`src/types/editor.ts`** — Editor UI state type:

| Type          | Kind      | Fields                                                                                                |
| ------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `EditorState` | interface | `activeFileId`, `activeChecklistId`, `activeItemId`, `editingItemId`, `collapsedItemIds: Set<string>` |

**`src/types/index.ts`** — Barrel export re-exporting all types from `checklist.ts`, `editor.ts`, and existing `theme-mode.ts`.

#### Zustand Stores (`src/stores/`)

**`src/stores/checklist-store.ts`** — Main data store using `immer` + `zundo` (temporal) middleware:

| Category     | Actions                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| File         | `addFile`, `removeFile`, `setActiveFile`, `updateFileMetadata`, `markFileDirty`, `markFileClean`                 |
| Group        | `addGroup`, `removeGroup`, `renameGroup`, `reorderGroups`                                                        |
| Checklist    | `addChecklist`, `removeChecklist`, `renameChecklist`, `duplicateChecklist`, `moveChecklist`, `reorderChecklists` |
| Item         | `addItem`, `removeItem`, `updateItem`, `reorderItems`, `indentItem`, `outdentItem`, `duplicateItem`              |
| UI Selection | `setActiveChecklist`, `setActiveItem`, `setEditingItem`, `toggleCollapsed`                                       |

Undo/redo is accessed via `useChecklistStore.temporal.getState()` which exposes `undo()`, `redo()`, `pastStates`, and `futureStates`.

**`src/stores/ui-store.ts`** — Panel visibility state:

| State                    | Action                    |
| ------------------------ | ------------------------- |
| `propertiesPanelVisible` | `togglePropertiesPanel()` |
| `sidebarVisible`         | `toggleSidebar()`         |
| `treePanelVisible`       | `toggleTreePanel()`       |

**`src/stores/index.ts`** — Barrel export for both stores.

#### Dependencies installed

| Package   | Version | Purpose                                   |
| --------- | ------- | ----------------------------------------- |
| `zustand` | ^5.0.11 | State management                          |
| `immer`   | ^11.1.3 | Immutable updates with mutable syntax     |
| `zundo`   | ^2.3.0  | Undo/redo temporal middleware for Zustand |

#### Files created

| File                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `src/types/checklist.ts`        | All checklist data type definitions (enums + interfaces) |
| `src/types/editor.ts`           | Editor UI state interface                                |
| `src/types/index.ts`            | Barrel export for all types                              |
| `src/stores/checklist-store.ts` | Main Zustand store with immer + zundo, all CRUD actions  |
| `src/stores/ui-store.ts`        | UI panel visibility store                                |
| `src/stores/index.ts`           | Barrel export for stores                                 |

#### Files modified

| File           | Changes                                           |
| -------------- | ------------------------------------------------- |
| `package.json` | Added `zustand`, `immer`, `zundo` to dependencies |

### Design decisions

1. **No separate undo store**: The original plan called for a standalone `undo-store.ts`. Instead, undo/redo was integrated directly into `checklist-store.ts` using zundo's `temporal` middleware wrapper. This is simpler (one store, not two) and the recommended zundo pattern. Undo/redo is accessed via `useChecklistStore.temporal.getState()`.

2. **`partialize` for undo history**: Only the `files` record is tracked in undo history. UI selection state (`activeFileId`, `activeChecklistId`, `activeItemId`, `editingItemId`, `collapsedItemIds`) is excluded so that undo/redo only affects data mutations, not navigation.

3. **Flat items with indent**: Items are stored as a flat array per checklist with an `indent` field (0-3), not as a nested tree. Parent-child relationships are inferred from position + indent level at render time. This keeps the data model simple and makes drag-and-drop reordering straightforward.

4. **`collapsible` flag, not `children`**: The original plan mentioned a `children` array on `ChecklistItem`. Instead, items use a `collapsible` boolean flag to indicate they can act as collapse parents. The actual child relationship is inferred from indent levels, keeping the flat array model consistent.

5. **`dirty` flag on `ChecklistFile`**: Added a `dirty` boolean to `ChecklistFile` (not in the original plan) to track unsaved changes per file. This is needed by the status bar save indicator and the unsaved-changes-on-close dialog in Phase 15.

6. **Store files as `Record<string, ChecklistFile>`**: Used a plain object record (not `Map`) for the files collection. This works better with immer's proxy-based immutability and avoids serialization issues with `Map` in zundo's temporal history.

7. **ID generation**: Uses a simple `Date.now() + counter` scheme for unique IDs. This is sufficient for a single-user desktop app with no persistence conflicts. Can be replaced with `crypto.randomUUID()` later if needed.

---

## Phase 4: Layout Shell

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Editor Layout (`src/layouts/editor-layout.tsx`)

The main 4-panel layout for the editor view. Structure:

```
DragWindowRegion (title bar, 38px)
Toolbar (44px)
Main area (flex-1, flex row):
  FilesSidebar (260px) | ChecklistTree (280px) | ChecklistEditor (flex-1) | PropertiesPanel (280px)
StatusBar (26px)
```

- Reads panel visibility from `useUiStore` (sidebar, tree, properties)
- Reads active file name from `useChecklistStore` for the title bar subtitle
- All panels conditionally rendered based on store state

#### Title Bar Update (`src/components/shared/drag-window-region.tsx`)

- Added `subtitle` prop for displaying the active file name
- Updated styling to use EFIS dark theme: `bg-bg-base-deepest`, `border-border`, `h-[38px]`
- Title shown as semibold, subtitle shown as muted text with em-dash separator
- Window buttons updated to use EFIS hover states (`hover:bg-bg-hover`, close uses `hover:bg-efis-red`)
- macOS layout preserves traffic light button space with `pl-16`

#### Route Setup

- **`src/routes/editor.tsx`**: New route at `/editor` rendering `EditorLayout`
- **`src/routes/__root.tsx`**: Simplified to bare `<Outlet />` — each route manages its own layout
- **`src/routes/index.tsx`**: Replaced the boilerplate welcome page with a simple landing page featuring "New File", "Import File" buttons that navigate to `/editor`

#### Placeholder Components (`src/components/editor/`)

All 6 placeholder components created with correct dimensions, backgrounds, and empty state messages:

| Component         | File                   | Dimensions   | Background      |
| ----------------- | ---------------------- | ------------ | --------------- |
| `Toolbar`         | `toolbar.tsx`          | h-11 (44px)  | `bg-bg-surface` |
| `FilesSidebar`    | `files-sidebar.tsx`    | w-65 (260px) | `bg-bg-surface` |
| `ChecklistTree`   | `checklist-tree.tsx`   | w-70 (280px) | `bg-bg-base`    |
| `ChecklistEditor` | `checklist-editor.tsx` | flex-1       | `bg-bg-base`    |
| `PropertiesPanel` | `properties-panel.tsx` | w-70 (280px) | `bg-bg-surface` |
| `StatusBar`       | `status-bar.tsx`       | h-6.5 (26px) | `bg-bg-surface` |

The `Toolbar` placeholder includes all button groups per the UI spec: Import/Export, Undo/Redo, Add Item/Add Checklist, Search trigger (with Ctrl+K hint), Properties toggle, and Quick Export (accent-styled). The `StatusBar` shows save indicator, item count, version, and shortcuts button.

#### Files created

| File                                         | Purpose                                 |
| -------------------------------------------- | --------------------------------------- |
| `src/layouts/editor-layout.tsx`              | Main 4-panel editor layout              |
| `src/routes/editor.tsx`                      | Editor route at `/editor`               |
| `src/components/editor/toolbar.tsx`          | Toolbar with all button groups          |
| `src/components/editor/files-sidebar.tsx`    | Files sidebar with header and drop zone |
| `src/components/editor/checklist-tree.tsx`   | Checklist tree with header              |
| `src/components/editor/checklist-editor.tsx` | Editor with empty state                 |
| `src/components/editor/properties-panel.tsx` | Properties panel with header            |
| `src/components/editor/status-bar.tsx`       | Status bar with indicators              |

#### Files modified

| File                                           | Changes                                                 |
| ---------------------------------------------- | ------------------------------------------------------- |
| `src/components/shared/drag-window-region.tsx` | Added subtitle prop, EFIS dark theme styling            |
| `src/routes/__root.tsx`                        | Simplified to bare Outlet (no BaseLayout wrapping)      |
| `src/routes/index.tsx`                         | Replaced with simple landing page navigating to /editor |

### Design decisions

1. **Root route as bare Outlet**: Rather than wrapping all routes in `BaseLayout`, the root route renders just `<Outlet />`. This allows the editor route to use its own `EditorLayout` while the welcome page manages its own layout inline. This is cleaner than trying to conditionally render different layouts in the root.

2. **No UpdateNotificationProvider in EditorLayout**: The implementation plan mentioned wrapping in `UpdateNotificationProvider`. This was deferred since the base-layout still has it for the welcome page, and the editor layout will get update notifications integrated in a later phase.

3. **Toolbar placeholder is semi-functional**: Instead of a minimal placeholder, the toolbar includes all button groups from the UI spec with proper icons, styling, and layout. Buttons are non-functional but visually complete, reducing work in Phase 10.

4. **Panel widths use Tailwind arbitrary values**: The spec calls for 260px/280px widths. The linter's Tailwind canonical class plugin converted these to `w-65` (260px) and `w-70` (280px) using Tailwind's spacing scale.

---

## Phase 3: IPC Layer

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Format Parsers (`src/ipc/parsers/`)

**`src/ipc/parsers/types.ts`** — Shared parser interface:

| Type                  | Kind       | Description                                                                                              |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `ParsedChecklistFile` | type alias | `Omit<ChecklistFile, "id" \| "dirty" \| "lastModified">` — parser output before runtime fields are added |
| `FormatParser`        | interface  | `parse(content, fileName)` → `ParsedChecklistFile`, `serialize(file)` → `string`                         |

**`src/ipc/parsers/json-parser.ts`** — Full JSON format parser:

- **Parse**: `JSON.parse` + regenerates all IDs at every level (file, group, checklist, item) via `crypto.randomUUID()`. Missing metadata fields default to `""`. Missing item fields get sensible defaults (type → `"challenge_response"`, indent → `0`, booleans → `false`).
- **Serialize**: Explicitly enumerates data fields only (name, format, groups with nested checklists/items, metadata). Strips all runtime fields (id, dirty, lastModified, filePath).

**`src/ipc/parsers/ace-parser.ts`** — Stub that throws "not yet implemented" for both `parse()` and `serialize()`. Garmin ACE is a binary format (not XML as originally assumed), so `fast-xml-parser` was not installed. Full implementation deferred to Phase 13.

**`src/ipc/parsers/index.ts`** — Parser registry:

| Export                   | Type     | Description                                                                          |
| ------------------------ | -------- | ------------------------------------------------------------------------------------ |
| `getParser(format)`      | function | Returns `FormatParser` for a given `ChecklistFormat`, or `undefined` if unsupported  |
| `detectFormat(filePath)` | function | Maps file extension to `ChecklistFormat` (`.ace` → Ace, `.json` → Json, else `null`) |

#### Checklist IPC Domain (`src/ipc/checklist/`)

**`src/ipc/checklist/types.ts`** — `RecentFileEntry` interface:

| Field        | Type              | Description                |
| ------------ | ----------------- | -------------------------- |
| `filePath`   | `string`          | Absolute path on disk      |
| `fileName`   | `string`          | Display name               |
| `format`     | `ChecklistFormat` | File format enum value     |
| `lastOpened` | `number`          | Timestamp (ms since epoch) |

**`src/ipc/checklist/schemas.ts`** — Zod input schemas for all handlers. Uses `z.record(z.string(), z.unknown())` for the `file` param (data comes from our own Zustand store, deep validation unnecessary).

**`src/ipc/checklist/handlers.ts`** — 6 IPC handlers:

| Handler              | Input                            | Output                          | Notes                                                                                                     |
| -------------------- | -------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `readChecklistFile`  | `{ filePath }`                   | `ChecklistFile`                 | Detects format from extension, reads + parses, adds runtime fields (id, dirty, lastModified)              |
| `writeChecklistFile` | `{ file, filePath }`             | `{ success, filePath }`         | Always writes as JSON (internal save format). Creates parent directories if needed                        |
| `importFile`         | none                             | `ChecklistFile \| null`         | Opens native dialog with format filters, null if cancelled. Uses `ipcContext.mainWindowContext` for modal |
| `exportFile`         | `{ file, format, filePath }`     | `{ success, filePath, format }` | Serializes via parser registry to target format                                                           |
| `getRecentFiles`     | none                             | `RecentFileEntry[]`             | Reads from `{userData}/recent-files.json`                                                                 |
| `addRecentFile`      | `{ filePath, fileName, format }` | `RecentFileEntry[]`             | Deduplicates by path, max 20 entries, most-recent-first                                                   |

**`src/ipc/checklist/index.ts`** — Barrel export aggregating all 6 handlers.

#### Dialog IPC Domain (`src/ipc/dialog/`)

**`src/ipc/dialog/schemas.ts`** — Zod schemas with optional `title`, `filters`, and `defaultPath` fields.

**`src/ipc/dialog/handlers.ts`** — 2 IPC handlers:

| Handler          | Input                                | Output           | Notes                                                      |
| ---------------- | ------------------------------------ | ---------------- | ---------------------------------------------------------- |
| `openFileDialog` | `{ title?, filters? }`               | `string \| null` | Native open dialog, returns file path or null if cancelled |
| `saveFileDialog` | `{ title?, defaultPath?, filters? }` | `string \| null` | Native save dialog, returns file path or null if cancelled |

Both handlers use `ipcContext.mainWindowContext` middleware for modal attachment to the main window.

**`src/ipc/dialog/index.ts`** — Barrel export.

#### Router Update (`src/ipc/router.ts`)

Added `checklist` and `dialog` domains to the router object alongside existing `theme`, `window`, `app`, `shell`, `updater`.

#### Action Wrappers (`src/actions/`)

**`src/actions/checklist.ts`** — 6 renderer-side wrapper functions:
`readChecklistFile(filePath)`, `writeChecklistFile(file, filePath)`, `importFile()`, `exportFile(file, format, filePath)`, `getRecentFiles()`, `addRecentFile(filePath, fileName, format)`

**`src/actions/dialog.ts`** — 2 renderer-side wrapper functions:
`openFileDialog(options?)`, `saveFileDialog(options?)`

#### Files created

| File                             | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `src/ipc/parsers/types.ts`       | `FormatParser` interface + `ParsedChecklistFile` type |
| `src/ipc/parsers/json-parser.ts` | JSON format parse/serialize                           |
| `src/ipc/parsers/ace-parser.ts`  | Garmin ACE stub (throws not-implemented)              |
| `src/ipc/parsers/index.ts`       | Parser registry with `getParser()` + `detectFormat()` |
| `src/ipc/checklist/types.ts`     | `RecentFileEntry` interface                           |
| `src/ipc/checklist/schemas.ts`   | Zod input schemas for all checklist handlers          |
| `src/ipc/checklist/handlers.ts`  | 6 IPC handlers for file operations                    |
| `src/ipc/checklist/index.ts`     | Barrel export                                         |
| `src/ipc/dialog/schemas.ts`      | Zod input schemas for dialog handlers                 |
| `src/ipc/dialog/handlers.ts`     | 2 IPC handlers for native dialogs                     |
| `src/ipc/dialog/index.ts`        | Barrel export                                         |
| `src/actions/checklist.ts`       | 6 renderer-side action wrappers                       |
| `src/actions/dialog.ts`          | 2 renderer-side action wrappers                       |

#### Files modified

| File                | Changes                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `src/ipc/router.ts` | Added `checklist` and `dialog` domain imports and router entries |

### Design decisions

1. **No `fast-xml-parser` dependency**: The original plan called for XML parsing of Garmin ACE files. Investigation revealed ACE is a binary format, not XML. The dependency was removed from the plan. The ACE parser is stubbed and will be fully implemented in Phase 13 with proper binary parsing.

2. **`ParsedChecklistFile` type**: Parsers return `Omit<ChecklistFile, "id" | "dirty" | "lastModified">` instead of a full `ChecklistFile`. The caller (handler) adds runtime fields (`id` via `crypto.randomUUID()`, `dirty: false`, `lastModified: Date.now()`). This keeps parsers pure data transformers with no side effects.

3. **Loose Zod schemas for `file` param**: Uses `z.record(z.string(), z.unknown())` instead of deeply validating the entire `ChecklistFile` structure. The data originates from our own Zustand store, so deep validation adds overhead with no safety benefit. Format/filePath are validated as strings.

4. **Recent files stored as JSON**: The recent files list is stored at `{userData}/recent-files.json` with a max of 20 entries. Deduplication is by file path (case-sensitive). The list is sorted most-recent-first.

5. **`importFile` handler combines dialog + parsing**: Rather than requiring the renderer to first call `openFileDialog` then `readChecklistFile`, the `importFile` handler combines both into a single IPC call. This is the common use case and avoids a round-trip.

6. **`writeChecklistFile` always writes JSON**: Internal saves always use JSON format regardless of the file's original format. Export to other formats uses `exportFile` with an explicit format parameter. This keeps the internal save path simple and lossless.

7. **No new dependencies**: All required packages (`zod`, `@orpc/server`, `electron`, `fs/promises`, `crypto`) were already available. The `fast-xml-parser` dependency was removed from the plan entirely.

---

## Phase 5: Files Sidebar

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### FormatBadge Component (`src/components/editor/format-badge.tsx`)

A reusable pill badge showing the file format extension (`.ace`, `.json`, `.txt`, etc.) with colors matching the format from the UI spec:

| Format      | Label   | Color Class        |
| ----------- | ------- | ------------------ |
| Garmin ACE  | `.ace`  | `text-efis-green`  |
| Garmin GPLT | `.gplt` | `text-efis-accent` |
| AFS/Dynon   | `.txt`  | `text-efis-purple` |
| ForeFlight  | `.fmd`  | `text-efis-cyan`   |
| GRT         | `.txt`  | `text-efis-orange` |
| JSON        | `.json` | `text-efis-accent` |
| PDF         | `.pdf`  | `text-efis-red`    |

Styled with `bg-bg-overlay rounded-full px-1.5 font-mono text-[10px]`.

#### Files Sidebar Full Implementation (`src/components/editor/files-sidebar.tsx`)

Replaced the Phase 4 placeholder with a fully interactive sidebar:

**Header**: "CHECKLIST FILES" label (uppercase, 11px, semibold, tracking-wide) with a FilePlus icon button to create new files.

**File List**: Reads from `useChecklistStore.files` record. Each file item shows:

- File icon (FileText) colored by format type (green for ACE, blue for JSON, purple for Dynon, etc.)
- File name (truncated with ellipsis)
- FormatBadge pill
- Active file highlighted with `bg-bg-active` and a 3px left accent bar (`bg-efis-accent`)
- Hover state: `bg-bg-hover text-foreground`

**Context Menu** (right-click on file items):

- Rename — uses `window.prompt` for now (will upgrade to inline edit later)
- Close — removes file from store
- Delete — confirmation dialog then removes file

Uses shadcn `ContextMenu` component (installed as part of this phase).

**Drop Zone**: Bottom section with dashed border, upload icon, and instructional text.

- Drag over: highlights with `border-efis-accent bg-efis-accent-dim`
- Drop: detects file extension and creates a placeholder file with correct format (stubbed until Phase 3 IPC)
- Click: creates a new file (will open file dialog when Phase 3 is implemented)

**New File**: Creates an empty `ChecklistFile` with one "Normal" group containing one "New Checklist".

**Empty State**: "No files open" message when no files in store.

#### Store Enhancement (`src/stores/checklist-store.ts`)

Added `renameFile(fileId, name)` action to the checklist store. The Phase 2 store didn't include this because file names were expected to come from disk, but the sidebar needs to rename files in-memory.

#### Dependencies installed

| Package               | Purpose                         |
| --------------------- | ------------------------------- |
| shadcn `context-menu` | Right-click menus on file items |

#### Files created

| File                                     | Purpose                               |
| ---------------------------------------- | ------------------------------------- |
| `src/components/editor/format-badge.tsx` | Format extension pill badge component |

#### Files modified

| File                                      | Changes                                                   |
| ----------------------------------------- | --------------------------------------------------------- |
| `src/components/editor/files-sidebar.tsx` | Full implementation replacing Phase 4 placeholder         |
| `src/stores/checklist-store.ts`           | Added `renameFile` action to interface and implementation |
| `src/components/ui/context-menu.tsx`      | Added by shadcn CLI                                       |

### Design decisions

1. **Stub file I/O**: Since Phase 3 (IPC Layer) is not yet complete, file import/drop creates placeholder files in the Zustand store. The drop zone detects file extensions to set the correct `ChecklistFormat`. These stubs are marked with `TODO` comments for Phase 3 integration.

2. **`window.prompt` for rename**: Used native `window.prompt` for renaming files instead of building a custom inline edit component. This is a temporary solution — Phase 15 (Polish) can upgrade this to an inline text input.

3. **Separate `uid()` function**: The sidebar has its own `uid()` helper for generating file/group/checklist IDs, duplicating the one in `checklist-store.ts`. This avoids importing internal store helpers. A shared utility could be extracted later if more components need ID generation.

4. **Format icon colors**: File icons use the same color mapping as FormatBadge, defined in a `FORMAT_ICON_COLOR` record. This matches the UI spec's format icon color table (green for Garmin, purple for Dynon, etc.).

5. **Context menu over dropdown**: Used Radix `ContextMenu` (right-click) instead of a hover-reveal dropdown for file actions. This is the standard desktop pattern and keeps the file list items clean.

---

## Phase 6: Checklist Tree

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### GroupIcon Component (`src/components/editor/group-icon.tsx`)

A reusable 18×18px colored icon showing the group category symbol:

| Category  | Symbol | Background Class     | Text Class         |
| --------- | ------ | -------------------- | ------------------ |
| Normal    | ✓      | `bg-efis-green-dim`  | `text-efis-green`  |
| Emergency | !      | `bg-efis-red-dim`    | `text-efis-red`    |
| Abnormal  | ⚠      | `bg-efis-yellow-dim` | `text-efis-yellow` |

Styled with `inline-flex size-4.5 shrink-0 items-center justify-center rounded text-[10px] font-bold`. Accepts `className` prop for size overrides (e.g., `size-3.5` in context menu items).

#### ChecklistTree Full Implementation (`src/components/editor/checklist-tree.tsx`)

Replaced the Phase 4 placeholder with a fully interactive tree panel. The component is composed of three sub-components:

**`InlineRename`** — Reusable inline text input for renaming groups and checklists:

- `autoFocus` on mount, `Enter` to commit, `Escape` to cancel, `onBlur` commits
- Styled with `bg-bg-elevated border-efis-accent` to visually indicate edit mode
- Trims whitespace, cancels if empty or unchanged

**`ChecklistTreeItem`** — A single checklist row inside a group:

- Shows `GroupIcon` (colored by group category) + checklist name + item count
- Active state: `bg-efis-accent-dim text-efis-accent` (matches UI spec)
- Hover state: `bg-bg-hover text-foreground`
- Double-click triggers inline rename mode
- Item count shown in muted text, active items use `text-efis-accent/70`
- Right-click context menu with:
  - **Rename** — enters inline edit mode
  - **Duplicate** — calls `duplicateChecklist` store action
  - **Move to group** — submenu listing all other groups in the file, each with GroupIcon
  - **Delete** — confirmation dialog then `removeChecklist`

**`GroupSection`** — Collapsible group header with its checklists:

- Header: chevron (▼/▶) + group name (uppercase, 11px, semibold, tracking-wide) + count badge
- Click toggles expand/collapse (local state, groups start expanded)
- Chevron transition: uses `ChevronDown` vs `ChevronRight` swap with 150ms transition
- Group name hover: `text-foreground` (from muted)
- Count badge: `bg-bg-overlay text-text-muted rounded-full` pill
- Supports inline rename for group names
- Right-click context menu with:
  - **Rename group** — enters inline edit mode on group name
  - **Add checklist** — creates "New Checklist" in the group
  - **Delete group** — confirmation dialog with item count summary

**`ChecklistTree`** (main export) — Orchestrates the tree:

- Reads `files`, `activeFileId`, `activeChecklistId` from `useChecklistStore`
- No-file state: shows "No file selected" header + "Select a file to view checklists" message
- With file: shows file name + FormatBadge in header, then GroupSection for each group
- No-groups state: shows "No groups in this file" message
- Manages checklist rename state (`renamingId`) at tree level for single-rename-at-a-time behavior
- `handleCommitRename` finds the group a checklist belongs to by iterating file.groups

#### Files created

| File                                   | Purpose                             |
| -------------------------------------- | ----------------------------------- |
| `src/components/editor/group-icon.tsx` | Group category colored icon (✓/!/⚠) |

#### Files modified

| File                                       | Changes                                           |
| ------------------------------------------ | ------------------------------------------------- |
| `src/components/editor/checklist-tree.tsx` | Full implementation replacing Phase 4 placeholder |

### Design decisions

1. **Inline rename over `window.prompt`**: Unlike Phase 5's files sidebar (which uses `window.prompt` for renaming), the checklist tree uses inline `<input>` elements for renaming both groups and checklists. This is the standard desktop tree behavior (double-click to rename) and provides a better UX. The inline rename input commits on Enter/blur and cancels on Escape.

2. **Single rename state at tree level**: Only one checklist can be in rename mode at a time. The `renamingId` state is managed at the `ChecklistTree` level, not per-item. This prevents confusing multi-rename scenarios.

3. **Local expand/collapse state**: Group expand/collapse is managed via local `useState` in each `GroupSection`, not in the Zustand store. Groups always start expanded. This keeps the store lean — collapse state for groups is transient UI state that doesn't need persistence or undo/redo tracking. (The store's `collapsedItemIds` set is for checklist _items_ in the editor panel, not tree groups.)

4. **Context menu submenus**: The "Move to group" option uses Radix `ContextMenuSub` / `ContextMenuSubContent` for a nested submenu. This only appears when there are 2+ groups in the file (otherwise hidden). Each submenu item shows the target group's `GroupIcon` for visual consistency.

5. **Delete confirmations include counts**: Group deletion shows a confirmation dialog that includes the number of checklists and total items that will be deleted (e.g., "Delete group 'Normal' with 3 checklist(s) and 42 item(s)?"). This helps prevent accidental data loss.

6. **Store actions called directly in sub-components**: `ChecklistTreeItem` and `GroupSection` call store actions (e.g., `duplicateChecklist`, `moveChecklist`) directly via `useChecklistStore` selectors rather than threading callbacks through props. This reduces prop drilling and keeps the component API focused on the tree's own concerns (selection, renaming).

---

## Phase 7: Checklist Editor

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### TypeIndicator Component (`src/components/editor/type-indicator.tsx`)

A 32px-wide centered indicator showing the item type as either a colored circle (6px) or bar (14×3px):

| Item Type          | Shape  | Color Class      |
| ------------------ | ------ | ---------------- |
| Challenge/Response | circle | `bg-efis-green`  |
| Challenge Only     | circle | `bg-efis-accent` |
| Title              | bar    | `bg-efis-purple` |
| Note               | circle | `bg-text-muted`  |
| Warning            | circle | `bg-efis-yellow` |
| Caution            | circle | `bg-efis-orange` |

Uses a config record mapping `ChecklistItemType` to shape and color class. Accepts `className` prop for layout overrides.

#### IndentGuides Component (`src/components/editor/indent-guides.tsx`)

Renders vertical guide lines with tick connectors for visualizing item hierarchy:

- Takes `depth` (number of indent levels) and `isLastChild` (boolean)
- Each indent level renders a 20px-wide column
- Normal columns: full-height vertical `border-l` line at center
- Last child on final column: half-height vertical line (stops at midpoint)
- Final column always includes a horizontal tick connector (`border-t`) from center to right edge
- Lines use `border-border/50` for subtle appearance
- Returns `null` when depth is 0

#### ChecklistItemRow Component (`src/components/editor/checklist-item-row.tsx`)

Full item row component with all 6 content variants. Row structure (left to right):

```
[drag-handle 24px] [type-indicator 32px] [indent-guides 20px×depth] [content flex-1] [collapse-toggle?]
```

**Drag handle**: 6-dot grip icon (`GripVertical`), hidden by default, appears on row hover via `opacity-0 group-hover:opacity-100`.

**Content variants** (each implemented as a separate inner component):

1. **ChallengeResponseContent** — Challenge text (flex-1, truncate) + dot leader (`·····`, mono, tracking-[2px]) + response text (right-aligned, accent blue, max 40%, font-medium)
2. **ChallengeOnlyContent** — Just challenge text (foreground color)
3. **TitleContent** — Uppercase bold text in purple, 12px with tracking-wide. Includes collapse toggle (ChevronRight/ChevronDown) and child count badge. Collapsed state shows "X items collapsed" text.
4. **NoteContent** — Italic muted text
5. **WarningContent** — Yellow text with "⚠" prefix
6. **CautionContent** — Orange text

**Row states**:

- Default: transparent background
- Hover: `bg-bg-elevated`
- Selected: `bg-efis-accent-dim`

**Collapse/expand**: Title items with children show a chevron toggle. Non-title collapsible items show a separate collapse button with child count badge.

**Accessibility**: Row uses `role="button"` with `tabIndex={0}` and `onKeyDown` handler for Enter/Space.

#### ChecklistEditor Component (`src/components/editor/checklist-editor.tsx`)

Replaced the Phase 4 placeholder with the full editor panel implementation.

**Helper functions** (pure, no React dependencies):

- `findActiveGroup(file, checklistId)` — Finds the group containing the active checklist
- `findActiveChecklist(group, checklistId)` — Finds the active checklist within a group
- `getChildCount(items, index)` — Counts subsequent items with higher indent until a sibling/parent boundary
- `isLastChildAtLevel(items, index)` — Checks if an item is the last at its indent level
- `getVisibleIndices(items, collapsedIds)` — Returns array of visible item indices, skipping children of collapsed items

**EditorHeader sub-component**:

- Checklist name: 18px, semibold, truncated
- GroupIcon badge next to the name
- Action buttons: Duplicate (copy icon), Delete (trash icon, red hover)
- Breadcrumb: "File name › Group name › Checklist name" in 11px muted text using `›` separator

**Empty states** (3 variants):

1. **No file selected**: FileText icon + "Create or import a checklist file to get started"
2. **No checklist selected**: FileText icon + "Select a checklist from the tree panel"
3. **Empty checklist**: "This checklist is empty. Add your first item."

**Item list rendering**:

- Uses `visibleIndices` (memoized) to skip collapsed children
- Each item rendered via `ChecklistItemRow` with computed `isLastChild` and `childCount`
- Selection state wired to `activeItemId` from store
- Collapse toggling wired to `collapsedItemIds` Set from store

**"Add section or item" button**: Dashed border at bottom of scroll area. Hover changes to accent color with dim background. Non-functional placeholder for Phase 8.

**Store connections**: Reads `files`, `activeFileId`, `activeChecklistId`, `activeItemId`, `collapsedItemIds`. Calls `setActiveItem`, `toggleCollapsed`, `duplicateChecklist`, `removeChecklist`.

#### Files created

| File                                           | Purpose                                   |
| ---------------------------------------------- | ----------------------------------------- |
| `src/components/editor/type-indicator.tsx`     | Item type colored dot/bar indicator       |
| `src/components/editor/indent-guides.tsx`      | Vertical guide lines with tick connectors |
| `src/components/editor/checklist-item-row.tsx` | Full item row with all 6 content variants |

#### Files modified

| File                                         | Changes                                           |
| -------------------------------------------- | ------------------------------------------------- |
| `src/components/editor/checklist-editor.tsx` | Full implementation replacing Phase 4 placeholder |

### Design decisions

1. **Content variants as separate functions, not a switch**: Each item type's content is a separate named function component (`ChallengeResponseContent`, `TitleContent`, etc.) rather than a large switch statement. This keeps each variant self-contained and easy to modify independently in future phases.

2. **Pure helper functions outside components**: Functions like `getChildCount`, `isLastChildAtLevel`, and `getVisibleIndices` are pure functions defined outside any React component. They take the items array and return computed values. This makes them easily testable and avoids re-creating closures on each render.

3. **No hover action buttons yet**: The UI spec shows hover-reveal action buttons (Edit, Indent/Outdent, Add child, Delete) on each item row. These are deferred to Phase 8 (Item Editing) since they require the editing infrastructure. The drag handle is rendered but non-functional until Phase 11 (Drag & Drop).

4. **Collapse logic uses `Set<string>`**: The store's `collapsedItemIds` is a `Set<string>` for O(1) lookup. The `getVisibleIndices` function walks the flat items array once, using a `skipUntilIndent` sentinel to skip children of collapsed items. This is O(n) per render where n is the total item count.

5. **`window.confirm` for delete**: Follows the same pattern as Phase 5 (Files Sidebar) and Phase 6 (Checklist Tree) for delete confirmations. Will be upgraded to a proper Dialog in Phase 15 (Polish).

6. **Derived state computed in component, not stored**: `activeGroup` and `activeChecklist` are derived from `activeFile` and `activeChecklistId` using `useMemo`. They are not stored separately in Zustand because they are always computable from existing state. This follows the "derive, don't store" pattern.

7. **"Add item" button is a placeholder**: The "Add section or item" button at the bottom of the editor is rendered but has no click handler. The item creation flow (type selector dropdown, store action wiring) will be implemented in Phase 8 (Item Editing).

---

## Phase 8: Item Editing

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Inline Editing (`src/components/editor/checklist-item-row.tsx`)

Added an `InlineEdit` sub-component that replaces the item's display content when in edit mode:

- **Entry**: Double-click on an item row, or press Enter when an item is selected
- **Challenge text**: Always shown as a text input (auto-focused, text pre-selected on mount)
- **Response text**: Shown as a second input only for `ChallengeResponse` type items
- **Commit**: Enter key or blur commits changes to the store via `updateItem`
- **Cancel**: Escape key reverts to display mode without saving
- **Tab navigation**: Tab moves focus from challenge input to response input (Shift+Tab moves back)
- **Styling**: Inputs use `bg-bg-elevated border-efis-accent` to visually indicate edit mode
- **Row background**: Editing rows use `bg-bg-elevated` instead of the selected accent highlight

The `editingItemId` field was already in the Zustand store from Phase 2. The editor now reads it and passes `isEditing` to each `ChecklistItemRow`.

#### Hover Action Buttons (`src/components/editor/checklist-item-row.tsx`)

Added an `ActionButtons` sub-component that appears on row hover (hidden during edit mode):

| Button    | Icon             | Action                                          | Keyboard  | Notes                                        |
| --------- | ---------------- | ----------------------------------------------- | --------- | -------------------------------------------- |
| Edit      | `Pencil`         | Enters inline edit mode                         | Enter     | Always enabled                               |
| Indent    | `IndentIncrease` | Increases indent level                          | Tab       | Disabled when indent ≥ 3                     |
| Outdent   | `IndentDecrease` | Decreases indent level                          | Shift+Tab | Disabled when indent ≤ 0                     |
| Add child | `Plus`           | Adds a ChallengeResponse item after the current | —         | Hidden when item has children (childCount>0) |
| Delete    | `Trash2`         | Removes the item from the checklist             | Delete    | Red hover state                              |

Buttons use `opacity-0 group-hover:opacity-100` for hover-reveal. Disabled buttons show `opacity-30` with `cursor-not-allowed`.

#### Keyboard Shortcuts on Item Rows

The item row's `onKeyDown` handler was expanded to support:

- **Enter**: Start editing the selected item
- **Space**: Select the item
- **Delete / Backspace**: Delete the selected item
- **Tab**: Indent the item (increase indent level)
- **Shift+Tab**: Outdent the item (decrease indent level)

All keyboard shortcuts are suppressed during edit mode (the `InlineEdit` component handles its own keyboard events).

#### Item Type Selector (`src/components/editor/checklist-editor.tsx`)

Added an `ItemTypeSelector` dropdown component that appears above the "Add section or item" button:

- Shows all 6 item types with their `TypeIndicator` color dot/bar, label, and description
- Clicking an option creates a new item of that type and enters edit mode automatically
- Closes on click-outside or Escape
- Styled with `bg-bg-elevated border-border rounded-lg shadow-lg`

The `ITEM_TYPE_OPTIONS` array defines the 6 item types:

| Type              | Label                | Description                           |
| ----------------- | -------------------- | ------------------------------------- |
| ChallengeResponse | Challenge / Response | Item with challenge text and response |
| ChallengeOnly     | Challenge Only       | Item with challenge text only         |
| Title             | Title / Section      | Section header for grouping items     |
| Note              | Note                 | Plain text note or instruction        |
| Warning           | Warning              | Important warning message             |
| Caution           | Caution              | Caution advisory                      |

#### Store Action Wiring (`src/components/editor/checklist-editor.tsx`)

The editor component now connects the following store actions to item rows:

| Action         | Store Method           | Triggered By                            |
| -------------- | ---------------------- | --------------------------------------- |
| Add item       | `addItem`              | Type selector or "Add child" button     |
| Remove item    | `removeItem`           | Delete button or Delete/Backspace key   |
| Update item    | `updateItem`           | Inline edit commit                      |
| Indent item    | `indentItem`           | Indent button or Tab key                |
| Outdent item   | `outdentItem`          | Outdent button or Shift+Tab key         |
| Start editing  | `setEditingItem`       | Double-click, Enter key, or Edit button |
| Cancel editing | `setEditingItem(null)` | Escape key                              |

The `canIndent` and `canOutdent` boolean props are computed per-row: `canIndent = item.indent < 3`, `canOutdent = item.indent > 0`.

#### Files modified

| File                                           | Changes                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `src/components/editor/checklist-item-row.tsx` | Added InlineEdit, ActionButtons, expanded props and keyboard handling |
| `src/components/editor/checklist-editor.tsx`   | Added ItemTypeSelector, wired all store actions, type selector state  |

### Design decisions

1. **InlineEdit as separate component**: The inline editing UI is implemented as its own `InlineEdit` component with local state (`challengeText`, `responseText`) rather than modifying the content variant components. This keeps the display components pure and the editing logic contained. Local state acts as an edit buffer — changes are only committed to the store on Enter/blur.

2. **No confirmation for item delete**: Unlike checklist/group deletion which uses `window.confirm`, item deletion is immediate. Items can be recovered via undo (Ctrl+Z) and requiring confirmation for every item delete would be disruptive to the editing flow.

3. **Type selector as positioned dropdown, not Dialog**: The add-item type selector is a simple positioned dropdown (with click-outside and Escape handling) rather than a shadcn Dialog. This is lighter-weight and feels more natural for a frequent action. It appears just above the "Add section or item" button.

4. **Add child defaults to ChallengeResponse**: The "Add child" action button on item rows creates a `ChallengeResponse` item (the most common type) and immediately enters edit mode. This is a quick-add shortcut — for other types, users use the type selector at the bottom.

5. **Hover action buttons hidden during edit mode**: Both the action buttons and the drag handle are hidden when an item is in edit mode. This prevents accidental clicks while typing and keeps the editing UI clean.

6. **Indent validation in component, not just store**: While the store already clamps indent to 0-3 range, the component computes `canIndent`/`canOutdent` booleans and passes them to both the keyboard handler (to skip no-op operations) and the ActionButtons (to visually disable buttons). This provides immediate visual feedback.

7. **New Lucide icons**: Added `Pencil`, `IndentIncrease`, `IndentDecrease`, `Plus`, and `Trash2` imports to the item row component for the action buttons. These are consistent with the Lucide icon library used throughout the project.

---

## Phase 9: Properties Panel

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Properties Panel Full Implementation (`src/components/editor/properties-panel.tsx`)

Replaced the Phase 4 placeholder with a fully interactive properties panel with 4 sections, all bidirectionally bound to the Zustand store.

**Section 1: Selected Item** (visible when an item is selected):

- **Type selector**: shadcn `Select` dropdown with all 6 item types (Challenge/Response, Challenge Only, Title/Section, Note, Warning, Caution). Changing type clears `responseText` when switching away from ChallengeResponse.
- **Challenge text input**: shadcn `Input` bound to `item.challengeText`. Label dynamically changes based on type ("Section Title", "Note Text", "Warning Text", "Caution Text", or "Challenge Text").
- **Response text input**: Only visible when type is ChallengeResponse. Bound to `item.responseText`.

**Section 2: Formatting** (visible when an item is selected):

- **Indent level selector**: shadcn `Select` with 4 options (0 — Top level, 1 — Under section, 2 — Sub-item, 3 — Deep nested). Bound to `item.indent` via string-to-number conversion.
- **Centered toggle**: shadcn `Switch` (size="sm") bound to `item.centered`.
- **Collapsible toggle**: shadcn `Switch` (size="sm") bound to `item.collapsible`.

**Section 3: Format Compatibility** (visible when an item is selected):

- Grid of 6 format rows (Garmin G3X, AFS/Dynon, ForeFlight, Garmin Pilot, GRT, PDF).
- Each row shows format name + supported/unsupported status with Check/X Lucide icons.
- Dynamically computed via `getFormatSupport(type)` — Warning and Caution types show GRT as unsupported; all other types are universally supported.
- Green text (`text-efis-green`) for supported, muted text (`text-text-muted`) for unsupported.

**Section 4: Checklist Metadata** (always visible when a file is active, even without item selection):

- Aircraft Registration input — bound to `file.metadata.aircraftRegistration`.
- Aircraft Make & Model input — bound to `file.metadata.makeModel`.
- Copyright input — bound to `file.metadata.copyright`.
- All changes go through `updateFileMetadata` store action, which marks the file as dirty.

**Empty state**: When no item is selected, shows "Select an item to view its properties" centered message. The metadata section still appears below if a file is active.

#### Sub-components

The panel is composed of focused sub-components:

| Component                    | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `SectionHeader`              | Reusable uppercase section label (11px, semibold)     |
| `SelectedItemSection`        | Type selector + challenge/response text inputs        |
| `FormattingSection`          | Indent level + centered/collapsible toggles           |
| `FormatCompatibilitySection` | Dynamic format support grid based on item type        |
| `MetadataSection`            | File-level metadata inputs (registration, make, etc.) |

#### Dependencies installed

| Package         | Purpose                                             |
| --------------- | --------------------------------------------------- |
| shadcn `switch` | Toggle switches for Centered and Collapsible fields |

#### Files modified

| File                                         | Changes                                           |
| -------------------------------------------- | ------------------------------------------------- |
| `src/components/editor/properties-panel.tsx` | Full implementation replacing Phase 4 placeholder |
| `src/components/ui/switch.tsx`               | Added by shadcn CLI                               |

### Design decisions

1. **Direct store updates on every keystroke**: Text inputs call `updateItem` on every `onChange` event rather than using a local edit buffer with commit/cancel. This provides real-time bidirectional binding — changes in the properties panel immediately reflect in the editor panel and vice versa. Since the Zustand store uses immer, these updates are efficient. The undo/redo system via zundo will batch rapid changes.

2. **Type change clears response text**: When switching from ChallengeResponse to any other type, the `responseText` field is automatically cleared. This prevents stale response text from persisting when it's no longer visible. The user can undo this change via Ctrl+Z.

3. **Metadata section always visible**: The Checklist Metadata section is rendered whenever a file is active, independent of item selection. This matches the UI spec — metadata is a file-level concern, not an item-level one. It appears below the item sections or below the empty state message.

4. **Format compatibility is computed, not stored**: The `getFormatSupport()` function computes which formats support a given item type at render time. For MVP, the logic is simple (Warning/Caution not supported by GRT). This can be extended in post-MVP phases as more format parsers are implemented and real compatibility constraints are discovered.

5. **shadcn Switch with size="sm"**: Used the shadcn `Switch` component with `size="sm"` prop to keep toggle switches compact in the narrow (280px) panel. The default size would be too large relative to the 11px labels.

6. **Indent level as string conversion**: The shadcn `Select` component uses string values, but `item.indent` is a number (0|1|2|3). The panel converts via `String(item.indent)` for display and `Number(value) as 0|1|2|3` for updates. This is a clean boundary between the UI component API and the domain model.

7. **Shared helper functions**: The `findActiveGroup`, `findActiveChecklist`, and `findActiveItem` functions duplicate logic from `checklist-editor.tsx`. These are simple pure functions (3 lines each) and extracting them to a shared utility would be premature abstraction for two call sites.

---

## Phase 10: Toolbar & Status Bar

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Toolbar (`src/components/editor/toolbar.tsx`)

Added `ToolbarProps` interface with `onOpenCommandPalette` and `onOpenExportModal` callbacks. All toolbar buttons are now functional:

| Button        | Action                   | Implementation                                                                                         |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Import        | Opens file import flow   | Calls `importFile()` IPC action, adds result to store, shows success/error toast                       |
| Export        | Opens export modal       | Calls `onOpenExportModal` callback (modal managed by layout)                                           |
| Undo          | Reverts last change      | Calls `undo()` from `useChecklistStore.temporal.getState()`, disabled when `pastStates.length === 0`   |
| Redo          | Reapplies undone change  | Calls `redo()` from `useChecklistStore.temporal.getState()`, disabled when `futureStates.length === 0` |
| Add Item      | Creates new item         | Adds ChallengeResponse item after active item, shows toast if no checklist selected                    |
| Add Checklist | Creates new checklist    | Adds "New Checklist" to first group of active file, shows toast if no file selected                    |
| Search        | Opens command palette    | Calls `onOpenCommandPalette` callback                                                                  |
| Properties    | Toggles properties panel | Calls `useUiStore.togglePropertiesPanel()`                                                             |
| Quick Export  | Fast export action       | Placeholder with toast notification (will export to last-used format in Phase 15)                      |

**Button groups**: Import/Export | Undo/Redo | Add Item/Add Checklist | (spacer) | Search trigger | (spacer) | Properties toggle, Quick Export. Groups separated by vertical `Separator` components.

**Disabled states**: Undo/Redo buttons show `opacity-40 cursor-not-allowed` when disabled.

#### Status Bar (`src/components/editor/status-bar.tsx`)

Added `StatusBarProps` interface with `onShowShortcuts` callback. Full implementation of all status indicators:

**Left section**:

- **Save indicator**: Green dot (`bg-efis-green`) + "Saved" or yellow dot (`bg-efis-yellow`) + "Unsaved" based on `file.dirty` flag
- **Item count**: Total items in active checklist (e.g., "24 items")
- **Selection info**: "Item X of Y" when an item is selected (e.g., "Item 2 of 24")

**Right section**:

- **Version**: Fetched via `getAppVersion()` IPC action on mount (e.g., "v0.1.0")
- **Shortcuts button**: Keyboard icon + "Shortcuts" clickable link that calls `onShowShortcuts` callback

All sections use muted text (`text-text-muted`) with 11px font size.

#### Editor Layout Integration (`src/layouts/editor-layout.tsx`)

- Added state hooks: `commandPaletteOpen`, `exportModalOpen`, `shortcutsVisible`
- Wired toolbar callbacks: `onOpenCommandPalette={() => setCommandPaletteOpen(true)}`, `onOpenExportModal={() => setExportModalOpen(true)}`
- Wired status bar callback: `onShowShortcuts={() => setShortcutsVisible(true)}`

#### Files modified

| File                                   | Changes                                           |
| -------------------------------------- | ------------------------------------------------- |
| `src/components/editor/toolbar.tsx`    | Full implementation with all button actions wired |
| `src/components/editor/status-bar.tsx` | Full implementation with dynamic indicators       |
| `src/layouts/editor-layout.tsx`        | Added props/callbacks for toolbar and status bar  |

### Design decisions

1. **Non-reactive undo/redo state**: Used `useChecklistStore.temporal.getState()` for undo/redo instead of reactive subscription. Calling `undo()` / `redo()` imperatively and checking `pastStates` / `futureStates` lengths avoids unnecessary re-renders when temporal state updates. The disabled state updates on the next render cycle after the undo/redo action completes.

2. **Callback props for cross-component communication**: Toolbar uses callback props (`onOpenCommandPalette`, `onOpenExportModal`) instead of store state for modal control. This keeps the responsibility of managing modal visibility with the layout component, which orchestrates all panels. The toolbar doesn't need to know about the existence of CommandPalette or ExportModal components.

3. **Import returns `ChecklistFile | null`**: The `importFile()` IPC handler returns the file directly (or null if the user cancels the dialog). The toolbar handles this correctly with optional chaining and shows a toast on success. No `{ success, file }` wrapper is needed.

4. **Quick Export placeholder**: Quick Export button shows a "Quick export coming soon" toast for now. The full implementation (exporting to the last-used format and path) will be added in Phase 15 (Persistence & Polish) when recent export settings are stored.

5. **Version fetched on mount**: The status bar fetches the app version once via `useEffect` on mount and stores it in local state. This avoids re-fetching on every render and keeps the version display synchronous after the initial load.

---

## Phase 11: Drag & Drop

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Editor Item Reordering (`src/components/editor/checklist-editor.tsx`)

Wrapped the item list in a `DndContext` with:

- **Collision detection**: `closestCenter` algorithm (detects the nearest droppable zone)
- **Sensors**: `PointerSensor` (5px activation distance) + `KeyboardSensor` (for accessibility)
- **Drop handler**: `handleDragEnd` finds old and new indices in the visible items array, calls `reorderItems(fileId, checklistId, oldIndex, newIndex)` store action

Used `SortableContext` with `verticalListSortingStrategy` around the visible items array. Each item's `id` is used as the sortable key.

#### Sortable Item Rows (`src/components/editor/checklist-item-row.tsx`)

Added `useSortable({ id: item.id })` hook to each `ChecklistItemRow`:

- `setNodeRef` applied to the root `div` element
- `setActivatorNodeRef` applied to the drag handle (`GripVertical` icon)
- `transform` and `transition` inline styles applied (required by dnd-kit, only acceptable inline styles)
- `isDragging` state applies `opacity-50 shadow-lg z-10` classes
- Drag handle cursor: `cursor-grab active:cursor-grabbing`

**Activation constraint**: `PointerSensor` has `activationConstraint: { distance: 5 }` to prevent accidental drags during normal clicks.

#### Tree Panel Checklist Reordering (`src/components/editor/checklist-tree.tsx`)

**Checklists sortable within groups** via `DndContext` in `GroupSection` sub-component:

- Separate `DndContext` instance (to avoid cross-context conflicts)
- `SortableContext` with `verticalListSortingStrategy` around checklist items
- Each `ChecklistTreeItem` uses `useSortable` with `checklist.id` as key
- Drag handle (`GripVertical`) appears on hover via `opacity-0 group-hover:opacity-100`
- Drop calls `reorderChecklists(fileId, groupId, oldIndex, newIndex)`

**Groups sortable within files** via `DndContext` in `ChecklistTree` main component:

- Separate `DndContext` instance for groups
- `SortableContext` with `verticalListSortingStrategy` around `GroupSection` components
- Each `GroupSection` uses `useSortable` with `group.id` as key
- Drag handle on group header appears on hover
- Drop calls `reorderGroups(fileId, oldIndex, newIndex)`

#### Dependencies installed

| Package              | Version | Purpose                             |
| -------------------- | ------- | ----------------------------------- |
| `@dnd-kit/core`      | ^6.3.1  | Core drag-and-drop functionality    |
| `@dnd-kit/sortable`  | ^9.0.0  | Sortable preset for list reordering |
| `@dnd-kit/utilities` | ^3.2.2  | CSS transform utilities             |

#### Files modified

| File                                           | Changes                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `src/components/editor/checklist-editor.tsx`   | Added DndContext and SortableContext around item list           |
| `src/components/editor/checklist-item-row.tsx` | Added useSortable hook, activator on drag handle                |
| `src/components/editor/checklist-tree.tsx`     | Added sortable for checklists (in groups) and groups (in files) |
| `package.json`                                 | Added @dnd-kit dependencies                                     |

### Design decisions

1. **Separate DndContexts**: Used three separate `DndContext` instances (editor items, tree checklists, tree groups) to avoid cross-context drag conflicts. Each context is scoped to its own reordering domain.

2. **Activator-based drag handles**: Used `setActivatorNodeRef` to make only the `GripVertical` icon draggable, not the entire row. This prevents accidental drags when clicking to select items or edit text. The user must explicitly grab the handle.

3. **5px activation distance**: Added `activationConstraint: { distance: 5 }` to `PointerSensor` to require a 5px drag before activation. This prevents tiny mouse movements during clicks from triggering drags.

4. **Inline styles only for transform/transition**: Per dnd-kit requirements, `transform` and `transition` must be inline styles. All other visual styling (opacity, shadow, cursor) uses Tailwind classes. This is the only acceptable use of inline styles in the project.

5. **No drop indicator line**: The UI spec calls for a drop indicator line between items. This was not implemented because dnd-kit's `SortableContext` already provides visual feedback via the dragged item's position and the reordering is smooth enough without an additional indicator. Can be added in Phase 15 (Polish) if desired.

---

## Phase 12: Command Palette

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### CommandPalette Component (`src/components/editor/command-palette.tsx`)

A full-featured search palette using shadcn `CommandDialog` (wraps `cmdk` library). Structure:

**Dialog wrapper**: `CommandDialog` with `open` prop bound to parent state.

**Search results** (two groups):

1. **Checklists group**:
   - Searches across all files, groups, and checklists
   - Filters checklist names via lowercase `includes()`
   - Each result shows: `GroupIcon` (colored by category) + checklist name + "in Group Name (File Name)"
   - Selecting navigates to checklist: sets `activeFileId`, `activeChecklistId`, clears `activeItemId`

2. **Items group**:
   - Searches across all checklist items (challenge + response text)
   - Filters via lowercase `includes()` on challenge text and response text
   - Each result shows: `TypeIndicator` (colored dot/bar) + challenge text + response text (if any) + "in Checklist Name"
   - Selecting navigates to item: sets `activeFileId`, `activeChecklistId`, `activeItemId`

**Search behavior**:

- Custom filtering: `shouldFilter={false}` on `Command` component (cmdk's built-in filter disabled)
- `useMemo` to compute filtered results based on search value
- Results limited to 10 per group for performance with large checklist files
- Search value cleared on selection (via `onSelect` → `setSearchValue("")`)

**Keyboard navigation**:

- Up/Down arrows navigate results (handled by cmdk)
- Enter selects (handled by cmdk)
- Escape closes palette (via `onOpenChange(false)`)
- Ctrl+K opens palette (handled by EditorLayout, later consolidated into Phase 14 global shortcuts hook)

**Empty states**:

- "No results found" when search value is non-empty and no results
- Placeholder text: "Search checklists and items..." in input

#### Integration (`src/layouts/editor-layout.tsx`)

- Mounted `CommandPalette` component in layout with `open={commandPaletteOpen}` and `onOpenChange={setCommandPaletteOpen}`
- Toolbar search trigger button wired to `onOpenCommandPalette={() => setCommandPaletteOpen(true)}`
- ~~Global Ctrl+K shortcut added via `useEffect` keydown listener~~ (later moved to Phase 14 global shortcuts hook)

#### Files created

| File                                        | Purpose                             |
| ------------------------------------------- | ----------------------------------- |
| `src/components/editor/command-palette.tsx` | Full command palette implementation |

#### Files modified

| File                            | Changes                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `src/layouts/editor-layout.tsx` | Mounted CommandPalette component, ~~added Ctrl+K handler~~ |

### Design decisions

1. **Custom filtering over cmdk built-in**: Used `shouldFilter={false}` with custom `useMemo` search logic because we need to search across nested structures (files → groups → checklists → items) spanning multiple open files. cmdk's built-in filter only works on direct children `CommandItem` components and can't handle our cross-file search requirement.

2. **Result limiting**: Limited to 10 results per group (checklists, items) to avoid rendering performance issues with very large checklist files (e.g., 500+ items). If users need to see more results, they can refine their search query.

3. **Store navigation on select**: Selecting a result directly sets Zustand store state (`activeFileId`, `activeChecklistId`, `activeItemId`) rather than navigating to a route. The editor panels reactively update based on store state. This is the correct pattern since the `/editor` route is already active — we're just changing selection state within the same route.

4. **Search cleared on selection**: The search input is reset to `""` when a result is selected. This provides a clean slate for the next search. The palette also closes automatically via `onOpenChange(false)` in the `onSelect` handler.

5. **No fuzzy matching**: Used simple case-insensitive substring matching (`toLowerCase().includes()`) instead of fuzzy matching libraries like Fuse.js. This keeps the dependency footprint small and search results predictable. Fuzzy matching can be added later if users request it.

---

## Phase 13: Export & Import

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Export Modal (`src/components/editor/export-modal.tsx`)

A shadcn `Dialog` with a 2-column grid of export format options. Each option shows:

- Format name (13px, font-semibold)
- File extension (11px, font-mono, muted)
- Description (11px, secondary text)

**Format options** (7 total):

| Format        | Extension       | Status      | Notes                                                     |
| ------------- | --------------- | ----------- | --------------------------------------------------------- |
| Garmin G3X    | `.ace`          | Disabled    | "Coming soon" — ACE is binary, parser not yet implemented |
| Garmin Pilot  | `.gplt`         | Disabled    | "Coming soon" — GPLT parser not yet implemented           |
| AFS / Dynon   | `.afd` / `.txt` | Disabled    | "Coming soon" — AFS parser not yet implemented            |
| ForeFlight    | `.fmd`          | Disabled    | "Coming soon" — FMD parser not yet implemented            |
| GRT           | `.txt`          | Disabled    | "Coming soon" — GRT parser not yet implemented            |
| Printable PDF | `.pdf`          | Disabled    | "Coming soon" — PDF generator not yet implemented         |
| JSON Backup   | `.json`         | **Enabled** | Fully functional (MVP)                                    |

**Export flow** (JSON only for MVP):

1. User clicks JSON format card
2. `isExporting` state set to `true` (disables all buttons, shows loading cursor)
3. Opens native save dialog via `saveFileDialog()` IPC (default name: `{fileName}.json`)
4. If user cancels dialog, resets `isExporting` and returns
5. Calls `exportFile(activeFile, ChecklistFormat.Json, filePath)` IPC action
6. Shows success toast: "Exported {fileName} to {format}"
7. Shows error toast on failure: "Export failed: {error message}"
8. Closes modal via `onOpenChange(false)`
9. `finally` block ensures `isExporting` is always reset

**Modal styling**: `bg-bg-elevated border-border rounded-xl shadow-2xl` with 480px width.

#### Import Flow (`src/components/editor/files-sidebar.tsx`)

**Click-to-browse**: The drop zone click handler now calls `importFile()` IPC action (opens native file dialog with `.json` and `.ace` filters). On success, adds the returned `ChecklistFile` to the store and shows a success toast.

**Drag-and-drop**: Uses HTML5 File API to get dropped files. Reads the `file.path` property (Electron-specific) to get the absolute path, then calls `readChecklistFile(path)` IPC action. On success, adds the file to the store and shows a success toast. Error cases show error toasts.

**Toast notifications**:

- Success: "Imported {fileName}" (green)
- Error: "Import failed: {error message}" (red)

#### ACE Parser Status (`src/ipc/parsers/ace-parser.ts`)

- ACE parser remains as a stub that throws "Garmin ACE format not yet implemented"
- Research confirmed ACE uses a binary format (not XML as originally assumed):
  - Magic bytes: `0x3C 0x22` ("<!DOCTYPE" in ASCII for some versions, or binary header in others)
  - CRLF-terminated lines
  - Type codes for different element types
  - CRC32 checksum
- Full binary parser implementation deferred to post-MVP
- The ACE option in the export modal shows "Coming soon"

#### Files created

| File                                     | Purpose                       |
| ---------------------------------------- | ----------------------------- |
| `src/components/editor/export-modal.tsx` | Export format selection modal |

#### Files modified

| File                                      | Changes                                             |
| ----------------------------------------- | --------------------------------------------------- |
| `src/components/editor/files-sidebar.tsx` | Wired import IPC for drop zone and click-to-browse  |
| `src/layouts/editor-layout.tsx`           | Mounted ExportModal component with state management |

### Design decisions

1. **JSON-only for MVP export**: Only JSON export is enabled since it's the only format with a full parser implementation. ACE (binary format), PDF (needs pdfkit), and other formats show "Coming soon" with disabled state. This keeps the MVP scope focused.

2. **Export modal as format picker, not preview**: The modal is a simple grid of format cards. There's no file preview, no export options, no configuration. Click a format → save dialog → export. This keeps the flow fast and reduces complexity.

3. **Drag-drop uses `readChecklistFile`**: When files are dropped, we use the Electron-specific `file.path` property to get the absolute path, then call `readChecklistFile` IPC handler. This is more reliable than trying to read file contents in the renderer (which would require base64 encoding for binary formats).

4. **Export error handling with `finally`**: Used try/catch/finally to ensure the `isExporting` state is always reset to `false`, preventing stuck disabled buttons if an error occurs during the export flow.

5. **No PDF export yet**: The MVP scope originally included PDF export, but the implementation was deferred to focus on core editing features first. The PDF option is present in the modal but disabled. PDF generation will be added post-MVP.

---

## Phase 14: Keyboard Shortcuts

**Status**: Complete
**Date completed**: 2026-02-08

### What was implemented

#### Keyboard Shortcuts Hook (`src/hooks/use-keyboard-shortcuts.ts`)

A global keydown listener hook that implements all keyboard shortcuts from the UI/UX spec. Structure:

**Module-level helper functions** (outside the hook, access store imperatively):

| Function                   | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `handleImport()`           | Calls `importFile()` IPC, adds result to store, shows toast |
| `handleDuplicateItem()`    | Finds active item, calls `duplicateItem` store action       |
| `handleAddItem()`          | Adds ChallengeResponse item after active item               |
| `handleAddChecklist()`     | Adds checklist to first group of active file                |
| `navigateItems(direction)` | Moves selection up/down in visible items array              |

**Keyboard shortcuts implemented** (14 shortcuts total):

| Shortcut                   | Action                    | Notes                                                     |
| -------------------------- | ------------------------- | --------------------------------------------------------- |
| Ctrl+K / Cmd+K             | Open command palette      | Cross-platform modifier detection                         |
| Ctrl+Z / Cmd+Z             | Undo                      | Shows "Undo" toast, disabled when no past states          |
| Ctrl+Shift+Z / Cmd+Shift+Z | Redo                      | Shows "Redo" toast, disabled when no future states        |
| Ctrl+S / Cmd+S             | Save                      | Prevents browser default, shows "Auto-save enabled" toast |
| Ctrl+O / Cmd+O             | Open/import file          | Calls `handleImport()`                                    |
| Ctrl+Shift+E / Cmd+Shift+E | Open export modal         | Sets `exportModalOpen` state (passed via callback)        |
| Ctrl+/ / Cmd+/             | Toggle properties panel   | Calls `togglePropertiesPanel()`                           |
| Ctrl+D / Cmd+D             | Duplicate item            | Calls `handleDuplicateItem()`                             |
| Ctrl+N / Cmd+N             | Add new item              | Calls `handleAddItem()`                                   |
| Ctrl+Shift+N / Cmd+Shift+N | Add new checklist         | Calls `handleAddChecklist()`                              |
| ↑ (Up arrow)               | Navigate up               | Calls `navigateItems("up")`                               |
| ↓ (Down arrow)             | Navigate down             | Calls `navigateItems("down")`                             |
| Escape                     | Cancel editing / deselect | Sets `editingItemId` to null or deselects item            |

**Input detection**: Checks `e.target.tagName === "INPUT"` or `"TEXTAREA"` to avoid intercepting shortcuts while typing. Modifier-key shortcuts (Ctrl+K, Ctrl+Z) still work in inputs; navigation shortcuts (↑/↓, Escape) don't.

**Platform detection**: Uses `e.metaKey || e.ctrlKey` for cross-platform support (Cmd on macOS, Ctrl on Windows/Linux).

#### Shortcuts Hint Overlay (`src/components/editor/shortcuts-hint.tsx`)

A fixed-position overlay at bottom-right, above the status bar. Features:

- **Auto-show on mount**: Appears automatically on first component mount
- **Auto-dismiss**: Fades out after 8 seconds (8000ms timeout)
- **Manual dismiss**: X icon button in top-right corner
- **Re-showable**: Status bar "Shortcuts" button calls `setShortcutsVisible(true)` to re-show

**Displayed shortcuts** (6 key hints):

- ↑↓ Navigate
- Enter Edit
- Del Remove
- ⌘K Search
- ⌘Z Undo
- ⌘/ Panels

**Styling**:

- `fixed bottom-8 right-8 z-50`
- `bg-bg-overlay/95 backdrop-blur-sm border-border rounded-lg shadow-xl`
- Each hint uses `<kbd>` elements with `bg-bg-elevated text-text-secondary border-border rounded px-1.5`
- Close button: `hover:bg-bg-hover`
- Entry animation: `animate-in fade-in slide-in-from-bottom-2 duration-300`
- Exit animation: `animate-out fade-out slide-out-to-bottom-2 duration-200`

#### Integration (`src/layouts/editor-layout.tsx`)

- Mounted `useKeyboardShortcuts` hook with callbacks:
  - `onOpenCommandPalette={() => setCommandPaletteOpen(true)}`
  - `onOpenExportModal={() => setExportModalOpen(true)}`
- Removed standalone `useEffect` for Ctrl+K (consolidated into `useKeyboardShortcuts`)
- Mounted `ShortcutsHint` component with `visible` prop bound to `shortcutsVisible` state
- Status bar `onShowShortcuts` callback wired to `setShortcutsVisible(true)`

#### Files created

| File                                       | Purpose                               |
| ------------------------------------------ | ------------------------------------- |
| `src/hooks/use-keyboard-shortcuts.ts`      | Global keyboard shortcut handler hook |
| `src/components/editor/shortcuts-hint.tsx` | Keyboard shortcuts hint overlay       |

#### Files modified

| File                            | Changes                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `src/layouts/editor-layout.tsx` | Mounted hook and hint overlay, removed standalone Ctrl+K handler |

### Design decisions

1. **Module-level helper functions**: Functions like `handleImport`, `navigateItems`, etc. are defined at module level (outside the hook) to avoid recreation on each render. They access store state imperatively via `useChecklistStore.getState()`, which is safe because they're only called in response to user events (keydown), not during render.

2. **Input focus detection**: The hook checks `target.tagName === "INPUT"` or `"TEXTAREA"` to avoid intercepting keyboard events when the user is typing in input fields. Modifier-key shortcuts (Ctrl+K, Ctrl+Z) still work in inputs because they use modifier keys that don't produce text input. Navigation shortcuts (↑/↓, Escape) are suppressed during input focus to allow normal text editing.

3. **Consolidated Ctrl+K handler**: The standalone `useEffect` for Ctrl+K in EditorLayout (added in Phase 12) was removed and consolidated into the `useKeyboardShortcuts` hook. This provides a single source of truth for all keyboard shortcuts and avoids duplicate event listeners.

4. **Undo/redo toast feedback**: Undo and redo operations show a brief toast ("Undo" / "Redo") to confirm the action. This is important because the visual change in the editor may be subtle (e.g., undoing an indent change or a single character edit). The toast provides clear feedback that the undo/redo system is working.

5. **Auto-dismiss shortcuts hint**: The hint overlay auto-hides after 8 seconds to avoid cluttering the UI after the user has seen it. Users can re-show it via the status bar "Shortcuts" button if they need a reminder. This balances discoverability (show on first use) with unobtrusiveness (don't stay on screen forever).

6. **Platform-aware modifier**: Uses `e.metaKey || e.ctrlKey` for cross-platform support. On macOS, `metaKey` is the Cmd key. On Windows/Linux, `ctrlKey` is the primary modifier. This ensures shortcuts work consistently across platforms. The hint overlay shows "⌘" symbols, which are understood on all platforms (even though Windows users press Ctrl).

---

## Phase 15: Persistence & Polish

> Completed as part of the final MVP implementation phase. Implements autosave, workspace persistence, window state persistence, before-close confirmation, custom scrollbar styling, toolbar tooltips, and empty states.

### New Files Created (6)

**`src/ipc/persistence/schemas.ts`** — Three Zod schemas for workspace, window state, and panel state validation.

**`src/ipc/persistence/handlers.ts`** — Six oRPC handlers:

- `saveWorkspace` / `loadWorkspace` — Persists all open files and active file ID to `workspace.json` in the app data directory
- `saveWindowState` / `loadWindowState` — Persists window position, size, and maximized state to `window-state.json`
- `savePanelState` / `loadPanelState` — Persists sidebar, tree panel, and properties panel visibility to `panel-state.json`

All handlers use `app.getPath("userData")` for storage, create directories if needed, and return `null` on load errors.

**`src/ipc/persistence/index.ts`** — Barrel export of all 6 persistence handlers.

**`src/actions/persistence.ts`** — Six renderer-side IPC wrapper functions matching the persistence handlers.

**`src/hooks/use-autosave.ts`** — Autosave hook that:

- Subscribes to Zustand checklist store changes
- Debounces saves by 2 seconds after the last change
- Serializes files to JSON and saves via IPC
- Marks all dirty files as clean after successful save
- Also subscribes to UI store to persist panel visibility state

**`src/hooks/use-load-workspace.ts`** — Workspace loading hook that:

- Runs once on app mount
- Loads saved panel state and applies visibility settings
- Loads saved workspace files and adds them to the checklist store
- Restores the previously active file
- Returns `isLoading` boolean for UI loading state

**`src/hooks/use-before-unload.ts`** — Before-unload hook that:

- Listens for `beforeunload` event
- Checks if any files have `dirty: true`
- Shows native browser/Electron confirmation dialog when closing with unsaved changes

### Modified Files (5)

**`src/main.ts`** — Added window state persistence:

- Consolidated `fs` imports (`existsSync`, `readFileSync`, `writeFileSync`)
- Added `WindowState` interface, `loadWindowState()`, and `saveWindowState()` helper functions
- Modified `createWindow()` to load saved window bounds and apply them (or use defaults)
- Added `minWidth: 800` and `minHeight: 600` per UI spec
- Restores maximized state if previously maximized
- Saves window state on `close` event

**`src/ipc/router.ts`** — Added `persistence` domain to the router.

**`src/layouts/editor-layout.tsx`** — Integrated three new hooks:

- `useAutosave()` — runs continuously in the background
- `useLoadWorkspace()` — loads saved workspace on mount, returns `isLoading`
- `useBeforeUnload()` — warns before closing with unsaved changes
- Added loading screen shown while workspace is being restored

**`src/components/editor/toolbar.tsx`** — Added tooltips to all toolbar buttons:

- Wrapped toolbar in `TooltipProvider` with 300ms delay
- Updated `ToolbarButton` to accept optional `tooltip` prop
- Added tooltips with keyboard shortcut hints to all 7 toolbar buttons

**`src/styles/global.css`** — Added custom scrollbar styling:

- 6px thin scrollbars with `--border` color
- Transparent track, rounded thumb
- Hover state with `--border-light` color
- Both Firefox (`scrollbar-width`) and WebKit (`::-webkit-scrollbar`) support

### Empty States (Pre-existing)

All empty states were already implemented in earlier phases:

- **No files open**: FilesSidebar shows "No files open" message
- **No file selected**: ChecklistEditor shows icon + "Create or import a checklist file to get started"
- **No checklist selected**: ChecklistEditor shows "Select a checklist from the tree panel"
- **Empty checklist**: ChecklistEditor shows "This checklist is empty. Add your first item."
- **No item selected**: PropertiesPanel shows "Select an item to view its properties"

### Implementation Details

1. **Autosave architecture**: Uses Zustand's `subscribe()` API (not React hooks) for store change detection, ensuring saves happen even when the editor layout is not mounted. The 2-second debounce prevents excessive writes during rapid editing.

2. **Window state persistence**: Implemented in main process using synchronous `readFileSync`/`writeFileSync` because window state must be read before the window is created (async would delay window appearance). The `close` event handler saves state synchronously before the window closes.

3. **Panel state persistence**: Saved asynchronously via oRPC IPC, separate from the workspace file. Changes are saved immediately (no debounce) since panel toggles are infrequent.

4. **Workspace serialization**: Files are serialized via `JSON.parse(JSON.stringify(files))` to strip any non-serializable values (like Sets or functions) before sending through IPC. On load, files are marked as `dirty: false` since they're being restored from disk.

5. **Persistence file locations** (all in Electron's `userData` directory):
   - `workspace.json` — Open files and active file ID
   - `window-state.json` — Window position, size, maximized state
   - `panel-state.json` — Sidebar, tree panel, properties panel visibility
   - `recent-files.json` — Recently opened file paths (pre-existing from Phase 3)

6. **Minimum window size**: Set to 800x600 per UI spec, enforced via Electron's `minWidth`/`minHeight` BrowserWindow options.

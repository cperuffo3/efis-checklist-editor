# Project Brief — EFIS Checklist Editor

## Overview

A desktop Electron application for creating, editing, importing, and exporting aircraft checklist files used by modern EFIS (Electronic Flight Instrument System) avionics. The editor supports multiple avionics file formats and provides a polished, keyboard-driven editing experience with a dark-themed IDE-style interface. Think of it as "VS Code for aircraft checklists."

## Problem Statement

Pilots who build or maintain experimental aircraft need to create and manage digital checklists for their EFIS avionics systems (Garmin G3X, Dynon SkyView, GRT, etc.). Each avionics manufacturer uses a different proprietary file format. Currently, pilots must either:

- Manually edit cryptic text/XML files with no visual feedback
- Use the existing web-based EFIS Editor (Angular app), which has limited UX and no native OS integration

This app solves the problem by providing a native desktop application with superior UX — drag-and-drop reordering, a three-panel IDE layout, inline editing, format conversion, and direct file system access for saving/loading checklist files.

## Target Users

- **Experimental aircraft builders and owners** who need to create and maintain EFIS checklists
- **Aviation enthusiasts** who want to share or convert checklists between different avionics formats
- **Flight schools** that manage standardized checklists across a fleet

## Input Data

### Importable File Formats

| Format                       | Extension       | Description                                   |
| ---------------------------- | --------------- | --------------------------------------------- |
| Garmin G3X / G3X Touch / GTN | `.ace`          | XML-based Garmin checklist format             |
| Garmin Pilot                 | `.gplt`         | Unencrypted Garmin Pilot format               |
| AFS / Dynon SkyView          | `.txt` / `.afd` | Plain-text format with formatting conventions |
| ForeFlight                   | `.fmd`          | Jeppesen ForeFlight Mobile format             |
| GRT (Grand Rapids)           | `.txt`          | Plain-text format, similar to AFS/Dynon       |
| JSON                         | `.json`         | The editor's own internal lossless format     |

### Exportable File Formats

All importable formats above, plus:

| Format | Extension | Description                                      |
| ------ | --------- | ------------------------------------------------ |
| PDF    | `.pdf`    | Printable paper backup with selectable page size |

### Internal Data Model

Checklists are stored internally in a normalized JSON structure:

- **ChecklistFile** — top-level container with metadata (aircraft registration, make/model, copyright)
- **ChecklistGroup** — named group of checklists (e.g., "Normal", "Emergency", "Abnormal"), with optional category
- **Checklist** — a named checklist (e.g., "Preflight Inspection") containing items
- **ChecklistItem** — individual item with:
  - **Type**: Challenge/Response, Challenge Only, Title/Section Header, Note/Plaintext, Warning, Caution
  - **Text fields**: challenge text, response text (for challenge/response type)
  - **Formatting**: indent level (0–3), centered flag, collapsible parent flag
  - **Children**: items can be nested under parent items (hierarchical structure)

## Core User Flow

1. **Open or create** — User launches the app and either opens an existing checklist file (via file picker, drag-and-drop, or import) or creates a new empty checklist file
2. **Navigate** — User sees three panels: a file sidebar (left), a checklist tree (center-left), and an editor (center) with an optional properties panel (right)
3. **Select a checklist** — User clicks a checklist in the tree panel to load its items in the editor
4. **Edit items** — User adds, edits, reorders (drag-and-drop), indents/outdents, and deletes checklist items. Items support multiple types (challenge/response, notes, warnings, titles, etc.)
5. **Organize** — User creates/renames/reorders checklist groups and checklists in the tree panel
6. **Configure metadata** — User edits file-level metadata (aircraft registration, make/model) in the properties panel
7. **Export** — User exports the checklist to one or more target formats via an export dialog, choosing a save location on disk
8. **Quick Export** — One-click export to the most recently used format/location

## Technical Considerations

### State Management

- **Zustand** store for all checklist data (files, groups, checklists, items)
- Undo/redo stack built into the store
- Currently-selected file, checklist, and item tracked in state
- Autosave to local app data directory (via Electron `app.getPath('userData')`)

### Data Persistence

- Checklist files saved as JSON in the app's user data directory
- Recent files list persisted
- Window state (size, position, panel widths) persisted
- Export preferences (last used format, last used directory) persisted

### IPC Handlers Needed

| Domain      | Handler              | Purpose                                                             |
| ----------- | -------------------- | ------------------------------------------------------------------- |
| `checklist` | `readChecklistFile`  | Read and parse a checklist file from disk                           |
| `checklist` | `writeChecklistFile` | Write internal JSON format to disk                                  |
| `checklist` | `importFile`         | Open file dialog, read file, detect format, parse to internal model |
| `checklist` | `exportFile`         | Convert internal model to target format and save to disk            |
| `checklist` | `getRecentFiles`     | Get list of recently opened files                                   |
| `dialog`    | `openFileDialog`     | Show native open file dialog                                        |
| `dialog`    | `saveFileDialog`     | Show native save file dialog                                        |
| `pdf`       | `exportPdf`          | Generate PDF from checklist data with page size options             |

### Format Parsers (Main Process)

Each format needs a parser (import) and serializer (export):

- **Garmin ACE** — XML parsing/generation
- **Garmin Pilot (GPLT)** — Binary/structured format parsing
- **AFS/Dynon** — Line-by-line text parsing with formatting conventions
- **ForeFlight (FMD)** — Structured format parsing
- **GRT** — Line-by-line text parsing (similar to AFS/Dynon, with token support)
- **JSON** — Direct serialization/deserialization of internal format
- **PDF** — Generation only (using a PDF library like `pdfkit` or `jspdf`)

### External Dependencies (New)

- `zustand` — Lightweight state management
- `@dnd-kit/core` + `@dnd-kit/sortable` — Drag and drop for reordering
- `pdfkit` or `jspdf` — PDF generation
- `fast-xml-parser` — XML parsing for Garmin ACE format
- `lucide-react` — Icon library (consistent with shadcn/ui)
- `cmdk` — Command palette (already have `command.tsx` from shadcn)

## MVP Scope

### Must-Have for v1.0

1. **Internal data model** — TypeScript types for ChecklistFile, ChecklistGroup, Checklist, ChecklistItem
2. **File management sidebar** — List open files, create new files, close files
3. **Checklist tree panel** — Display groups and checklists, select a checklist to edit
4. **Checklist editor** — View and edit items in the selected checklist
   - Add/remove/edit items
   - Item types: Challenge/Response, Challenge Only, Title, Note, Warning, Caution
   - Indent/outdent items (0–3 levels)
   - Drag-and-drop reordering
   - Collapsible parent items
5. **Properties panel** — Edit selected item properties and file metadata
6. **Import** — Garmin ACE (`.ace`) and JSON formats
7. **Export** — Garmin ACE (`.ace`), JSON, and PDF formats
8. **Toolbar** — Import, Export, Undo, Redo, Add Item, Add Checklist, Quick Export
9. **Command palette** — Search checklists and items (Ctrl+K)
10. **Keyboard shortcuts** — Navigation (arrow keys), editing (Enter, Delete, Tab/Shift+Tab for indent)
11. **Status bar** — Save status, item count, selection info
12. **Autosave** — Persist working state to app data directory
13. **Dark theme** — The reference dark theme as the default (light theme can come later)

### Explicitly Out of MVP Scope

- Cloud synchronization (Google Drive or otherwise)
- Light theme
- AFS/Dynon, ForeFlight, GRT, Garmin Pilot format parsers (post-MVP, one at a time)
- GRT live data token rendering
- Garmin Pilot completion actions
- PDF page size selection and advanced print options

## Future Enhancements

- **Additional format parsers**: AFS/Dynon, ForeFlight (FMD), GRT, Garmin Pilot (GPLT)
- **Cloud sync**: Optional Google Drive or Dropbox synchronization
- **Light theme**: Full light mode with theme toggle
- **GRT live data tokens**: Render fake live data in preview mode
- **Garmin Pilot actions**: Support for completion actions and dynamic data tokens
- **PDF customization**: Page size selection, group cover pages, spiral binding offset
- **Templates**: Pre-built checklist templates for common aircraft types
- **Multi-window**: Open multiple checklist files in separate windows
- **Diff view**: Compare two checklist versions side-by-side
- **Bulk operations**: Multi-select items for batch move/delete/indent
- **Search and replace**: Find/replace text across all items in a file
- **Configuration file editing**: Support EFIS configuration files beyond checklists

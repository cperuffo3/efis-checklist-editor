import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

enableMapSet();

import { ChecklistItemType } from "@/types/checklist";
import type {
  ChecklistFile,
  ChecklistFileMetadata,
  ChecklistGroup,
  ChecklistGroupCategory,
  Checklist,
  ChecklistItem,
} from "@/types/checklist";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let counter = 0;

function uid(): string {
  return `${Date.now()}-${++counter}`;
}

function createEmptyItem(
  type: ChecklistItemType,
  overrides?: Partial<ChecklistItem>,
): ChecklistItem {
  return {
    id: uid(),
    type,
    challengeText: "",
    responseText: "",
    indent: 0,
    centered: false,
    collapsible: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface ChecklistState {
  /** All open files keyed by ID */
  files: Record<string, ChecklistFile>;

  /** Currently active file */
  activeFileId: string | null;
  /** Currently selected checklist */
  activeChecklistId: string | null;
  /** Currently selected item */
  activeItemId: string | null;
  /** Item currently in inline-edit mode */
  editingItemId: string | null;
  /** Items whose children are collapsed */
  collapsedItemIds: Set<string>;
  /** All multi-selected item IDs */
  selectedItemIds: Set<string>;
  /** Anchor for shift-click range selection */
  anchorItemId: string | null;

  // -- File actions ---------------------------------------------------------
  addFile: (file: ChecklistFile) => void;
  removeFile: (id: string) => void;
  renameFile: (fileId: string, name: string) => void;
  setActiveFile: (id: string | null) => void;
  updateFileMetadata: (
    fileId: string,
    metadata: Partial<ChecklistFileMetadata>,
  ) => void;
  markFileDirty: (fileId: string) => void;
  markFileClean: (fileId: string) => void;

  // -- Group actions --------------------------------------------------------
  addGroup: (
    fileId: string,
    name: string,
    category: ChecklistGroupCategory,
  ) => void;
  removeGroup: (fileId: string, groupId: string) => void;
  renameGroup: (fileId: string, groupId: string, name: string) => void;
  updateGroupCategory: (
    fileId: string,
    groupId: string,
    category: ChecklistGroupCategory,
  ) => void;
  reorderGroups: (fileId: string, fromIndex: number, toIndex: number) => void;

  // -- Checklist actions ----------------------------------------------------
  addChecklist: (fileId: string, groupId: string, name: string) => void;
  removeChecklist: (
    fileId: string,
    groupId: string,
    checklistId: string,
  ) => void;
  renameChecklist: (
    fileId: string,
    groupId: string,
    checklistId: string,
    name: string,
  ) => void;
  duplicateChecklist: (
    fileId: string,
    groupId: string,
    checklistId: string,
  ) => void;
  moveChecklist: (
    fileId: string,
    fromGroupId: string,
    toGroupId: string,
    checklistId: string,
    toIndex?: number,
  ) => void;
  addChecklistsToGroup: (
    fileId: string,
    groupId: string,
    checklists: Checklist[],
  ) => void;
  copyChecklistToFile: (
    sourceFileId: string,
    sourceGroupId: string,
    checklistId: string,
    targetFileId: string,
    targetGroupId: string,
  ) => void;
  reorderChecklists: (
    fileId: string,
    groupId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;

  // -- Item actions ---------------------------------------------------------
  addItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    type: ChecklistItemType,
    afterIndex?: number,
  ) => void;
  removeItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    itemId: string,
  ) => void;
  updateItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    itemId: string,
    changes: Partial<Omit<ChecklistItem, "id">>,
  ) => void;
  reorderItems: (
    fileId: string,
    groupId: string,
    checklistId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  indentItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    itemId: string,
  ) => void;
  outdentItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    itemId: string,
  ) => void;
  duplicateItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    itemId: string,
  ) => void;

  // -- Uppercase actions ----------------------------------------------------
  uppercaseItem: (
    fileId: string,
    groupId: string,
    checklistId: string,
    itemId: string,
  ) => void;
  uppercaseChecklist: (
    fileId: string,
    groupId: string,
    checklistId: string,
  ) => void;
  uppercaseFile: (fileId: string) => void;

  // -- Multi-select item actions --------------------------------------------
  duplicateSelectedItems: (
    fileId: string,
    groupId: string,
    checklistId: string,
  ) => void;
  removeSelectedItems: (
    fileId: string,
    groupId: string,
    checklistId: string,
  ) => void;
  reorderSelectedItems: (
    fileId: string,
    groupId: string,
    checklistId: string,
    selectedIds: string[],
    toIndex: number,
  ) => void;

  // -- UI selection actions -------------------------------------------------
  setActiveChecklist: (id: string | null) => void;
  setActiveItem: (id: string | null) => void;
  setEditingItem: (id: string | null) => void;
  toggleCollapsed: (itemId: string) => void;
  selectRange: (toId: string, visibleIds: string[]) => void;
  clearSelection: () => void;
}

// ---------------------------------------------------------------------------
// Helpers to locate nested structures via immer draft
// ---------------------------------------------------------------------------

function findGroup(file: ChecklistFile, groupId: string) {
  return file.groups.find((g) => g.id === groupId);
}

function findChecklist(group: ChecklistGroup, checklistId: string) {
  return group.checklists.find((c) => c.id === checklistId);
}

/** Uppercase challengeText and responseText on challenge/response items only */
function uppercaseItemText(item: ChecklistItem) {
  if (
    item.type === ChecklistItemType.ChallengeResponse ||
    item.type === ChecklistItemType.ChallengeOnly
  ) {
    item.challengeText = item.challengeText.toUpperCase();
    item.responseText = item.responseText.toUpperCase();
  }
}

function markDirty(
  state: { files: Record<string, ChecklistFile> },
  fileId: string,
) {
  const file = state.files[fileId];
  if (file) {
    file.dirty = true;
    file.lastModified = Date.now();
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChecklistStore = create<ChecklistState>()(
  temporal(
    immer((set) => ({
      files: {},
      activeFileId: null,
      activeChecklistId: null,
      activeItemId: null,
      editingItemId: null,
      collapsedItemIds: new Set<string>(),
      selectedItemIds: new Set<string>(),
      anchorItemId: null,

      // -- File actions -----------------------------------------------------

      addFile: (file) =>
        set((state) => {
          state.files[file.id] = file;
          state.activeFileId = file.id;
        }),

      removeFile: (id) =>
        set((state) => {
          delete state.files[id];
          if (state.activeFileId === id) {
            const remaining = Object.keys(state.files);
            state.activeFileId = remaining.length > 0 ? remaining[0] : null;
            state.activeChecklistId = null;
            state.activeItemId = null;
            state.editingItemId = null;
            state.selectedItemIds = new Set();
            state.anchorItemId = null;
          }
        }),

      renameFile: (fileId, name) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          file.name = name;
          markDirty(state, fileId);
        }),

      setActiveFile: (id) =>
        set((state) => {
          state.activeFileId = id;
          state.activeChecklistId = null;
          state.activeItemId = null;
          state.editingItemId = null;
          state.selectedItemIds = new Set();
          state.anchorItemId = null;
        }),

      updateFileMetadata: (fileId, metadata) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          Object.assign(file.metadata, metadata);
          markDirty(state, fileId);
        }),

      markFileDirty: (fileId) =>
        set((state) => {
          markDirty(state, fileId);
        }),

      markFileClean: (fileId) =>
        set((state) => {
          const file = state.files[fileId];
          if (file) file.dirty = false;
        }),

      // -- Group actions ----------------------------------------------------

      addGroup: (fileId, name, category) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group: ChecklistGroup = {
            id: uid(),
            name,
            category,
            checklists: [],
          };
          file.groups.push(group);
          markDirty(state, fileId);
        }),

      removeGroup: (fileId, groupId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          file.groups = file.groups.filter((g) => g.id !== groupId);
          markDirty(state, fileId);
        }),

      renameGroup: (fileId, groupId, name) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (group) group.name = name;
          markDirty(state, fileId);
        }),

      updateGroupCategory: (fileId, groupId, category) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (group) group.category = category;
          markDirty(state, fileId);
        }),

      reorderGroups: (fileId, fromIndex, toIndex) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const [moved] = file.groups.splice(fromIndex, 1);
          file.groups.splice(toIndex, 0, moved);
          markDirty(state, fileId);
        }),

      // -- Checklist actions ------------------------------------------------

      addChecklist: (fileId, groupId, name) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist: Checklist = { id: uid(), name, items: [] };
          group.checklists.push(checklist);
          markDirty(state, fileId);
        }),

      removeChecklist: (fileId, groupId, checklistId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          group.checklists = group.checklists.filter(
            (c) => c.id !== checklistId,
          );
          if (state.activeChecklistId === checklistId) {
            state.activeChecklistId = null;
            state.activeItemId = null;
            state.editingItemId = null;
            state.selectedItemIds = new Set();
            state.anchorItemId = null;
          }
          markDirty(state, fileId);
        }),

      renameChecklist: (fileId, groupId, checklistId, name) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (checklist) checklist.name = name;
          markDirty(state, fileId);
        }),

      duplicateChecklist: (fileId, groupId, checklistId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const source = findChecklist(group, checklistId);
          if (!source) return;
          const clone: Checklist = {
            id: uid(),
            name: `${source.name} (Copy)`,
            items: source.items.map((item) => ({ ...item, id: uid() })),
          };
          const idx = group.checklists.findIndex((c) => c.id === checklistId);
          group.checklists.splice(idx + 1, 0, clone);
          markDirty(state, fileId);
        }),

      addChecklistsToGroup: (fileId, groupId, checklists) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          for (const cl of checklists) {
            group.checklists.push({
              id: uid(),
              name: cl.name,
              items: cl.items.map((item) => ({ ...item, id: uid() })),
            });
          }
          markDirty(state, fileId);
        }),

      moveChecklist: (fileId, fromGroupId, toGroupId, checklistId, toIndex) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const fromGroup = findGroup(file, fromGroupId);
          const toGroup = findGroup(file, toGroupId);
          if (!fromGroup || !toGroup) return;
          const idx = fromGroup.checklists.findIndex(
            (c) => c.id === checklistId,
          );
          if (idx === -1) return;
          const [moved] = fromGroup.checklists.splice(idx, 1);
          if (toIndex !== undefined) {
            toGroup.checklists.splice(toIndex, 0, moved);
          } else {
            toGroup.checklists.push(moved);
          }
          markDirty(state, fileId);
        }),

      copyChecklistToFile: (
        sourceFileId,
        sourceGroupId,
        checklistId,
        targetFileId,
        targetGroupId,
      ) =>
        set((state) => {
          const sourceFile = state.files[sourceFileId];
          const targetFile = state.files[targetFileId];
          if (!sourceFile || !targetFile) return;
          const sourceGroup = findGroup(sourceFile, sourceGroupId);
          if (!sourceGroup) return;
          const source = findChecklist(sourceGroup, checklistId);
          if (!source) return;
          const targetGroup = findGroup(targetFile, targetGroupId);
          if (!targetGroup) return;
          const clone: Checklist = {
            id: uid(),
            name: source.name,
            items: source.items.map((item) => ({ ...item, id: uid() })),
          };
          targetGroup.checklists.push(clone);
          markDirty(state, targetFileId);
        }),

      reorderChecklists: (fileId, groupId, fromIndex, toIndex) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const [moved] = group.checklists.splice(fromIndex, 1);
          group.checklists.splice(toIndex, 0, moved);
          markDirty(state, fileId);
        }),

      // -- Item actions -----------------------------------------------------

      addItem: (fileId, groupId, checklistId, type, afterIndex) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          // Inherit indent level from the preceding item
          const precedingItem =
            afterIndex !== undefined
              ? checklist.items[afterIndex]
              : checklist.items[checklist.items.length - 1];
          const indent = precedingItem ? precedingItem.indent : 0;
          const newItem = createEmptyItem(type, { indent });
          const insertAt =
            afterIndex !== undefined ? afterIndex + 1 : checklist.items.length;
          checklist.items.splice(insertAt, 0, newItem);
          state.activeItemId = newItem.id;
          state.editingItemId = newItem.id;
          state.selectedItemIds = new Set([newItem.id]);
          state.anchorItemId = newItem.id;
          markDirty(state, fileId);
        }),

      removeItem: (fileId, groupId, checklistId, itemId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          checklist.items = checklist.items.filter((i) => i.id !== itemId);
          if (state.activeItemId === itemId) {
            state.activeItemId = null;
            state.anchorItemId = null;
          }
          if (state.editingItemId === itemId) state.editingItemId = null;
          state.selectedItemIds.delete(itemId);
          state.collapsedItemIds.delete(itemId);
          markDirty(state, fileId);
        }),

      updateItem: (fileId, groupId, checklistId, itemId, changes) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          const item = checklist.items.find((i) => i.id === itemId);
          if (!item) return;
          Object.assign(item, changes);
          markDirty(state, fileId);
        }),

      reorderItems: (fileId, groupId, checklistId, fromIndex, toIndex) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          const [moved] = checklist.items.splice(fromIndex, 1);
          checklist.items.splice(toIndex, 0, moved);
          markDirty(state, fileId);
        }),

      indentItem: (fileId, groupId, checklistId, itemId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          const item = checklist.items.find((i) => i.id === itemId);
          if (!item || item.indent >= 3) return;
          item.indent = (item.indent + 1) as 0 | 1 | 2 | 3;
          markDirty(state, fileId);
        }),

      outdentItem: (fileId, groupId, checklistId, itemId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          const item = checklist.items.find((i) => i.id === itemId);
          if (!item || item.indent <= 0) return;
          item.indent = (item.indent - 1) as 0 | 1 | 2 | 3;
          markDirty(state, fileId);
        }),

      duplicateItem: (fileId, groupId, checklistId, itemId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          const idx = checklist.items.findIndex((i) => i.id === itemId);
          if (idx === -1) return;
          const source = checklist.items[idx];
          const clone: ChecklistItem = { ...source, id: uid() };
          checklist.items.splice(idx + 1, 0, clone);
          state.activeItemId = clone.id;
          state.selectedItemIds = new Set([clone.id]);
          state.anchorItemId = clone.id;
          markDirty(state, fileId);
        }),

      // -- Uppercase actions ------------------------------------------------

      uppercaseItem: (fileId, groupId, checklistId, itemId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          const item = checklist.items.find((i) => i.id === itemId);
          if (!item) return;
          uppercaseItemText(item);
          markDirty(state, fileId);
        }),

      uppercaseChecklist: (fileId, groupId, checklistId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;
          for (const item of checklist.items) {
            uppercaseItemText(item);
          }
          markDirty(state, fileId);
        }),

      uppercaseFile: (fileId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          for (const group of file.groups) {
            for (const checklist of group.checklists) {
              for (const item of checklist.items) {
                uppercaseItemText(item);
              }
            }
          }
          markDirty(state, fileId);
        }),

      // -- UI selection actions ---------------------------------------------

      setActiveChecklist: (id) =>
        set((state) => {
          state.activeChecklistId = id;
          state.activeItemId = null;
          state.editingItemId = null;
          state.selectedItemIds = new Set();
          state.anchorItemId = null;
        }),

      setActiveItem: (id) =>
        set((state) => {
          state.activeItemId = id;
          state.editingItemId = null;
          state.anchorItemId = id;
          state.selectedItemIds = new Set(id ? [id] : []);
        }),

      setEditingItem: (id) =>
        set((state) => {
          state.editingItemId = id;
        }),

      toggleCollapsed: (itemId) =>
        set((state) => {
          if (state.collapsedItemIds.has(itemId)) {
            state.collapsedItemIds.delete(itemId);
          } else {
            state.collapsedItemIds.add(itemId);
          }
        }),

      selectRange: (toId, visibleIds) =>
        set((state) => {
          const anchorId = state.anchorItemId;
          if (!anchorId) {
            // No anchor yet — treat like single select
            state.anchorItemId = toId;
            state.selectedItemIds = new Set([toId]);
            return;
          }

          const anchorIdx = visibleIds.indexOf(anchorId);
          const targetIdx = visibleIds.indexOf(toId);
          if (anchorIdx === -1 || targetIdx === -1) {
            state.selectedItemIds = new Set([toId]);
            state.anchorItemId = toId;
            return;
          }

          const start = Math.min(anchorIdx, targetIdx);
          const end = Math.max(anchorIdx, targetIdx);
          state.selectedItemIds = new Set(visibleIds.slice(start, end + 1));
          // anchorItemId stays the same — repeated Shift-clicks adjust from same anchor
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedItemIds = new Set();
          state.anchorItemId = null;
        }),

      // -- Multi-select item actions ------------------------------------------

      duplicateSelectedItems: (fileId, groupId, checklistId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;

          const selected = state.selectedItemIds;
          if (selected.size === 0) return;

          // Find selected items in order and the index of the last one
          const selectedIndices: number[] = [];
          for (let i = 0; i < checklist.items.length; i++) {
            if (selected.has(checklist.items[i].id)) {
              selectedIndices.push(i);
            }
          }
          if (selectedIndices.length === 0) return;

          const lastIdx = selectedIndices[selectedIndices.length - 1];

          // Clone selected items in order
          const clones: ChecklistItem[] = selectedIndices.map((idx) => ({
            ...checklist.items[idx],
            id: uid(),
          }));

          // Insert all clones after the last selected item
          checklist.items.splice(lastIdx + 1, 0, ...clones);

          // Select the clones
          const cloneIds = new Set(clones.map((c) => c.id));
          state.selectedItemIds = cloneIds;
          state.activeItemId = clones[0].id;
          state.anchorItemId = clones[0].id;
          markDirty(state, fileId);
        }),

      removeSelectedItems: (fileId, groupId, checklistId) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;

          const selected = state.selectedItemIds;
          if (selected.size === 0) return;

          checklist.items = checklist.items.filter((i) => !selected.has(i.id));

          for (const id of selected) {
            state.collapsedItemIds.delete(id);
          }
          state.selectedItemIds = new Set();
          state.anchorItemId = null;
          state.activeItemId = null;
          state.editingItemId = null;
          markDirty(state, fileId);
        }),

      reorderSelectedItems: (
        fileId,
        groupId,
        checklistId,
        selectedIds,
        toIndex,
      ) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return;
          const group = findGroup(file, groupId);
          if (!group) return;
          const checklist = findChecklist(group, checklistId);
          if (!checklist) return;

          const selectedSet = new Set(selectedIds);

          // Extract selected items in their original order
          const extracted: ChecklistItem[] = [];
          const remaining: ChecklistItem[] = [];
          for (const item of checklist.items) {
            if (selectedSet.has(item.id)) {
              extracted.push(item);
            } else {
              remaining.push(item);
            }
          }

          // Find insertion point in remaining array
          // toIndex refers to position in the original array of the drop target
          // We need to find where in `remaining` the drop target is
          const clampedIndex = Math.min(toIndex, remaining.length);

          remaining.splice(clampedIndex, 0, ...extracted);
          checklist.items = remaining;
          markDirty(state, fileId);
        }),
    })),
    {
      // Only track data fields in undo history, not UI selection state
      partialize: (state) => ({
        files: state.files,
      }),
    },
  ),
);

import { useEffect, useRef } from "react";
import { useChecklistStore } from "@/stores";
import { useUiStore } from "@/stores";
import { importFile } from "@/actions/checklist";
import { toast } from "sonner";
import { ChecklistItemType } from "@/types/checklist";

interface UseKeyboardShortcutsOptions {
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  onShowShortcuts: () => void;
}

// ---------------------------------------------------------------------------
// Helper functions (module-level to avoid recreating on each render)
// ---------------------------------------------------------------------------

function handleImport() {
  importFile()
    .then((file) => {
      if (file) {
        useChecklistStore.getState().addFile(file);
        toast.success("File imported", { description: `Opened ${file.name}` });
      }
    })
    .catch((err) => {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    });
}

function handleDuplicateItem() {
  const state = useChecklistStore.getState();
  if (!state.activeFileId || !state.activeChecklistId) return;

  const file = state.files[state.activeFileId];
  if (!file) return;

  // Batch duplicate if multi-selected
  if (state.selectedItemIds.size > 1) {
    for (const group of file.groups) {
      if (group.checklists.some((c) => c.id === state.activeChecklistId)) {
        state.duplicateSelectedItems(
          state.activeFileId,
          group.id,
          state.activeChecklistId!,
        );
        toast.success(`Duplicated ${state.selectedItemIds.size} items`);
        return;
      }
    }
    return;
  }

  // Single duplicate
  if (!state.activeItemId) return;

  for (const group of file.groups) {
    if (group.checklists.some((c) => c.id === state.activeChecklistId)) {
      state.duplicateItem(
        state.activeFileId,
        group.id,
        state.activeChecklistId!,
        state.activeItemId!,
      );
      toast.success("Item duplicated");
      return;
    }
  }
}

function handleAddItem() {
  const state = useChecklistStore.getState();
  if (!state.activeFileId || !state.activeChecklistId) {
    toast.warning("No checklist selected");
    return;
  }

  const file = state.files[state.activeFileId];
  if (!file) return;

  for (const group of file.groups) {
    if (group.checklists.some((c) => c.id === state.activeChecklistId)) {
      // Find the current active item index to insert after
      const checklist = group.checklists.find(
        (c) => c.id === state.activeChecklistId,
      );
      const afterIndex = state.activeItemId
        ? (checklist?.items.findIndex((i) => i.id === state.activeItemId) ?? -1)
        : -1;

      state.addItem(
        state.activeFileId,
        group.id,
        state.activeChecklistId!,
        ChecklistItemType.ChallengeResponse,
        afterIndex !== -1 ? afterIndex : undefined,
      );
      return;
    }
  }
}

function handleAddChecklist() {
  const state = useChecklistStore.getState();
  if (!state.activeFileId) {
    toast.warning("No file open");
    return;
  }

  const file = state.files[state.activeFileId];
  if (!file || file.groups.length === 0) return;

  state.addChecklist(state.activeFileId, file.groups[0].id, "New Checklist");
  toast.success("Checklist added");
}

function navigateItems(direction: number) {
  const state = useChecklistStore.getState();
  if (!state.activeFileId || !state.activeChecklistId) return;

  const file = state.files[state.activeFileId];
  if (!file) return;

  for (const group of file.groups) {
    const checklist = group.checklists.find(
      (c) => c.id === state.activeChecklistId,
    );
    if (!checklist) continue;

    const items = checklist.items;
    if (items.length === 0) return;

    // If no item selected, select first or last
    if (!state.activeItemId) {
      const idx = direction > 0 ? 0 : items.length - 1;
      state.setActiveItem(items[idx].id);
      return;
    }

    const currentIdx = items.findIndex((i) => i.id === state.activeItemId);
    if (currentIdx === -1) return;

    const nextIdx = currentIdx + direction;
    if (nextIdx >= 0 && nextIdx < items.length) {
      state.setActiveItem(items[nextIdx].id);
    }
    return;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onOpenExportModal,
  onShowShortcuts,
}: UseKeyboardShortcutsOptions) {
  // Store callbacks in refs so the keydown effect can stay stable (empty deps).
  // The keydown listener is registered once and never torn down, avoiding
  // the issue where re-renders with new callback references cause the
  // listener to be removed and not re-attached.
  const callbacksRef = useRef({
    onOpenCommandPalette,
    onOpenExportModal,
    onShowShortcuts,
  });

  // Sync ref in effect — React Compiler disallows ref writes during render.
  useEffect(() => {
    callbacksRef.current = {
      onOpenCommandPalette,
      onOpenExportModal,
      onShowShortcuts,
    };
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isModKey = e.metaKey || e.ctrlKey;

      // Don't intercept when typing in input/textarea elements
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Check editing state from store
      const state = useChecklistStore.getState();
      const isEditing = state.editingItemId !== null;

      // Ctrl+K - Command palette
      if (isModKey && e.key === "k") {
        e.preventDefault();
        callbacksRef.current.onOpenCommandPalette();
        return;
      }

      // Ctrl+Z - Undo
      if (isModKey && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        const { undo, pastStates } = useChecklistStore.temporal.getState();
        if (pastStates.length > 0) {
          undo();
          toast.success("Undo");
        }
        return;
      }

      // Ctrl+Shift+Z - Redo
      if (isModKey && e.shiftKey && e.key === "z") {
        e.preventDefault();
        const { redo, futureStates } = useChecklistStore.temporal.getState();
        if (futureStates.length > 0) {
          redo();
          toast.success("Redo");
        }
        return;
      }

      // Ctrl+S - Save (prevent browser default)
      if (isModKey && e.key === "s") {
        e.preventDefault();
        toast.info("Autosave is enabled");
        return;
      }

      // Ctrl+O - Open/import
      if (isModKey && e.key === "o") {
        e.preventDefault();
        handleImport();
        return;
      }

      // Ctrl+Shift+E - Quick export
      if (isModKey && e.shiftKey && e.key === "e") {
        e.preventDefault();
        callbacksRef.current.onOpenExportModal();
        return;
      }

      // Ctrl+/ - Toggle properties
      if (isModKey && e.key === "/") {
        e.preventDefault();
        useUiStore.getState().togglePropertiesPanel();
        return;
      }

      // Ctrl+D - Duplicate item (works even when an input is focused,
      // since Ctrl+D has no standard text-input behaviour to conflict with)
      if (isModKey && e.key === "d") {
        e.preventDefault();
        handleDuplicateItem();
        return;
      }

      // Ctrl+N - New item
      if (isModKey && !e.shiftKey && e.key === "n") {
        e.preventDefault();
        handleAddItem();
        return;
      }

      // Ctrl+Shift+N - New checklist
      if (isModKey && e.shiftKey && e.key === "n") {
        e.preventDefault();
        handleAddChecklist();
        return;
      }

      // The following shortcuts only work when not editing and not in an input
      if (isEditing || isInputFocused) return;

      // ArrowUp - Previous item
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateItems(-1);
        return;
      }

      // ArrowDown - Next item
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateItems(1);
        return;
      }

      // Escape - Deselect item / clear selection
      if (e.key === "Escape") {
        e.preventDefault();
        const currentState = useChecklistStore.getState();
        if (currentState.editingItemId) {
          currentState.setEditingItem(null);
        } else if (
          currentState.selectedItemIds.size > 1 ||
          currentState.activeItemId
        ) {
          currentState.setActiveItem(null);
        }
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // Empty deps — listener registered once. Callbacks accessed via ref.
  }, []);
}

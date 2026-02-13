import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { FileText, Copy, Trash2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useChecklistStore } from "@/stores";
import { ChecklistItemRow } from "@/components/editor/checklist-item-row";
import { GroupIcon } from "@/components/editor/group-icon";
import { TypeIndicator } from "@/components/editor/type-indicator";
import { ITEM_TYPE_LINE_COLOR } from "@/components/editor/indent-guides";
import type { LineSegment } from "@/components/editor/indent-guides";
import { cn } from "@/utils/tailwind";
import { ChecklistItemType } from "@/types/checklist";
import type {
  ChecklistFile,
  ChecklistGroup,
  Checklist,
  ChecklistItem,
} from "@/types/checklist";

// ---------------------------------------------------------------------------
// Helpers — resolve active data from the store
// ---------------------------------------------------------------------------

function findActiveGroup(
  file: ChecklistFile,
  checklistId: string,
): ChecklistGroup | undefined {
  return file.groups.find((g) =>
    g.checklists.some((c) => c.id === checklistId),
  );
}

function findActiveChecklist(
  group: ChecklistGroup,
  checklistId: string,
): Checklist | undefined {
  return group.checklists.find((c) => c.id === checklistId);
}

/**
 * Compute child count for an item in a flat list.
 *
 * For Title/Section items: "children" are all subsequent items until the next
 * Title at the same or lower indent level. This lets a Title at indent 0
 * own same-indent items below it (e.g. challenge/response items at indent 0).
 *
 * For other items: "children" are subsequent items with a strictly higher indent,
 * up to the next item with the same or lower indent.
 */
function getChildCount(items: ChecklistItem[], index: number): number {
  const item = items[index];
  const parentIndent = item.indent;
  let count = 0;

  if (item.type === ChecklistItemType.Title) {
    for (let i = index + 1; i < items.length; i++) {
      if (
        items[i].type === ChecklistItemType.Title &&
        items[i].indent <= parentIndent
      )
        break;
      count++;
    }
  } else {
    for (let i = index + 1; i < items.length; i++) {
      if (items[i].indent <= parentIndent) break;
      count++;
    }
  }

  return count;
}

/**
 * Compute the colored line segments for a visible item's indent guides.
 *
 * For each indent column (0 .. depth-1), determines:
 * - The color (inherited from the parent item at that indent level)
 * - Whether the vertical line continues below or stops (L-shape for last child)
 *
 * Uses the full items array for parent lookup and visible indices for continuation.
 */
function computeLineSegments(
  items: ChecklistItem[],
  visibleIndices: number[],
  visiblePosition: number,
): LineSegment[] {
  const itemIndex = visibleIndices[visiblePosition];
  const item = items[itemIndex];
  const segments: LineSegment[] = [];

  for (let col = 0; col < item.indent; col++) {
    // Find the parent at this indent level by scanning backward in full array
    let parentType = ChecklistItemType.Title; // fallback
    for (let j = itemIndex - 1; j >= 0; j--) {
      if (items[j].indent === col) {
        parentType = items[j].type;
        break;
      }
    }

    // Check if vertical line continues below this row:
    // Look at the next visible item — if its indent is still deeper than this column,
    // the line continues (there are more descendants in scope)
    let continues = false;
    if (visiblePosition + 1 < visibleIndices.length) {
      const nextItem = items[visibleIndices[visiblePosition + 1]];
      continues = nextItem.indent > col;
    }

    segments.push({
      continues,
      colorClass: ITEM_TYPE_LINE_COLOR[parentType],
    });
  }

  return segments;
}

/**
 * Build a list of visible items, skipping children of collapsed parents.
 * Returns indices into the original items array.
 *
 * Title/Section items use section-based collapse: all items until the next
 * Title at the same or lower indent are hidden. Other items use indent-based
 * collapse: only items with strictly higher indent are hidden.
 */
function getVisibleIndices(
  items: ChecklistItem[],
  collapsedIds: Set<string>,
): number[] {
  const visible: number[] = [];
  let skipUntilIndent: number | null = null;
  let skipIsTitle = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // If we're skipping collapsed children
    if (skipUntilIndent !== null) {
      if (skipIsTitle) {
        // Title-based collapse: stop at next Title with same or lower indent
        if (
          item.type === ChecklistItemType.Title &&
          item.indent <= skipUntilIndent
        ) {
          skipUntilIndent = null;
          skipIsTitle = false;
        } else {
          continue;
        }
      } else {
        // Indent-based collapse: stop at same or lower indent
        if (item.indent <= skipUntilIndent) {
          skipUntilIndent = null;
        } else {
          continue;
        }
      }
    }

    visible.push(i);

    // If this item is collapsed, skip its children
    if (collapsedIds.has(item.id)) {
      skipUntilIndent = item.indent;
      skipIsTitle = item.type === ChecklistItemType.Title;
    }
  }

  return visible;
}

// ---------------------------------------------------------------------------
// Editor Header
// ---------------------------------------------------------------------------

interface EditorHeaderProps {
  file: ChecklistFile;
  group: ChecklistGroup;
  checklist: Checklist;
  onDuplicate: () => void;
  onDelete: () => void;
}

function EditorHeader({
  file,
  group,
  checklist,
  onDuplicate,
  onDelete,
}: EditorHeaderProps) {
  return (
    <div className="border-border shrink-0 border-b px-6 pt-4 pb-3">
      {/* Top row: name + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="text-foreground min-w-0 truncate text-[18px] leading-tight font-semibold">
            {checklist.name}
          </h2>
          <GroupIcon category={group.category} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onDuplicate}
            className="border-border bg-bg-elevated text-muted-foreground hover:border-border-light hover:bg-bg-hover hover:text-foreground flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition-colors duration-150"
          >
            <Copy className="size-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="border-border bg-bg-elevated text-efis-red hover:border-efis-red/40 hover:bg-efis-red-dim flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition-colors duration-150"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <p className="text-text-muted mt-1 text-[11px]">
        {file.name}
        <span className="mx-1">{"\u203A"}</span>
        {group.name}
        <span className="mx-1">{"\u203A"}</span>
        {checklist.name}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty States
// ---------------------------------------------------------------------------

function NoFileSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center">
      <FileText className="text-text-muted size-10" />
      <p className="text-muted-foreground text-sm">
        Create or import a checklist file to get started
      </p>
    </div>
  );
}

function NoChecklistSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center">
      <FileText className="text-text-muted size-8" />
      <p className="text-muted-foreground text-sm">
        Select a checklist from the tree panel
      </p>
    </div>
  );
}

function EmptyChecklist() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-muted-foreground text-sm">
        This checklist is empty. Add your first item.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item Type Selector
// ---------------------------------------------------------------------------

const ITEM_TYPE_OPTIONS: {
  type: ChecklistItemType;
  label: string;
  description: string;
}[] = [
  {
    type: ChecklistItemType.ChallengeResponse,
    label: "Challenge / Response",
    description: "Item with challenge text and response",
  },
  {
    type: ChecklistItemType.ChallengeOnly,
    label: "Challenge Only",
    description: "Item with challenge text only",
  },
  {
    type: ChecklistItemType.Title,
    label: "Title / Section",
    description: "Section header for grouping items",
  },
  {
    type: ChecklistItemType.Note,
    label: "Note",
    description: "Plain text note or instruction",
  },
  {
    type: ChecklistItemType.Warning,
    label: "Warning",
    description: "Important warning message",
  },
  {
    type: ChecklistItemType.Caution,
    label: "Caution",
    description: "Caution advisory",
  },
];

interface ItemTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ChecklistItemType) => void;
}

function ItemTypeSelector({ open, onClose, onSelect }: ItemTypeSelectorProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="bg-bg-elevated border-border z-10 w-64 rounded-lg border p-1 shadow-lg"
    >
      {ITEM_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => {
            onSelect(opt.type);
            onClose();
          }}
          className="hover:bg-bg-hover text-foreground flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors duration-150"
        >
          <TypeIndicator type={opt.type} className="w-6" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium">{opt.label}</div>
            <div className="text-text-muted text-[10px]">{opt.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChecklistEditor
// ---------------------------------------------------------------------------

export function ChecklistEditor() {
  const files = useChecklistStore((s) => s.files);
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const activeChecklistId = useChecklistStore((s) => s.activeChecklistId);
  const editingItemId = useChecklistStore((s) => s.editingItemId);
  const collapsedItemIds = useChecklistStore((s) => s.collapsedItemIds);
  const selectedItemIds = useChecklistStore((s) => s.selectedItemIds);
  const setActiveItem = useChecklistStore((s) => s.setActiveItem);
  const setEditingItem = useChecklistStore((s) => s.setEditingItem);
  const toggleCollapsed = useChecklistStore((s) => s.toggleCollapsed);
  const selectRange = useChecklistStore((s) => s.selectRange);
  const duplicateChecklist = useChecklistStore((s) => s.duplicateChecklist);
  const removeChecklist = useChecklistStore((s) => s.removeChecklist);
  const addItem = useChecklistStore((s) => s.addItem);
  const removeItem = useChecklistStore((s) => s.removeItem);
  const updateItem = useChecklistStore((s) => s.updateItem);
  const reorderItems = useChecklistStore((s) => s.reorderItems);
  const reorderSelectedItems = useChecklistStore((s) => s.reorderSelectedItems);
  const indentItem = useChecklistStore((s) => s.indentItem);
  const outdentItem = useChecklistStore((s) => s.outdentItem);
  const duplicateItem = useChecklistStore((s) => s.duplicateItem);
  const duplicateSelectedItems = useChecklistStore(
    (s) => s.duplicateSelectedItems,
  );
  const removeSelectedItems = useChecklistStore((s) => s.removeSelectedItems);
  const uppercaseItem = useChecklistStore((s) => s.uppercaseItem);

  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [typeSelectorAfterIndex, setTypeSelectorAfterIndex] = useState<
    number | undefined
  >(undefined);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Derive active file, group, checklist
  const activeFile = activeFileId ? files[activeFileId] : null;

  const activeGroup = useMemo(() => {
    if (!activeFile || !activeChecklistId) return null;
    return findActiveGroup(activeFile, activeChecklistId) ?? null;
  }, [activeFile, activeChecklistId]);

  const activeGroupId = useMemo(() => {
    if (!activeFile || !activeChecklistId) return null;
    const group = findActiveGroup(activeFile, activeChecklistId);
    return group?.id ?? null;
  }, [activeFile, activeChecklistId]);

  const activeChecklist = useMemo(() => {
    if (!activeGroup || !activeChecklistId) return null;
    return findActiveChecklist(activeGroup, activeChecklistId) ?? null;
  }, [activeGroup, activeChecklistId]);

  // Compute visible items (collapse logic)
  const visibleIndices = useMemo(() => {
    if (!activeChecklist) return [];
    return getVisibleIndices(activeChecklist.items, collapsedItemIds);
  }, [activeChecklist, collapsedItemIds]);

  // Visible item IDs (for shift-click range selection)
  const visibleIds = useMemo(() => {
    if (!activeChecklist) return [];
    return visibleIndices.map((idx) => activeChecklist.items[idx].id);
  }, [activeChecklist, visibleIndices]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Selection handler — normal click vs shift-click
  const handleSelect = useCallback(
    (itemId: string, shiftKey: boolean) => {
      if (shiftKey) {
        selectRange(itemId, visibleIds);
        // Set activeItemId for properties panel / keyboard focus, but keep anchor
        useChecklistStore.setState({
          activeItemId: itemId,
          editingItemId: null,
        });
      } else {
        setActiveItem(itemId);
      }
    },
    [selectRange, setActiveItem, visibleIds],
  );

  // Drag start handler — track which item is being dragged
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragId = event.active.id as string;
      setActiveDragId(dragId);

      // If the dragged item isn't in the selection, reset selection to just it
      if (!selectedItemIds.has(dragId)) {
        setActiveItem(dragId);
      }
    },
    [selectedItemIds, setActiveItem],
  );

  // Drag end handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      if (
        !activeFileId ||
        !activeGroupId ||
        !activeChecklistId ||
        !activeChecklist
      )
        return;

      const items = activeChecklist.items;
      const isMultiDrag =
        selectedItemIds.has(active.id as string) && selectedItemIds.size > 1;

      if (isMultiDrag) {
        // Multi-drag: find the drop target index in the full items array
        const overIndex = items.findIndex((item) => item.id === over.id);
        if (overIndex === -1) return;

        reorderSelectedItems(
          activeFileId,
          activeGroupId,
          activeChecklistId,
          Array.from(selectedItemIds),
          overIndex,
        );
      } else {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        reorderItems(
          activeFileId,
          activeGroupId,
          activeChecklistId,
          oldIndex,
          newIndex,
        );
      }
    },
    [
      activeFileId,
      activeGroupId,
      activeChecklistId,
      activeChecklist,
      selectedItemIds,
      reorderItems,
      reorderSelectedItems,
    ],
  );

  // Handlers
  const handleDuplicate = useCallback(() => {
    if (!activeFileId || !activeGroup || !activeChecklistId) return;
    duplicateChecklist(activeFileId, activeGroup.id, activeChecklistId);
  }, [activeFileId, activeGroup, activeChecklistId, duplicateChecklist]);

  const handleDeleteChecklist = useCallback(() => {
    if (!activeFileId || !activeGroup || !activeChecklistId || !activeChecklist)
      return;
    toast.warning(`Delete "${activeChecklist.name}"?`, {
      description: "This cannot be undone.",
      action: {
        label: "Delete",
        onClick: () =>
          removeChecklist(activeFileId, activeGroup.id, activeChecklistId),
      },
    });
  }, [
    activeFileId,
    activeGroup,
    activeChecklistId,
    activeChecklist,
    removeChecklist,
  ]);

  const handleAddItem = useCallback(
    (type: ChecklistItemType, afterIndex?: number) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;
      addItem(
        activeFileId,
        activeGroup.id,
        activeChecklistId,
        type,
        afterIndex,
      );
    },
    [activeFileId, activeGroup, activeChecklistId, addItem],
  );

  const handleOpenTypeSelector = useCallback((afterIndex?: number) => {
    setTypeSelectorAfterIndex(afterIndex);
    setTypeSelectorOpen(true);
  }, []);

  const handleCommitEdit = useCallback(
    (
      itemId: string,
      changes: { challengeText: string; responseText: string },
    ) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;
      updateItem(
        activeFileId,
        activeGroup.id,
        activeChecklistId,
        itemId,
        changes,
      );
      setEditingItem(null);
    },
    [activeFileId, activeGroup, activeChecklistId, updateItem, setEditingItem],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;

      // Batch delete if this item is part of a multi-selection
      if (selectedItemIds.has(itemId) && selectedItemIds.size > 1) {
        removeSelectedItems(activeFileId, activeGroup.id, activeChecklistId);
      } else {
        removeItem(activeFileId, activeGroup.id, activeChecklistId, itemId);
      }
    },
    [
      activeFileId,
      activeGroup,
      activeChecklistId,
      selectedItemIds,
      removeItem,
      removeSelectedItems,
    ],
  );

  const handleDuplicateItem = useCallback(
    (itemId: string) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;

      // Batch duplicate if this item is part of a multi-selection
      if (selectedItemIds.has(itemId) && selectedItemIds.size > 1) {
        duplicateSelectedItems(activeFileId, activeGroup.id, activeChecklistId);
      } else {
        duplicateItem(activeFileId, activeGroup.id, activeChecklistId, itemId);
      }
    },
    [
      activeFileId,
      activeGroup,
      activeChecklistId,
      selectedItemIds,
      duplicateItem,
      duplicateSelectedItems,
    ],
  );

  const handleIndent = useCallback(
    (itemId: string) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;
      indentItem(activeFileId, activeGroup.id, activeChecklistId, itemId);
    },
    [activeFileId, activeGroup, activeChecklistId, indentItem],
  );

  const handleOutdent = useCallback(
    (itemId: string) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;
      outdentItem(activeFileId, activeGroup.id, activeChecklistId, itemId);
    },
    [activeFileId, activeGroup, activeChecklistId, outdentItem],
  );

  const handleUppercaseItem = useCallback(
    (itemId: string) => {
      if (!activeFileId || !activeGroup || !activeChecklistId) return;
      uppercaseItem(activeFileId, activeGroup.id, activeChecklistId, itemId);
    },
    [activeFileId, activeGroup, activeChecklistId, uppercaseItem],
  );

  const handleAddChild = useCallback(
    (afterIndex: number) => {
      // Add a child item after the parent, defaulting to ChallengeResponse
      handleAddItem(ChecklistItemType.ChallengeResponse, afterIndex);
    },
    [handleAddItem],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // No file selected
  if (!activeFile) {
    return (
      <div className="bg-bg-base flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <NoFileSelected />
        </ScrollArea>
      </div>
    );
  }

  // File selected but no checklist selected
  if (!activeGroup || !activeChecklist) {
    return (
      <div className="bg-bg-base flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <NoChecklistSelected />
        </ScrollArea>
      </div>
    );
  }

  const items = activeChecklist.items;

  return (
    <div className="bg-bg-base flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Editor header */}
      <EditorHeader
        file={activeFile}
        group={activeGroup}
        checklist={activeChecklist}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteChecklist}
      />

      {/* Item list */}
      <ScrollArea className="min-h-0 flex-1">
        {items.length === 0 ? (
          <EmptyChecklist />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleIndices.map((idx) => items[idx].id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="py-2">
                {visibleIndices.map((itemIndex, visiblePos) => {
                  const item = items[itemIndex];
                  return (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      index={itemIndex}
                      isSelected={selectedItemIds.has(item.id)}
                      isEditing={item.id === editingItemId}
                      isCollapsed={collapsedItemIds.has(item.id)}
                      lineSegments={computeLineSegments(
                        items,
                        visibleIndices,
                        visiblePos,
                      )}
                      childCount={getChildCount(items, itemIndex)}
                      canIndent={item.indent < 3}
                      canOutdent={item.indent > 0}
                      selectedCount={
                        selectedItemIds.has(item.id) ? selectedItemIds.size : 1
                      }
                      onSelect={(shiftKey) => handleSelect(item.id, shiftKey)}
                      onStartEdit={() => {
                        setActiveItem(item.id);
                        setEditingItem(item.id);
                      }}
                      onCommitEdit={(changes) =>
                        handleCommitEdit(item.id, changes)
                      }
                      onCancelEdit={() => setEditingItem(null)}
                      onToggleCollapse={() => toggleCollapsed(item.id)}
                      onIndent={() => handleIndent(item.id)}
                      onOutdent={() => handleOutdent(item.id)}
                      onDuplicate={() => handleDuplicateItem(item.id)}
                      onDelete={() => handleDeleteItem(item.id)}
                      onAddChild={() => handleAddChild(itemIndex)}
                      onAddItemBelow={() =>
                        handleAddItem(
                          ChecklistItemType.ChallengeResponse,
                          itemIndex,
                        )
                      }
                      onUppercase={() => handleUppercaseItem(item.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>

            {/* Multi-drag overlay */}
            <DragOverlay>
              {activeDragId && selectedItemIds.size > 1 ? (
                <div className="bg-efis-accent-dim border-efis-accent flex items-center gap-2 rounded border px-3 py-2 shadow-lg">
                  <GripVertical className="text-efis-accent size-3.5" />
                  <span className="text-efis-accent text-xs font-medium">
                    Moving {selectedItemIds.size} items
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add item row */}
        <div className="relative mx-4 py-1">
          <button
            type="button"
            onClick={() => handleOpenTypeSelector(undefined)}
            className={cn(
              "border-border text-text-muted flex w-full items-center justify-center gap-1.5 rounded border border-dashed py-1.5 text-xs transition-colors duration-150",
              "hover:border-efis-accent hover:text-efis-accent hover:bg-efis-accent-dim",
            )}
          >
            <Plus className="size-3.5" />
            Add section or item
          </button>

          {typeSelectorOpen && (
            <div className="absolute bottom-full left-3 z-20 mb-1">
              <ItemTypeSelector
                open={typeSelectorOpen}
                onClose={() => setTypeSelectorOpen(false)}
                onSelect={(type) => handleAddItem(type, typeSelectorAfterIndex)}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

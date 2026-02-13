import { useCallback, useState } from "react";
import {
  ALargeSmall,
  ChevronDown,
  ChevronRight,
  Copy,
  CopyPlus,
  FileDown,
  FolderInput,
  FolderPlus,
  GripVertical,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChecklistStore } from "@/stores";
import { FormatBadge } from "@/components/editor/format-badge";
import { FileMetadataDialog } from "@/components/editor/file-metadata-dialog";
import { GroupIcon } from "@/components/editor/group-icon";
import { importChecklistsFromFile } from "@/actions/checklist";
import { cn } from "@/utils/tailwind";
import { ChecklistGroupCategory } from "@/types/checklist";
import type {
  Checklist,
  ChecklistFile,
  ChecklistGroup,
} from "@/types/checklist";

// ---------------------------------------------------------------------------
// Inline rename input
// ---------------------------------------------------------------------------

interface InlineRenameProps {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

function InlineRename({ initialValue, onCommit, onCancel }: InlineRenameProps) {
  const [value, setValue] = useState(initialValue);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialValue) {
      onCommit(trimmed);
    } else {
      onCancel();
    }
  }, [value, initialValue, onCommit, onCancel]);

  return (
    <input
      autoFocus
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
      className="bg-bg-elevated border-efis-accent text-foreground min-w-0 flex-1 rounded border px-1 py-0.5 text-xs outline-none"
    />
  );
}

// ---------------------------------------------------------------------------
// ChecklistTreeItem — a single checklist row inside a group
// ---------------------------------------------------------------------------

interface ChecklistTreeItemProps {
  file: ChecklistFile;
  group: ChecklistGroup;
  checklist: Checklist;
  isActive: boolean;
  onSelect: () => void;
  isRenaming: boolean;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onCancelRename: () => void;
}

function ChecklistTreeItem({
  file,
  group,
  checklist,
  isActive,
  onSelect,
  isRenaming,
  onStartRename,
  onCommitRename,
  onCancelRename,
}: ChecklistTreeItemProps) {
  const files = useChecklistStore((s) => s.files);
  const removeChecklist = useChecklistStore((s) => s.removeChecklist);
  const duplicateChecklist = useChecklistStore((s) => s.duplicateChecklist);
  const moveChecklist = useChecklistStore((s) => s.moveChecklist);
  const copyChecklistToFile = useChecklistStore((s) => s.copyChecklistToFile);
  const uppercaseChecklist = useChecklistStore((s) => s.uppercaseChecklist);

  const otherGroups = file.groups.filter((g) => g.id !== group.id);
  const otherFiles = Object.values(files).filter((f) => f.id !== file.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: checklist.id });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          ref={setNodeRef}
          type="button"
          onClick={onSelect}
          onDoubleClick={onStartRename}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
          className={cn(
            "group flex w-full items-center gap-2 py-1 pr-3 pl-2 text-left text-xs transition-colors duration-150",
            isActive
              ? "bg-efis-accent-dim text-efis-accent"
              : "text-muted-foreground hover:bg-bg-hover hover:text-foreground",
            isDragging && "z-10 opacity-50 shadow-lg",
          )}
        >
          <div
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="flex w-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
          >
            <GripVertical className="text-text-muted size-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
          </div>

          <GroupIcon category={group.category} />

          {isRenaming ? (
            <InlineRename
              initialValue={checklist.name}
              onCommit={onCommitRename}
              onCancel={onCancelRename}
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{checklist.name}</span>
          )}

          <span
            className={cn(
              "shrink-0 tabular-nums",
              isActive ? "text-efis-accent/70" : "text-text-muted",
            )}
          >
            {checklist.items.length}
          </span>
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onStartRename}>
          <Pencil className="size-3.5" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => duplicateChecklist(file.id, group.id, checklist.id)}
        >
          <Copy className="size-3.5" />
          Duplicate
        </ContextMenuItem>
        {otherGroups.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderInput className="size-3.5" />
              Move to group
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {otherGroups.map((g) => (
                <ContextMenuItem
                  key={g.id}
                  onClick={() =>
                    moveChecklist(file.id, group.id, g.id, checklist.id)
                  }
                >
                  <GroupIcon category={g.category} className="size-3.5" />
                  {g.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        {otherFiles.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <CopyPlus className="size-3.5" />
              Copy to
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {otherFiles.map((targetFile) =>
                targetFile.groups.length === 1 ? (
                  <ContextMenuItem
                    key={targetFile.id}
                    onClick={() => {
                      copyChecklistToFile(
                        file.id,
                        group.id,
                        checklist.id,
                        targetFile.id,
                        targetFile.groups[0].id,
                      );
                      toast.success(`Copied "${checklist.name}"`, {
                        description: `Added to ${targetFile.name} › ${targetFile.groups[0].name}`,
                      });
                    }}
                  >
                    {targetFile.name}
                  </ContextMenuItem>
                ) : (
                  <ContextMenuSub key={targetFile.id}>
                    <ContextMenuSubTrigger>
                      {targetFile.name}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      {targetFile.groups.map((g) => (
                        <ContextMenuItem
                          key={g.id}
                          onClick={() => {
                            copyChecklistToFile(
                              file.id,
                              group.id,
                              checklist.id,
                              targetFile.id,
                              g.id,
                            );
                            toast.success(`Copied "${checklist.name}"`, {
                              description: `Added to ${targetFile.name} › ${g.name}`,
                            });
                          }}
                        >
                          <GroupIcon
                            category={g.category}
                            className="size-3.5"
                          />
                          {g.name}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                ),
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => uppercaseChecklist(file.id, group.id, checklist.id)}
        >
          <ALargeSmall className="size-3.5" />
          Uppercase All
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            toast.warning(`Delete "${checklist.name}"?`, {
              description: "This cannot be undone.",
              action: {
                label: "Delete",
                onClick: () => removeChecklist(file.id, group.id, checklist.id),
              },
            });
          }}
        >
          <Trash2 className="size-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ---------------------------------------------------------------------------
// GroupSection — collapsible group header with its checklists
// ---------------------------------------------------------------------------

interface GroupSectionProps {
  file: ChecklistFile;
  group: ChecklistGroup;
  activeChecklistId: string | null;
  onSelectChecklist: (checklistId: string) => void;
  renamingId: string | null;
  onStartRename: (id: string) => void;
  onCommitRename: (id: string, name: string) => void;
  onCancelRename: () => void;
}

function GroupSection({
  file,
  group,
  activeChecklistId,
  onSelectChecklist,
  renamingId,
  onStartRename,
  onCommitRename,
  onCancelRename,
}: GroupSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const addChecklist = useChecklistStore((s) => s.addChecklist);
  const addChecklistsToGroup = useChecklistStore((s) => s.addChecklistsToGroup);
  const removeGroup = useChecklistStore((s) => s.removeGroup);
  const renameGroup = useChecklistStore((s) => s.renameGroup);
  const setActiveChecklist = useChecklistStore((s) => s.setActiveChecklist);

  const [isRenamingGroup, setIsRenamingGroup] = useState(false);

  // Droppable zone so empty groups can accept checklists
  const { setNodeRef: setDroppableRef, isOver: isGroupOver } = useDroppable({
    id: `group-drop-${group.id}`,
    data: { type: "group", groupId: group.id },
  });

  const handleRenameGroup = useCallback(() => {
    setIsRenamingGroup(true);
  }, []);

  const handleCommitGroupRename = useCallback(
    (name: string) => {
      renameGroup(file.id, group.id, name);
      setIsRenamingGroup(false);
    },
    [file.id, group.id, renameGroup],
  );

  const handleCancelGroupRename = useCallback(() => {
    setIsRenamingGroup(false);
  }, []);

  const handleAddChecklist = useCallback(() => {
    addChecklist(file.id, group.id, "New Checklist");
  }, [file.id, group.id, addChecklist]);

  const handleImportChecklists = useCallback(async () => {
    try {
      const checklists = await importChecklistsFromFile();
      if (!checklists || checklists.length === 0) return;

      addChecklistsToGroup(file.id, group.id, checklists as Checklist[]);

      const names = checklists.map((c: { name: string }) => c.name).join(", ");
      toast.success(
        `Imported ${checklists.length} checklist${checklists.length > 1 ? "s" : ""}`,
        { description: names },
      );

      // Auto-select the first imported checklist.
      // The store assigned fresh IDs so we need to find the newly added ones.
      // They were appended to the end of the group, so pick the last N.
      const updatedGroup = useChecklistStore
        .getState()
        .files[file.id]?.groups.find((g) => g.id === group.id);
      if (updatedGroup && updatedGroup.checklists.length > 0) {
        const firstImported =
          updatedGroup.checklists[
            updatedGroup.checklists.length - checklists.length
          ];
        if (firstImported) {
          setActiveChecklist(firstImported.id);
        }
      }
    } catch (err) {
      toast.error("Failed to import checklists", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }, [file.id, group.id, addChecklistsToGroup, setActiveChecklist]);

  const handleDeleteGroup = useCallback(() => {
    const totalItems = group.checklists.reduce(
      (sum, cl) => sum + cl.items.length,
      0,
    );
    const description =
      totalItems > 0
        ? `${group.checklists.length} checklist(s) and ${totalItems} item(s) will be lost. This cannot be undone.`
        : "This cannot be undone.";
    toast.warning(`Delete group "${group.name}"?`, {
      description,
      action: {
        label: "Delete",
        onClick: () => removeGroup(file.id, group.id),
      },
    });
  }, [file.id, group, removeGroup]);

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  const {
    attributes: groupAttributes,
    listeners: groupListeners,
    setNodeRef: setGroupNodeRef,
    setActivatorNodeRef: setGroupActivatorNodeRef,
    transform: groupTransform,
    transition: groupTransition,
    isDragging: isGroupDragging,
  } = useSortable({ id: group.id });

  return (
    <div
      ref={setGroupNodeRef}
      style={{
        transform: CSS.Transform.toString(groupTransform),
        transition: groupTransition,
      }}
      className={cn(isGroupDragging && "z-10 opacity-50 shadow-lg")}
    >
      {/* Group header */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="group flex w-full items-center gap-1.5 px-1 py-1.5 text-left transition-colors duration-150"
          >
            <div
              ref={setGroupActivatorNodeRef}
              {...groupAttributes}
              {...groupListeners}
              className="flex w-4 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
            >
              <GripVertical className="text-text-muted size-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            </div>

            <ChevronIcon className="text-text-muted size-3.5 shrink-0 transition-transform duration-150" />

            {isRenamingGroup ? (
              <InlineRename
                initialValue={group.name}
                onCommit={handleCommitGroupRename}
                onCancel={handleCancelGroupRename}
              />
            ) : (
              <span className="text-muted-foreground group-hover:text-foreground min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wide uppercase">
                {group.name}
              </span>
            )}

            <span className="bg-bg-overlay text-text-muted shrink-0 rounded-full px-1.5 text-[10px] leading-relaxed tabular-nums">
              {group.checklists.length}
            </span>
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={handleRenameGroup}>
            <Pencil className="size-3.5" />
            Rename group
          </ContextMenuItem>
          <ContextMenuItem onClick={handleAddChecklist}>
            <Plus className="size-3.5" />
            Add checklist
          </ContextMenuItem>
          <ContextMenuItem onClick={handleImportChecklists}>
            <FileDown className="size-3.5" />
            Import checklist
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onClick={handleDeleteGroup}>
            <Trash2 className="size-3.5" />
            Delete group
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Checklists within group */}
      {expanded && (
        <div
          ref={setDroppableRef}
          className={cn(
            "min-h-6 transition-colors duration-150",
            isGroupOver && "bg-efis-accent-dim/50",
          )}
        >
          <SortableContext
            items={group.checklists.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {group.checklists.map((checklist) => (
              <ChecklistTreeItem
                key={checklist.id}
                file={file}
                group={group}
                checklist={checklist}
                isActive={checklist.id === activeChecklistId}
                onSelect={() => onSelectChecklist(checklist.id)}
                isRenaming={renamingId === checklist.id}
                onStartRename={() => onStartRename(checklist.id)}
                onCommitRename={(name) => onCommitRename(checklist.id, name)}
                onCancelRename={onCancelRename}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddGroupMenu — category picker for adding a new group
// ---------------------------------------------------------------------------

const GROUP_CATEGORY_OPTIONS: {
  category: ChecklistGroupCategory;
  label: string;
}[] = [
  { category: ChecklistGroupCategory.Normal, label: "Normal" },
  { category: ChecklistGroupCategory.Emergency, label: "Emergency" },
  { category: ChecklistGroupCategory.Abnormal, label: "Abnormal" },
];

interface AddGroupMenuProps {
  onAdd: (name: string, category: ChecklistGroupCategory) => void;
}

function AddGroupMenu({ onAdd }: AddGroupMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative px-2 py-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "border-border text-text-muted flex w-full items-center justify-center gap-1.5 rounded border border-dashed py-1.5 text-xs transition-colors duration-150",
          "hover:border-efis-accent hover:text-efis-accent hover:bg-efis-accent-dim",
        )}
      >
        <FolderPlus className="size-3.5" />
        Add group
      </button>

      {open && (
        <div className="bg-bg-elevated border-border absolute right-2 bottom-full left-2 z-10 mb-1 rounded-lg border p-1 shadow-lg">
          {GROUP_CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.category}
              type="button"
              onClick={() => {
                onAdd(opt.label, opt.category);
                setOpen(false);
              }}
              className="hover:bg-bg-hover text-foreground flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-150"
            >
              <GroupIcon category={opt.category} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChecklistTree — main export
// ---------------------------------------------------------------------------

/**
 * Custom collision detection: prefer checklist sortable items first (pointerWithin),
 * then fall back to droppable group zones (rectIntersection) for empty groups.
 */
const checklistCollisionDetection: CollisionDetection = (args) => {
  // First try pointerWithin — this finds the sortable item the pointer is over
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    // Filter to only checklist items and group drop zones (not group sortable IDs)
    const relevant = pointerCollisions.filter((c) => {
      const id = String(c.id);
      return id.startsWith("group-drop-") || !id.startsWith("group-");
    });
    if (relevant.length > 0) return relevant;
  }

  // Fall back to rectIntersection for group drop zones
  const rectCollisions = rectIntersection(args);
  return rectCollisions.filter((c) => String(c.id).startsWith("group-drop-"));
};

export function ChecklistTree() {
  const files = useChecklistStore((s) => s.files);
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const activeChecklistId = useChecklistStore((s) => s.activeChecklistId);
  const setActiveChecklist = useChecklistStore((s) => s.setActiveChecklist);
  const renameChecklist = useChecklistStore((s) => s.renameChecklist);
  const renameFile = useChecklistStore((s) => s.renameFile);
  const reorderGroups = useChecklistStore((s) => s.reorderGroups);
  const reorderChecklists = useChecklistStore((s) => s.reorderChecklists);
  const moveChecklist = useChecklistStore((s) => s.moveChecklist);
  const addGroup = useChecklistStore((s) => s.addGroup);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [isRenamingFile, setIsRenamingFile] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  const activeFile = activeFileId ? files[activeFileId] : null;

  // Drag and drop sensors shared by both contexts
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // -- Group drag handler ---------------------------------------------------

  const handleGroupDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !activeFile) return;

      const oldIndex = activeFile.groups.findIndex((g) => g.id === active.id);
      const newIndex = activeFile.groups.findIndex((g) => g.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      reorderGroups(activeFile.id, oldIndex, newIndex);
    },
    [activeFile, reorderGroups],
  );

  // -- Cross-group checklist drag handler -----------------------------------

  const handleChecklistDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !activeFile) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Find which group the dragged checklist belongs to
      let sourceGroupId: string | null = null;
      for (const g of activeFile.groups) {
        if (g.checklists.some((c) => c.id === activeId)) {
          sourceGroupId = g.id;
          break;
        }
      }
      if (!sourceGroupId) return;

      // Determine if dropped onto a group drop zone (empty group) or onto another checklist
      if (overId.startsWith("group-drop-")) {
        const targetGroupId = overId.replace("group-drop-", "");
        if (targetGroupId === sourceGroupId) return;
        // Move to the end of the target group
        moveChecklist(activeFile.id, sourceGroupId, targetGroupId, activeId);
        return;
      }

      // Dropped onto another checklist — find its group
      let targetGroupId: string | null = null;
      let targetIndex = -1;
      for (const g of activeFile.groups) {
        const idx = g.checklists.findIndex((c) => c.id === overId);
        if (idx !== -1) {
          targetGroupId = g.id;
          targetIndex = idx;
          break;
        }
      }
      if (!targetGroupId) return;

      if (sourceGroupId === targetGroupId) {
        // Same group — reorder within
        const sourceGroup = activeFile.groups.find(
          (g) => g.id === sourceGroupId,
        );
        if (!sourceGroup) return;
        const oldIndex = sourceGroup.checklists.findIndex(
          (c) => c.id === activeId,
        );
        if (oldIndex === -1 || oldIndex === targetIndex) return;
        reorderChecklists(activeFile.id, sourceGroupId, oldIndex, targetIndex);
      } else {
        // Cross-group move — insert at the target position
        moveChecklist(
          activeFile.id,
          sourceGroupId,
          targetGroupId,
          activeId,
          targetIndex,
        );
      }
    },
    [activeFile, reorderChecklists, moveChecklist],
  );

  // -- Checklist rename handlers -----------------------------------------------

  const handleStartRename = useCallback((checklistId: string) => {
    setRenamingId(checklistId);
  }, []);

  const handleCommitRename = useCallback(
    (checklistId: string, name: string) => {
      if (!activeFile) return;
      // Find which group this checklist belongs to
      for (const group of activeFile.groups) {
        if (group.checklists.some((c) => c.id === checklistId)) {
          renameChecklist(activeFile.id, group.id, checklistId, name);
          break;
        }
      }
      setRenamingId(null);
    },
    [activeFile, renameChecklist],
  );

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const handleSelectChecklist = useCallback(
    (checklistId: string) => {
      setActiveChecklist(checklistId);
    },
    [setActiveChecklist],
  );

  const handleAddGroup = useCallback(
    (name: string, category: ChecklistGroupCategory) => {
      if (!activeFile) return;
      addGroup(activeFile.id, name, category);
    },
    [activeFile, addGroup],
  );

  // -- Collect all checklist IDs across groups for the single SortableContext --

  const allChecklistIds = activeFile
    ? activeFile.groups.flatMap((g) => g.checklists.map((c) => c.id))
    : [];

  // -- Render -----------------------------------------------------------------

  if (!activeFile) {
    return (
      <div className="border-border bg-bg-base flex min-h-0 w-70 shrink-0 flex-col border-r">
        <div className="border-border flex items-center justify-between border-b px-3.5 py-2.5">
          <span className="text-foreground text-[13px] font-semibold">
            No file selected
          </span>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="text-text-muted px-3.5 py-6 text-center text-xs">
            Select a file to view checklists
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="border-border bg-bg-base flex min-h-0 w-70 shrink-0 flex-col border-r">
      {/* Header: file name + settings icon + format badge */}
      <div className="border-border flex items-center gap-2 border-b px-3.5 py-2.5">
        {isRenamingFile ? (
          <InlineRename
            initialValue={activeFile.name}
            onCommit={(name) => {
              renameFile(activeFile.id, name);
              setIsRenamingFile(false);
            }}
            onCancel={() => setIsRenamingFile(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsRenamingFile(true)}
            className="text-foreground hover:text-efis-accent min-w-0 flex-1 truncate text-left text-[13px] font-semibold transition-colors duration-150"
          >
            {activeFile.name}
          </button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsMetadataOpen(true)}
              className="text-text-muted hover:text-foreground shrink-0 transition-colors duration-150"
            >
              <Settings className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">File metadata</TooltipContent>
        </Tooltip>

        <FormatBadge format={activeFile.format} />
      </div>

      <FileMetadataDialog
        file={activeFile}
        open={isMetadataOpen}
        onOpenChange={setIsMetadataOpen}
      />

      {/* Tree body */}
      <ScrollArea className="min-h-0 flex-1">
        {activeFile.groups.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext
              items={activeFile.groups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={checklistCollisionDetection}
                onDragEnd={handleChecklistDragEnd}
              >
                <SortableContext
                  items={allChecklistIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="py-1">
                    {activeFile.groups.map((group) => (
                      <GroupSection
                        key={group.id}
                        file={activeFile}
                        group={group}
                        activeChecklistId={activeChecklistId}
                        onSelectChecklist={handleSelectChecklist}
                        renamingId={renamingId}
                        onStartRename={handleStartRename}
                        onCommitRename={handleCommitRename}
                        onCancelRename={handleCancelRename}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-text-muted px-3.5 py-6 text-center text-xs">
            No groups in this file
          </div>
        )}

        <AddGroupMenu onAdd={handleAddGroup} />
      </ScrollArea>
    </div>
  );
}

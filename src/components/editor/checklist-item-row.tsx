import { useCallback, useEffect, useRef, useState } from "react";
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  Pencil,
  IndentIncrease,
  IndentDecrease,
  Trash2,
  Plus,
  Copy,
  ALargeSmall,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/tailwind";
import { ChecklistItemType } from "@/types/checklist";
import type { ChecklistItem } from "@/types/checklist";
import { TypeIndicator } from "@/components/editor/type-indicator";
import {
  IndentGuides,
  ITEM_TYPE_LINE_COLOR,
} from "@/components/editor/indent-guides";
import type { LineSegment } from "@/components/editor/indent-guides";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChecklistItemRowProps {
  item: ChecklistItem;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  isCollapsed: boolean;
  lineSegments: LineSegment[];
  childCount: number;
  canIndent: boolean;
  canOutdent: boolean;
  /** Number of currently multi-selected items (for context menu labels) */
  selectedCount: number;
  onSelect: (shiftKey: boolean) => void;
  onStartEdit: () => void;
  onCommitEdit: (changes: {
    challengeText: string;
    responseText: string;
  }) => void;
  onCancelEdit: () => void;
  onToggleCollapse: () => void;
  onDuplicate: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onAddItemBelow: () => void;
  onUppercase: () => void;
}

// ---------------------------------------------------------------------------
// Inline Edit Component
// ---------------------------------------------------------------------------

interface InlineEditProps {
  item: ChecklistItem;
  onCommit: (changes: { challengeText: string; responseText: string }) => void;
  onCancel: () => void;
}

function InlineEdit({ item, onCommit, onCancel }: InlineEditProps) {
  const [challengeText, setChallengeText] = useState(item.challengeText);
  const [responseText, setResponseText] = useState(item.responseText);
  const challengeRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasResponse = item.type === ChecklistItemType.ChallengeResponse;

  useEffect(() => {
    challengeRef.current?.focus();
    challengeRef.current?.select();
  }, []);

  const handleCommit = useCallback(() => {
    onCommit({
      challengeText: challengeText.trim(),
      responseText: responseText.trim(),
    });
  }, [challengeText, responseText, onCommit]);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Only commit when focus leaves the entire inline edit container
      // (not when moving between challenge/response fields)
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        handleCommit();
      }
    },
    [handleCommit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCommit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab" && hasResponse) {
        e.preventDefault();
        if (e.shiftKey) {
          challengeRef.current?.focus();
          challengeRef.current?.select();
        } else {
          // From challenge → response, from response → cycle back to challenge
          const target =
            document.activeElement === responseRef.current
              ? challengeRef
              : responseRef;
          target.current?.focus();
          target.current?.select();
        }
      }
    },
    [handleCommit, onCancel, hasResponse],
  );

  const inputClass =
    "bg-bg-elevated border-efis-accent rounded px-1.5 py-0.5 text-[13px] text-foreground border outline-none";

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 flex-1 items-center gap-1.5"
      onKeyDown={handleKeyDown}
    >
      <input
        ref={challengeRef}
        type="text"
        value={challengeText}
        onChange={(e) => setChallengeText(e.target.value)}
        onBlur={handleBlur}
        placeholder={
          item.type === ChecklistItemType.Title
            ? "Section title"
            : "Challenge text"
        }
        className={cn(inputClass, hasResponse ? "flex-1" : "flex-1")}
      />
      {hasResponse && (
        <input
          ref={responseRef}
          type="text"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          onBlur={handleBlur}
          placeholder="Response"
          className={cn(inputClass, "w-[35%] shrink-0 text-right")}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content Variants
// ---------------------------------------------------------------------------

function ChallengeResponseContent({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center overflow-hidden">
      <span className="text-foreground min-w-0 truncate text-[13px]">
        {item.challengeText || "Untitled"}
      </span>
      <span className="text-text-muted mx-1 min-w-5 flex-1 translate-y-1 overflow-hidden font-mono text-xs tracking-[2px] whitespace-nowrap">
        {"·".repeat(200)}
      </span>
      <span className="text-efis-accent shrink-0 text-right text-[13px] font-medium">
        {item.responseText}
      </span>
    </div>
  );
}

function ChallengeOnlyContent({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <span className="text-foreground min-w-0 truncate text-[13px]">
        {item.challengeText || "Untitled"}
      </span>
    </div>
  );
}

function TitleContent({
  item,
  isCollapsed,
  childCount,
  onToggleCollapse,
}: {
  item: ChecklistItem;
  isCollapsed: boolean;
  childCount: number;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      {/* Collapse toggle for title items */}
      {childCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="text-muted-foreground hover:text-foreground -ml-0.5 shrink-0 p-0.5 transition-colors duration-150"
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      )}

      <span className="text-efis-purple min-w-0 flex-1 truncate text-[12px] font-bold tracking-wide uppercase">
        {item.challengeText || "UNTITLED SECTION"}
      </span>

      {childCount > 0 && (
        <span className="bg-bg-overlay text-text-secondary shrink-0 rounded-full px-1.5 text-[10px] leading-relaxed">
          {isCollapsed
            ? `${childCount} item${childCount !== 1 ? "s" : ""} collapsed`
            : `${childCount}i`}
        </span>
      )}
    </div>
  );
}

function NoteContent({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <span className="text-muted-foreground min-w-0 truncate text-[13px] italic">
        {item.challengeText || "Empty note"}
      </span>
    </div>
  );
}

function WarningContent({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <span className="text-efis-yellow min-w-0 truncate text-[13px]">
        {"⚠ "}
        {item.challengeText || "Warning"}
      </span>
    </div>
  );
}

function CautionContent({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <span className="text-efis-orange min-w-0 truncate text-[13px]">
        {item.challengeText || "Caution"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hover Action Buttons
// ---------------------------------------------------------------------------

interface ActionButtonsProps {
  canIndent: boolean;
  canOutdent: boolean;
  childCount: number;
  onStartEdit: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onDelete: () => void;
  onAddChild: () => void;
}

function ActionButtons({
  canIndent,
  canOutdent,
  childCount,
  onStartEdit,
  onIndent,
  onOutdent,
  onDelete,
  onAddChild,
}: ActionButtonsProps) {
  const btnClass =
    "text-text-muted hover:text-foreground hover:bg-bg-hover shrink-0 rounded p-0.5 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted";

  return (
    <div className="ml-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      <button
        type="button"
        title="Edit (Enter)"
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
        className={btnClass}
      >
        <Pencil className="size-3" />
      </button>
      <button
        type="button"
        title="Indent (Tab)"
        disabled={!canIndent}
        onClick={(e) => {
          e.stopPropagation();
          onIndent();
        }}
        className={btnClass}
      >
        <IndentIncrease className="size-3" />
      </button>
      <button
        type="button"
        title="Outdent (Shift+Tab)"
        disabled={!canOutdent}
        onClick={(e) => {
          e.stopPropagation();
          onOutdent();
        }}
        className={btnClass}
      >
        <IndentDecrease className="size-3" />
      </button>
      <button
        type="button"
        title="Add child item"
        onClick={(e) => {
          e.stopPropagation();
          onAddChild();
        }}
        className={cn(btnClass, childCount > 0 && "invisible")}
      >
        <Plus className="size-3" />
      </button>
      <button
        type="button"
        title="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(btnClass, "hover:text-efis-red hover:bg-efis-red-dim")}
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChecklistItemRow
// ---------------------------------------------------------------------------

export function ChecklistItemRow({
  item,
  isSelected,
  isEditing,
  isCollapsed,
  lineSegments,
  childCount,
  canIndent,
  canOutdent,
  selectedCount,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onToggleCollapse,
  onDuplicate,
  onIndent,
  onOutdent,
  onDelete,
  onAddChild,
  onAddItemBelow,
  onUppercase,
}: ChecklistItemRowProps) {
  const isTitle = item.type === ChecklistItemType.Title;
  const rowRef = useRef<HTMLDivElement>(null);
  const prevIsEditing = useRef(isEditing);

  // Refocus the row after exiting edit mode so keyboard shortcuts keep working
  useEffect(() => {
    if (prevIsEditing.current && !isEditing && isSelected) {
      rowRef.current?.focus();
    }
    prevIsEditing.current = isEditing;
  }, [isEditing, isSelected]);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // Merge sortable ref with our local ref
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      rowRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={mergedRef}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            if (!isEditing) onSelect(e.shiftKey);
          }}
          onDoubleClick={(e) => {
            if (!isEditing) {
              onSelect(e.shiftKey);
              onStartEdit();
            }
          }}
          onKeyDown={(e) => {
            if (isEditing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              onAddItemBelow();
            } else if (e.key === " ") {
              e.preventDefault();
              onSelect(e.shiftKey);
            } else if (e.key === "Delete" || e.key === "Backspace") {
              e.preventDefault();
              onDelete();
            } else if (e.key === "Tab") {
              e.preventDefault();
              if (e.shiftKey) {
                onOutdent();
              } else {
                onIndent();
              }
            }
          }}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
          className={cn(
            "group mx-4 my-px flex min-h-9.5 items-stretch rounded pr-3 transition-colors duration-150",
            isSelected && !isEditing
              ? "bg-efis-accent-dim"
              : !isEditing && "hover:bg-bg-elevated",
            isEditing && "bg-bg-elevated",
            isDragging && "z-10 opacity-50 shadow-lg",
          )}
        >
          {/* Drag handle */}
          <div
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="flex w-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
          >
            <GripVertical className="text-text-muted size-3.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
          </div>

          {/* Indent guides — colored connector lines from parent */}
          <IndentGuides segments={lineSegments} />

          {/* Type indicator (circle/bar) — sits after indent guides so tick connects into it */}
          <TypeIndicator
            type={item.type}
            showConnector={childCount > 0 && !isCollapsed}
            connectorColorClass={ITEM_TYPE_LINE_COLOR[item.type]}
          />

          {/* Content — editing or display mode */}
          {isEditing ? (
            <InlineEdit
              item={item}
              onCommit={onCommitEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              {item.type === ChecklistItemType.ChallengeResponse && (
                <ChallengeResponseContent item={item} />
              )}
              {item.type === ChecklistItemType.ChallengeOnly && (
                <ChallengeOnlyContent item={item} />
              )}
              {item.type === ChecklistItemType.Title && (
                <TitleContent
                  item={item}
                  isCollapsed={isCollapsed}
                  childCount={childCount}
                  onToggleCollapse={onToggleCollapse}
                />
              )}
              {item.type === ChecklistItemType.Note && (
                <NoteContent item={item} />
              )}
              {item.type === ChecklistItemType.Warning && (
                <WarningContent item={item} />
              )}
              {item.type === ChecklistItemType.Caution && (
                <CautionContent item={item} />
              )}
            </>
          )}

          {/* Collapsed badge for non-title collapsible items */}
          {!isEditing && !isTitle && item.collapsible && childCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
              className="text-muted-foreground hover:text-foreground ml-1.5 shrink-0 p-0.5 transition-colors duration-150"
            >
              {isCollapsed ? (
                <span className="flex items-center gap-0.5">
                  <ChevronRight className="size-3" />
                  <span className="bg-bg-overlay rounded-full px-1.5 text-[10px] leading-relaxed">
                    {childCount}
                  </span>
                </span>
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          )}

          {/* Hover action buttons (hidden during editing) */}
          {!isEditing && (
            <ActionButtons
              canIndent={canIndent}
              canOutdent={canOutdent}
              childCount={childCount}
              onStartEdit={onStartEdit}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={onStartEdit}>
          <Pencil className="size-3.5" />
          Edit
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onDuplicate}>
          <Copy className="size-3.5" />
          {selectedCount > 1 ? `Duplicate (${selectedCount})` : "Duplicate"}
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onUppercase}>
          <ALargeSmall className="size-3.5" />
          Uppercase
        </ContextMenuItem>
        <ContextMenuItem onSelect={onAddItemBelow}>
          <Plus className="size-3.5" />
          Add Item Below
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onIndent} disabled={!canIndent}>
          <IndentIncrease className="size-3.5" />
          Indent
          <ContextMenuShortcut>Tab</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onOutdent} disabled={!canOutdent}>
          <IndentDecrease className="size-3.5" />
          Outdent
          <ContextMenuShortcut>Shift+Tab</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onDelete} variant="destructive">
          <Trash2 className="size-3.5" />
          {selectedCount > 1 ? `Delete (${selectedCount})` : "Delete"}
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

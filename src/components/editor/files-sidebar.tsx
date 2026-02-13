import { useCallback, useRef, useState } from "react";
import {
  ALargeSmall,
  FileText,
  FilePlus,
  Upload,
  Pencil,
  X,
  Trash2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useChecklistStore } from "@/stores";
import { FormatBadge } from "@/components/editor/format-badge";
import { cn } from "@/utils/tailwind";
import { ChecklistFormat, ChecklistGroupCategory } from "@/types/checklist";
import type { ChecklistFile } from "@/types/checklist";
import { importFile, readChecklistFile } from "@/actions/checklist";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Format icon color mapping
// ---------------------------------------------------------------------------

const FORMAT_ICON_COLOR: Record<ChecklistFormat, string> = {
  [ChecklistFormat.Ace]: "text-efis-green",
  [ChecklistFormat.Gplt]: "text-efis-accent",
  [ChecklistFormat.AfsDynon]: "text-efis-purple",
  [ChecklistFormat.ForeFlight]: "text-efis-cyan",
  [ChecklistFormat.Grt]: "text-efis-orange",
  [ChecklistFormat.Json]: "text-efis-accent",
  [ChecklistFormat.Pdf]: "text-efis-red",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let counter = 0;

function uid(): string {
  return `${Date.now()}-${++counter}`;
}

function createNewFile(): ChecklistFile {
  const fileId = uid();
  const groupId = uid();
  const checklistId = uid();

  return {
    id: fileId,
    name: "Untitled Checklists",
    format: ChecklistFormat.Json,
    groups: [
      {
        id: groupId,
        name: "Normal",
        category: ChecklistGroupCategory.Normal,
        checklists: [
          {
            id: checklistId,
            name: "New Checklist",
            items: [],
          },
        ],
      },
    ],
    metadata: {
      aircraftRegistration: "",
      makeModel: "",
      copyright: "",
    },
    lastModified: Date.now(),
    dirty: true,
  };
}

// ---------------------------------------------------------------------------
// FileListItem
// ---------------------------------------------------------------------------

interface FileListItemProps {
  file: ChecklistFile;
  isActive: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onCancelRename: () => void;
  onClose: () => void;
  onDelete: () => void;
  onUppercase: () => void;
}

function FileListItem({
  file,
  isActive,
  isRenaming,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onClose,
  onDelete,
  onUppercase,
}: FileListItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={onStartRename}
          className={cn(
            "group relative flex w-full items-center gap-2 px-3.5 py-1.5 text-left text-xs transition-colors duration-150",
            isActive
              ? "bg-bg-active text-foreground"
              : "text-muted-foreground hover:bg-bg-hover hover:text-foreground",
          )}
        >
          {/* Active indicator bar */}
          {isActive && (
            <div className="bg-efis-accent absolute top-0 left-0 h-full w-0.75" />
          )}

          {/* File icon */}
          <FileText
            className={cn("size-4 shrink-0", FORMAT_ICON_COLOR[file.format])}
          />

          {/* File name */}
          {isRenaming ? (
            <InlineRename
              initialValue={file.name}
              onCommit={onCommitRename}
              onCancel={onCancelRename}
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
          )}

          {/* Format badge */}
          <FormatBadge format={file.format} />
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onStartRename}>
          <Pencil className="size-3.5" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={onClose}>
          <X className="size-3.5" />
          Close
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onUppercase}>
          <ALargeSmall className="size-3.5" />
          Uppercase All
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

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
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      className="bg-bg-elevated border-efis-accent text-foreground min-w-0 flex-1 rounded border px-1 py-0.5 text-xs outline-none"
    />
  );
}

// ---------------------------------------------------------------------------
// FilesSidebar
// ---------------------------------------------------------------------------

export function FilesSidebar() {
  const files = useChecklistStore((s) => s.files);
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const addFile = useChecklistStore((s) => s.addFile);
  const removeFile = useChecklistStore((s) => s.removeFile);
  const renameFile = useChecklistStore((s) => s.renameFile);
  const setActiveFile = useChecklistStore((s) => s.setActiveFile);
  const uppercaseFile = useChecklistStore((s) => s.uppercaseFile);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const fileList = Object.values(files);

  // -- Handlers ---------------------------------------------------------------

  const handleNewFile = useCallback(() => {
    const newFile = createNewFile();
    addFile(newFile);
  }, [addFile]);

  const handleSelectFile = useCallback(
    (fileId: string) => {
      setActiveFile(fileId);
    },
    [setActiveFile],
  );

  const handleStartRename = useCallback((fileId: string) => {
    setRenamingFileId(fileId);
  }, []);

  const handleCommitRename = useCallback(
    (fileId: string, newName: string) => {
      renameFile(fileId, newName);
      setRenamingFileId(null);
    },
    [renameFile],
  );

  const handleCancelRename = useCallback(() => {
    setRenamingFileId(null);
  }, []);

  const handleCloseFile = useCallback(
    (fileId: string) => {
      removeFile(fileId);
    },
    [removeFile],
  );

  const handleDeleteFile = useCallback(
    (fileId: string) => {
      const file = files[fileId];
      if (!file) return;
      toast.warning(`Delete "${file.name}"?`, {
        description: "This cannot be undone.",
        action: {
          label: "Delete",
          onClick: () => removeFile(fileId),
        },
      });
    },
    [files, removeFile],
  );

  // -- Drag & Drop ------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      // In Electron, dropped files have a .path property
      for (const droppedFile of droppedFiles) {
        const filePath = (droppedFile as File & { path: string }).path;
        if (!filePath) continue;

        try {
          const file = await readChecklistFile(filePath);
          addFile(file);
          toast.success("File imported", {
            description: `Opened ${file.name}`,
          });
        } catch (err) {
          toast.error("Import failed", {
            description:
              err instanceof Error
                ? err.message
                : `Failed to import ${droppedFile.name}`,
          });
        }
      }
    },
    [addFile],
  );

  const handleDropZoneClick = useCallback(async () => {
    try {
      const file = await importFile();
      if (file) {
        addFile(file);
        toast.success("File imported", {
          description: `Opened ${file.name}`,
        });
      }
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [addFile]);

  // -- Render -----------------------------------------------------------------

  return (
    <div className="border-border bg-bg-surface flex min-h-0 w-65 shrink-0 flex-col border-r">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-3.5 py-3">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Checklist Files
        </span>
        <button
          type="button"
          onClick={handleNewFile}
          className="text-muted-foreground hover:bg-bg-hover hover:text-foreground rounded p-1 transition-colors duration-150"
          title="New file"
        >
          <FilePlus className="size-3.5" />
        </button>
      </div>

      {/* File list */}
      <ScrollArea className="min-h-0 flex-1">
        {fileList.length > 0 ? (
          <div className="py-1">
            {fileList.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                isActive={file.id === activeFileId}
                isRenaming={renamingFileId === file.id}
                onSelect={() => handleSelectFile(file.id)}
                onStartRename={() => handleStartRename(file.id)}
                onCommitRename={(name) => handleCommitRename(file.id, name)}
                onCancelRename={handleCancelRename}
                onClose={() => handleCloseFile(file.id)}
                onDelete={() => handleDeleteFile(file.id)}
                onUppercase={() => uppercaseFile(file.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-text-muted px-3.5 py-6 text-center text-xs">
            No files open
          </div>
        )}
      </ScrollArea>

      {/* Drop zone */}
      <div className="mx-3 mb-3">
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-xs transition-colors duration-150",
            isDraggingOver
              ? "border-efis-accent bg-efis-accent-dim text-muted-foreground"
              : "border-border text-text-muted hover:border-efis-accent hover:text-muted-foreground",
          )}
        >
          <Upload className="size-5" />
          <span>
            Drop file to import
            <br />
            or click to browse
          </span>
        </div>
      </div>
    </div>
  );
}

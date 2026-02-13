import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Download,
  Undo2,
  Redo2,
  Plus,
  ListPlus,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useChecklistStore } from "@/stores";
import { useUiStore } from "@/stores";
import { importFile } from "@/actions/checklist";
import { toast } from "sonner";
import { ChecklistItemType } from "@/types/checklist";

interface ToolbarProps {
  onOpenCommandPalette?: () => void;
  onOpenExportModal?: () => void;
}

export function Toolbar({
  onOpenCommandPalette,
  onOpenExportModal,
}: ToolbarProps) {
  const addFile = useChecklistStore((s) => s.addFile);
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const files = useChecklistStore((s) => s.files);
  const addItem = useChecklistStore((s) => s.addItem);
  const addChecklist = useChecklistStore((s) => s.addChecklist);
  const activeChecklistId = useChecklistStore((s) => s.activeChecklistId);

  const { undo, redo, pastStates, futureStates } =
    useChecklistStore.temporal.getState();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const togglePropertiesPanel = useUiStore((s) => s.togglePropertiesPanel);

  const activeFile = activeFileId ? files[activeFileId] : null;

  // Find active group and checklist for Add Item
  let activeGroupId: string | null = null;
  if (activeFile && activeChecklistId) {
    for (const group of activeFile.groups) {
      if (group.checklists.some((c) => c.id === activeChecklistId)) {
        activeGroupId = group.id;
        break;
      }
    }
  }

  const handleImport = async () => {
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
  };

  const handleExport = () => {
    if (onOpenExportModal) {
      onOpenExportModal();
    } else {
      toast.info("Export dialog coming in Phase 13");
    }
  };

  const handleAddItem = () => {
    if (!activeFileId || !activeGroupId || !activeChecklistId) {
      toast.warning("No checklist selected", {
        description: "Select a checklist to add an item",
      });
      return;
    }
    addItem(
      activeFileId,
      activeGroupId,
      activeChecklistId,
      ChecklistItemType.ChallengeResponse,
    );
  };

  const handleAddChecklist = () => {
    if (!activeFileId) {
      toast.warning("No file open", {
        description: "Open or create a file first",
      });
      return;
    }
    const firstGroup = activeFile?.groups[0];
    if (!firstGroup) {
      toast.warning("No groups in file", {
        description: "Add a group first",
      });
      return;
    }
    addChecklist(activeFileId, firstGroup.id, "New Checklist");
    toast.success("Checklist added");
  };

  const handleQuickExport = () => {
    toast.info("Quick export coming in Phase 13");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-border bg-bg-surface flex h-11 shrink-0 items-center gap-1 border-b px-3">
        {/* Import / Export */}
        <ToolbarButton
          icon={<Upload className="size-3.5" />}
          label="Import"
          tooltip="Import file (Ctrl+O)"
          onClick={handleImport}
        />
        <ToolbarButton
          icon={<Download className="size-3.5" />}
          label="Export"
          tooltip="Export file (Ctrl+Shift+E)"
          onClick={handleExport}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Undo / Redo */}
        <ToolbarButton
          icon={<Undo2 className="size-3.5" />}
          tooltip="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={undo}
        />
        <ToolbarButton
          icon={<Redo2 className="size-3.5" />}
          tooltip="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={redo}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Add Item / Add Checklist */}
        <ToolbarButton
          icon={<Plus className="size-3.5" />}
          label="Item"
          tooltip="New item (Ctrl+N)"
          onClick={handleAddItem}
        />
        <ToolbarButton
          icon={<ListPlus className="size-3.5" />}
          label="Checklist"
          tooltip="New checklist (Ctrl+Shift+N)"
          onClick={handleAddChecklist}
        />

        <div className="flex-1" />

        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="border-border bg-bg-elevated text-text-muted hover:border-border-light hover:text-muted-foreground flex min-w-55 items-center gap-2 rounded-md border px-3 py-1 text-xs transition-colors duration-150"
        >
          <Search className="size-3.5" />
          <span>Search checklists&hellip;</span>
          <kbd className="border-border bg-bg-surface ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl+K
          </kbd>
        </button>

        <div className="flex-1" />

        {/* Properties toggle */}
        <ToolbarButton
          icon={<SlidersHorizontal className="size-3.5" />}
          label="Properties"
          tooltip="Toggle properties (Ctrl+/)"
          onClick={togglePropertiesPanel}
        />

        {/* Quick Export */}
        <button
          type="button"
          onClick={handleQuickExport}
          className="border-efis-accent/25 bg-efis-accent-dim text-efis-accent hover:bg-efis-accent/20 hover:text-efis-accent-hover flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors duration-150"
        >
          <Zap className="size-3.5" />
          Quick Export
        </button>
      </div>
    </TooltipProvider>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label?: string;
  tooltip?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function ToolbarButton({
  icon,
  label,
  tooltip,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-muted-foreground hover:bg-bg-hover hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

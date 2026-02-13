import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/tailwind";
import { useChecklistStore } from "@/stores";
import { exportFile } from "@/actions/checklist";
import { saveFileDialog } from "@/actions/dialog";
import { toast } from "sonner";
import { ChecklistFormat } from "@/types/checklist";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Format options for the export grid
const EXPORT_OPTIONS = [
  {
    format: ChecklistFormat.Ace,
    name: "Garmin G3X",
    extension: ".ace",
    description: "G3X, G3X Touch, GTN",
    enabled: true,
  },
  {
    format: ChecklistFormat.Json,
    name: "JSON Backup",
    extension: ".json",
    description: "Lossless internal format",
    enabled: true,
  },
  {
    format: ChecklistFormat.Pdf,
    name: "Printable PDF",
    extension: ".pdf",
    description: "Paper backup",
    enabled: true,
  },
  {
    format: ChecklistFormat.Gplt,
    name: "Garmin Pilot",
    extension: ".gplt",
    description: "Compressed format",
    enabled: true,
  },
  {
    format: ChecklistFormat.AfsDynon,
    name: "AFS / Dynon",
    extension: ".txt",
    description: "SkyView, AF-5000",
    enabled: true,
  },
  {
    format: ChecklistFormat.ForeFlight,
    name: "ForeFlight",
    extension: ".fmd",
    description: "Jeppesen ForeFlight",
    enabled: true,
  },
  {
    format: ChecklistFormat.Grt,
    name: "GRT",
    extension: ".txt",
    description: "Grand Rapids",
    enabled: true,
  },
];

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const files = useChecklistStore((s) => s.files);
  const activeFile = activeFileId ? files[activeFileId] : null;

  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: ChecklistFormat, extension: string) {
    if (!activeFile) return;

    try {
      setIsExporting(true);

      // Remove leading dot and slashes for the save dialog
      const cleanExt = extension.replace(/^\./, "").split("/")[0].trim();

      const filePath = await saveFileDialog({
        title: `Export as ${format.toUpperCase()}`,
        defaultPath: `${activeFile.name}.${cleanExt}`,
        filters: [{ name: format.toUpperCase(), extensions: [cleanExt] }],
      });

      if (!filePath) {
        setIsExporting(false);
        return; // User cancelled
      }

      await exportFile(activeFile, format, filePath);
      toast.success("Export complete", {
        description: `Saved to ${filePath}`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Export Checklists</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_OPTIONS.map((option) => (
            <button
              key={option.format}
              type="button"
              disabled={!option.enabled || !activeFile || isExporting}
              onClick={() => handleExport(option.format, option.extension)}
              className={cn(
                "border-border flex flex-col items-start rounded-lg border p-3 text-left transition-colors duration-150",
                option.enabled && activeFile && !isExporting
                  ? "hover:border-efis-accent hover:bg-efis-accent-dim cursor-pointer"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              <span className="text-foreground text-[13px] font-semibold">
                {option.name}
              </span>
              <span className="text-text-muted font-mono text-[11px]">
                {option.extension}
              </span>
              <span className="text-text-secondary text-[11px]">
                {option.enabled ? option.description : "Coming soon"}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

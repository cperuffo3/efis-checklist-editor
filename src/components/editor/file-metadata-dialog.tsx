import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChecklistStore } from "@/stores";
import type { ChecklistFile } from "@/types/checklist";

interface FileMetadataDialogProps {
  file: ChecklistFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileMetadataDialog({
  file,
  open,
  onOpenChange,
}: FileMetadataDialogProps) {
  const updateFileMetadata = useChecklistStore((s) => s.updateFileMetadata);

  const [registration, setRegistration] = useState(
    file.metadata.aircraftRegistration,
  );
  const [makeModel, setMakeModel] = useState(file.metadata.makeModel);
  const [copyright, setCopyright] = useState(file.metadata.copyright);

  // Sync local state when the dialog opens or file changes
  useEffect(() => {
    if (open) {
      setRegistration(file.metadata.aircraftRegistration);
      setMakeModel(file.metadata.makeModel);
      setCopyright(file.metadata.copyright);
    }
  }, [open, file.metadata]);

  const handleRegistrationChange = useCallback(
    (value: string) => {
      setRegistration(value);
      updateFileMetadata(file.id, { aircraftRegistration: value });
    },
    [file.id, updateFileMetadata],
  );

  const handleMakeModelChange = useCallback(
    (value: string) => {
      setMakeModel(value);
      updateFileMetadata(file.id, { makeModel: value });
    },
    [file.id, updateFileMetadata],
  );

  const handleCopyrightChange = useCallback(
    (value: string) => {
      setCopyright(value);
      updateFileMetadata(file.id, { copyright: value });
    },
    [file.id, updateFileMetadata],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>File Metadata</DialogTitle>
          <DialogDescription>Edit metadata for {file.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground mb-1 block text-[11px]">
              Aircraft Registration
            </Label>
            <Input
              value={registration}
              onChange={(e) => handleRegistrationChange(e.target.value)}
              placeholder="N12345"
              className="text-xs"
            />
          </div>

          <div>
            <Label className="text-muted-foreground mb-1 block text-[11px]">
              Aircraft Make & Model
            </Label>
            <Input
              value={makeModel}
              onChange={(e) => handleMakeModelChange(e.target.value)}
              placeholder="Cessna 172S Skyhawk"
              className="text-xs"
            />
          </div>

          <div>
            <Label className="text-muted-foreground mb-1 block text-[11px]">
              Copyright
            </Label>
            <Input
              value={copyright}
              onChange={(e) => handleCopyrightChange(e.target.value)}
              placeholder="Optional copyright notice"
              className="text-xs"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

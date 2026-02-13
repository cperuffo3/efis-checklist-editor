import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";
import { useChecklistStore } from "@/stores";
import { getAppVersion } from "@/actions/app";

interface StatusBarProps {
  onShowShortcuts?: () => void;
}

export function StatusBar({ onShowShortcuts }: StatusBarProps) {
  const [version, setVersion] = useState<string>("v0.1.0");

  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const files = useChecklistStore((s) => s.files);
  const activeChecklistId = useChecklistStore((s) => s.activeChecklistId);
  const activeItemId = useChecklistStore((s) => s.activeItemId);

  // Get version on mount
  useEffect(() => {
    getAppVersion().then((v) => setVersion(`v${v}`));
  }, []);

  // Derive active file, checklist, and item data
  const activeFile = activeFileId ? files[activeFileId] : null;

  let activeChecklist = null;
  if (activeFile && activeChecklistId) {
    for (const group of activeFile.groups) {
      const found = group.checklists.find((c) => c.id === activeChecklistId);
      if (found) {
        activeChecklist = found;
        break;
      }
    }
  }

  const itemCount = activeChecklist?.items.length ?? 0;
  const selectedIndex = activeChecklist?.items.findIndex(
    (i) => i.id === activeItemId,
  );

  return (
    <div className="border-border bg-bg-surface text-text-muted flex h-6.5 shrink-0 items-center justify-between border-t px-3 text-[11px]">
      {/* Left items */}
      <div className="flex items-center gap-3">
        {activeFile && (
          <>
            <span className="flex items-center gap-1.5">
              <span
                className={
                  activeFile.dirty
                    ? "bg-efis-yellow size-2 rounded-full"
                    : "bg-efis-green size-2 rounded-full"
                }
              />
              {activeFile.dirty ? "Unsaved" : "Saved"}
            </span>
            {activeChecklist && (
              <>
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                {activeItemId &&
                  selectedIndex !== undefined &&
                  selectedIndex !== -1 && (
                    <span>
                      Item {selectedIndex + 1} of {itemCount}
                    </span>
                  )}
              </>
            )}
          </>
        )}
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        <span>{version}</span>
        <button
          type="button"
          onClick={onShowShortcuts}
          className="hover:text-muted-foreground flex items-center gap-1 transition-colors duration-150"
        >
          <Keyboard className="size-3" />
          Shortcuts
        </button>
      </div>
    </div>
  );
}

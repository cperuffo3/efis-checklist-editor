import { useEffect } from "react";
import { X } from "lucide-react";

interface ShortcutsHintProps {
  visible: boolean;
  onClose: () => void;
}

export function ShortcutsHint({ visible, onClose }: ShortcutsHintProps) {
  // Auto-hide after 8 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 fixed right-4 bottom-10 z-50 duration-300">
      <div className="border-border bg-bg-overlay flex items-center gap-4 rounded-md border px-4 py-2.5 shadow-lg">
        {/* Shortcut hints */}
        <div className="flex items-center gap-3 text-[11px]">
          <ShortcutHint keys={["↑", "↓"]} action="Navigate" />
          <ShortcutHint keys={["Enter"]} action="Edit" />
          <ShortcutHint keys={["Del"]} action="Remove" />
          <ShortcutHint keys={["Tab"]} action="Indent" />
          <ShortcutHint keys={["Ctrl", "K"]} action="Search" />
          <ShortcutHint keys={["Ctrl", "Z"]} action="Undo" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-foreground ml-1 transition-colors"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

function ShortcutHint({ keys, action }: { keys: string[]; action: string }) {
  return (
    <span className="text-text-secondary flex items-center gap-1">
      <span className="flex gap-0.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="border-border bg-bg-surface text-foreground rounded border px-1 py-0.5 font-mono text-[10px]"
          >
            {key}
          </kbd>
        ))}
      </span>
      <span className="text-text-muted">{action}</span>
    </span>
  );
}

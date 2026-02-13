import { useState } from "react";
import { DragWindowRegion } from "@/components/shared";
import { Toolbar } from "@/components/editor/toolbar";
import { FilesSidebar } from "@/components/editor/files-sidebar";
import { ChecklistTree } from "@/components/editor/checklist-tree";
import { ChecklistEditor } from "@/components/editor/checklist-editor";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { StatusBar } from "@/components/editor/status-bar";
import { CommandPalette } from "@/components/editor/command-palette";
import { ExportModal } from "@/components/editor/export-modal";
import { ShortcutsHint } from "@/components/editor/shortcuts-hint";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutosave } from "@/hooks/use-autosave";
import { useLoadWorkspace } from "@/hooks/use-load-workspace";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useUiStore } from "@/stores";
import { useChecklistStore } from "@/stores";

export default function EditorLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(true); // Show on first load

  const sidebarVisible = useUiStore((s) => s.sidebarVisible);
  const treePanelVisible = useUiStore((s) => s.treePanelVisible);
  const propertiesPanelVisible = useUiStore((s) => s.propertiesPanelVisible);

  const activeFile = useChecklistStore((s) =>
    s.activeFileId ? s.files[s.activeFileId] : null,
  );

  // Register all keyboard shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onOpenExportModal: () => setExportModalOpen(true),
    onShowShortcuts: () => setShortcutsVisible(true),
  });

  // Autosave and workspace persistence
  useAutosave();
  const isLoading = useLoadWorkspace();

  // Warn before closing with unsaved changes
  useBeforeUnload();

  // Show loading state while workspace loads
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <DragWindowRegion title="EFIS Editor" />
        <div className="bg-bg-base flex flex-1 items-center justify-center">
          <div className="text-text-muted text-sm">Loading workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Title bar */}
      <DragWindowRegion title="EFIS Editor" subtitle={activeFile?.name} />

      {/* Toolbar */}
      <Toolbar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
      />

      {/* Main content area — 4 panels */}
      <div className="flex min-h-0 flex-1">
        {sidebarVisible && <FilesSidebar />}
        {treePanelVisible && <ChecklistTree />}
        <ChecklistEditor />
        {propertiesPanelVisible && <PropertiesPanel />}
      </div>

      {/* Status bar */}
      <StatusBar onShowShortcuts={() => setShortcutsVisible(true)} />

      {/* Keyboard shortcuts hint overlay */}
      <ShortcutsHint
        visible={shortcutsVisible}
        onClose={() => setShortcutsVisible(false)}
      />

      {/* Command palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Export modal */}
      <ExportModal open={exportModalOpen} onOpenChange={setExportModalOpen} />
    </div>
  );
}

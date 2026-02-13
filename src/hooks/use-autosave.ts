import { useEffect, useRef } from "react";
import { useChecklistStore } from "@/stores";
import { useUiStore } from "@/stores";
import { saveWorkspace, savePanelState } from "@/actions/persistence";

export function useAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to checklist store changes
  useEffect(() => {
    const unsubscribe = useChecklistStore.subscribe((state, prevState) => {
      // Only save if files actually changed
      if (state.files === prevState.files) return;

      // Clear previous timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Debounce 2 seconds
      timerRef.current = setTimeout(() => {
        const { files, activeFileId, markFileClean } =
          useChecklistStore.getState();

        // Convert files to plain objects for serialization (strip functions)
        const filesData = JSON.parse(JSON.stringify(files));

        saveWorkspace(filesData, activeFileId)
          .then(() => {
            // Mark all dirty files as clean
            for (const fileId of Object.keys(files)) {
              if (files[fileId].dirty) {
                markFileClean(fileId);
              }
            }
          })
          .catch((err) => {
            console.error("[Autosave] Failed to save workspace:", err);
          });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Subscribe to UI store changes to save panel state
  useEffect(() => {
    const unsubscribe = useUiStore.subscribe((state, prevState) => {
      if (
        state.sidebarVisible === prevState.sidebarVisible &&
        state.treePanelVisible === prevState.treePanelVisible &&
        state.propertiesPanelVisible === prevState.propertiesPanelVisible
      )
        return;

      savePanelState({
        sidebarVisible: state.sidebarVisible,
        treePanelVisible: state.treePanelVisible,
        propertiesPanelVisible: state.propertiesPanelVisible,
      }).catch((err) => {
        console.error("[Autosave] Failed to save panel state:", err);
      });
    });

    return () => unsubscribe();
  }, []);
}

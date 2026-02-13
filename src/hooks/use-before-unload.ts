import { useEffect } from "react";
import { useChecklistStore } from "@/stores";

/**
 * Warn the user before closing the window if there are unsaved changes.
 * Works via the beforeunload event which Electron respects.
 */
export function useBeforeUnload() {
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      const { files } = useChecklistStore.getState();
      const hasDirtyFiles = Object.values(files).some((f) => f.dirty);

      if (hasDirtyFiles) {
        // Standard beforeunload pattern - message may not be shown but the dialog will appear
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to close?";
        return e.returnValue;
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}

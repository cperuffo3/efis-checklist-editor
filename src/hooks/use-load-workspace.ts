import { useEffect, useState } from "react";
import { useChecklistStore } from "@/stores";
import { useUiStore } from "@/stores";
import { loadWorkspace, loadPanelState } from "@/actions/persistence";
import {
  ChecklistFormat,
  ChecklistGroupCategory,
  ChecklistItemType,
} from "@/types/checklist";
import type { ChecklistFile } from "@/types/checklist";

let uidCounter = 0;
function uid(): string {
  return `${Date.now()}-${++uidCounter}`;
}

function createTemplateFile(): ChecklistFile {
  return {
    id: uid(),
    name: "My Checklists",
    format: ChecklistFormat.Json,
    groups: [
      {
        id: uid(),
        name: "Normal",
        category: ChecklistGroupCategory.Normal,
        checklists: [
          {
            id: uid(),
            name: "Preflight Inspection",
            items: [
              {
                id: uid(),
                type: ChecklistItemType.Title,
                challengeText: "CABIN",
                responseText: "",
                indent: 0,
                centered: false,
                collapsible: true,
              },
              {
                id: uid(),
                type: ChecklistItemType.ChallengeResponse,
                challengeText: "Parking Brake",
                responseText: "SET",
                indent: 1,
                centered: false,
                collapsible: false,
              },
              {
                id: uid(),
                type: ChecklistItemType.ChallengeResponse,
                challengeText: "Required Documents (AROW)",
                responseText: "CHECK",
                indent: 1,
                centered: false,
                collapsible: false,
              },
              {
                id: uid(),
                type: ChecklistItemType.ChallengeResponse,
                challengeText: "Avionics Master Switch",
                responseText: "OFF",
                indent: 1,
                centered: false,
                collapsible: false,
              },
            ],
          },
          {
            id: uid(),
            name: "Before Engine Start",
            items: [],
          },
        ],
      },
      {
        id: uid(),
        name: "Emergency",
        category: ChecklistGroupCategory.Emergency,
        checklists: [
          {
            id: uid(),
            name: "Engine Failure",
            items: [],
          },
        ],
      },
      {
        id: uid(),
        name: "Abnormal",
        category: ChecklistGroupCategory.Abnormal,
        checklists: [],
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

export function useLoadWorkspace() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Load panel state
        const panelState = await loadPanelState();
        if (panelState) {
          const uiStore = useUiStore.getState();
          // Toggle panels if they differ from defaults (all visible by default)
          if (!panelState.sidebarVisible && uiStore.sidebarVisible) {
            uiStore.toggleSidebar();
          }
          if (!panelState.treePanelVisible && uiStore.treePanelVisible) {
            uiStore.toggleTreePanel();
          }
          if (
            !panelState.propertiesPanelVisible &&
            uiStore.propertiesPanelVisible
          ) {
            uiStore.togglePropertiesPanel();
          }
        }

        // Load workspace
        const workspace = await loadWorkspace();
        const store = useChecklistStore.getState();
        let hasFiles = false;

        if (workspace && workspace.files) {
          // Add each file to the store
          const files = workspace.files as Record<string, ChecklistFile>;
          for (const file of Object.values(files)) {
            if (file && file.id) {
              // Mark as clean since it was loaded from disk
              file.dirty = false;
              store.addFile(file);
              hasFiles = true;
            }
          }
          // Restore active file
          if (
            workspace.activeFileId &&
            files[workspace.activeFileId as string]
          ) {
            store.setActiveFile(workspace.activeFileId as string);
          }
        }

        // First run: create a starter template file
        if (!hasFiles) {
          const template = createTemplateFile();
          store.addFile(template);
          store.setActiveFile(template.id);
        }
      } catch (err) {
        console.error("[Workspace] Failed to load workspace:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return isLoading;
}

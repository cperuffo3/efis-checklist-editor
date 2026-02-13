import { create } from "zustand";

interface UiState {
  propertiesPanelVisible: boolean;
  sidebarVisible: boolean;
  treePanelVisible: boolean;
  togglePropertiesPanel: () => void;
  toggleSidebar: () => void;
  toggleTreePanel: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  propertiesPanelVisible: true,
  sidebarVisible: true,
  treePanelVisible: true,
  togglePropertiesPanel: () =>
    set((s) => ({ propertiesPanelVisible: !s.propertiesPanelVisible })),
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  toggleTreePanel: () =>
    set((s) => ({ treePanelVisible: !s.treePanelVisible })),
}));

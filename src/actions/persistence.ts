import { ipc } from "@/ipc/manager";

export function saveWorkspace(
  files: Record<string, unknown>,
  activeFileId: string | null,
) {
  return ipc.client.persistence.saveWorkspace({ files, activeFileId });
}

export function loadWorkspace() {
  return ipc.client.persistence.loadWorkspace();
}

export function saveWindowState(state: {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}) {
  return ipc.client.persistence.saveWindowState(state);
}

export function loadWindowState() {
  return ipc.client.persistence.loadWindowState();
}

export function savePanelState(state: {
  sidebarVisible: boolean;
  treePanelVisible: boolean;
  propertiesPanelVisible: boolean;
}) {
  return ipc.client.persistence.savePanelState(state);
}

export function loadPanelState() {
  return ipc.client.persistence.loadPanelState();
}

import { ipc } from "@/ipc/manager";
import type { ChecklistFile } from "@/types/checklist";

export function readChecklistFile(filePath: string) {
  return ipc.client.checklist.readChecklistFile({ filePath });
}

export function writeChecklistFile(file: ChecklistFile, filePath: string) {
  return ipc.client.checklist.writeChecklistFile({
    file: file as unknown as Record<string, unknown>,
    filePath,
  });
}

export function importFile() {
  return ipc.client.checklist.importFile();
}

export function exportFile(
  file: ChecklistFile,
  format: string,
  filePath: string,
) {
  return ipc.client.checklist.exportFile({
    file: file as unknown as Record<string, unknown>,
    format,
    filePath,
  });
}

export function getRecentFiles() {
  return ipc.client.checklist.getRecentFiles();
}

export function addRecentFile(
  filePath: string,
  fileName: string,
  format: string,
) {
  return ipc.client.checklist.addRecentFile({ filePath, fileName, format });
}

export function importChecklistsFromFile() {
  return ipc.client.checklist.importChecklistsFromFile();
}

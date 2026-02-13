import { ipc } from "@/ipc/manager";

export function openFileDialog(options?: {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
}) {
  return ipc.client.dialog.openFileDialog(options ?? {});
}

export function saveFileDialog(options?: {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}) {
  return ipc.client.dialog.saveFileDialog(options ?? {});
}

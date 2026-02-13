import { os } from "@orpc/server";
import { dialog } from "electron";
import { ipcContext } from "@/ipc/context";
import {
  openFileDialogInputSchema,
  saveFileDialogInputSchema,
} from "./schemas";

/** Show native open file dialog, returns file path or null if cancelled */
export const openFileDialog = os
  .use(ipcContext.mainWindowContext)
  .input(openFileDialogInputSchema)
  .handler(async ({ input, context }) => {
    const result = await dialog.showOpenDialog(context.window, {
      title: input.title ?? "Open File",
      filters: input.filters ?? [
        { name: "Checklist Files", extensions: ["ace", "json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

/** Show native save file dialog, returns file path or null if cancelled */
export const saveFileDialog = os
  .use(ipcContext.mainWindowContext)
  .input(saveFileDialogInputSchema)
  .handler(async ({ input, context }) => {
    const result = await dialog.showSaveDialog(context.window, {
      title: input.title ?? "Save File",
      defaultPath: input.defaultPath,
      filters: input.filters ?? [
        { name: "JSON", extensions: ["json"] },
        { name: "Garmin ACE", extensions: ["ace"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

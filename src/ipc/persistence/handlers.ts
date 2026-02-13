import { os } from "@orpc/server";
import { app } from "electron";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import {
  saveWorkspaceInputSchema,
  saveWindowStateInputSchema,
  savePanelStateInputSchema,
} from "./schemas";

const WORKSPACE_FILE_NAME = "workspace.json";
const WINDOW_STATE_FILE_NAME = "window-state.json";
const PANEL_STATE_FILE_NAME = "panel-state.json";

function getWorkspacePath(): string {
  return path.join(app.getPath("userData"), WORKSPACE_FILE_NAME);
}

function getWindowStatePath(): string {
  return path.join(app.getPath("userData"), WINDOW_STATE_FILE_NAME);
}

function getPanelStatePath(): string {
  return path.join(app.getPath("userData"), PANEL_STATE_FILE_NAME);
}

/** Save workspace state (files + activeFileId) to disk */
export const saveWorkspace = os
  .input(saveWorkspaceInputSchema)
  .handler(async ({ input }) => {
    const { files, activeFileId } = input;
    const filePath = getWorkspacePath();

    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const content = JSON.stringify({ files, activeFileId }, null, 2);
    await writeFile(filePath, content, "utf-8");

    return { success: true };
  });

/** Load workspace state from disk */
export const loadWorkspace = os.handler(async () => {
  const filePath = getWorkspacePath();
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
});

/** Save window bounds and maximized state to disk */
export const saveWindowState = os
  .input(saveWindowStateInputSchema)
  .handler(async ({ input }) => {
    const filePath = getWindowStatePath();

    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const content = JSON.stringify(input, null, 2);
    await writeFile(filePath, content, "utf-8");

    return { success: true };
  });

/** Load window state from disk */
export const loadWindowState = os.handler(async () => {
  const filePath = getWindowStatePath();
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
});

/** Save panel visibility state to disk */
export const savePanelState = os
  .input(savePanelStateInputSchema)
  .handler(async ({ input }) => {
    const filePath = getPanelStatePath();

    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const content = JSON.stringify(input, null, 2);
    await writeFile(filePath, content, "utf-8");

    return { success: true };
  });

/** Load panel visibility state from disk */
export const loadPanelState = os.handler(async () => {
  const filePath = getPanelStatePath();
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
});

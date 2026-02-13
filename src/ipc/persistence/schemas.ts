import z from "zod";

export const saveWorkspaceInputSchema = z.object({
  files: z.record(z.string(), z.unknown()),
  activeFileId: z.string().nullable(),
});

export const saveWindowStateInputSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  isMaximized: z.boolean(),
});

export const savePanelStateInputSchema = z.object({
  sidebarVisible: z.boolean(),
  treePanelVisible: z.boolean(),
  propertiesPanelVisible: z.boolean(),
});

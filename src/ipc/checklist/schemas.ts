import z from "zod";

export const readChecklistFileInputSchema = z.object({
  filePath: z.string(),
});

export const writeChecklistFileInputSchema = z.object({
  file: z.record(z.string(), z.unknown()),
  filePath: z.string(),
});

export const exportFileInputSchema = z.object({
  file: z.record(z.string(), z.unknown()),
  format: z.string(),
  filePath: z.string(),
});

export const addRecentFileInputSchema = z.object({
  filePath: z.string(),
  fileName: z.string(),
  format: z.string(),
});

import { os } from "@orpc/server";
import { app, dialog } from "electron";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { ChecklistFormat, ChecklistItemType } from "@/types/checklist";
import type { Checklist, ChecklistFile } from "@/types/checklist";
import { ipcContext } from "@/ipc/context";
import {
  detectFormat,
  getParser,
  garminPilotParser,
  pdfParser,
} from "@/ipc/formats";
import type { ParsedChecklistFile } from "@/ipc/formats";
import type { RecentFileEntry } from "./types";
import {
  readChecklistFileInputSchema,
  writeChecklistFileInputSchema,
  exportFileInputSchema,
  addRecentFileInputSchema,
} from "./schemas";

const RECENT_FILES_NAME = "recent-files.json";
const MAX_RECENT_FILES = 20;

function getRecentFilesPath(): string {
  return path.join(app.getPath("userData"), RECENT_FILES_NAME);
}

async function readRecentFilesFromDisk(): Promise<RecentFileEntry[]> {
  const filePath = getRecentFilesPath();
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as RecentFileEntry[];
  } catch {
    return [];
  }
}

async function writeRecentFilesToDisk(entries: RecentFileEntry[]) {
  const dir = path.dirname(getRecentFilesPath());
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(getRecentFilesPath(), JSON.stringify(entries, null, 2));
}

/**
 * Parse file content using the appropriate parser.
 * Handles async parsers (Garmin Pilot) transparently.
 */
async function parseFileContent(
  content: Buffer,
  format: ChecklistFormat,
  fileName: string,
): Promise<ParsedChecklistFile> {
  if (format === ChecklistFormat.Gplt) {
    return garminPilotParser.parseAsync(content, fileName);
  }
  const parser = getParser(format);
  return parser.parse(content, fileName);
}

/**
 * Serialize a file using the appropriate parser.
 * Handles async parsers (Garmin Pilot, PDF) transparently.
 */
async function serializeFile(
  file: ChecklistFile,
  format: ChecklistFormat,
): Promise<Buffer | string> {
  if (format === ChecklistFormat.Gplt) {
    return garminPilotParser.serializeAsync(file);
  }
  if (format === ChecklistFormat.Pdf) {
    return pdfParser.serializeAsync(file);
  }
  const parser = getParser(format);
  return parser.serialize(file);
}

/** Read and parse a checklist file from disk */
export const readChecklistFile = os
  .input(readChecklistFileInputSchema)
  .handler(async ({ input }) => {
    const { filePath } = input;

    // Read as raw Buffer for binary format support
    const content = await readFile(filePath);
    const format = detectFormat(filePath, content);
    if (!format) {
      throw new Error(`Unsupported file format: ${path.extname(filePath)}`);
    }

    const fileName = path.basename(filePath, path.extname(filePath));
    const parsed = await parseFileContent(content, format, fileName);

    const file: ChecklistFile = {
      ...parsed,
      id: crypto.randomUUID(),
      filePath,
      dirty: false,
      lastModified: Date.now(),
    };

    return file;
  });

/** Write a ChecklistFile as JSON to disk (internal save) */
export const writeChecklistFile = os
  .input(writeChecklistFileInputSchema)
  .handler(async ({ input }) => {
    const { file, filePath } = input;

    const content = await serializeFile(
      file as unknown as ChecklistFile,
      ChecklistFormat.Json,
    );

    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(filePath, content, "utf-8");

    return { success: true, filePath };
  });

/** Open native file dialog, read file, detect format, parse to internal model */
export const importFile = os
  .use(ipcContext.mainWindowContext)
  .handler(async ({ context }) => {
    const result = await dialog.showOpenDialog(context.window, {
      title: "Import Checklist File",
      filters: [
        {
          name: "Checklist Files",
          extensions: ["ace", "json", "txt", "afd", "fmd", "gplt"],
        },
        { name: "Garmin ACE", extensions: ["ace"] },
        { name: "JSON", extensions: ["json"] },
        { name: "Dynon / AFS", extensions: ["txt", "afd"] },
        { name: "ForeFlight", extensions: ["fmd"] },
        { name: "Garmin Pilot", extensions: ["gplt"] },
        { name: "GRT", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];

    // Read as raw Buffer for binary format support
    const content = await readFile(filePath);
    const format = detectFormat(filePath, content);
    if (!format) {
      throw new Error(`Unsupported file format: ${path.extname(filePath)}`);
    }

    const fileName = path.basename(filePath, path.extname(filePath));
    const parsed = await parseFileContent(content, format, fileName);

    const file: ChecklistFile = {
      ...parsed,
      id: crypto.randomUUID(),
      filePath,
      dirty: false,
      lastModified: Date.now(),
    };

    return file;
  });

/** Serialize active file to target format and save to disk */
export const exportFile = os
  .input(exportFileInputSchema)
  .handler(async ({ input }) => {
    const { file, format, filePath } = input;
    const checklistFormat = format as ChecklistFormat;

    const content = await serializeFile(
      file as unknown as ChecklistFile,
      checklistFormat,
    );

    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write binary formats as Buffer, text as utf-8
    if (Buffer.isBuffer(content)) {
      await writeFile(filePath, content);
    } else {
      await writeFile(filePath, content, "utf-8");
    }

    return { success: true, filePath, format };
  });

/** Get list of recently opened files */
export const getRecentFiles = os.handler(async () => {
  return readRecentFilesFromDisk();
});

/** Add a file path to the recent files list */
export const addRecentFile = os
  .input(addRecentFileInputSchema)
  .handler(async ({ input }) => {
    const { filePath, fileName, format } = input;
    const entries = await readRecentFilesFromDisk();

    // Remove duplicate if exists
    const filtered = entries.filter((e) => e.filePath !== filePath);

    // Add to front
    const newEntry: RecentFileEntry = {
      filePath,
      fileName,
      format: format as ChecklistFormat,
      lastOpened: Date.now(),
    };
    filtered.unshift(newEntry);

    // Trim to max
    const trimmed = filtered.slice(0, MAX_RECENT_FILES);

    await writeRecentFilesToDisk(trimmed);
    return trimmed;
  });

/** Map rdamazio item type strings used in standalone checklist objects */
const RDAMAZIO_TYPE_MAP: Record<string, ChecklistItemType> = {
  ITEM_CHALLENGE_RESPONSE: ChecklistItemType.ChallengeResponse,
  ITEM_CHALLENGE: ChecklistItemType.ChallengeOnly,
  ITEM_TITLE: ChecklistItemType.Title,
  ITEM_PLAINTEXT: ChecklistItemType.Note,
  ITEM_NOTE: ChecklistItemType.Note,
  ITEM_WARNING: ChecklistItemType.Warning,
  ITEM_CAUTION: ChecklistItemType.Caution,
  ITEM_SPACE: ChecklistItemType.Note,
};

/** Parse a single item object into a Checklist item with a fresh ID */
function parseItem(item: Record<string, unknown>): Checklist["items"][number] {
  // Detect rdamazio item format (uses prompt/expectation and ITEM_ prefixed types)
  const isRdamazio =
    typeof item.type === "string" && (item.type as string).startsWith("ITEM_");

  return {
    id: crypto.randomUUID(),
    type: isRdamazio
      ? (RDAMAZIO_TYPE_MAP[item.type as string] ??
        ChecklistItemType.ChallengeResponse)
      : ((item.type as ChecklistItemType) ??
        ChecklistItemType.ChallengeResponse),
    challengeText: ((item.prompt ?? item.challengeText) as string) ?? "",
    responseText: ((item.expectation ?? item.responseText) as string) ?? "",
    indent: Math.min((item.indent as number) ?? 0, 3) as 0 | 1 | 2 | 3,
    centered: (item.centered as boolean) ?? false,
    collapsible: (item.collapsible as boolean) ?? false,
  };
}

/**
 * Open a JSON file dialog and extract Checklist objects from it.
 *
 * Supports three formats:
 * - Full EFIS JSON file (has `groups` array) — flattens all checklists
 * - Standalone checklist object (has `items` array at top level)
 * - rdamazio format (groups with `title` fields)
 *
 * All returned checklists have freshly generated IDs.
 */
export const importChecklistsFromFile = os
  .use(ipcContext.mainWindowContext)
  .handler(async ({ context }) => {
    const result = await dialog.showOpenDialog(context.window, {
      title: "Import Checklists from JSON",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const content = await readFile(filePath, "utf-8");
    const raw = JSON.parse(content) as Record<string, unknown>;

    // Case 1: Full EFIS JSON file (has `groups` array) — use jsonParser to handle
    // both internal format and rdamazio format, then flatten all checklists
    if (Array.isArray(raw.groups)) {
      const parsed = getParser(ChecklistFormat.Json).parse(
        Buffer.from(content, "utf-8"),
        path.basename(filePath, path.extname(filePath)),
      );
      const checklists: Checklist[] = [];
      for (const group of parsed.groups) {
        for (const cl of group.checklists) {
          checklists.push(cl as Checklist);
        }
      }
      return checklists;
    }

    // Case 2: Standalone checklist object (has `items` array at top level)
    if (Array.isArray(raw.items)) {
      const items = (raw.items as Record<string, unknown>[]).map(parseItem);
      const checklist: Checklist = {
        id: crypto.randomUUID(),
        name:
          (raw.name as string) ??
          (raw.title as string) ??
          path.basename(filePath, path.extname(filePath)),
        items,
      };
      return [checklist];
    }

    throw new Error(
      "Unrecognized JSON format. Expected a file with groups/checklists or a standalone checklist with items.",
    );
  });

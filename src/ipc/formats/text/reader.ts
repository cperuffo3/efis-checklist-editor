import {
  ChecklistFormat,
  ChecklistGroupCategory,
  ChecklistItemType,
} from "@/types/checklist";
import type {
  Checklist,
  ChecklistFileMetadata,
  ChecklistGroup,
  ChecklistItem,
} from "@/types/checklist";
import type { ParsedChecklistFile } from "../types";
import {
  DEFAULT_FIRST_GROUP,
  METADATA_AIRCRAFT_TITLE,
  METADATA_CHECKLIST_TITLE,
  METADATA_COPYRIGHT_TITLE,
  METADATA_FILE_TITLE,
  METADATA_MAKE_MODEL_TITLE,
  METADATA_MANUFACTURER_TITLE,
  WRAP_PREFIX,
  type TextFormatOptions,
} from "./options";

/**
 * Generic text format reader. Used by both Dynon/AFS and GRT parsers.
 */
export function readText(
  content: string,
  fileName: string,
  options: TextFormatOptions,
  format: ChecklistFormat,
): ParsedChecklistFile {
  const titleSuffix = options.titlePrefixSuffix.split("").reverse().join("");
  const checklistPrefixMatch =
    options.checklistPrefixMatcher ??
    new RegExp("^" + escapeRegExp(options.checklistPrefix) + "$");
  const itemPrefixMatch =
    options.itemPrefixMatcher ??
    new RegExp("^" + escapeRegExp(options.itemPrefix) + "$");
  const checklistNumOffset = options.checklistZeroIndexed ? 0 : 1;
  const itemNumOffset = options.checklistItemZeroIndexed ? 0 : 1;
  const groupSep = options.groupNameSeparator;

  const properCase = (str: string) =>
    options.allUppercase ? str.toUpperCase() : str;

  // Strip file extension from name
  let name = fileName;
  for (const ext of options.fileExtensions) {
    if (name.toLowerCase().endsWith(ext.toLowerCase())) {
      name = name.slice(0, -ext.length);
      break;
    }
  }

  const groups: ChecklistGroup[] = [];
  const metadata: ChecklistFileMetadata = {
    aircraftRegistration: "",
    makeModel: "",
    copyright: "",
  };

  const lines = content.split(/\r?\n/);
  let currentGroup: ChecklistGroup | undefined;
  let currentChecklist: Checklist | undefined;
  let currentItemSeen = false;
  let currentItemContents = "";
  let currentItemIndent = 0;
  let currentItemStartSpaces = 0;
  let currentChecklistNum = 0;
  let currentItemLineNum = 0;

  function processItem() {
    if (currentItemSeen && currentChecklist) {
      const item = itemForContents(
        currentItemContents,
        currentItemIndent,
        currentItemStartSpaces,
      );
      // Skip leading blank items if checklistTopBlankLine is set
      if (
        !options.checklistTopBlankLine ||
        item.type !== ChecklistItemType.Note ||
        item.challengeText !== "" ||
        currentChecklist.items.length > 0
      ) {
        currentChecklist.items.push(item);
      }
      currentItemContents = "";
      currentItemSeen = false;
    }
  }

  function itemForContents(
    contents: string,
    indent: number,
    startSpaces: number,
  ): ChecklistItem {
    const endTrimmed = contents.trimEnd();
    const endSpaces = contents.length - endTrimmed.length;
    const centered = endSpaces > 0 && endSpaces === startSpaces;
    if (centered) indent = 0;

    let prompt = endTrimmed.trimStart();
    let expectation = "";
    let itemType: ChecklistItemType = ChecklistItemType.ChallengeOnly;

    if (!prompt) {
      // Empty/space item - represent as a Note with empty text
      itemType = ChecklistItemType.Note;
    } else if (prompt.startsWith(options.notePrefix)) {
      itemType = ChecklistItemType.Note;
      prompt = prompt.slice(options.notePrefix.length);
    } else if (
      prompt.startsWith(options.titlePrefixSuffix) &&
      prompt.endsWith(titleSuffix)
    ) {
      itemType = ChecklistItemType.Title;
      prompt = prompt.slice(
        options.titlePrefixSuffix.length,
        -titleSuffix.length,
      );
    } else if (prompt.startsWith(options.warningPrefix)) {
      itemType = ChecklistItemType.Warning;
      prompt = prompt.slice(options.warningPrefix.length);
    } else if (prompt.startsWith(options.cautionPrefix)) {
      itemType = ChecklistItemType.Caution;
      prompt = prompt.slice(options.cautionPrefix.length);
    } else {
      const sepIdx = prompt.indexOf(options.expectationSeparator);
      if (sepIdx !== -1) {
        itemType = ChecklistItemType.ChallengeResponse;
        expectation = prompt.slice(
          sepIdx + options.expectationSeparator.length,
        );
        prompt = prompt.slice(0, sepIdx);
      }
    }

    return {
      id: crypto.randomUUID(),
      type: itemType,
      challengeText: prompt,
      responseText: expectation,
      indent: Math.min(3, Math.max(0, indent)) as 0 | 1 | 2 | 3,
      centered,
      collapsible: false,
    };
  }

  for (const line of lines) {
    if (options.commentPrefix && line.startsWith(options.commentPrefix))
      continue;
    if (!line.trim()) continue;

    const firstSpaceIdx = line.indexOf(" ");
    let prefix: string;
    let lineContents: string;
    if (firstSpaceIdx === -1) {
      prefix = line;
      lineContents = "";
    } else {
      prefix = line.slice(0, firstSpaceIdx);
      lineContents = line.slice(firstSpaceIdx + 1);
    }

    const checklistMatch = checklistPrefixMatch.exec(prefix);
    if (checklistMatch) {
      processItem();

      let groupTitle = properCase(DEFAULT_FIRST_GROUP);
      let checklistTitle = lineContents;

      if (groupSep && (groups.length > 0 || !options.skipFirstGroup)) {
        const groupSepIdx = lineContents.indexOf(groupSep);
        if (groupSepIdx !== -1) {
          groupTitle = lineContents.slice(0, groupSepIdx);
          checklistTitle = lineContents.slice(groupSepIdx + groupSep.length);
        }
      }

      if (currentGroup?.name !== groupTitle) {
        currentGroup = {
          id: crypto.randomUUID(),
          name: groupTitle,
          category: ChecklistGroupCategory.Normal,
          checklists: [],
        };
        groups.push(currentGroup);
      }

      currentChecklist = {
        id: crypto.randomUUID(),
        name: checklistTitle,
        items: [],
      };
      currentGroup.checklists.push(currentChecklist);
      currentItemLineNum = 0;
      currentChecklistNum++;

      if (checklistMatch.groups && "checklistNum" in checklistMatch.groups) {
        const num = parseInt(checklistMatch.groups["checklistNum"], 10);
        const expected = currentChecklistNum - 1 + checklistNumOffset;
        if (num !== expected) {
          throw new Error(
            `Unexpected checklist number ${num} in "${prefix}" (expected ${expected})`,
          );
        }
      }
      continue;
    }

    const itemMatch = itemPrefixMatch.exec(prefix);
    if (itemMatch) {
      if (!currentChecklist || !currentGroup) {
        throw new Error("Checklist item found before start of checklist");
      }

      currentItemStartSpaces =
        lineContents.length - lineContents.trimStart().length;
      const newIndent = Math.floor(
        currentItemStartSpaces / options.indentWidth,
      );
      lineContents = lineContents.slice(newIndent * options.indentWidth);

      if (lineContents.startsWith(WRAP_PREFIX)) {
        // Wrapped line continuation
        currentItemContents += " " + lineContents.slice(WRAP_PREFIX.length);
      } else {
        processItem();
        currentItemContents = lineContents;
        currentItemIndent = newIndent;
        currentItemSeen = true;
      }

      if (itemMatch.groups) {
        if ("checklistNum" in itemMatch.groups) {
          const num = parseInt(itemMatch.groups["checklistNum"], 10);
          const expected = currentChecklistNum - 1 + checklistNumOffset;
          if (num !== expected) {
            throw new Error(
              `Unexpected checklist number ${num} in "${prefix}" (expected ${expected})`,
            );
          }
        }
        if ("itemNum" in itemMatch.groups) {
          const num = parseInt(itemMatch.groups["itemNum"], 10);
          const expected = currentItemLineNum + itemNumOffset;
          if (num !== expected) {
            throw new Error(
              `Unexpected item number ${num} in "${prefix}" (expected ${expected})`,
            );
          }
        }
      }
      currentItemLineNum++;
      continue;
    }

    // Unknown prefix — skip silently (some files have stray lines)
  }

  // Process the last item
  processItem();

  // Check if last checklist is metadata
  if (
    currentChecklist?.name === properCase(METADATA_CHECKLIST_TITLE) &&
    currentGroup
  ) {
    extractMetadata(currentChecklist, metadata, properCase);
    currentGroup.checklists.pop();
    if (currentGroup.checklists.length === 0) {
      groups.pop();
    }
  }

  return {
    name: metadata.aircraftRegistration || name,
    format,
    filePath: undefined,
    groups,
    metadata,
  };
}

/** Extract metadata from a special "Checklist Info" checklist */
function extractMetadata(
  checklist: Checklist,
  metadata: ChecklistFileMetadata,
  properCase: (s: string) => string,
) {
  const items = checklist.items;
  for (let i = 0; i < items.length - 1; i++) {
    const prompt = items[i].challengeText;
    if (prompt === properCase(METADATA_FILE_TITLE)) {
      // Name stored in metadata — use it but don't set on metadata obj
    } else if (prompt === properCase(METADATA_MAKE_MODEL_TITLE)) {
      metadata.makeModel = items[++i].challengeText;
    } else if (prompt === properCase(METADATA_AIRCRAFT_TITLE)) {
      metadata.aircraftRegistration = items[++i].challengeText;
    } else if (prompt === properCase(METADATA_MANUFACTURER_TITLE)) {
      i++; // skip — not in our model
    } else if (prompt === properCase(METADATA_COPYRIGHT_TITLE)) {
      metadata.copyright = items[++i].challengeText;
    }
  }
}

/** Escape special regex characters in a string */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

import { ChecklistItemType } from "@/types/checklist";
import type { ChecklistFile, ChecklistItem } from "@/types/checklist";
import {
  HEADER_COMMENT,
  METADATA_AIRCRAFT_TITLE,
  METADATA_CHECKLIST_TITLE,
  METADATA_COPYRIGHT_TITLE,
  METADATA_FILE_TITLE,
  METADATA_MAKE_MODEL_TITLE,
  WRAP_PREFIX,
  type TextFormatOptions,
} from "./options";

const CRLF = "\r\n";

/**
 * Generic text format writer. Used by both Dynon/AFS and GRT.
 */
export function writeText(
  file: ChecklistFile,
  options: TextFormatOptions,
): string {
  const titleSuffix = options.titlePrefixSuffix.split("").reverse().join("");
  const parts: string[] = [];

  const properCase = (str: string) =>
    options.allUppercase ? str.toUpperCase() : str;

  const normalizeText = (text: string) =>
    options.forbidCommas ? text.replaceAll(",", "") : text;

  function replaceNumbers(
    template: string,
    checklistNum: number,
    itemNum: number,
  ) {
    let cn = checklistNum;
    let in_ = itemNum;
    if (!options.checklistZeroIndexed) cn++;
    if (!options.checklistItemZeroIndexed) in_++;
    return template
      .replace("{{checklistNum}}", cn.toString())
      .replace("{{itemNum}}", in_.toString());
  }

  function addPart(s: string) {
    parts.push(properCase(s));
  }
  function addLine(s?: string) {
    if (s) addPart(s);
    parts.push(CRLF);
  }

  // Header comment
  addLine(HEADER_COMMENT);

  let firstGroup = true;
  let checklistIdx = 0;

  for (const group of file.groups) {
    for (const checklist of group.checklists) {
      addLine();
      addPart(replaceNumbers(options.checklistPrefix, checklistIdx, 0));
      addPart(" ");
      if (!firstGroup || !options.skipFirstGroup) {
        addPart(normalizeText(group.name));
        addPart(": ");
      }
      addLine(normalizeText(checklist.name));

      writeItems(checklist.items, checklistIdx);
      checklistIdx++;
    }
    firstGroup = false;
  }

  // Output metadata checklist if enabled
  if (options.outputMetadata && file.metadata) {
    addLine();
    addPart(replaceNumbers(options.checklistPrefix, checklistIdx, 0));
    addPart(" ");
    addLine(METADATA_CHECKLIST_TITLE);

    let metaIdx = 0;
    if (options.checklistTopBlankLine) {
      addLine(replaceNumbers(options.itemPrefix, checklistIdx, metaIdx++));
    }

    metaIdx = addMetaItem(
      METADATA_FILE_TITLE,
      file.name,
      checklistIdx,
      metaIdx,
    );
    if (file.metadata.makeModel) {
      metaIdx = addMetaItem(
        METADATA_MAKE_MODEL_TITLE,
        file.metadata.makeModel,
        checklistIdx,
        metaIdx,
      );
    }
    if (file.metadata.aircraftRegistration) {
      metaIdx = addMetaItem(
        METADATA_AIRCRAFT_TITLE,
        file.metadata.aircraftRegistration,
        checklistIdx,
        metaIdx,
      );
    }
    // manufacturerInfo not in our model, skip
    if (file.metadata.copyright) {
      metaIdx = addMetaItem(
        METADATA_COPYRIGHT_TITLE,
        file.metadata.copyright,
        checklistIdx,
        metaIdx,
      );
    }
    addLine(replaceNumbers(options.itemPrefix, checklistIdx, metaIdx++));

    // Last updated timestamp
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    addPart(replaceNumbers(options.itemPrefix, checklistIdx, metaIdx));
    addPart(" ");
    addPart("Last updated ");
    addLine(dateStr);
  }

  return parts.join("");

  // --- helpers ---

  function addMetaItem(
    title: string,
    contents: string,
    clIdx: number,
    idx: number,
  ): number {
    addPart(replaceNumbers(options.itemPrefix, clIdx, idx++));
    addPart(" ");
    addLine(title);
    addPart(replaceNumbers(options.itemPrefix, clIdx, idx++));
    addPart("   ");
    addLine(normalizeText(contents));
    return idx;
  }

  function writeItems(items: ChecklistItem[], clIdx: number) {
    let itemIdx = 0;

    if (options.checklistTopBlankLine) {
      addLine(replaceNumbers(options.itemPrefix, clIdx, itemIdx++));
    }

    for (const item of items) {
      let prefix = "";
      let suffix = "";
      const isSpace =
        item.type === ChecklistItemType.Note && item.challengeText === "";

      switch (item.type) {
        case ChecklistItemType.Title:
          prefix = options.titlePrefixSuffix;
          suffix = titleSuffix;
          break;
        case ChecklistItemType.Warning:
          prefix = options.warningPrefix;
          break;
        case ChecklistItemType.Caution:
          prefix = options.cautionPrefix;
          break;
        case ChecklistItemType.Note:
          if (!isSpace) prefix = options.notePrefix;
          break;
      }

      let fullLine = prefix + normalizeText(item.challengeText);
      if (item.responseText) {
        fullLine += options.expectationSeparator;
        fullLine += normalizeText(item.responseText);
      }
      fullLine += suffix;

      let indentWidth: number;
      if (isSpace) {
        indentWidth = 0;
      } else if (item.centered) {
        if (options.maxLineLength && fullLine.length < options.maxLineLength) {
          indentWidth = Math.floor(
            (options.maxLineLength - fullLine.length) / 2,
          );
        } else {
          indentWidth = 7;
        }
      } else {
        indentWidth = item.indent * options.indentWidth;
      }
      const indentStr = " ".repeat(indentWidth);

      let remaining = fullLine;
      let wrapped = false;

      while (true) {
        addPart(replaceNumbers(options.itemPrefix, clIdx, itemIdx++));
        if (!isSpace) addPart(" ");

        addPart(indentStr);

        let wrapWidth = 0;
        if (wrapped) {
          wrapWidth = WRAP_PREFIX.length;
          addPart(WRAP_PREFIX);
        }

        if (options.maxLineLength) {
          const maxContent = options.maxLineLength - indentWidth - wrapWidth;
          if (remaining.length > maxContent) {
            let wrapIdx = remaining.slice(0, maxContent).lastIndexOf(" ");
            if (wrapIdx === -1) wrapIdx = options.maxLineLength;
            addLine(remaining.slice(0, wrapIdx));
            remaining = remaining.slice(wrapIdx + 1);
            wrapped = true;
            continue;
          }
        }

        addPart(remaining);
        if (item.centered) addPart(indentStr);
        addLine();
        break;
      }
    }
  }
}

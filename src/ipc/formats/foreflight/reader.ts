import {
  ChecklistFormat,
  ChecklistGroupCategory,
  ChecklistItemType,
} from "@/types/checklist";
import type {
  Checklist,
  ChecklistGroup,
  ChecklistItem,
} from "@/types/checklist";
import { multilineNoteToItems } from "../format-utils";
import type { ParsedChecklistFile } from "../types";
import { decrypt } from "./crypto";

/** ForeFlight container constants */
const CONTAINER_TYPE = "checklist";
const SCHEMA_VERSION = "1.0";
const ITEM_HEADER = "comment"; // ForeFlight's name for detail/non-check items

/** ForeFlight JSON types (subset of what we need) */
interface FFContainer {
  type: string;
  payload?: {
    schemaVersion: string;
    metadata?: { name?: string; detail?: string; tailNumber?: string };
    groups: FFGroup[];
  };
}
interface FFGroup {
  groupType: string;
  items: FFSubgroup[];
}
interface FFSubgroup {
  title: string;
  items: FFChecklist[];
}
interface FFChecklist {
  title: string;
  items: FFItem[];
}
interface FFItem {
  type?: string;
  title?: string;
  detail?: string;
  note?: string;
}

/** Map ForeFlight groupType string to our ChecklistGroupCategory */
function mapCategory(groupType: string): ChecklistGroupCategory {
  switch (groupType) {
    case "ABNORMAL":
    case "abnormal":
    case "1":
      return ChecklistGroupCategory.Abnormal;
    case "EMERGENCY":
    case "emergency":
    case "2":
      return ChecklistGroupCategory.Emergency;
    default:
      return ChecklistGroupCategory.Normal;
  }
}

/**
 * Parse a ForeFlight .fmd file buffer into internal model.
 */
export function readForeFlight(
  content: Buffer,
  fileName: string,
): ParsedChecklistFile {
  const json = decrypt(content);
  const container: FFContainer = JSON.parse(json);

  if (container.type !== CONTAINER_TYPE) {
    throw new Error(`ForeFlight: unknown container type '${container.type}'`);
  }
  if (!container.payload) {
    throw new Error("ForeFlight: missing payload");
  }
  if (container.payload.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `ForeFlight: unknown schema version '${container.payload.schemaVersion}'`,
    );
  }

  const metadata = container.payload.metadata;
  const name = metadata?.name || fileName.replace(/\.fmd$/i, "") || fileName;

  const groups: ChecklistGroup[] = [];

  for (const ffGroup of container.payload.groups) {
    const category = mapCategory(ffGroup.groupType);
    for (const subgroup of ffGroup.items) {
      const checklists: Checklist[] = subgroup.items.map((ffChecklist) =>
        convertChecklist(ffChecklist),
      );
      if (checklists.length > 0) {
        groups.push({
          id: crypto.randomUUID(),
          name: subgroup.title,
          category,
          checklists,
        });
      }
    }
  }

  return {
    name,
    format: ChecklistFormat.ForeFlight,
    filePath: undefined,
    groups,
    metadata: {
      aircraftRegistration: metadata?.tailNumber ?? "",
      makeModel: metadata?.detail ?? "",
      copyright: "",
    },
  };
}

function convertChecklist(ffChecklist: FFChecklist): Checklist {
  const items: ChecklistItem[] = [];
  for (const ffItem of ffChecklist.items) {
    items.push(...convertItem(ffItem));
  }
  return {
    id: crypto.randomUUID(),
    name: ffChecklist.title,
    items,
  };
}

function convertItem(ffItem: FFItem): ChecklistItem[] {
  const result: ChecklistItem[] = [];

  if (ffItem.type === ITEM_HEADER) {
    // Detail item
    if (ffItem.title) {
      result.push(makeItem(ChecklistItemType.Title, ffItem.title));
    } else if (ffItem.detail) {
      result.push(
        ...multilineNoteToItems(ffItem.detail, true).map((n) =>
          makeItem(n.type, n.challengeText, "", n.indent),
        ),
      );
    } else {
      // Empty space — skip
    }
  } else {
    // Check item
    if (ffItem.detail) {
      result.push(
        makeItem(
          ChecklistItemType.ChallengeResponse,
          ffItem.title ?? "",
          ffItem.detail.toUpperCase(),
        ),
      );
    } else {
      result.push(
        makeItem(ChecklistItemType.ChallengeOnly, ffItem.title ?? ""),
      );
    }
  }

  // Handle notes attached to the item
  const noteText = ffItem.type === ITEM_HEADER ? ffItem.detail : ffItem.note;
  if (
    (ffItem.type === ITEM_HEADER && ffItem.title && ffItem.detail) ||
    ffItem.note
  ) {
    const text = noteText ?? "";
    result.push(
      ...multilineNoteToItems(text, false).map((n) =>
        makeItem(n.type, n.challengeText, "", n.indent),
      ),
    );
  }

  return result;
}

function makeItem(
  type: ChecklistItemType,
  challengeText: string,
  responseText = "",
  indent: 0 | 1 | 2 | 3 = 0,
): ChecklistItem {
  return {
    id: crypto.randomUUID(),
    type,
    challengeText,
    responseText,
    indent,
    centered: false,
    collapsible: false,
  };
}

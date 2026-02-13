import { parseTarGzip } from "nanotar";
import { ChecklistFormat, ChecklistItemType } from "@/types/checklist";
import type {
  Checklist,
  ChecklistGroup,
  ChecklistItem,
} from "@/types/checklist";
import { multilineNoteToItems } from "../format-utils";
import type { ParsedChecklistFile } from "../types";
import { getLiveDataSlug, LIVE_DATA_TYPES } from "./live-data";
import {
  CONTENT_FILENAME,
  GP_ITEM_NOTE,
  GP_ITEM_PLAIN_TEXT,
  compareGroupKeys,
  garminGroupKeyToEfis,
  isSupportedContainer,
  type EfisGroupKey,
  type GarminGroupKey,
} from "./utils";

/** Garmin Pilot JSON types */
interface GPContainer {
  dataModelVersion: number;
  packageTypeVersion: number;
  name: string;
  type: string;
  objects: GPObjects[];
}
interface GPObjects {
  checklists: GPChecklist[];
  checklistItems: GPChecklistItem[];
}
interface GPChecklist {
  uuid: string;
  name: string;
  type: number;
  subtype: number;
  completionItem: number;
  checklistItems: string[];
}
interface GPChecklistItem {
  uuid: string;
  itemType: number;
  title: string;
  action: string;
}

/**
 * Parse a Garmin Pilot .gplt file (tar.gz compressed JSON).
 */
export async function readGarminPilot(
  content: Buffer,
  fileName: string,
): Promise<ParsedChecklistFile> {
  const entries = await parseTarGzip(content);

  const dataEntry = entries.find((e) => e.name === CONTENT_FILENAME);
  if (!dataEntry?.text) {
    throw new Error("Garmin Pilot: content.json not found in archive");
  }

  const container: GPContainer = JSON.parse(dataEntry.text);

  if (!isSupportedContainer(container)) {
    throw new Error("Garmin Pilot: unsupported container format");
  }

  const objects = container.objects[0];
  const groups = convertGroups(objects);

  return {
    name: container.name || fileName.replace(/\.gplt$/i, "") || fileName,
    format: ChecklistFormat.Gplt,
    filePath: undefined,
    groups,
    metadata: {
      aircraftRegistration: "",
      makeModel: "",
      copyright: "",
    },
  };
}

function convertGroups(objects: GPObjects): ChecklistGroup[] {
  // Build item lookup map: uuid -> ChecklistItem[]
  const itemsMap = new Map<string, ChecklistItem[]>();
  for (const gpItem of objects.checklistItems) {
    itemsMap.set(gpItem.uuid, convertChecklistItem(gpItem));
  }

  // Convert checklists and tag with their Garmin group key
  const ungrouped: [GarminGroupKey, Checklist][] = objects.checklists
    .map((gpChecklist): [GarminGroupKey, Checklist] => {
      const items: ChecklistItem[] = [];
      for (const itemUuid of gpChecklist.checklistItems) {
        const converted = itemsMap.get(itemUuid);
        if (converted) items.push(...converted);
      }
      return [
        [gpChecklist.type, gpChecklist.subtype],
        {
          id: crypto.randomUUID(),
          name: gpChecklist.name,
          items,
        },
      ];
    })
    .sort(([keyA], [keyB]) => compareGroupKeys(keyA, keyB));

  // Group checklists by EFIS group key
  const grouped = new Map<
    string,
    { key: EfisGroupKey; checklists: Checklist[] }
  >();
  for (const [garminKey, checklist] of ungrouped) {
    const efisKey = garminGroupKeyToEfis(garminKey);
    const keyStr = JSON.stringify(efisKey);
    const entry = grouped.get(keyStr);
    if (entry) {
      entry.checklists.push(checklist);
    } else {
      grouped.set(keyStr, { key: efisKey, checklists: [checklist] });
    }
  }

  return [...grouped.values()].map(
    ({ key: [category, title], checklists }) => ({
      id: crypto.randomUUID(),
      name: title,
      category,
      checklists,
    }),
  );
}

function convertChecklistItem(gpItem: GPChecklistItem): ChecklistItem[] {
  const result: ChecklistItem[] = [];

  if (gpItem.itemType === GP_ITEM_PLAIN_TEXT) {
    // Check item (plain text)
    if (gpItem.action) {
      result.push(
        makeItem(
          ChecklistItemType.ChallengeResponse,
          gpItem.title,
          gpItem.action,
        ),
      );
    } else {
      result.push(makeItem(ChecklistItemType.ChallengeOnly, gpItem.title));
    }
  } else if (gpItem.itemType === GP_ITEM_NOTE) {
    // Note item
    if (!gpItem.title && !gpItem.action) {
      // Empty space — skip
    } else if (gpItem.title) {
      result.push(makeItem(ChecklistItemType.Title, gpItem.title));
    }
    if (gpItem.action) {
      const standalone = !gpItem.title;
      result.push(
        ...multilineNoteToItems(gpItem.action, standalone).map((n) =>
          makeItem(n.type, n.challengeText, "", n.indent),
        ),
      );
    }
  } else if (LIVE_DATA_TYPES.has(gpItem.itemType)) {
    // Live data — store as challenge/response with token slug
    result.push(
      makeItem(
        ChecklistItemType.ChallengeResponse,
        gpItem.title,
        getLiveDataSlug(gpItem.itemType),
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

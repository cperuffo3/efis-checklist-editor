import { createTarGzip } from "nanotar";
import { ChecklistItemType } from "@/types/checklist";
import type { ChecklistFile, ChecklistItem } from "@/types/checklist";
import { getItemTypePrefix, shouldMergeNotes } from "../format-utils";
import { getGarminLiveDataType } from "./live-data";
import {
  CONTENT_FILENAME,
  DATA_MODEL_VERSION,
  CONTAINER_TYPE,
  PACKAGE_TYPE_VERSION,
  GP_ITEM_PLAIN_TEXT,
  GP_ITEM_NOTE,
  GP_ACTION_NEXT_CHECKLIST,
  efisGroupKeyToGarmin,
} from "./utils";

/** Garmin Pilot JSON output types */
interface GPItemOut {
  checked: boolean;
  itemType: number;
  title: string;
  uuid: string;
  action: string;
}

/**
 * Serialize a ChecklistFile to Garmin Pilot .gplt format (tar.gz compressed JSON).
 */
export async function writeGarminPilot(file: ChecklistFile): Promise<Buffer> {
  const checklistsMap = new Map<string, GPChecklistOut[]>();
  const allItems: GPItemOut[] = [];

  for (const group of file.groups) {
    const garminKey = efisGroupKeyToGarmin([group.category, group.name]);
    const keyStr = JSON.stringify(garminKey);
    const existing = checklistsMap.get(keyStr) ?? [];

    for (const checklist of group.checklists) {
      const items = convertItems(checklist.items);
      allItems.push(...items);

      const [type, subtype] = garminKey;
      existing.push({
        completionItem: GP_ACTION_NEXT_CHECKLIST,
        uuid: crypto.randomUUID(),
        checklistItems: items.map((i) => i.uuid),
        name: checklist.name,
        type,
        subtype,
      });
    }

    checklistsMap.set(keyStr, existing);
  }

  // Flatten all checklists in order
  const allChecklists: GPChecklistOut[] = [];
  for (const checklists of checklistsMap.values()) {
    allChecklists.push(...checklists);
  }

  const container = {
    dataModelVersion: DATA_MODEL_VERSION,
    packageTypeVersion: PACKAGE_TYPE_VERSION,
    name: file.name,
    type: CONTAINER_TYPE,
    objects: [
      {
        checklists: allChecklists,
        binders: [
          {
            uuid: crypto.randomUUID(),
            sortOrder: 0,
            name: file.name,
            checklists: allChecklists.map((c) => c.uuid),
          },
        ],
        checklistItems: allItems,
        version: 0,
      },
    ],
  };

  const json = JSON.stringify(container, null, 2);
  const compressed = await createTarGzip([
    { name: CONTENT_FILENAME, data: json },
  ]);

  return Buffer.from(compressed);
}

interface GPChecklistOut {
  completionItem: number;
  uuid: string;
  checklistItems: string[];
  name: string;
  type: number;
  subtype: number;
}

function convertItems(items: ChecklistItem[]): GPItemOut[] {
  const acc: [GPItemOut, ChecklistItem][] = [];

  for (const item of items) {
    const gpItem: GPItemOut = {
      checked: false,
      itemType: GP_ITEM_PLAIN_TEXT,
      title: item.challengeText,
      uuid: crypto.randomUUID(),
      action: item.responseText,
    };
    acc.push([gpItem, item]);

    switch (item.type) {
      case ChecklistItemType.ChallengeResponse: {
        const liveType = getGarminLiveDataType(item.responseText);
        if (liveType !== undefined) {
          gpItem.itemType = liveType;
          gpItem.action = "";
        } else {
          gpItem.itemType = GP_ITEM_PLAIN_TEXT;
          gpItem.action = item.responseText;
        }
        break;
      }

      case ChecklistItemType.ChallengeOnly:
        gpItem.action = "";
        break;

      case ChecklistItemType.Title:
        gpItem.itemType = GP_ITEM_NOTE;
        gpItem.action = "";
        break;

      case ChecklistItemType.Note:
      case ChecklistItemType.Caution:
      case ChecklistItemType.Warning: {
        gpItem.itemType = GP_ITEM_NOTE;
        gpItem.title = "";

        const text = getItemTypePrefix(item.type) + item.challengeText;

        const prev = acc.length >= 2 ? acc[acc.length - 2] : undefined;
        if (
          prev &&
          shouldMergeNotes(item, prev[1], [ChecklistItemType.Title])
        ) {
          const [lastGP] = prev;
          lastGP.action = lastGP.action ? `${lastGP.action}\n${text}` : text;
          acc.pop();
        } else {
          gpItem.action = text;
        }
        break;
      }
    }
  }

  return acc.map(([gpItem]) => gpItem);
}

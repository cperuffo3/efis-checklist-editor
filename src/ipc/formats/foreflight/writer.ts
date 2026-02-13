import { ChecklistGroupCategory, ChecklistItemType } from "@/types/checklist";
import type {
  ChecklistFile,
  ChecklistGroup,
  ChecklistItem,
} from "@/types/checklist";
import { getItemTypePrefix, shouldMergeNotes } from "../format-utils";
import { encrypt } from "./crypto";

const CONTAINER_TYPE = "checklist";
const SCHEMA_VERSION = "1.0";
const ITEM_HEADER = "comment";

interface FFItem {
  objectId: string;
  title?: string;
  detail?: string;
  type?: string;
  note?: string;
}

/**
 * Serialize a ChecklistFile to an encrypted ForeFlight .fmd buffer.
 */
export function writeForeFlight(file: ChecklistFile): Buffer {
  const container = {
    type: CONTAINER_TYPE,
    payload: {
      objectId: newObjectId(),
      schemaVersion: SCHEMA_VERSION,
      metadata: {
        name: file.name,
        detail: file.metadata.makeModel,
        tailNumber: file.metadata.aircraftRegistration?.toUpperCase(),
      },
      groups: buildGroups(file.groups),
    },
  };

  const json = JSON.stringify(container, null, 2);
  return encrypt(json);
}

function buildGroups(groups: ChecklistGroup[]): Array<{
  objectId: string;
  groupType: string;
  items: Array<{
    objectId: string;
    title: string;
    items: Array<{
      objectId: string;
      title: string;
      items: FFItem[];
    }>;
  }>;
}> {
  const categories: ChecklistGroupCategory[] = [
    ChecklistGroupCategory.Normal,
    ChecklistGroupCategory.Abnormal,
    ChecklistGroupCategory.Emergency,
  ];

  return categories.map((category) => ({
    objectId: newObjectId(),
    groupType: categoryToString(category),
    items: groups
      .filter((g) => g.category === category)
      .map((group) => ({
        objectId: newObjectId(),
        title: group.name,
        items: group.checklists.map((checklist) => ({
          objectId: newObjectId(),
          title: checklist.name,
          items: convertItems(checklist.items),
        })),
      })),
  }));
}

function convertItems(items: ChecklistItem[]): FFItem[] {
  const acc: [FFItem, ChecklistItem][] = [];

  for (const item of items) {
    const ffItem: FFItem = {
      objectId: newObjectId(),
      title: item.challengeText,
      detail: item.responseText.toUpperCase(),
    };
    acc.push([ffItem, item]);

    switch (item.type) {
      case ChecklistItemType.ChallengeResponse:
        break;

      case ChecklistItemType.ChallengeOnly:
        ffItem.detail = undefined;
        break;

      case ChecklistItemType.Title:
        ffItem.type = ITEM_HEADER;
        ffItem.detail = undefined;
        break;

      case ChecklistItemType.Note:
      case ChecklistItemType.Caution:
      case ChecklistItemType.Warning: {
        const text = getItemTypePrefix(item.type) + item.challengeText;

        const prev = acc.length >= 2 ? acc[acc.length - 2] : undefined;
        if (prev && shouldMergeNotes(item, prev[1])) {
          const [lastFF] = prev;
          if (lastFF.type !== ITEM_HEADER) {
            // Append as note to check item
            lastFF.note = lastFF.note ? lastFF.note + "\n" + text : text;
          } else {
            // Append as detail to detail item
            lastFF.detail = lastFF.detail ? lastFF.detail + "\n" + text : text;
          }
          acc.pop();
          break;
        }

        // Standalone note → detail item without title
        ffItem.type = ITEM_HEADER;
        ffItem.title = undefined;
        ffItem.detail = text;
        break;
      }
    }
  }

  return acc.map(([ffItem]) => ffItem);
}

function categoryToString(category: ChecklistGroupCategory): string {
  // ForeFlight expects lowercase group type values
  switch (category) {
    case ChecklistGroupCategory.Abnormal:
      return "abnormal";
    case ChecklistGroupCategory.Emergency:
      return "emergency";
    default:
      return "normal";
  }
}

function newObjectId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

import { ChecklistFormat, ChecklistItemType } from "@/types";
import type { ChecklistFile } from "@/types";
import type { FormatParser, ParsedChecklistFile } from "../types";

/** Map rdamazio/efis-editor item type strings to our internal enum */
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

/**
 * Detect whether the parsed JSON uses the rdamazio/efis-editor schema.
 *
 * Key indicator: groups have `title` instead of `name`, and items use
 * `prompt`/`expectation` with SCREAMING_CASE type values like `ITEM_CHALLENGE_RESPONSE`.
 */
function isRdamazioFormat(raw: Record<string, unknown>): boolean {
  if (!Array.isArray(raw.groups) || raw.groups.length === 0) return false;
  const firstGroup = raw.groups[0] as Record<string, unknown>;
  // rdamazio groups use "title" not "name"
  if (typeof firstGroup.title === "string" && !("name" in firstGroup))
    return true;
  // Also check items for ITEM_ prefix types
  if (Array.isArray(firstGroup.checklists)) {
    const firstChecklist = (
      firstGroup.checklists as Record<string, unknown>[]
    )[0];
    if (firstChecklist && Array.isArray(firstChecklist.items)) {
      const firstItem = (firstChecklist.items as Record<string, unknown>[])[0];
      if (
        firstItem &&
        typeof firstItem.type === "string" &&
        firstItem.type.startsWith("ITEM_")
      )
        return true;
    }
  }
  return false;
}

/** Parse rdamazio/efis-editor JSON format into our internal model */
function parseRdamazioFormat(
  raw: Record<string, unknown>,
  fileName: string,
): ParsedChecklistFile {
  const metadata = raw.metadata as Record<string, unknown> | undefined;

  return {
    name: (metadata?.name as string) ?? fileName,
    format: ChecklistFormat.Json,
    filePath: undefined,
    groups: Array.isArray(raw.groups)
      ? raw.groups.map((group: Record<string, unknown>) => ({
          id: crypto.randomUUID(),
          name: (group.title as string) ?? "",
          category: (group.category as string) ?? "normal",
          checklists: Array.isArray(group.checklists)
            ? group.checklists.map((checklist: Record<string, unknown>) => ({
                id: crypto.randomUUID(),
                name: (checklist.title as string) ?? "",
                items: Array.isArray(checklist.items)
                  ? checklist.items.map((item: Record<string, unknown>) => ({
                      id: crypto.randomUUID(),
                      type:
                        RDAMAZIO_TYPE_MAP[item.type as string] ??
                        ChecklistItemType.ChallengeResponse,
                      challengeText: (item.prompt as string) ?? "",
                      responseText: (item.expectation as string) ?? "",
                      indent: Math.min((item.indent as number) ?? 0, 3) as
                        | 0
                        | 1
                        | 2
                        | 3,
                      centered: (item.centered as boolean) ?? false,
                      collapsible: false,
                    }))
                  : [],
              }))
            : [],
        }))
      : [],
    metadata: {
      aircraftRegistration: "",
      makeModel: "",
      copyright: "",
    },
  };
}

/**
 * JSON format parser — supports both our internal format and rdamazio/efis-editor format.
 *
 * On parse: auto-detects whether the JSON uses our schema or the rdamazio schema
 * (groups with `title` and items with `prompt`/`expectation`/`ITEM_*` types).
 * Regenerates all IDs so imported data never collides with existing store entries.
 *
 * On serialize: strips runtime-only fields (id, dirty, lastModified)
 * and writes only data fields in our internal format.
 */
export const jsonParser: FormatParser = {
  parse(content: Buffer, fileName: string): ParsedChecklistFile {
    const raw = JSON.parse(content.toString("utf-8"));

    if (isRdamazioFormat(raw)) {
      return parseRdamazioFormat(raw, fileName);
    }

    return {
      name: raw.name ?? fileName,
      format: ChecklistFormat.Json,
      filePath: undefined,
      groups: Array.isArray(raw.groups)
        ? raw.groups.map((group: Record<string, unknown>) => ({
            id: crypto.randomUUID(),
            name: (group.name as string) ?? "",
            category: (group.category as string) ?? "normal",
            checklists: Array.isArray(group.checklists)
              ? group.checklists.map((checklist: Record<string, unknown>) => ({
                  id: crypto.randomUUID(),
                  name: (checklist.name as string) ?? "",
                  items: Array.isArray(checklist.items)
                    ? checklist.items.map((item: Record<string, unknown>) => ({
                        id: crypto.randomUUID(),
                        type: (item.type as string) ?? "challenge_response",
                        challengeText: (item.challengeText as string) ?? "",
                        responseText: (item.responseText as string) ?? "",
                        indent: (item.indent as number) ?? 0,
                        centered: (item.centered as boolean) ?? false,
                        collapsible: (item.collapsible as boolean) ?? false,
                      }))
                    : [],
                }))
              : [],
          }))
        : [],
      metadata: {
        aircraftRegistration:
          (raw.metadata?.aircraftRegistration as string) ?? "",
        makeModel: (raw.metadata?.makeModel as string) ?? "",
        copyright: (raw.metadata?.copyright as string) ?? "",
      },
    };
  },

  serialize(file: ChecklistFile): string {
    const data = {
      name: file.name,
      format: file.format,
      groups: file.groups.map((group) => ({
        name: group.name,
        category: group.category,
        checklists: group.checklists.map((checklist) => ({
          name: checklist.name,
          items: checklist.items.map((item) => ({
            type: item.type,
            challengeText: item.challengeText,
            responseText: item.responseText,
            indent: item.indent,
            centered: item.centered,
            collapsible: item.collapsible,
          })),
        })),
      })),
      metadata: {
        aircraftRegistration: file.metadata.aircraftRegistration,
        makeModel: file.metadata.makeModel,
        copyright: file.metadata.copyright,
      },
    };

    return JSON.stringify(data, null, 2);
  },
};

import { ChecklistItemType, type ChecklistItem } from "@/types/checklist";

/** Prefix map for note-like item types */
const ITEM_TYPE_PREFIXES = new Map<ChecklistItemType, string>([
  [ChecklistItemType.Note, "NOTE: "],
  [ChecklistItemType.Caution, "CAUTION: "],
  [ChecklistItemType.Warning, "WARNING: "],
]);

/** Reverse map: prefix string -> item type */
const PREFIX_TO_ITEM_TYPE = new Map<string, ChecklistItemType>(
  [...ITEM_TYPE_PREFIXES.entries()].map(([type, prefix]) => [prefix, type]),
);

/** Get the text prefix for a note-like item type, or empty string */
export function getItemTypePrefix(type: ChecklistItemType): string {
  return ITEM_TYPE_PREFIXES.get(type) ?? "";
}

/**
 * Parse a prompt string that may start with a type prefix (e.g. "NOTE: ...").
 * Returns the detected type and cleaned prompt text.
 */
export function promptToPartialItem(
  prompt: string,
): Pick<ChecklistItem, "type"> & { prompt: string } {
  for (const [prefix, type] of PREFIX_TO_ITEM_TYPE) {
    if (prompt.startsWith(prefix)) {
      return { type, prompt: prompt.slice(prefix.length) };
    }
  }
  return { type: ChecklistItemType.Note, prompt };
}

/**
 * Convert possibly multiline note text into ChecklistItem partials.
 *
 * - standalone single-line: indent 0
 * - standalone multiline or attached: indent 1
 */
export function multilineNoteToItems(
  text: string,
  standalone: boolean,
): Array<{
  type: ChecklistItemType;
  challengeText: string;
  indent: 0 | 1;
}> {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => {
    const parsed = promptToPartialItem(line);
    return {
      type: parsed.type,
      challengeText: parsed.prompt,
      indent: lines.length > 1 || !standalone ? 1 : 0,
    };
  });
}

/**
 * Check whether a note item should be merged into the previous item
 * (for formats like ForeFlight/Garmin Pilot that combine notes).
 */
export function shouldMergeNotes(
  item: ChecklistItem,
  lastItem: ChecklistItem,
  titleLikeTypes: ChecklistItemType[] = [
    ChecklistItemType.Title,
    ChecklistItemType.ChallengeResponse,
  ],
): boolean {
  return (
    (titleLikeTypes.includes(lastItem.type) && lastItem.indent < item.indent) ||
    ([...ITEM_TYPE_PREFIXES.keys()].includes(lastItem.type) &&
      lastItem.indent <= item.indent &&
      lastItem.indent >= 1)
  );
}

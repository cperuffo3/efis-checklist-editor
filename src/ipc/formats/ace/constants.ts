import { ChecklistItemType } from "@/types/checklist";

export const HEADER = Buffer.from([0xf0, 0xf0, 0xf0, 0xf0, 0x00, 0x01]);
export const GROUP_HEADER = Buffer.from([0x3c, 0x30]); // '<0'
export const GROUP_END = ">";
export const CHECKLIST_HEADER = Buffer.from([0x28, 0x30]); // '(0'
export const CHECKLIST_END = ")";
export const FILE_END = "END";
export const CRLF = Buffer.from([0x0d, 0x0a]);

/** Map ACE type code byte to our ChecklistItemType */
export function itemTypeForCode(code: number): ChecklistItemType {
  switch (code) {
    case 0x77: // 'w'
      return ChecklistItemType.Warning;
    case 0x61: // 'a'
      return ChecklistItemType.Caution;
    case 0x6e: // 'n'
      return ChecklistItemType.Note;
    case 0x70: // 'p' - plaintext maps to Note in our model
      return ChecklistItemType.Note;
    case 0x63: // 'c'
      return ChecklistItemType.ChallengeOnly;
    case 0x72: // 'r'
      return ChecklistItemType.ChallengeResponse;
    case 0x74: // 't'
      return ChecklistItemType.Title;
    default:
      throw new Error("Unexpected ACE item type code: 0x" + code.toString(16));
  }
}

/** Map our ChecklistItemType to ACE type code byte */
export function codeForItemType(type: ChecklistItemType): number {
  switch (type) {
    case ChecklistItemType.Warning:
      return 0x77; // 'w'
    case ChecklistItemType.Caution:
      return 0x61; // 'a'
    case ChecklistItemType.Note:
      return 0x6e; // 'n'
    case ChecklistItemType.ChallengeOnly:
      return 0x63; // 'c'
    case ChecklistItemType.ChallengeResponse:
      return 0x72; // 'r'
    case ChecklistItemType.Title:
      return 0x74; // 't'
    default:
      throw new Error(`Unexpected item type for ACE export: ${type}`);
  }
}

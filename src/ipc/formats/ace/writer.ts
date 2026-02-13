import crc32 from "buffer-crc32";
import { ChecklistItemType } from "@/types/checklist";
import type { ChecklistFile } from "@/types/checklist";
import * as C from "./constants";

/**
 * Writes a ChecklistFile to Garmin ACE binary format.
 *
 * Format: latin1 encoding, CRLF line endings.
 * Header → metadata (5 lines) → groups → checklists → items → "END" → CRC32.
 */
export function writeAce(file: ChecklistFile): Buffer {
  const parts: Buffer[] = [];

  function addBuf(b: Buffer) {
    parts.push(b);
  }
  function addBytes(...bytes: number[]) {
    addBuf(Buffer.from(bytes));
  }
  function addLine(line?: string) {
    if (line) addBuf(Buffer.from(line, "latin1"));
    addBuf(C.CRLF);
  }

  // Header
  addBuf(C.HEADER);
  addBytes(0, 0); // defaultGroupIndex, defaultChecklistIndex
  addLine();

  // Metadata (5 lines) — Garmin's editor considers file corrupt if any are empty
  addLine(file.name || " ");
  addLine(file.metadata.makeModel || " ");
  addLine(file.metadata.aircraftRegistration || " ");
  addLine(" "); // manufacturerInfo — not in our model
  addLine(file.metadata.copyright || " ");

  // Groups
  for (const group of file.groups) {
    // G3X doesn't handle empty groups well, skip them
    if (
      group.checklists.length === 0 ||
      group.checklists.every((cl) => cl.items.length === 0)
    ) {
      continue;
    }

    addBuf(C.GROUP_HEADER);
    addLine(group.name);

    for (const checklist of group.checklists) {
      // G3X doesn't handle empty checklists well, skip them
      if (checklist.items.length === 0) continue;

      addBuf(C.CHECKLIST_HEADER);
      addLine(checklist.name);

      for (const item of checklist.items) {
        const typeCode = C.codeForItemType(item.type);
        let indentCode = item.indent + 0x30;
        if (item.centered) {
          indentCode = 0x63; // 'c'
        }
        addBytes(typeCode, indentCode);

        let text = item.challengeText;
        if (item.type === ChecklistItemType.ChallengeResponse) {
          text += "~" + item.responseText;
        }
        addLine(text);
      }

      addLine(C.CHECKLIST_END);
    }

    addLine(C.GROUP_END);
  }

  addLine(C.FILE_END);

  // Calculate CRC of all content so far
  const content = Buffer.concat(parts);
  const crcValue = crc32.signed(content);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32LE(~crcValue >>> 0, 0);

  return Buffer.concat([content, crcBuf]);
}

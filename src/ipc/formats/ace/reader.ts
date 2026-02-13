import * as crc32 from "buffer-crc32";
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
import type { ParsedChecklistFile } from "../types";
import * as C from "./constants";

/**
 * Reads a Garmin ACE binary checklist file from a Buffer.
 *
 * Format: latin1 encoding, CRLF line endings.
 * Header → metadata (5 lines) → groups → checklists → items → "END" → CRC32.
 */
export function readAce(buf: Buffer, fileName: string): ParsedChecklistFile {
  let offset = 0;

  // --- helpers ---

  function peekBytes(len: number): Buffer {
    const slice = buf.subarray(offset, offset + len);
    if (slice.length !== len) {
      throw new Error(
        `ACE: truncated file, expected ${len} bytes at offset ${offset}`,
      );
    }
    return slice;
  }

  function readBytes(len: number): Buffer {
    const b = peekBytes(len);
    offset += len;
    return b;
  }

  function consumeBytes(expected: Buffer): boolean {
    const slice = peekBytes(expected.length);
    if (slice.equals(expected)) {
      offset += expected.length;
      return true;
    }
    return false;
  }

  function peekLine(): string {
    // Find CRLF
    let idx = offset;
    while (idx < buf.length - 1) {
      if (buf[idx] === 0x0d && buf[idx + 1] === 0x0a) break;
      idx++;
    }
    if (
      idx >= buf.length - 1 &&
      !(buf[idx] === 0x0d && buf[idx + 1] === 0x0a)
    ) {
      throw new Error("ACE: truncated file, reached EOF reading line");
    }
    return buf.subarray(offset, idx).toString("latin1");
  }

  function readLine(): string {
    const line = peekLine();
    offset += line.length + 2; // +2 for CRLF
    return line;
  }

  function consumeLine(expected: string): boolean {
    const line = peekLine();
    if (line === expected) {
      offset += line.length + 2;
      return true;
    }
    return false;
  }

  // --- item reader ---

  function readItem(): ChecklistItem | null {
    // Empty line = space item, skip it
    if (consumeLine("")) {
      return null;
    }

    const typeCode = readBytes(1)[0];
    const type = C.itemTypeForCode(typeCode);
    const indentCode = readBytes(1)[0];
    let indent: 0 | 1 | 2 | 3 = 0;
    let centered = false;

    if (indentCode === 0x63) {
      // 'c'
      centered = true;
    } else {
      const raw = indentCode - 0x30;
      indent = Math.min(3, Math.max(0, raw)) as 0 | 1 | 2 | 3;
    }

    let prompt = readLine();
    let expectation = "";

    if (type === ChecklistItemType.ChallengeResponse) {
      const splits = prompt.split("~");
      prompt = splits[0];
      expectation = splits.length > 1 ? splits.slice(1).join("~") : "";
    }

    return {
      id: crypto.randomUUID(),
      type,
      challengeText: prompt,
      responseText: expectation,
      indent,
      centered,
      collapsible: false,
    };
  }

  // --- checklist reader ---

  function readChecklist(): Checklist {
    if (!consumeBytes(C.CHECKLIST_HEADER)) {
      throw new Error("ACE: bad checklist header: " + peekLine());
    }
    const title = readLine();
    const items: ChecklistItem[] = [];

    while (!consumeLine(C.CHECKLIST_END)) {
      const item = readItem();
      if (item) items.push(item);
    }

    return { id: crypto.randomUUID(), name: title, items };
  }

  // --- group reader ---

  function readGroup(): ChecklistGroup {
    if (!consumeBytes(C.GROUP_HEADER)) {
      throw new Error("ACE: bad group header: " + peekLine());
    }
    const title = readLine();
    const checklists: Checklist[] = [];

    while (!consumeLine(C.GROUP_END)) {
      checklists.push(readChecklist());
    }

    return {
      id: crypto.randomUUID(),
      name: title,
      category: ChecklistGroupCategory.Normal,
      checklists,
    };
  }

  // --- main read ---

  // Verify CRC before parsing
  const expectedCrc = crc32.signed(buf.subarray(0, buf.length - 4));

  // Read header
  const header = readBytes(C.HEADER.length);
  if (!header.equals(C.HEADER)) {
    throw new Error(`ACE: unexpected file header in ${fileName}`);
  }

  // Default group/checklist indices (skip)
  readBytes(1); // defaultGroup
  readBytes(1); // defaultChecklist
  if (!consumeLine("")) {
    throw new Error("ACE: unexpected header ending");
  }

  // Metadata (5 lines)
  let name = readLine();
  if (!name) {
    name = fileName.replace(/\.ace$/i, "") || fileName;
  }
  const makeAndModel = readLine().trim();
  const aircraftInfo = readLine().trim();
  readLine(); // manufacturerInfo - not in our model
  const copyrightInfo = readLine().trim();

  // Groups
  const groups: ChecklistGroup[] = [];
  while (!consumeLine(C.FILE_END)) {
    groups.push(readGroup());
  }

  // Verify CRC
  const crcBytes = buf.subarray(offset, offset + 4);
  if (crcBytes.length === 4) {
    const fileCrc = ~crcBytes.readUInt32LE(0);
    if (fileCrc !== expectedCrc) {
      throw new Error(
        `ACE: checksum mismatch! Expected ${expectedCrc.toString(16)}, got ${fileCrc.toString(16)}`,
      );
    }
  }

  return {
    name,
    format: ChecklistFormat.Ace,
    filePath: undefined,
    groups,
    metadata: {
      aircraftRegistration: aircraftInfo,
      makeModel: makeAndModel,
      copyright: copyrightInfo,
    },
  };
}

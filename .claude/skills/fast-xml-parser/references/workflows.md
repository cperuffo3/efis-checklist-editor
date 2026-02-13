# fast-xml-parser Workflows

## Contents

- Format Parser Architecture
- Implementing an XML Format Parser
- Garmin ACE Binary Format (NOT XML)
- IPC Integration for Format Parsers
- Validation Pipeline

## Format Parser Architecture

All format parsers implement a common interface. See the **orpc** skill for IPC wiring.

```typescript
// src/ipc/parsers/types.ts
import type { ChecklistFile } from "@/types/checklist";

export interface FormatParser {
  parse(content: string | Buffer): ChecklistFile;
  serialize(file: ChecklistFile): string | Buffer;
}
```

XML-based parsers use `string`; binary parsers (like ACE) use `Buffer`.

```typescript
// src/ipc/parsers/index.ts
import type { FormatParser } from "./types";
import { jsonParser } from "./json-parser";
// import { aceParser } from "./ace-parser";  // Binary, NOT fast-xml-parser

export const parsers: Record<string, FormatParser> = {
  json: jsonParser,
  // ace: aceParser,
};
```

## Implementing an XML Format Parser

Copy this checklist and track progress:

- [ ] Step 1: Define the XML schema mapping types
- [ ] Step 2: Create shared XML config (parser + builder options)
- [ ] Step 3: Implement `parse()` — XML string → internal model
- [ ] Step 4: Implement `serialize()` — internal model → XML string
- [ ] Step 5: Add `isArray` for all repeating tags
- [ ] Step 6: Test round-trip: parse → serialize → parse, compare
- [ ] Step 7: Register in parser index and wire to IPC router

```typescript
// src/ipc/parsers/example-xml-parser.ts
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import { XML_PARSE_OPTIONS, XML_BUILD_OPTIONS } from "./xml-config";
import type { FormatParser } from "./types";
import type { ChecklistFile } from "@/types/checklist";

// Step 1: Define raw XML shape (what fast-xml-parser produces)
interface RawXmlChecklist {
  checklistFile: {
    "@_version": string;
    group: Array<{
      "@_name": string;
      "@_category"?: string;
      checklist: Array<{
        "@_name": string;
        item: Array<{
          "@_type": string;
          challenge?: string;
          response?: string;
        }>;
      }>;
    }>;
  };
}

export const exampleXmlParser: FormatParser = {
  parse(content: string): ChecklistFile {
    const valid = XMLValidator.validate(content);
    if (valid !== true) {
      throw new Error(
        `Invalid XML at line ${valid.err.line}: ${valid.err.msg}`,
      );
    }

    const parser = new XMLParser(XML_PARSE_OPTIONS);
    const raw = parser.parse(content) as RawXmlChecklist;
    return mapFromXml(raw);
  },

  serialize(file: ChecklistFile): string {
    const raw = mapToXml(file);
    const builder = new XMLBuilder(XML_BUILD_OPTIONS);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(raw);
  },
};

function mapFromXml(raw: RawXmlChecklist): ChecklistFile {
  // Transform raw parsed XML to internal ChecklistFile type
  // Map @_type strings to ChecklistItemType enum values
  // Handle missing optional fields with defaults
  throw new Error("Implement XML-to-internal mapping");
}

function mapToXml(file: ChecklistFile): RawXmlChecklist {
  // Transform internal ChecklistFile to XML-ready structure
  // Convert enum values back to @_type strings
  throw new Error("Implement internal-to-XML mapping");
}
```

### Round-Trip Validation

1. Parse original XML to internal model
2. Serialize internal model back to XML
3. Parse the re-serialized XML
4. Compare internal models — they must be structurally equal
5. If validation fails, fix mapping logic and repeat step 1

```typescript
function validateRoundTrip(originalXml: string): boolean {
  const model1 = exampleXmlParser.parse(originalXml);
  const reserializedXml = exampleXmlParser.serialize(model1);
  const model2 = exampleXmlParser.parse(reserializedXml);
  return deepEqual(model1, model2);
}
```

## Garmin ACE Binary Format (NOT XML)

ACE is a **binary format**. Do NOT use fast-xml-parser. Key facts from the reference implementation (rdamazio/efis-editor):

| Component                    | Detail                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| Encoding                     | Latin-1 (ISO-8859-1)                                              |
| Line endings                 | CRLF (`0x0D 0x0A`)                                                |
| Header                       | `0xF0 0xF0 0xF0 0xF0 0x00 0x01`                                   |
| Group marker                 | `0x3C 0x30` (`<0`) + title + CRLF, ends with `>` line             |
| Checklist marker             | `0x28 0x30` (`(0`) + title + CRLF, ends with `)` line             |
| Item format                  | `[type_byte][indent_byte][text]CRLF`                              |
| Challenge/Response separator | `~` (tilde) between prompt and expectation                        |
| File end                     | `END` line                                                        |
| CRC                          | Last 4 bytes: inverted CRC32 (little-endian) of everything before |

### Item Type Bytes

| Byte   | Char | Type               |
| ------ | ---- | ------------------ |
| `0x72` | `r`  | Challenge/Response |
| `0x63` | `c`  | Challenge Only     |
| `0x74` | `t`  | Title              |
| `0x6E` | `n`  | Note               |
| `0x70` | `p`  | Plaintext          |
| `0x77` | `w`  | Warning            |
| `0x61` | `a`  | Caution            |

### Indent Encoding

- `0x30` = indent 0, `0x31` = indent 1, `0x32` = indent 2, `0x33` = indent 3
- `0x63` (`c`) = centered

### ACE Parser Skeleton

```typescript
// src/ipc/parsers/ace-parser.ts
import { Buffer } from "node:buffer";
import type { FormatParser } from "./types";
import type { ChecklistFile } from "@/types/checklist";

const HEADER = Buffer.from([0xf0, 0xf0, 0xf0, 0xf0, 0x00, 0x01]);
const CRLF = Buffer.from([0x0d, 0x0a]);

export const aceParser: FormatParser = {
  parse(content: Buffer): ChecklistFile {
    // 1. Verify header bytes match HEADER constant
    // 2. Read default group/checklist indices (2 bytes after header)
    // 3. Read metadata lines: name, makeModel, aircraftInfo, manufacturer, copyright
    // 4. Loop: read groups (start: 0x3C30, end: ">" line)
    //    Loop: read checklists (start: 0x2830, end: ")" line)
    //      Loop: read items (type byte + indent byte + text until CRLF)
    // 5. Consume "END" line
    // 6. Verify CRC32: ~crc32(content[0..len-4]) === last 4 bytes (LE)
    throw new Error("Not yet implemented");
  },

  serialize(file: ChecklistFile): Buffer {
    // 1. Write HEADER bytes
    // 2. Write default group/checklist + CRLF
    // 3. Write metadata lines (pad empty fields with " ")
    // 4. Write groups/checklists/items with marker bytes
    //    Skip empty groups and empty checklists (G3X requirement)
    // 5. Write "END" + CRLF
    // 6. Compute CRC32 of all bytes so far, invert, write as 4 LE bytes
    throw new Error("Not yet implemented");
  },
};
```

**Dependency needed:** `buffer-crc32` or `crc-32` for checksum computation. Not `fast-xml-parser`.

## IPC Integration for Format Parsers

Parsers run in the **main process** only. See the **orpc** skill for the full IPC pattern.

```typescript
// src/ipc/checklist/handlers.ts
import { os } from "@orpc/server";
import { z } from "zod";
import { parsers } from "@/ipc/parsers";

export const importFile = os
  .input(z.object({ filePath: z.string(), format: z.string() }))
  .handler(async ({ input }) => {
    const fs = await import("node:fs/promises");
    const content = await fs.readFile(input.filePath);
    const parser = parsers[input.format];
    if (!parser) throw new Error(`Unsupported format: ${input.format}`);
    return parser.parse(content);
  });
```

## Validation Pipeline

For XML formats, validate XML syntax first, then validate parsed structure with **zod** schemas.

```typescript
import { XMLValidator, XMLParser } from "fast-xml-parser";
import { z } from "zod";

function safeParseXml<T>(xml: string, options: object): T {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(
      `XML validation failed at line ${validation.err.line}, ` +
        `col ${validation.err.col}: ${validation.err.msg}`,
    );
  }

  const parser = new XMLParser(options);
  return parser.parse(xml) as T;
}

// Then validate the parsed shape with zod
const xmlChecklistSchema = z.object({
  checklistFile: z.object({
    group: z.array(
      z.object({
        "@_name": z.string(),
        checklist: z.array(
          z.object({
            "@_name": z.string(),
            item: z.array(
              z.object({
                "@_type": z.string(),
                challenge: z.string().optional(),
                response: z.string().optional(),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
});

// Full pipeline: XML syntax → parse → schema validation → internal mapping
const raw = safeParseXml(xmlString, XML_PARSE_OPTIONS);
const validated = xmlChecklistSchema.parse(raw);
const internal = mapFromXml(validated);
```

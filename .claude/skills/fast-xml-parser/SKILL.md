---
name: fast-xml-parser
description: |
  Configures fast-xml-parser for XML parsing and building in the Electron main process.
  Use when: implementing XML-based format parsers, converting between XML and JS objects for checklist data, or validating XML input files.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# fast-xml-parser

Pure JavaScript XML parser/builder with zero native dependencies. Converts XML to JS objects (`XMLParser`) and JS objects back to XML (`XMLBuilder`). Includes `XMLValidator` for syntax checking.

## WARNING: Garmin ACE Is NOT XML

The project brief calls ACE "XML-based" — this is **incorrect**. ACE (.ace) is a **binary format** with a CRC32 checksum, control-byte prefixed lines, and latin1 encoding. The reference implementation (rdamazio/efis-editor) parses ACE as raw bytes, not XML.

**Do NOT use fast-xml-parser for ACE files.** Use `Uint8Array`/`Buffer` operations with `buffer-crc32` instead. See [workflows](references/workflows.md) for the correct ACE approach.

fast-xml-parser is appropriate for **future XML-based formats** (e.g., ForeFlight .fmd if XML, or custom XML interchange).

## Quick Start

### Parse XML to JS Object

```typescript
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["checklist", "item"].includes(tagName),
});

const result = parser.parse(xmlString);
```

### Build JS Object to XML

```typescript
import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
});

const xml = builder.build(jsObject);
```

### Validate Before Parsing

```typescript
import { XMLValidator } from "fast-xml-parser";

const result = XMLValidator.validate(xmlString);
if (result !== true) {
  throw new Error(`Invalid XML at line ${result.err.line}: ${result.err.msg}`);
}
```

## Key Concepts

| Concept               | Usage                                        | Example                               |
| --------------------- | -------------------------------------------- | ------------------------------------- |
| `attributeNamePrefix` | Distinguishes attributes from child elements | `"@_"` → `{ "@_id": "1" }`            |
| `isArray`             | Forces tags to always parse as arrays        | Prevents single-child becoming object |
| `preserveOrder`       | Maintains element ordering in round-trips    | Required for lossless parse→build     |
| `stopNodes`           | Treats inner content as raw string           | `["*.script", "*.raw"]`               |
| `suppressEmptyNode`   | Omits `<tag></tag>` for empty values         | Cleaner XML output                    |

## Critical Options

**Always match parser and builder options.** If you parse with `attributeNamePrefix: "@_"`, you must build with the same prefix.

```typescript
// Shared config ensures round-trip fidelity
const XML_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName: string) => ARRAY_TAGS.includes(tagName),
} as const;

const parser = new XMLParser(XML_OPTIONS);
const builder = new XMLBuilder({ ...XML_OPTIONS, format: true });
```

## See Also

- [patterns](references/patterns.md) — Parser/builder configuration, round-trip fidelity, type coercion pitfalls
- [workflows](references/workflows.md) — IPC integration, ACE binary format, format parser architecture

## Related Skills

- See the **zod** skill for validating parsed XML data against schemas
- See the **typescript** skill for typing parsed XML structures
- See the **electron** skill for main-process IPC where parsers run
- See the **orpc** skill for wiring format parsers into the IPC layer

## Documentation Resources

> Fetch latest fast-xml-parser documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "fast-xml-parser"
2. Query with `mcp__context7__query-docs` using the resolved library ID

**Library ID:** `/naturalintelligence/fast-xml-parser`

**Recommended Queries:**

- "XMLParser XMLBuilder configuration options attributes"
- "preserveOrder round-trip parse build"
- "isArray stopNodes alwaysCreateTextNode options"

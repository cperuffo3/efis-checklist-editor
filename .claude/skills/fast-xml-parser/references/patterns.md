# fast-xml-parser Patterns

## Contents

- Shared Configuration Pattern
- Forcing Array Tags with isArray
- Round-Trip Fidelity with preserveOrder
- Type Coercion Pitfalls
- Handling XML Declaration
- Anti-Patterns

## Shared Configuration Pattern

Parser and builder MUST share identical attribute/naming options. Define once, use everywhere.

```typescript
// src/ipc/parsers/xml-config.ts
import type { X2jOptions, XmlBuilderOptions } from "fast-xml-parser";

const ARRAY_TAGS = ["group", "checklist", "item"];

export const XML_PARSE_OPTIONS: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
  isArray: (_name: string, jpath: string) => {
    const tag = jpath.split(".").pop() ?? "";
    return ARRAY_TAGS.includes(tag);
  },
};

export const XML_BUILD_OPTIONS: Partial<XmlBuilderOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
};
```

```typescript
// Usage in a format parser
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { XML_PARSE_OPTIONS, XML_BUILD_OPTIONS } from "./xml-config";

export function parse(content: string): ChecklistFile {
  const parser = new XMLParser(XML_PARSE_OPTIONS);
  const raw = parser.parse(content);
  return mapToInternal(raw);
}

export function serialize(file: ChecklistFile): string {
  const builder = new XMLBuilder(XML_BUILD_OPTIONS);
  const raw = mapToXmlStructure(file);
  return builder.build(raw);
}
```

## Forcing Array Tags with isArray

Without `isArray`, a single `<item>` child becomes an object, but multiple become an array. This breaks iteration.

```typescript
// BAD — XML with one item parses differently than XML with two items
const xml1 = "<list><item>A</item></list>";
// Parses to: { list: { item: "A" } }  ← string, not array!

const xml2 = "<list><item>A</item><item>B</item></list>";
// Parses to: { list: { item: ["A", "B"] } }  ← array

// GOOD — isArray ensures consistent array type
const parser = new XMLParser({
  isArray: (tagName) => tagName === "item",
});
// xml1 now parses to: { list: { item: ["A"] } }  ← always array
```

The `isArray` callback receives `(tagName, jpath, isLeafNode, isAttribute, leafValue)`. Use `jpath` for context-sensitive decisions:

```typescript
isArray: (_name, jpath) => {
  // Only force array for items under a checklist, not elsewhere
  return jpath === "file.group.checklist.item";
},
```

## Round-Trip Fidelity with preserveOrder

Standard parsing loses element order. If order matters (mixed content, specific tag sequences), use `preserveOrder: true`.

```typescript
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const options = {
  ignoreAttributes: false,
  preserveOrder: true,
  commentPropName: "#comment",
};

const parser = new XMLParser(options);
const jsObj = parser.parse(originalXml);

const builder = new XMLBuilder(options);
const rebuilt = builder.build(jsObj);
// Element order is preserved
```

**Trade-off:** `preserveOrder` changes the output shape to an array-of-objects format that is harder to traverse. Only use when order preservation is required.

## Type Coercion Pitfalls

### WARNING: parseTagValue Converts Strings to Numbers

**The Problem:**

```typescript
// BAD — parseTagValue: true (default) silently converts numeric strings
const xml = "<item><code>007</code><zip>02134</zip></item>";
const parser = new XMLParser({ parseTagValue: true });
// Result: { item: { code: 7, zip: 2134 } }
// Leading zeros are LOST
```

**Why This Breaks:**

1. Aircraft registration like "N172SP" is safe (not numeric), but part codes could be
2. Identifiers and formatted numbers that start with zeros lose their format
3. The conversion is silent — no warning, no error

**The Fix:**

```typescript
// GOOD — Disable for string-heavy data, convert manually where needed
const parser = new XMLParser({
  parseTagValue: false,
  parseAttributeValue: false,
});
// Result: { item: { code: "007", zip: "02134" } }
// Then parse numbers explicitly where you know they're numeric
```

### WARNING: Empty Tags Become Empty String or True

```typescript
const xml = "<item><note/><checked/></item>";
// Default: empty self-closing tags become ""
// With allowBooleanAttributes, may become true
// ALWAYS check for empty values when mapping to internal types
```

## Handling XML Declaration

fast-xml-parser does not auto-add XML declarations to output. Prepend manually:

```typescript
const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
});

const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
const body = builder.build(data);
const fullXml = xmlDeclaration + body;
```

## Anti-Patterns

### WARNING: Mismatched Parser/Builder Options

**The Problem:**

```typescript
// BAD — Parser uses "@_" prefix, builder uses default (no prefix)
const parser = new XMLParser({ attributeNamePrefix: "@_" });
const builder = new XMLBuilder({}); // Missing prefix!

const parsed = parser.parse('<item id="1">text</item>');
// parsed = { item: { "@_id": "1", "#text": "text" } }
const rebuilt = builder.build(parsed);
// Attributes are lost or malformed
```

**Why This Breaks:**

1. Builder does not recognize `@_`-prefixed keys as attributes
2. They appear as child elements instead, corrupting the XML structure
3. Round-trip data integrity is silently lost

**The Fix:** Use a shared config object (see Shared Configuration Pattern above).

### WARNING: Not Using isArray for Variable-Count Children

**The Problem:**

```typescript
// BAD — Works in testing with multiple items, breaks with one item
function getItems(parsed: any): ChecklistItem[] {
  return parsed.checklist.item.map((i: any) => mapItem(i));
  // TypeError: parsed.checklist.item.map is not a function
  // (single item parsed as object, not array)
}
```

**Why This Breaks:**

1. Fast-xml-parser returns an array only when 2+ sibling elements share a tag name
2. A single child element becomes a direct value (object or string)
3. Tests with sample data containing multiple items pass, production files with one item crash

**The Fix:** Always use `isArray` for any tag that can repeat. Test with 0, 1, and N children.

**When You Might Be Tempted:** During prototyping with rich sample XML files that always have multiple children. The bug only surfaces with minimal real-world data.

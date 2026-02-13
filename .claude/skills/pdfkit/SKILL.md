---
name: pdfkit
description: |
  Generates PDF exports of checklist files in the Electron main process.
  Use when: creating PDF export functionality, rendering checklists as printable documents,
  building the pdf-generator.ts parser, or working on the export IPC handler for PDF format.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# PDFKit Skill

PDFKit runs in the **Electron main process only** — never in the renderer. In this project, it lives at `src/ipc/parsers/pdf-generator.ts` and is invoked through the oRPC `checklist.exportFile` handler. PDFKit is a Node.js readable stream — pipe it to `fs.createWriteStream()` for file output or collect chunks into a Buffer.

## Quick Start

### Buffer-based export (for IPC handler)

```typescript
import PDFDocument from "pdfkit";

export function generatePdf(file: ChecklistFile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Render content...
    doc.fontSize(20).text(file.name, { align: "center" });
    doc.end();
  });
}
```

### File-based export (direct write)

```typescript
import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";

const doc = new PDFDocument({ size: "LETTER", bufferPages: true });
doc.pipe(createWriteStream(outputPath));
// ...render content...
doc.end();
```

## Key Concepts

| Concept          | Usage                             | Example                               |
| ---------------- | --------------------------------- | ------------------------------------- |
| Page size        | Constructor option                | `new PDFDocument({ size: "LETTER" })` |
| Chainable API    | All drawing methods return `doc`  | `doc.fontSize(12).text("hello")`      |
| Text positioning | Explicit x,y or auto-flow         | `doc.text("hello", 50, 100)`          |
| Vector graphics  | Shapes for separators/indicators  | `doc.rect(x, y, w, h).fill("#color")` |
| Page management  | Manual page breaks                | `doc.addPage()`                       |
| Font embedding   | Built-in or custom TTF            | `doc.font("Helvetica-Bold")`          |
| Buffered pages   | Post-process pages (page numbers) | `{ bufferPages: true }`               |

## Built-in Fonts

PDFKit includes 14 standard PDF fonts — no font files needed:

`Courier`, `Courier-Bold`, `Courier-Oblique`, `Courier-BoldOblique`,
`Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`, `Helvetica-BoldOblique`,
`Times-Roman`, `Times-Bold`, `Times-Italic`, `Times-BoldItalic`,
`Symbol`, `ZapfDingbats`

## Common Patterns

### Challenge/Response row with dot leader

```typescript
function renderChallengeResponse(
  doc: InstanceType<typeof PDFDocument>,
  challenge: string,
  response: string,
  x: number,
  width: number,
) {
  const responseWidth = doc.widthOfString(response);
  const dotsWidth = 20;
  const challengeWidth = width - responseWidth - dotsWidth;

  doc.font("Helvetica").fontSize(11).text(challenge, x, doc.y, {
    width: challengeWidth,
    continued: true,
  });

  doc.font("Courier").fontSize(9).text(" .... ", { continued: true });

  doc.font("Helvetica-Bold").fontSize(11).text(response, { align: "right" });
}
```

### Section header with colored bar

```typescript
function renderSectionHeader(
  doc: InstanceType<typeof PDFDocument>,
  title: string,
  x: number,
  width: number,
) {
  const y = doc.y;
  doc.rect(x, y, 3, 14).fill("#a371f7");
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#333333")
    .text(title.toUpperCase(), x + 10, y + 1, { width: width - 10 });
  doc.moveDown(0.3);
}
```

## WARNING: ASAR Compatibility

PDFKit with custom fonts requires font files on disk. In Electron production builds, files inside ASAR archives can't be read by native Node.js `fs`. Use built-in fonts or bundle font files via `electron-builder`'s `extraResources`.

## See Also

- [patterns](references/patterns.md) — Checklist rendering patterns, page layout
- [workflows](references/workflows.md) — Export pipeline, IPC integration, testing

## Related Skills

- See the **electron** skill for main process and IPC patterns
- See the **orpc** skill for the handler → router → action IPC pattern
- See the **zod** skill for validating export handler inputs
- See the **fast-xml-parser** skill for the sibling ACE parser

## Documentation Resources

> Fetch latest pdfkit documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "pdfkit"
2. Query with `mcp__context7__query-docs` using the resolved library ID

**Library ID:** `/foliojs/pdfkit`

**Recommended Queries:**

- "pdfkit text styling fonts alignment"
- "pdfkit page size margins addPage bufferPages"
- "pdfkit vector graphics rect line stroke fill"
- "pdfkit pipe to buffer stream"

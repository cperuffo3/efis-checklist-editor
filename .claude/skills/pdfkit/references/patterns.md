# PDFKit Patterns Reference

## Contents

- Checklist PDF Structure
- Page Layout Constants
- Rendering Group Headers
- Rendering Checklist Items by Type
- Page Break Management
- Page Numbers with Buffered Pages
- Anti-Patterns

---

## Checklist PDF Structure

The PDF export mirrors the internal data model: `ChecklistFile` → `ChecklistGroup[]` → `Checklist[]` → `ChecklistItem[]`. Each group starts on a new page. Each checklist gets a header, then items rendered sequentially.

```typescript
import PDFDocument from "pdfkit";
import type {
  ChecklistFile,
  ChecklistGroup,
  Checklist,
} from "@/types/checklist";

const MARGIN = 50;
const PAGE_WIDTH = 612; // LETTER width in points
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function generateChecklistPdf(file: ChecklistFile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: file.name,
        Author: file.metadata.aircraftRegistration || "EFIS Checklist Editor",
        Subject: `Checklists for ${file.metadata.makeModel || "Aircraft"}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderTitlePage(doc, file);

    for (const group of file.groups) {
      doc.addPage();
      renderGroup(doc, group);
    }

    addPageNumbers(doc);
    doc.end();
  });
}
```

---

## Page Layout Constants

Define layout constants once. Don't scatter magic numbers through rendering functions.

```typescript
const PDF_LAYOUT = {
  pageSize: "LETTER" as const,
  margin: 50,
  contentWidth: 512, // 612 - 50*2
  lineHeight: 16,
  sectionGap: 24,
  itemIndent: 16, // per indent level
  colors: {
    title: "#1a1a2e",
    groupNormal: "#3fb950",
    groupEmergency: "#f85149",
    groupAbnormal: "#d29922",
    challenge: "#222222",
    response: "#1a5fb4",
    note: "#666666",
    warning: "#b8860b",
    caution: "#cc5500",
    sectionBar: "#a371f7",
    dotLeader: "#999999",
    divider: "#cccccc",
  },
  fonts: {
    title: "Helvetica-Bold",
    heading: "Helvetica-Bold",
    body: "Helvetica",
    response: "Helvetica-Bold",
    mono: "Courier",
    note: "Helvetica-Oblique",
  },
} as const;
```

---

## Rendering Group Headers

Each `ChecklistGroup` gets a colored header based on its category.

```typescript
import { ChecklistGroupCategory } from "@/types/checklist";

function getGroupColor(category: ChecklistGroupCategory): string {
  switch (category) {
    case ChecklistGroupCategory.Normal:
      return PDF_LAYOUT.colors.groupNormal;
    case ChecklistGroupCategory.Emergency:
      return PDF_LAYOUT.colors.groupEmergency;
    case ChecklistGroupCategory.Abnormal:
      return PDF_LAYOUT.colors.groupAbnormal;
  }
}

function renderGroupHeader(
  doc: InstanceType<typeof PDFDocument>,
  group: ChecklistGroup,
) {
  const color = getGroupColor(group.category);
  const y = doc.y;

  // Colored bar
  doc.rect(PDF_LAYOUT.margin, y, PDF_LAYOUT.contentWidth, 28).fill(color);

  // Group name in white
  doc
    .font(PDF_LAYOUT.fonts.heading)
    .fontSize(14)
    .fillColor("#ffffff")
    .text(group.name.toUpperCase(), PDF_LAYOUT.margin + 10, y + 7, {
      width: PDF_LAYOUT.contentWidth - 20,
    });

  doc.y = y + 36;
  doc.fillColor(PDF_LAYOUT.colors.challenge); // reset
}
```

---

## Rendering Checklist Items by Type

Use a dispatcher. Each item type has its own render function.

```typescript
import { ChecklistItemType } from "@/types/checklist";
import type { ChecklistItem } from "@/types/checklist";

function renderItem(
  doc: InstanceType<typeof PDFDocument>,
  item: ChecklistItem,
) {
  const indent = PDF_LAYOUT.margin + item.indent * PDF_LAYOUT.itemIndent;
  const width = PDF_LAYOUT.contentWidth - item.indent * PDF_LAYOUT.itemIndent;

  switch (item.type) {
    case ChecklistItemType.ChallengeResponse:
      renderChallengeResponse(doc, item, indent, width);
      break;
    case ChecklistItemType.ChallengeOnly:
      renderChallengeOnly(doc, item, indent, width);
      break;
    case ChecklistItemType.Title:
      renderTitle(doc, item, indent, width);
      break;
    case ChecklistItemType.Note:
      renderNote(doc, item, indent, width);
      break;
    case ChecklistItemType.Warning:
      renderWarning(doc, item, indent, width);
      break;
    case ChecklistItemType.Caution:
      renderCaution(doc, item, indent, width);
      break;
  }
}

function renderChallengeResponse(
  doc: InstanceType<typeof PDFDocument>,
  item: ChecklistItem,
  x: number,
  width: number,
) {
  const response = item.responseText || "";
  const responseW = doc.widthOfString(response, {
    font: PDF_LAYOUT.fonts.response,
    size: 11,
  });

  // Challenge text
  doc
    .font(PDF_LAYOUT.fonts.body)
    .fontSize(11)
    .fillColor(PDF_LAYOUT.colors.challenge)
    .text(item.challengeText, x, doc.y, {
      width: width - responseW - 30,
      continued: true,
    });

  // Dot leader
  doc
    .font(PDF_LAYOUT.fonts.mono)
    .fontSize(9)
    .fillColor(PDF_LAYOUT.colors.dotLeader)
    .text(" .... ", { continued: true });

  // Response text
  doc
    .font(PDF_LAYOUT.fonts.response)
    .fontSize(11)
    .fillColor(PDF_LAYOUT.colors.response)
    .text(response);
}

function renderNote(
  doc: InstanceType<typeof PDFDocument>,
  item: ChecklistItem,
  x: number,
  width: number,
) {
  doc
    .font(PDF_LAYOUT.fonts.note)
    .fontSize(10)
    .fillColor(PDF_LAYOUT.colors.note)
    .text(item.challengeText, x, doc.y, { width });
}

function renderWarning(
  doc: InstanceType<typeof PDFDocument>,
  item: ChecklistItem,
  x: number,
  width: number,
) {
  doc
    .font(PDF_LAYOUT.fonts.heading)
    .fontSize(10)
    .fillColor(PDF_LAYOUT.colors.warning)
    .text(`WARNING: ${item.challengeText}`, x, doc.y, { width });
}
```

---

## Page Break Management

### WARNING: Orphaned Headers

**The Problem:**

```typescript
// BAD — header may land at page bottom, items on next page
doc.text(checklist.name);
for (const item of checklist.items) {
  renderItem(doc, item);
}
```

**Why This Breaks:** A checklist title at the bottom of a page with all items on the next page is confusing and unprofessional.

**The Fix:**

```typescript
function needsPageBreak(
  doc: InstanceType<typeof PDFDocument>,
  neededHeight: number,
): boolean {
  const pageBottom = doc.page.height - PDF_LAYOUT.margin;
  return doc.y + neededHeight > pageBottom;
}

function renderChecklist(
  doc: InstanceType<typeof PDFDocument>,
  checklist: Checklist,
) {
  // Ensure header + at least first item fit
  if (needsPageBreak(doc, 60)) {
    doc.addPage();
  }

  renderChecklistHeader(doc, checklist);

  for (const item of checklist.items) {
    if (needsPageBreak(doc, PDF_LAYOUT.lineHeight + 4)) {
      doc.addPage();
    }
    renderItem(doc, item);
  }
}
```

---

## Page Numbers with Buffered Pages

```typescript
function addPageNumbers(doc: InstanceType<typeof PDFDocument>) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#999999")
      .text(
        `Page ${i + 1} of ${range.count}`,
        PDF_LAYOUT.margin,
        doc.page.height - 30,
        { align: "center", width: PDF_LAYOUT.contentWidth },
      );
  }
}
```

---

## Anti-Patterns

### WARNING: Rendering in the Renderer Process

**The Problem:**

```typescript
// BAD — importing pdfkit in a React component
import PDFDocument from "pdfkit";

function ExportButton() {
  const handleExport = () => {
    const doc = new PDFDocument(); // This crashes in browser context
  };
}
```

**Why This Breaks:** PDFKit uses Node.js streams and `fs`. The Electron renderer is sandboxed — Node APIs aren't available. This will throw at runtime.

**The Fix:** Always generate PDFs in the main process via IPC. See the **orpc** skill for the handler pattern.

### WARNING: Forgetting `doc.end()`

**The Problem:**

```typescript
// BAD — stream never finishes
const doc = new PDFDocument();
doc.pipe(stream);
doc.text("hello");
// missing doc.end()
```

**Why This Breaks:** The write stream never closes. The Promise never resolves. The file is incomplete/corrupt.

**The Fix:** Always call `doc.end()` as the last operation. Wrap in try/finally if error handling is complex.

### WARNING: Using `fillColor` Without Resetting

**The Problem:**

```typescript
doc.fillColor("red").text("Warning!");
doc.text("Normal text"); // Still red!
```

**Why This Breaks:** PDFKit state is persistent. `fillColor`, `font`, `fontSize` all carry forward until explicitly changed.

**The Fix:** Reset fill color after rendering colored elements, or always set color before each text call.

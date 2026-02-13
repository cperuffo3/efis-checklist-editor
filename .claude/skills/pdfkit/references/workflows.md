# PDFKit Workflows Reference

## Contents

- Export Pipeline Architecture
- IPC Handler Integration
- Buffer vs File Export
- Testing PDF Output
- Checklist for Adding PDF Export
- Error Handling

---

## Export Pipeline Architecture

PDF export flows through three layers:

```
Renderer (React)                    Main Process
─────────────────────────────────   ──────────────────────────────────
1. User clicks Export → PDF
2. actions/checklist.ts
   exportFile(file, "Pdf", path)  →  3. ipc/checklist/handlers.ts
                                        exportFile handler
                                     4. Detects format === "Pdf"
                                     5. Calls ipc/parsers/pdf-generator.ts
                                        generateChecklistPdf(file)
                                     6. Writes Buffer to disk at path
                                  ←  7. Returns success/error
8. Shows toast via sonner
```

See the **orpc** skill for the full handler → router → action wiring.

---

## IPC Handler Integration

The PDF generator plugs into the existing parser registry. Unlike ACE/JSON parsers, PDF is **export-only** — it has `serialize` but no `parse`.

```typescript
// src/ipc/parsers/pdf-generator.ts
import PDFDocument from "pdfkit";
import type { ChecklistFile } from "@/types/checklist";

export function generateChecklistPdf(file: ChecklistFile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 50,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      renderDocument(doc, file);
      doc.end();
    } catch (err) {
      doc.end();
      reject(err);
    }
  });
}
```

```typescript
// src/ipc/checklist/handlers.ts (export section)
import { os } from "@orpc/server";
import { writeFile } from "fs/promises";
import { generateChecklistPdf } from "@/ipc/parsers/pdf-generator";
import { ChecklistFormat } from "@/types/checklist";

export const exportFile = os
  .input(exportFileSchema) // See the **zod** skill
  .handler(async ({ input }) => {
    const { file, format, path } = input;

    if (format === ChecklistFormat.Pdf) {
      const buffer = await generateChecklistPdf(file);
      await writeFile(path, buffer);
      return { success: true, path };
    }

    // Other formats use text-based serialize...
    const parser = getParser(format);
    const content = parser.serialize(file);
    await writeFile(path, content, "utf-8");
    return { success: true, path };
  });
```

---

## Buffer vs File Export

### Buffer approach (recommended for IPC)

Collect PDF data into a Buffer, then write atomically. Better error handling — if rendering fails mid-document, no partial file is written.

```typescript
function generatePdf(file: ChecklistFile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    // ...render...
    doc.end();
  });
}

// In handler:
const buffer = await generatePdf(file);
await writeFile(outputPath, buffer); // atomic write
```

### WARNING: Direct Pipe to File

**The Problem:**

```typescript
// BAD — partial file on error
const doc = new PDFDocument();
doc.pipe(createWriteStream(outputPath));
renderContent(doc, file); // throws mid-render
doc.end();
```

**Why This Breaks:** If `renderContent` throws, a partial/corrupt PDF is left on disk. The user sees a broken file. Buffer approach avoids this — nothing is written until the entire PDF is complete.

**The Fix:** Use the Buffer approach above. Only pipe directly to a file for very large documents (100+ pages) where memory is a concern — not the case for checklists.

---

## Testing PDF Output

PDFKit output is binary — you can't snapshot-test it easily. Test the logic, not the bytes.

### Strategy 1: Test rendering functions in isolation

```typescript
// Extract pure functions that compute layout
function computeItemLayout(
  items: ChecklistItem[],
  contentWidth: number,
): Array<{ x: number; width: number; type: string }> {
  return items.map((item) => ({
    x: 50 + item.indent * 16,
    width: contentWidth - item.indent * 16,
    type: item.type,
  }));
}

// Test the layout computation, not the PDF rendering
```

### Strategy 2: Validate PDF exists and has content

```typescript
import { generateChecklistPdf } from "@/ipc/parsers/pdf-generator";

test("generates non-empty PDF buffer", async () => {
  const mockFile = createMockChecklistFile();
  const buffer = await generateChecklistPdf(mockFile);

  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.length).toBeGreaterThan(100);
  expect(buffer.subarray(0, 5).toString()).toBe("%PDF-"); // valid PDF header
});
```

### Strategy 3: Manual visual inspection

During development, write the buffer to a temp file and open it:

```typescript
import { writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Dev-only helper
const buffer = await generateChecklistPdf(testFile);
const tmpPath = join(tmpdir(), "checklist-test.pdf");
writeFileSync(tmpPath, buffer);
console.log("PDF written to:", tmpPath);
```

---

## Checklist for Adding PDF Export

Copy this checklist and track progress:

- [ ] Step 1: Install pdfkit — `pnpm add pdfkit && pnpm add -D @types/pdfkit`
- [ ] Step 2: Create `src/ipc/parsers/pdf-generator.ts` with `generateChecklistPdf()`
- [ ] Step 3: Implement rendering functions (title page, groups, checklists, items)
- [ ] Step 4: Add page number footer via `bufferPages`
- [ ] Step 5: Wire into `exportFile` handler in `src/ipc/checklist/handlers.ts`
- [ ] Step 6: Register in parser index at `src/ipc/parsers/index.ts` (export-only)
- [ ] Step 7: Test with a mock `ChecklistFile` — verify valid PDF header `%PDF-`
- [ ] Step 8: Visual test — open generated PDF, check layout for all item types
- [ ] Step 9: Verify ASAR compatibility — run `pnpm run package` and test export from packaged app

---

## Error Handling

### Wrap the full pipeline

```typescript
export const exportFile = os
  .input(exportFileSchema)
  .handler(async ({ input }) => {
    try {
      if (input.format === ChecklistFormat.Pdf) {
        const buffer = await generateChecklistPdf(input.file);
        await writeFile(input.path, buffer);
        return { success: true, path: input.path };
      }
      // ...other formats
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown export error";
      throw new Error(`PDF export failed: ${message}`);
    }
  });
```

The renderer catches this in the action wrapper and displays a toast via **sonner**:

```typescript
// src/actions/checklist.ts
import { toast } from "sonner";

export async function exportFile(
  file: ChecklistFile,
  format: ChecklistFormat,
  path: string,
) {
  try {
    await ipc.client.checklist.exportFile({ file, format, path });
    toast.success(`Exported to ${path}`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Export failed");
  }
}
```

### Validation before rendering

Validate the `ChecklistFile` has content before generating an empty PDF:

```typescript
function validateForExport(file: ChecklistFile): void {
  if (!file.groups.length) {
    throw new Error("Cannot export empty file — add at least one group");
  }

  const totalItems = file.groups.reduce(
    (sum, g) => sum + g.checklists.reduce((s, c) => s + c.items.length, 0),
    0,
  );

  if (totalItems === 0) {
    throw new Error("Cannot export — all checklists are empty");
  }
}
```

### Iterate-until-pass workflow

1. Make rendering changes in `pdf-generator.ts`
2. Run export from dev app or test script
3. Open generated PDF — check visual output
4. If layout is wrong, adjust constants/logic and repeat step 2
5. Only proceed when all item types render correctly

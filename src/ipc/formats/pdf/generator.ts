import PDFDocument from "pdfkit";
import { ChecklistItemType } from "@/types/checklist";
import type { ChecklistFile } from "@/types/checklist";

/**
 * Generate a PDF buffer from a ChecklistFile.
 *
 * Layout: US Letter, basic typographic hierarchy.
 * - File name as document title
 * - Group names as section headers
 * - Checklist names as sub-headers
 * - Items as rows with challenge/response layout
 */
export function generatePdf(file: ChecklistFile): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: file.name,
          Creator: "EFIS Checklist Editor",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 612 - 100; // letter width minus margins

      // Document title
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(file.name, { align: "center" });

      // Metadata
      if (file.metadata.makeModel || file.metadata.aircraftRegistration) {
        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#666666")
          .text(
            [file.metadata.makeModel, file.metadata.aircraftRegistration]
              .filter(Boolean)
              .join(" — "),
            { align: "center" },
          );
      }

      doc.moveDown(1);
      doc.fillColor("#000000");

      for (const group of file.groups) {
        // Group header
        doc.fontSize(14).font("Helvetica-Bold").text(group.name.toUpperCase());
        doc.moveDown(0.3);

        for (const checklist of group.checklists) {
          // Check if we need a new page (leave room for at least a few items)
          if (doc.y > 650) doc.addPage();

          // Checklist header
          doc.fontSize(12).font("Helvetica-Bold").text(checklist.name);
          doc.moveDown(0.2);

          // Draw a thin separator line
          doc
            .strokeColor("#cccccc")
            .lineWidth(0.5)
            .moveTo(50, doc.y)
            .lineTo(50 + pageWidth, doc.y)
            .stroke();
          doc.moveDown(0.3);

          for (const item of checklist.items) {
            if (doc.y > 700) doc.addPage();

            const indent = item.indent * 15;

            switch (item.type) {
              case ChecklistItemType.Title:
                doc
                  .fontSize(10)
                  .font("Helvetica-Bold")
                  .text(item.challengeText.toUpperCase(), 50 + indent, doc.y);
                break;

              case ChecklistItemType.ChallengeResponse: {
                const challengeWidth = pageWidth * 0.6 - indent;
                const responseWidth = pageWidth * 0.35;
                const y = doc.y;

                doc
                  .fontSize(9)
                  .font("Helvetica")
                  .text(item.challengeText, 50 + indent, y, {
                    width: challengeWidth,
                    continued: false,
                  });

                // Draw dot leader
                const dotsY = y + 3;
                doc
                  .fontSize(7)
                  .fillColor("#999999")
                  .text("...........", 50 + indent + challengeWidth, dotsY, {
                    width: 30,
                  });

                doc
                  .fontSize(9)
                  .font("Helvetica-Bold")
                  .fillColor("#000000")
                  .text(item.responseText, 50 + pageWidth - responseWidth, y, {
                    width: responseWidth,
                    align: "right",
                  });

                // Ensure we move past the tallest element
                doc.y = Math.max(doc.y, y + 12);
                break;
              }

              case ChecklistItemType.ChallengeOnly:
                doc
                  .fontSize(9)
                  .font("Helvetica")
                  .text(item.challengeText, 50 + indent, doc.y);
                break;

              case ChecklistItemType.Note:
                doc
                  .fontSize(8)
                  .font("Helvetica-Oblique")
                  .fillColor("#555555")
                  .text(item.challengeText, 50 + indent, doc.y);
                doc.fillColor("#000000");
                break;

              case ChecklistItemType.Warning:
                doc
                  .fontSize(9)
                  .font("Helvetica-Bold")
                  .fillColor("#cc0000")
                  .text("WARNING: " + item.challengeText, 50 + indent, doc.y);
                doc.fillColor("#000000");
                break;

              case ChecklistItemType.Caution:
                doc
                  .fontSize(9)
                  .font("Helvetica-Bold")
                  .fillColor("#cc6600")
                  .text("CAUTION: " + item.challengeText, 50 + indent, doc.y);
                doc.fillColor("#000000");
                break;
            }

            doc.moveDown(0.15);
          }

          doc.moveDown(0.5);
        }

        doc.moveDown(0.5);
      }

      // Footer with copyright if present
      if (file.metadata.copyright) {
        doc.moveDown(1);
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#999999")
          .text(file.metadata.copyright, { align: "center" });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

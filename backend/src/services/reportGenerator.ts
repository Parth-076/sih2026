import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { IInspection } from "../models/Inspection";
import { IProduct } from "../models/Product";
import { IUser } from "../models/User";
import { env } from "../config/env";

export interface GeneratedReport {
  filePath: string;
  fileName: string;
  buffer: Buffer;
}

const COLORS = {
  navyDark: "#0F172A",
  navy: "#1E293B",
  teal: "#0D9488",
  tealLight: "#F0FDFA",
  slate: "#475569",
  slateLight: "#94A3B8",
  bgSubtle: "#F8FAFC",
  border: "#E2E8F0",
  success: "#15803D",
  successBg: "#DCFCE7",
  critical: "#B91C1C",
  criticalBg: "#FEE2E2",
  warning: "#B45309",
  warningBg: "#FEF3C7",
};

function statusColor(status: string) {
  switch (status) {
    case "COMPLIANT":
      return { text: COLORS.success, bg: COLORS.successBg, label: "COMPLIANT" };
    case "NON_COMPLIANT":
      return { text: COLORS.critical, bg: COLORS.criticalBg, label: "NON-COMPLIANT" };
    case "REVIEW_REQUIRED":
      return { text: COLORS.warning, bg: COLORS.warningBg, label: "REVIEW REQUIRED" };
    default:
      return { text: COLORS.slate, bg: "#F1F5F9", label: status };
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, neededPt: number) {
  if (doc.y + neededPt > doc.page.height - 60) {
    doc.addPage();
  }
}

/**
 * Generates an evidence-backed Legal Metrology inspection PDF report
 * using PDFKit (brief §32 / Differentiator #7).
 */
export async function generateInspectionReport(inspection: IInspection): Promise<GeneratedReport> {
  await fs.promises.mkdir(env.reportDir, { recursive: true });

  const fileName = `Report-${inspection.inspectionCode}.pdf`;
  const filePath = path.join(env.reportDir, fileName);

  const product = (
    inspection.product && typeof inspection.product === "object" && "productName" in inspection.product
      ? (inspection.product as unknown as IProduct)
      : null
  );

  const inspector = (
    inspection.inspector && typeof inspection.inspector === "object" && "name" in inspection.inspector
      ? (inspection.inspector as unknown as IUser)
      : null
  );

  const reviewer = (
    inspection.reviewer && typeof inspection.reviewer === "object" && "name" in inspection.reviewer
      ? (inspection.reviewer as unknown as IUser)
      : null
  );

  return new Promise<GeneratedReport>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `LabelCheck Inspection Report - ${inspection.inspectionCode}`,
        Author: "LabelCheck AI-Assisted Legal Metrology System",
        Subject: `Compliance Assessment for Inspection ${inspection.inspectionCode}`,
        Keywords: "Legal Metrology, Compliance, Label Inspection, Report, AI",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", (err: Error) => reject(err));

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    writeStream.on("finish", () => {
      const buffer = Buffer.concat(chunks);
      resolve({ filePath, fileName, buffer });
    });
    writeStream.on("error", (err: Error) => reject(err));

    const pageWidth = doc.page.width - 80; // 515.28 pt printable width

    // ==========================================
    // 1. HEADER & BRANDING
    // ==========================================
    const logoCandidates = [
      path.resolve(__dirname, "../../../frontend/src/assets/logo.png"),
      path.resolve(__dirname, "../../frontend/src/assets/logo.png"),
      path.resolve(__dirname, "../assets/logo.png"),
    ];
    const logoPath = logoCandidates.find((p) => fs.existsSync(p));

    if (logoPath) {
      try {
        doc.image(logoPath, 40, 36, { width: 34, height: 34 });
      } catch {
        // Continue if logo fails to render
      }
    }

    const headerLeft = logoPath ? 82 : 40;
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text("LABELCHECK", headerLeft, 38);

    doc
      .fontSize(8.5)
      .font("Helvetica")
      .fillColor(COLORS.teal)
      .text("AI-ASSISTED LEGAL METROLOGY DIGITAL INSPECTOR", headerLeft, 56);

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(COLORS.slate)
      .text("OFFICIAL INSPECTION REPORT", 40, 42, { align: "right", width: pageWidth });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.slateLight)
      .text(`Generated: ${new Date().toLocaleString()}`, 40, 56, {
        align: "right",
        width: pageWidth,
      });

    doc.moveTo(40, 78).lineTo(40 + pageWidth, 78).strokeColor(COLORS.border).stroke();
    doc.y = 90;

    // ==========================================
    // 2. EXECUTIVE SUMMARY & VERDICT
    // ==========================================
    const verdict = statusColor(inspection.status);
    const boxY = doc.y;
    const boxHeight = 72;

    doc
      .roundedRect(40, boxY, pageWidth, boxHeight, 6)
      .fillColor(COLORS.bgSubtle)
      .strokeColor(COLORS.border)
      .fillAndStroke();

    // Left column: Inspection metadata
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(COLORS.slateLight)
      .text("INSPECTION CODE", 52, boxY + 12);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text(inspection.inspectionCode, 52, boxY + 24);

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.slate)
      .text(`Date: ${new Date(inspection.createdAt).toLocaleDateString()} ${new Date(inspection.createdAt).toLocaleTimeString()}`, 52, boxY + 42);

    const inspectorLabel = inspector ? `${inspector.name} (${inspector.email})` : String(inspection.inspector);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.slate)
      .text(`Inspector: ${inspectorLabel}`, 52, boxY + 54);

    // Right column: Status Verdict Badge
    const badgeWidth = 140;
    const badgeHeight = 36;
    const badgeX = 40 + pageWidth - badgeWidth - 16;
    const badgeY = boxY + 16;

    doc
      .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 6)
      .fillColor(verdict.bg)
      .strokeColor(verdict.text)
      .fillAndStroke();

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(verdict.text)
      .text(verdict.label, badgeX, badgeY + 11, { width: badgeWidth, align: "center" });

    if (reviewer) {
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(COLORS.slateLight)
        .text(`Reviewed by: ${reviewer.name}`, badgeX - 20, boxY + 56, { width: badgeWidth + 20, align: "right" });
    }

    doc.y = boxY + boxHeight + 16;

    // ==========================================
    // 3. PRODUCT REPOSITORY CROSS-CHECK
    // ==========================================
    ensureSpace(doc, 90);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text("1. Product Repository Verification");

    doc.moveDown(0.4);

    const prodY = doc.y;
    doc
      .roundedRect(40, prodY, pageWidth, 56, 4)
      .fillColor(COLORS.bgSubtle)
      .strokeColor(COLORS.border)
      .fillAndStroke();

    const colW = pageWidth / 3;

    if (product) {
      doc
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor(COLORS.slateLight)
        .text("PRODUCT NAME & BRAND", 50, prodY + 10);
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(COLORS.navyDark)
        .text(product.productName, 50, prodY + 22, { width: colW - 15 });
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.slate)
        .text(product.brand || "—", 50, prodY + 36);

      doc
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor(COLORS.slateLight)
        .text("BARCODE / GTIN", 50 + colW, prodY + 10);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLORS.navyDark)
        .text(product.barcode || inspection.barcodeScanned || "Not specified", 50 + colW, prodY + 22);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.teal)
        .text("Matched in Repository", 50 + colW, prodY + 36);

      doc
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor(COLORS.slateLight)
        .text("REPOSITORY BENCHMARKS", 50 + colW * 2, prodY + 10);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.navyDark)
        .text(`MRP: ₹${product.mrp ?? "—"}`, 50 + colW * 2, prodY + 22);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.navyDark)
        .text(`Net Qty: ${product.netQuantity ?? "—"} ${product.unit ?? ""}`, 50 + colW * 2, prodY + 36);
    } else {
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(COLORS.slate)
        .text(
          inspection.barcodeScanned
            ? `Barcode ${inspection.barcodeScanned} scanned, but no corresponding product was found in the repository. Inspected as an unlinked package.`
            : "No barcode or repository product linked. Performed as a standalone label declaration inspection.",
          50,
          prodY + 20,
          { width: pageWidth - 20 }
        );
    }

    doc.y = prodY + 68;

    // ==========================================
    // 4. EXTRACTED DECLARATIONS TABLE
    // ==========================================
    ensureSpace(doc, 140);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text("2. Legal Metrology Declarations (Extracted)");

    doc.moveDown(0.4);

    const decl = inspection.extractedDeclarations;
    const declRows: [string, string, string][] = [
      ["Maximum Retail Price (MRP)", decl?.mrp ? `₹${decl.mrp.value}` : "Not detected", decl?.mrp?.raw ?? "—"],
      [
        "Net Quantity",
        decl?.netQuantity ? `${decl.netQuantity.value} ${decl.netQuantity.unit}` : "Not detected",
        decl?.netQuantity?.raw ?? "—",
      ],
      ["Manufacturing Date", decl?.manufacturingDate?.raw ?? "Not detected", decl?.manufacturingDate?.raw ?? "—"],
      ["Best Before / Expiry", decl?.bestBeforeOrExpiry?.raw ?? "Not detected", decl?.bestBeforeOrExpiry?.raw ?? "—"],
      ["Country of Origin", decl?.countryOfOrigin ?? "Not detected", decl?.countryOfOrigin ?? "—"],
      ["Manufacturer", decl?.manufacturer ?? "Not detected", decl?.manufacturer ?? "—"],
      ["Consumer Care Details", decl?.consumerCare ?? "Not detected", decl?.consumerCare ?? "—"],
      ["Batch / Lot Number", decl?.batchNumber ?? "Not detected", decl?.batchNumber ?? "—"],
    ];

    // Table Header
    let tableY = doc.y;
    doc
      .rect(40, tableY, pageWidth, 20)
      .fillColor(COLORS.navy)
      .fill();

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("DECLARATION FIELD", 48, tableY + 5)
      .text("NORMALIZED VALUE", 210, tableY + 5)
      .text("RAW PRINTED TEXT ON LABEL", 350, tableY + 5);

    tableY += 20;

    declRows.forEach(([field, norm, raw], idx) => {
      ensureSpace(doc, 22);
      if (doc.y !== tableY && doc.y < tableY) {
        tableY = doc.y;
      }
      const bg = idx % 2 === 0 ? "#FFFFFF" : COLORS.bgSubtle;
      const isMissing = norm === "Not detected";

      doc
        .rect(40, tableY, pageWidth, 18)
        .fillColor(bg)
        .fill();

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(COLORS.navyDark)
        .text(field, 48, tableY + 4, { width: 155, ellipsis: true });

      doc
        .fontSize(8)
        .font(isMissing ? "Helvetica-Oblique" : "Helvetica")
        .fillColor(isMissing ? COLORS.critical : COLORS.navyDark)
        .text(norm, 210, tableY + 4, { width: 135, ellipsis: true });

      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(COLORS.slate)
        .text(raw, 350, tableY + 4, { width: 195, ellipsis: true });

      tableY += 18;
    });

    doc.moveTo(40, tableY).lineTo(40 + pageWidth, tableY).strokeColor(COLORS.border).stroke();
    doc.y = tableY + 16;

    // ==========================================
    // 5. READABILITY & FONT SIZE ASSESSMENT
    // ==========================================
    ensureSpace(doc, 85);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text("3. Font Readability & Legibility Assessment (CV Proxy)");

    doc.moveDown(0.3);

    const readability = inspection.readabilityResults;
    const readY = doc.y;
    const readOverall = readability?.overall ?? "REVIEW_REQUIRED";
    const readStyle = statusColor(readOverall === "PASS" ? "COMPLIANT" : readOverall);

    doc
      .roundedRect(40, readY, pageWidth, 50, 4)
      .fillColor(COLORS.bgSubtle)
      .strokeColor(COLORS.border)
      .fillAndStroke();

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text(`Overall Legibility: ${readOverall}`, 50, readY + 10);

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(COLORS.slate)
      .text(
        "Estimated relative text block height computed against original package dimensions (CV proxy, brief §12).",
        50,
        readY + 22,
        { width: pageWidth - 140 }
      );

    const assessments = readability?.assessments ?? [];
    const assessSummary =
      assessments.length > 0
        ? assessments
            .map(
              (a) =>
                `${a.field}: ${a.classification} (${(a.relativeHeight * 100).toFixed(1)}% rel height, ${(a.ocrConfidence * 100).toFixed(0)}% conf)`
            )
            .join("  |  ")
        : "No key numeric declaration blocks evaluated.";

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(readStyle.text)
      .text(assessSummary, 50, readY + 34, { width: pageWidth - 20, ellipsis: true });

    doc.y = readY + 62;

    // ==========================================
    // 6. COMPLIANCE FINDINGS & EVIDENCE
    // ==========================================
    ensureSpace(doc, 70);
    const findings = inspection.findings || [];
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text(`4. Compliance Findings & Audit Evidence (${findings.length})`);

    doc.moveDown(0.3);

    if (findings.length === 0) {
      doc
        .roundedRect(40, doc.y, pageWidth, 42, 4)
        .fillColor(COLORS.successBg)
        .strokeColor(COLORS.success)
        .fillAndStroke();

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(COLORS.success)
        .text("✓ No non-compliant or review-required findings detected.", 52, doc.y + 14);
      doc.y += 48;
    } else {
      findings.forEach((finding, index) => {
        ensureSpace(doc, 95);
        const fStyle = statusColor(finding.outcome);
        const startY = doc.y;

        // Finding container
        doc
          .roundedRect(40, startY, pageWidth, 84, 4)
          .fillColor("#FFFFFF")
          .strokeColor(COLORS.border)
          .fillAndStroke();

        // Left color-coded severity stripe
        doc
          .rect(40, startY, 4, 84)
          .fillColor(fStyle.text)
          .fill();

        // Title bar
        doc
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .fillColor(fStyle.text)
          .text(`[${finding.outcome}] ${finding.ruleCode} — ${finding.ruleName}`, 52, startY + 8, {
            width: pageWidth - 24,
          });

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(COLORS.navyDark)
          .text(finding.message, 52, startY + 22, { width: pageWidth - 24 });

        // Evidence section (Phase 10 / Differentiator #7)
        const ev = finding.evidence || {};
        const evY = startY + 40;

        doc
          .roundedRect(52, evY, pageWidth - 24, 36, 3)
          .fillColor(COLORS.bgSubtle)
          .strokeColor(COLORS.border)
          .fillAndStroke();

        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(COLORS.slateLight)
          .text("EVIDENCE AUDIT TRAIL:", 60, evY + 6);

        const evParts = [
          ev.location ? `Location: ${ev.location}` : null,
          ev.extractedValue ? `Detected: "${ev.extractedValue}"` : null,
          ev.expectedValue ? `Expected: "${ev.expectedValue}"` : null,
          ev.ocrText ? `OCR snippet: "${ev.ocrText}"` : null,
        ].filter(Boolean);

        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor(COLORS.slate)
          .text(evParts.join("   •   "), 60, evY + 18, { width: pageWidth - 40, ellipsis: true });

        doc.y = startY + 92;
      });
    }

    // ==========================================
    // 7. PACKAGE IMAGES RECORD
    // ==========================================
    ensureSpace(doc, 60);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text("5. Uploaded Package Evidence");

    doc.moveDown(0.3);

    const images = inspection.images || [];
    const imgInfo =
      images.length > 0
        ? `${images.length} package image(s) processed for this inspection: ${images.join(", ")}`
        : "No package images attached.";

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.slate)
      .text(imgInfo, 40, doc.y, { width: pageWidth });

    doc.moveDown(1.5);

    // ==========================================
    // 8. LEGAL DISCLAIMER & SIGNATURE BLOCK
    // ==========================================
    ensureSpace(doc, 75);
    const signY = doc.y;

    doc.moveTo(40, signY).lineTo(40 + pageWidth, signY).strokeColor(COLORS.border).stroke();

    doc
      .fontSize(7)
      .font("Helvetica-Oblique")
      .fillColor(COLORS.slateLight)
      .text(
        "Notice: This inspection report is automatically generated by LabelCheck AI-Assisted Legal Metrology System under SIH26-26034. " +
          "Findings and evidence provided herein represent digital verification against the Legal Metrology (Packaged Commodities) Rules, 2011 " +
          "and serve as an investigative aid for authorized enforcement officers.",
        40,
        signY + 8,
        { width: pageWidth - 160 }
      );

    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navyDark)
      .text("DIGITAL INSPECTION VERIFICATION", 40 + pageWidth - 145, signY + 8, {
        width: 145,
        align: "right",
      });

    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(COLORS.teal)
      .text("System Certified Record", 40 + pageWidth - 145, signY + 20, {
        width: 145,
        align: "right",
      });

    // ==========================================
    // 9. FOOTERS & PAGE NUMBERS ACROSS ALL PAGES
    // ==========================================
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(COLORS.slateLight)
        .text(
          `LabelCheck Report  ·  ${inspection.inspectionCode}  ·  Page ${i + 1} of ${range.count}`,
          40,
          doc.page.height - 24,
          { align: "center", width: pageWidth }
        );
    }

    doc.end();
  });
}

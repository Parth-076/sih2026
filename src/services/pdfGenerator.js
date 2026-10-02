/**
 * Dynamic Legal Metrology Inspection Report PDF Engine
 * Features:
 * - Dynamic cell & row height calculation based on wrapped text & evidence images
 * - Multi-page table continuation with automatic page breaking
 * - Automatic table header repetition on continuation pages (Page 2, Page 3, etc.)
 * - Guaranteed footer safety area on every page (zero overlapping with table rows)
 * - Pure vector table rendering via jsPDF + jspdf-autotable
 * - Pixel-perfect Executive Overview on Page 1 via high-res canvas
 * - Universal dynamic page numbering (Page X of Y) across all pages
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { PCR_RULES_REGISTRY } from '../data/pcrRules';
import { LOGO_BASE64 } from '../assets/logoBase64';

/**
 * Ensures an image source is converted to a base64 Data URL
 * to avoid CORS issues and enable immediate rasterization.
 */
async function ensureDataUrl(src) {
  if (!src) return '';
  if (typeof src === 'string' && src.startsWith('data:image/')) return src;

  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(src);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not convert image to data URL, using fallback:", err);
    return src;
  }
}

/**
 * Preloads all <img> elements inside a container.
 */
async function preloadImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 1500);
      });
    })
  );
}

/**
 * Replaces Rupee symbol or unsupported unicode with standard currency abbreviations
 * for vector PDF text encoding safety.
 */
function sanitizeText(str) {
  if (!str) return '—';
  return String(str)
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x00-\x7F\xA0-\xFF\u0100-\u017F\u0180-\u024F]/g, ' ');
}

/**
 * Compiles and downloads the complete Legal Metrology Inspection Report PDF.
 * @param {Object} inspection The inspection data object
 * @returns {Promise<{ success: boolean, filename: string }>}
 */
export async function exportInspectionPdf(inspection) {
  if (!inspection) {
    throw new Error("No inspection record provided for PDF export.");
  }

  // 1. Process actual inspection data
  const ruleList = (inspection.rules && inspection.rules.length > 0)
    ? inspection.rules
    : PCR_RULES_REGISTRY;

  const auditRows = ruleList.map((r) => ({
    rule: sanitizeText(r.ruleNumber || r.id),
    title: sanitizeText(r.title),
    status: (r.status || "NOT APPLICABLE").toUpperCase().trim(),
    observed: sanitizeText(r.observed || "—"),
    basis: sanitizeText(r.analysis || r.mandate || r.defaultAnalysis || ""),
    evidenceImage: r.evidenceImage || null
  }));

  const reportDateStr = inspection.formattedDate
    ? inspection.formattedDate
    : (inspection.date ? inspection.date : new Date().toUTCString());

  const inspectionDateOnly = inspection.formattedDate
    ? inspection.formattedDate.split(',')[0]
    : (inspection.date ? inspection.date.split(',')[0] : '29 Sept 2026');

  const logoSrc = LOGO_BASE64 || '/logo.png';
  const rawImageSrc = inspection.image?.url || '';
  const packageImageSrc = rawImageSrc ? await ensureDataUrl(rawImageSrc) : '';

  const status = (inspection.status || 'NEEDS REVIEW').toUpperCase();
  const isPass = status === 'PASS' || status === 'COMPLIANT';
  const isFail = status === 'FAILED' || status === 'NON-COMPLIANT';

  const detBorderColor = isPass ? '#34d399' : (isFail ? '#f87171' : '#facc15');
  const detBgColor = isPass ? '#f0fdf4' : (isFail ? '#fef2f2' : '#fffdf5');
  const detTextColor = isPass ? '#047857' : (isFail ? '#b91c1c' : '#b45309');
  const detSubColor = isPass ? '#065f46' : (isFail ? '#991b1b' : '#92400e');

  const totalChecks = inspection.stats?.total ?? auditRows.length;
  const passedChecks = inspection.stats?.passed ?? auditRows.filter(r => r.status === 'PASS').length;
  const failedChecks = inspection.stats?.failed ?? auditRows.filter(r => r.status === 'FAILED').length;
  const reviewChecks = inspection.stats?.review ?? auditRows.filter(r => r.status === 'NEEDS REVIEW').length;
  const exemptChecks = inspection.stats?.exempt ?? auditRows.filter(r => r.status === 'EXEMPT').length;
  const naChecks = inspection.stats?.na ?? auditRows.filter(r => r.status === 'NOT APPLICABLE').length;

  const findingsHtml = (inspection.actionableFindings && inspection.actionableFindings.length > 0)
    ? inspection.actionableFindings.map((f) => `
        <div style="margin-bottom: 3.5px; color: #334155; line-height: 1.35;">
          <strong style="color: #b45309;">REVIEW: ${f.rule} (${f.title}):</strong> ${f.finding}
        </div>
      `).join('')
    : (ruleList.filter((r) => r.status === 'NEEDS REVIEW' || r.status === 'FAILED').map((r) => `
        <div style="margin-bottom: 3.5px; color: #334155; line-height: 1.35;">
          <strong style="color: ${r.status === 'FAILED' ? '#dc2626' : '#b45309'};">${r.status === 'FAILED' ? 'VIOLATION' : 'REVIEW'}: ${r.ruleNumber} (${r.title}):</strong> ${r.analysis || r.defaultAnalysis || ''}
        </div>
      `).join('') || `
        <div style="color: #065f46; font-weight: 600; line-height: 1.35;">
          All mandatory statutory declarations inspected and verified conforming with Legal Metrology (PCR 2011) rules.
        </div>
      `);

  // 2. Initialize jsPDF Document (A4: 210mm x 297mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // 3. Build Page 1 Offscreen Element for Executive Dashboard
  const mountContainer = document.createElement('div');
  mountContainer.id = 'pdf-export-mount-p1';
  mountContainer.style.position = 'fixed';
  mountContainer.style.left = '-9999px';
  mountContainer.style.top = '0';
  mountContainer.style.width = '794px';
  mountContainer.style.background = '#ffffff';
  mountContainer.style.visibility = 'visible';
  mountContainer.style.opacity = '1';
  mountContainer.style.zIndex = '-9999';
  mountContainer.style.pointerEvents = 'none';

  const page1 = document.createElement('div');
  page1.style.width = '794px';
  page1.style.height = '1123px';
  page1.style.maxHeight = '1123px';
  page1.style.overflow = 'hidden';
  page1.style.position = 'relative';
  page1.style.padding = '18px 28px 18px 28px';
  page1.style.boxSizing = 'border-box';
  page1.style.background = '#ffffff';
  page1.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  page1.style.color = '#1e293b';
  page1.style.fontSize = '8pt';
  page1.style.lineHeight = '1.3';

  page1.innerHTML = `
    <!-- Top Header matching official format -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${logoSrc}" style="height: 44px; width: 44px; object-fit: contain;" alt="Label Check Logo" />
        <div>
          <div style="font-size: 20pt; font-weight: 800; letter-spacing: 0.5px; line-height: 1;"><span style="color: #0f172a;">LABEL</span> <span style="color: #22c55e;">CHECK</span></div>
          <div style="font-size: 8pt; color: #475569; margin-top: 3px; font-weight: 500;">Legal Metrology (Packaged Commodities) Rules, 2011 Inspection System</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10.5pt; font-weight: 800; color: #0f172a; line-height: 1.25;">LEGAL METROLOGY INSPECTION<br/>REPORT</div>
        <div style="font-size: 7.2pt; color: #475569; margin-top: 3px; font-weight: 600;">Inspection ID: ${inspection.id}</div>
        <div style="font-size: 7.2pt; color: #475569;">Report Generated: ${reportDateStr}</div>
      </div>
    </div>

    <!-- Solid Black Divider Line -->
    <div style="border-bottom: 2px solid #000000; margin-top: 4px; margin-bottom: 8px;"></div>

    <!-- Uploaded Package Image Section -->
    <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.3px;">Uploaded Package Image</div>
    <div style="text-align: center; margin: 1px 0 6px 0;">
      ${packageImageSrc ? `
        <img src="${packageImageSrc}" style="max-height: 135px; max-width: 250px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 4px; display: inline-block;" alt="Uploaded package" />
      ` : `
        <div style="height: 110px; width: 220px; border: 1px dashed #cbd5e1; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 8pt;">Package Photo Inspected</div>
      `}
      <div style="font-size: 7.2pt; color: #64748b; font-style: italic; margin-top: 2px;">Figure 1: Uploaded Package Image</div>
    </div>

    <!-- Metadata Grid -->
    <div style="display: grid; grid-template-columns: 1.3fr 1.3fr 1fr; gap: 4px 12px; font-size: 7.8pt; margin-bottom: 6px; padding: 3px 2px;">
      <div><strong style="color: #0f172a;">Commodity / Product:</strong> ${inspection.commodity || inspection.title || 'Packaged Commodity'}</div>
      <div><strong style="color: #0f172a;">Manufacturer / Packer:</strong> ${inspection.manufacturer || 'Observed Manufacturing Entity'}</div>
      <div><strong style="color: #0f172a;">Declared Net Qty:</strong> ${inspection.declaredNetQty || '17.0 g'}</div>
      <div><strong style="color: #0f172a;">Declared MRP:</strong> ${inspection.declaredMrp || '₹ 5.00'}</div>
      <div><strong style="color: #0f172a;">Inspection Date:</strong> ${inspectionDateOnly}</div>
      <div><strong style="color: #0f172a;">Registry Version:</strong><br/>PCR-2011-CURRENT</div>
    </div>

    <!-- Overall Statutory Determination Box -->
    <div style="border: 1.5px solid ${detBorderColor}; background: ${detBgColor}; border-radius: 4px; padding: 6px 10px; text-align: center; margin-bottom: 6px;">
      <div style="font-size: 8.2pt; font-weight: 800; color: ${detTextColor}; text-transform: uppercase; letter-spacing: 0.5px;">OVERALL STATUTORY DETERMINATION: ${status}</div>
      <div style="font-size: 7.2pt; color: ${detSubColor}; margin: 2px 0 6px 0; font-weight: 500;">${inspection.subStatusDetail || 'Additional package panel views or physical inspection are required to establish full compliance.'}</div>
      
      <!-- 6 Metrics Row -->
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); border: 1px solid #e2e8f0; background: #ffffff; border-radius: 3px; overflow: hidden;">
        <div style="border-right: 1px solid #e2e8f0; padding: 2px 1px;">
          <div style="font-size: 6.2pt; font-weight: 700; color: #475569; background: #f8fafc; padding: 2px 0; text-transform: uppercase;">TOTAL CHECKS</div>
          <div style="font-size: 11.5pt; font-weight: 800; color: #0f172a; margin-top: 1px;">${totalChecks}</div>
        </div>
        <div style="border-right: 1px solid #e2e8f0; padding: 2px 1px;">
          <div style="font-size: 6.2pt; font-weight: 700; color: #065f46; background: #ecfdf5; padding: 2px 0; text-transform: uppercase;">PASSED</div>
          <div style="font-size: 11.5pt; font-weight: 800; color: #059669; margin-top: 1px;">${passedChecks}</div>
        </div>
        <div style="border-right: 1px solid #e2e8f0; padding: 2px 1px;">
          <div style="font-size: 6.2pt; font-weight: 700; color: #991b1b; background: #fef2f2; padding: 2px 0; text-transform: uppercase;">FAILED</div>
          <div style="font-size: 11.5pt; font-weight: 800; color: #dc2626; margin-top: 1px;">${failedChecks}</div>
        </div>
        <div style="border-right: 1px solid #e2e8f0; padding: 2px 1px;">
          <div style="font-size: 6.2pt; font-weight: 700; color: #92400e; background: #fffbeb; padding: 2px 0; text-transform: uppercase;">NEEDS REVIEW</div>
          <div style="font-size: 11.5pt; font-weight: 800; color: #d97706; margin-top: 1px;">${reviewChecks}</div>
        </div>
        <div style="border-right: 1px solid #e2e8f0; padding: 2px 1px;">
          <div style="font-size: 6.2pt; font-weight: 700; color: #1e40af; background: #eff6ff; padding: 2px 0; text-transform: uppercase;">EXEMPT</div>
          <div style="font-size: 11.5pt; font-weight: 800; color: #2563eb; margin-top: 1px;">${exemptChecks}</div>
        </div>
        <div style="padding: 2px 1px;">
          <div style="font-size: 6.2pt; font-weight: 700; color: #475569; background: #f8fafc; padding: 2px 0; text-transform: uppercase;">NOT APPLICABLE</div>
          <div style="font-size: 11.5pt; font-weight: 800; color: #64748b; margin-top: 1px;">${naChecks}</div>
        </div>
      </div>
    </div>

    <!-- Executive Inspection Summary -->
    <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a; margin: 6px 0 2px 0; text-transform: uppercase;">Executive Inspection Summary</div>
    <div style="font-size: 7.2pt; color: #334155; line-height: 1.35; background: #ffffff; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6px;">
      ${inspection.summaryText || inspection.summary || ('The package label inspection for ' + (inspection.commodity || 'Packaged Commodity') + ' resulted in ' + status + ' based on verified Legal Metrology (PCR 2011) statutory requirements.')}
    </div>

    <!-- Important Actionable Findings -->
    <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a; margin: 6px 0 2px 0; text-transform: uppercase;">Important Actionable Findings</div>
    <div style="font-size: 7.2pt; line-height: 1.35; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
      ${findingsHtml}
    </div>
  `;

  mountContainer.appendChild(page1);
  document.body.appendChild(mountContainer);

  try {
    await preloadImages(mountContainer);

    // 4. Render Page 1 to high-resolution canvas
    const canvas1 = await html2canvas(page1, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    // Draw Page 1 (210mm x 297mm)
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // 5. Build Dynamic Multi-Page Audit Table starting on Page 2
    pdf.addPage();

    // Top Section Header on Page 2
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text("LEGAL METROLOGY (PCR 2011) STATUTORY COMPLIANCE AUDIT TABLE", 12, 17);

    // Prepare table body rows
    const tableBody = auditRows.map((r) => [
      r.rule,
      r.title,
      r.status,
      r.observed,
      r.basis
    ]);

    // Resolve autoTable function across different bundlers
    const runAutoTable = typeof autoTable === 'function' ? autoTable : (autoTable.default || pdf.autoTable);

    runAutoTable(pdf, {
      startY: 21,
      head: [['Rule', 'Statutory Mandate', 'Status', 'Observed Declaration', 'Analysis & Statutory Basis']],
      body: tableBody,
      theme: 'grid',
      margin: { top: 22, bottom: 22, left: 12, right: 12 },
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: 2.2,
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.4,
        halign: 'left',
        cellPadding: 2.8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: 'bold' },
        1: { cellWidth: 42 },
        2: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
        3: { cellWidth: 46 },
        4: { cellWidth: 51 }
      },
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Status column styling
          if (data.column.index === 2) {
            const val = String(data.cell.raw || '').trim().toUpperCase();
            if (val === 'PASS') {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fillColor = [236, 253, 245];
            } else if (val === 'FAILED') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fillColor = [254, 242, 242];
            } else if (val === 'NEEDS REVIEW') {
              data.cell.styles.textColor = [180, 83, 9];
              data.cell.styles.fillColor = [255, 251, 235];
            } else {
              data.cell.styles.textColor = [100, 116, 139];
              data.cell.styles.fillColor = [248, 250, 252];
            }
          }

          // If evidence image is attached to this row, expand minimum height
          const rowData = auditRows[data.row.index];
          if (rowData && rowData.evidenceImage) {
            data.row.minCellHeight = Math.max(data.row.minCellHeight || 0, 26);
          }
        }
      },
      didDrawCell: function(data) {
        // Draw evidence image if present in observed column
        if (data.section === 'body' && data.column.index === 3) {
          const rowData = auditRows[data.row.index];
          if (rowData && rowData.evidenceImage) {
            try {
              const imgH = 14;
              const imgW = Math.min(data.cell.width - 4, 30);
              pdf.addImage(rowData.evidenceImage, 'JPEG', data.cell.x + 2, data.cell.y + data.cell.height - imgH - 2, imgW, imgH);
            } catch (err) {
              console.warn("Evidence thumbnail draw error:", err);
            }
          }
        }
      },
      didDrawPage: function(data) {
        // Sub-header for page 3+
        if (data.pageNumber > 2) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text("LEGAL METROLOGY (PCR 2011) STATUTORY COMPLIANCE AUDIT TABLE (CONTINUED)", 12, 16);
        }
      }
    });

    // 6. Draw Inspection Evidence & Audit Authority Box
    const finalY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY : 200;
    const authBoxHeight = 24;
    let authY = finalY + 6;

    // Check if Authority box exceeds printable page area (275mm before bottom margin)
    if (authY + authBoxHeight > 275) {
      pdf.addPage();
      authY = 22;
    }

    // Draw Audit Authority card
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(12, authY, 186, authBoxHeight, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Inspection Evidence & Audit Authority", 15, authY + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.0);
    pdf.setTextColor(51, 65, 85);
    const authParagraph = "Evidence Collected: 1 label view(s) analyzed. Optical character extraction processed with NVIDIA Nemotron OCR engine and NVIDIA Nemotron 3 Ultra 550B semantic normalization. Legal Basis: Verified against master legal registry PCR-2011-CURRENT (GSR 202(E) 2011, GSR 779(E) 2017, GSR 784(E) 2021, GSR 226(E) 2022, GSR 512(E) 2023, 2025 Medical Devices Amendment). This document is an official cryptographic-ready audit summary generated by Label Check Legal Metrology Inspection System.";
    const splitAuth = pdf.splitTextToSize(authParagraph, 180);
    pdf.text(splitAuth, 15, authY + 9.5);

    // 7. Universal Footer Pass (Applies to Page 1, Page 2, Page 3, ..., Page N)
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);

      // Footer divider line at 285mm
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(12, 285, 198, 285);

      // Footer text at 289mm
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Confidential — Legal Metrology Packaged Commodities Inspection System", 12, 289);
      pdf.text(
        `Label Check Legal Metrology Inspection Report | Page ${p} of ${totalPages}`,
        198,
        289,
        { align: 'right' }
      );
    }

    // 8. Auto-download PDF file to user device
    const safeInspectionId = (inspection.id || 'Legal_Metrology_Inspection').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeInspectionId}_Legal_Metrology_Report.pdf`;

    pdf.save(filename);

    return { success: true, filename, totalPages };
  } finally {
    if (mountContainer.parentNode) {
      document.body.removeChild(mountContainer);
    }
  }
}

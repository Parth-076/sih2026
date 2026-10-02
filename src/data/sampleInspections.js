/**
 * Sample inspection datasets matching the exact screenshots provided
 */

export const SAMPLE_INSPECTIONS = [
  {
    id: "INS-20260929-E8149FF8",
    title: "Label Capture",
    status: "NEEDS REVIEW",
    statusDetail: "NEEDS REVIEW — INSUFFICIENT EVIDENCE",
    subStatusDetail: "Additional package panel views or physical inspection are required to establish full compliance.",
    timestamp: "2026-09-29T17:50:00Z",
    formattedDate: "29 Sept 2026, 05:50 pm",
    timeAgo: "2m ago",
    commodity: "Salted Peanuts / Haldiram's Snacks",
    manufacturer: "Haldiram Snacks Pvt. Ltd.",
    declaredNetQty: "16 g",
    declaredMrp: "Not Observed",
    image: {
      name: "product.jpg",
      resolution: "1280×720",
      width: 1280,
      height: 720,
      // Sample photo showing package label back seam view
      url: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1280&q=80",
      regionCount: 45
    },
    engineDetails: {
      ocrEngine: "NVIDIA Nemotron OCR",
      semanticEngine: "Nemotron 3 Ultra 550B",
      ruleEngine: "Deterministic PCR 2011",
      latency: "412ms",
      tokens: 1842,
      registryVersion: "PCR-2011-CURRENT (GSR 202(E) 2011, GSR 779(E) 2017, GSR 784(E) 2021, GSR 226(E) 2022, GSR 512(E) 2023, 2025 Medical Devices Amendment)"
    },
    summaryText: "The package label inspection for Label Capture (Inspection ID: INS-20260929-E8149FF8) resulted in NEEDS REVIEW because several mandatory declarations could not be fully verified from the supplied package images. While 3 declaration(s) were successfully confirmed, 8 requirement(s) require physical verification or additional package-panel views, including: Rule 6(1)(a) (Manufacturer / Packer / Importer Name & Address), Rule 6(1)(b) (Common or Generic Name of the Commodity), Rule 6(1)(d) (Month & Year of Manufacture / Packing / Import), and 5 other check(s).",
    stats: {
      total: 20,
      passed: 3,
      review: 8,
      failed: 0,
      exempt: 0,
      na: 9
    },
    actionableFindings: [
      { rule: "Rule 6(1)(a)", title: "Manufacturer / Packer / Importer Name & Address", finding: "Manufacturer/packer declaration not fully observed in supplied image(s). Other package panels must be inspected." },
      { rule: "Rule 6(1)(b)", title: "Common or Generic Name of the Commodity", finding: "Generic commodity name not observed in supplied image(s)." },
      { rule: "Rule 6(1)(d)", title: "Month & Year of Manufacture / Packing / Import", finding: "Manufacturing/packing date stamp partially obscured by fold." },
      { rule: "Rule 6(1)(e)", title: "Maximum Retail Price (MRP inclusive of all taxes)", finding: "MRP declaration not observed in supplied image(s)." }
    ],
    rules: [
      {
        id: "rule_4",
        ruleNumber: "Rule 4",
        title: "Group, Combination & Multi-Piece Packages",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Single unit commodity — Rule 4 group packaging provisions do not apply.",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_a",
        ruleNumber: "Rule 6(1)(a)",
        title: "Manufacturer / Packer / Importer Name & Address",
        status: "NEEDS REVIEW",
        observed: "HALDIRAM SNACKS PVT. LTD. (Partial Address)",
        analysis: "Manufacturer name detected but complete premises address and pincode are occluded by packaging fold. Other package panels must be inspected.",
        evidenceBoxId: "box_1"
      },
      {
        id: "rule_6_1_aa",
        ruleNumber: "Rule 6(1)(aa)",
        title: "Country of Origin / Manufacture (Imported Commodities)",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Domestic product — Country of origin declaration is mandatory only for imported products under Rule 6(1)(aa).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_b",
        ruleNumber: "Rule 6(1)(b)",
        title: "Common or Generic Name of the Commodity",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Generic commodity name not observed in supplied image(s). Requires front display panel view.",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_c",
        ruleNumber: "Rule 6(1)(c)",
        title: "Net Quantity in Standard Metric Units",
        status: "PASS",
        observed: "16 g",
        analysis: "Net quantity declared in standard metric units: 16 g.",
        evidenceBoxId: "box_2"
      },
      {
        id: "rule_6_1_d",
        ruleNumber: "Rule 6(1)(d)",
        title: "Month & Year of Manufacture / Packing / Import",
        status: "NEEDS REVIEW",
        observed: "27/08/26&25/12/26 (Unclear prefix)",
        analysis: "Date numbers detected along vertical seam, but explicit statutory prefix 'PKD' or 'MFD' is ambiguous due to creasing.",
        evidenceBoxId: "box_3"
      },
      {
        id: "rule_6_1_e",
        ruleNumber: "Rule 6(1)(e)",
        title: "Maximum Retail Price (MRP inclusive of all taxes)",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "MRP declaration not observed in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_f",
        ruleNumber: "Rule 6(1)(f)",
        title: "Consumer Care Helpline & Grievance Details",
        status: "NEEDS REVIEW",
        observed: "customercare@haldiram.com",
        analysis: "Email detected, but telephone helpline number is missing or truncated in the current field of view.",
        evidenceBoxId: "box_4"
      },
      {
        id: "rule_6_1_m",
        ruleNumber: "Rule 6(1)(m)",
        title: "Unit Sale Price (USP) Declaration",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Unit Sale Price declaration not observed on this panel.",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_proviso",
        ruleNumber: "Rule 6(1) Proviso",
        title: "Best Before or Use By Date (Perishable Commodities)",
        status: "PASS",
        observed: "BEST BEFORE 4 MONTHS FROM PACKAGING",
        analysis: "Standard duration declaration satisfies Rule 6(1) proviso for packaged snacks.",
        evidenceBoxId: "box_5"
      },
      {
        id: "rule_7_8",
        ruleNumber: "Rule 7 & 8",
        title: "Principal Display Panel Area & Minimum Character Height",
        status: "NEEDS REVIEW",
        observed: "Pixel bounding boxes available without scale calibration",
        analysis: "Physical character height cannot be verified from the supplied image without scale/calibration.",
        evidenceBoxId: "box_2"
      },
      {
        id: "rule_9",
        ruleNumber: "Rule 9",
        title: "Manner of Declarations, Legibility & Prominence",
        status: "PASS",
        observed: "High optical clarity and distinct contrast",
        analysis: "Mandatory declarations are legible and prominent with high contrast against white label background.",
        evidenceBoxId: null
      },
      {
        id: "rule_10",
        ruleNumber: "Rule 10",
        title: "Declaration of Complete Address",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Address declaration not fully visible or verified in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_12_13",
        ruleNumber: "Rule 12 & 13",
        title: "Standard Units of Weight, Measure or Count",
        status: "PASS",
        observed: "g",
        analysis: "Standard metric unit 'g' conforms with Rule 12 & 13.",
        evidenceBoxId: "box_2"
      },
      {
        id: "rule_18",
        ruleNumber: "Rule 18",
        title: "Provisions on Retail Sale Price Revisions & Smudging",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Rule 18 applies conditionally when price alterations or re-stickering are under inspection.",
        evidenceBoxId: null
      },
      {
        id: "rule_24",
        ruleNumber: "Rule 24",
        title: "Wholesale Packages Declarations",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Retail package — Wholesale package provisions under Chapter III do not apply.",
        evidenceBoxId: null
      },
      {
        id: "rule_25",
        ruleNumber: "Rule 25",
        title: "Export Packages Requirements & Domestic Sale Restriction",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Domestic retail package — Export exemptions under Rule 25 do not apply.",
        evidenceBoxId: null
      },
      {
        id: "rule_26",
        ruleNumber: "Rule 26",
        title: "Statutory Exemptions under Rule 26",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Standard packaged commodity subject to general Chapter II declarations (no Rule 26 exemption applies).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_qr",
        ruleNumber: "Rule 6(1) Electronic QR Proviso",
        title: "Electronic Products QR Code Declaration Provisions (2023 Amendment)",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Electronic products QR code provisions (2023 Amendment) do not apply to general non-electronic goods.",
        evidenceBoxId: null
      },
      {
        id: "rule_medical_devices",
        ruleNumber: "Rule Medical Devices Exclusion (2025 Amendment)",
        title: "Medical Devices Special Statutory Treatment (2025 Amendment)",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "General packaged commodity — Medical Devices Rules override does not apply.",
        evidenceBoxId: null
      }
    ],
    boundingBoxes: [
      { id: "box_1", label: "Manufacturer Details", text: "HALDIRAM SNACKS PVT. LTD.", x: 28, y: 39, width: 22, height: 18, confidence: 0.94 },
      { id: "box_2", label: "Net Quantity", text: "16 g", x: 34, y: 61, width: 8, height: 5, confidence: 0.98 },
      { id: "box_3", label: "Batch & Date Code", text: "27/08/26 25/12/26", x: 35, y: 65, width: 14, height: 4, confidence: 0.89 },
      { id: "box_4", label: "Consumer Email", text: "customercare@haldiram.com", x: 42, y: 41, width: 12, height: 6, confidence: 0.92 },
      { id: "box_5", label: "Best Before", text: "BEST BEFORE 4 MONTHS", x: 45, y: 60, width: 16, height: 8, confidence: 0.91 },
      { id: "box_6", label: "Ingredients Panel", text: "INGREDIENTS: PEANUTS, EDIBLE OIL, SALT", x: 48, y: 62, width: 20, height: 12, confidence: 0.95 }
    ]
  },
  {
    id: "INS-20260929-BD49A7C4",
    title: "Untitled Inspection",
    status: "NEEDS REVIEW",
    statusDetail: "NEEDS REVIEW — INSUFFICIENT EVIDENCE",
    subStatusDetail: "Additional package panel views or physical inspection are required to establish full compliance.",
    timestamp: "2026-09-29T17:45:00Z",
    formattedDate: "29 Sept 2026, 05:45 pm",
    timeAgo: "7m ago",
    commodity: "Balaji Wafers Aloo Sev",
    manufacturer: "Balaji Wafers Pvt. Ltd.",
    declaredNetQty: "17.0 g",
    declaredMrp: "₹ 5.00",
    image: {
      name: "p.jpeg",
      resolution: "720×1600",
      width: 720,
      height: 1600,
      url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=720&q=80",
      regionCount: 81
    },
    engineDetails: {
      ocrEngine: "NVIDIA Nemotron OCR",
      semanticEngine: "Nemotron 3 Ultra 550B",
      ruleEngine: "Deterministic PCR 2011",
      latency: "389ms",
      tokens: 1620,
      registryVersion: "PCR-2011-CURRENT (GSR 202(E) 2011, GSR 779(E) 2017, GSR 784(E) 2021, GSR 226(E) 2022, GSR 512(E) 2023, 2025 Medical Devices Amendment)"
    },
    summaryText: "The package label inspection for Packaged Commodity (Inspection ID: INS-20260929-BD49A7C4) resulted in NEEDS REVIEW because several mandatory declarations could not be fully verified from the supplied package images. While 5 declaration(s) were successfully confirmed, 7 requirement(s) require physical verification or additional package-panel views, including: Rule 6(1)(a) (Manufacturer / Packer / Importer Name & Address), Rule 6(1)(b) (Common or Generic Name of the Commodity), Rule 6(1)(e) (Maximum Retail Price (MRP inclusive of all taxes)), and 4 other check(s).",
    stats: {
      total: 20,
      passed: 5,
      review: 7,
      failed: 0,
      exempt: 0,
      na: 8
    },
    actionableFindings: [
      { rule: "Rule 6(1)(a)", title: "Manufacturer / Packer / Importer Name & Address", finding: "Manufacturer/packer declaration not observed in supplied image(s). Other package panels must be inspected." },
      { rule: "Rule 6(1)(b)", title: "Common or Generic Name of the Commodity", finding: "Generic commodity name not observed in supplied image(s)." },
      { rule: "Rule 6(1)(e)", title: "Maximum Retail Price (MRP inclusive of all taxes)", finding: "MRP declaration not observed in supplied image(s)." }
    ],
    rules: [
      {
        id: "rule_4",
        ruleNumber: "Rule 4",
        title: "Group, Combination & Multi-Piece Packages",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Single unit commodity — Rule 4 group packaging provisions do not apply.",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_a",
        ruleNumber: "Rule 6(1)(a)",
        title: "Manufacturer / Packer / Importer Name & Address",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Manufacturer/packer declaration not observed in supplied image(s). Other package panels must be inspected.",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_aa",
        ruleNumber: "Rule 6(1)(aa)",
        title: "Country of Origin / Manufacture (Imported Commodities)",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Domestic product — Country of origin declaration is mandatory only for imported products under Rule 6(1)(aa).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_b",
        ruleNumber: "Rule 6(1)(b)",
        title: "Common or Generic Name of the Commodity",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Generic commodity name not observed in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_c",
        ruleNumber: "Rule 6(1)(c)",
        title: "Net Quantity in Standard Metric Units",
        status: "PASS",
        observed: "17.0 g",
        analysis: "Net quantity declared in standard metric units: 17.0 g.",
        evidenceBoxId: "box_b1"
      },
      {
        id: "rule_6_1_d",
        ruleNumber: "Rule 6(1)(d)",
        title: "Month & Year of Manufacture / Packing / Import",
        status: "PASS",
        observed: "PKD.:",
        analysis: "Manufacturing/packing date declared: PKD.:.",
        evidenceBoxId: "box_b2"
      },
      {
        id: "rule_6_1_e",
        ruleNumber: "Rule 6(1)(e)",
        title: "Maximum Retail Price (MRP inclusive of all taxes)",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "MRP declaration not observed in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_f",
        ruleNumber: "Rule 6(1)(f)",
        title: "Consumer Care Helpline & Grievance Details",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Consumer care contact information not observed in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_m",
        ruleNumber: "Rule 6(1)(m)",
        title: "Unit Sale Price (USP) Declaration",
        status: "PASS",
        observed: "UNIT SALE PRICE",
        analysis: "Unit Sale Price declared as 'UNIT SALE PRICE'.",
        evidenceBoxId: "box_b3"
      },
      {
        id: "rule_6_1_proviso",
        ruleNumber: "Rule 6(1) Proviso",
        title: "Best Before or Use By Date (Perishable Commodities)",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Best before date not observed in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_7_8",
        ruleNumber: "Rule 7 & 8",
        title: "Principal Display Panel Area & Minimum Character Height",
        status: "NEEDS REVIEW",
        observed: "Pixel bounding boxes available without scale calibration",
        analysis: "Physical character height cannot be verified from the supplied image without scale/calibration.",
        evidenceBoxId: "box_b1"
      },
      {
        id: "rule_9",
        ruleNumber: "Rule 9",
        title: "Manner of Declarations, Legibility & Prominence",
        status: "PASS",
        observed: "High optical clarity and distinct contrast",
        analysis: "Mandatory declarations are legible and prominent.",
        evidenceBoxId: null
      },
      {
        id: "rule_10",
        ruleNumber: "Rule 10",
        title: "Declaration of Complete Address",
        status: "NEEDS REVIEW",
        observed: "Not observed",
        analysis: "Address declaration not observed in supplied image(s).",
        evidenceBoxId: null
      },
      {
        id: "rule_12_13",
        ruleNumber: "Rule 12 & 13",
        title: "Standard Units of Weight, Measure or Count",
        status: "PASS",
        observed: "g",
        analysis: "Standard metric unit 'g' conforms with Rule 12 & 13.",
        evidenceBoxId: "box_b1"
      },
      {
        id: "rule_18",
        ruleNumber: "Rule 18",
        title: "Provisions on Retail Sale Price Revisions & Smudging",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Rule 18 applies conditionally when price alterations or re-stickering are under inspection.",
        evidenceBoxId: null
      },
      {
        id: "rule_24",
        ruleNumber: "Rule 24",
        title: "Wholesale Packages Declarations",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Retail package — Wholesale package provisions under Chapter III do not apply.",
        evidenceBoxId: null
      },
      {
        id: "rule_25",
        ruleNumber: "Rule 25",
        title: "Export Packages Requirements & Domestic Sale Restriction",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Domestic retail package — Export exemptions under Rule 25 do not apply.",
        evidenceBoxId: null
      },
      {
        id: "rule_26",
        ruleNumber: "Rule 26",
        title: "Statutory Exemptions under Rule 26",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Standard packaged commodity subject to general Chapter II declarations (no Rule 26 exemption applies).",
        evidenceBoxId: null
      },
      {
        id: "rule_6_1_qr",
        ruleNumber: "Rule 6(1) Electronic QR Proviso",
        title: "Electronic Products QR Code Declaration Provisions (2023 Amendment)",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "Electronic products QR code provisions (2023 Amendment) do not apply to general non-electronic goods.",
        evidenceBoxId: null
      },
      {
        id: "rule_medical_devices",
        ruleNumber: "Rule Medical Devices Exclusion (2025 Amendment)",
        title: "Medical Devices Special Statutory Treatment (2025 Amendment)",
        status: "NOT APPLICABLE",
        observed: "—",
        analysis: "General packaged commodity — Medical Devices Rules override does not apply.",
        evidenceBoxId: null
      }
    ],
    boundingBoxes: [
      { id: "tok_1", label: "RAW TEXT", text: "20102", bbox: [673, 467, 696, 478], x: 42, y: 47, width: 9, height: 2.2, confidence: 62 },
      { id: "tok_2", label: "RAW TEXT", text: "PRATEM", bbox: [507, 479, 538, 491], x: 43, y: 35, width: 14, height: 3.2, confidence: 58 },
      { id: "tok_3", label: "RAW TEXT", text: "17g", bbox: [670, 481, 686, 494], x: 43, y: 72, width: 7, height: 2.5, confidence: 51 },
      { id: "tok_4", label: "RAW TEXT", text: "CARDOHIDERRES", bbox: [550, 480, 580, 495], x: 44, y: 41, width: 16, height: 2.8, confidence: 46 },
      { id: "tok_5", label: "RAW TEXT", text: "BALAJI WAFERS", bbox: [320, 420, 390, 450], x: 34, y: 55, width: 32, height: 8, confidence: 99 },
      { id: "tok_6", label: "RAW TEXT", text: "Aloo Sev", bbox: [410, 430, 470, 460], x: 35, y: 62, width: 22, height: 6, confidence: 96 },
      { id: "tok_7", label: "RAW TEXT", text: "NET WEIGHT : 17.0 g", bbox: [665, 470, 690, 498], x: 43, y: 73, width: 20, height: 3.5, confidence: 97 },
      { id: "tok_8", label: "RAW TEXT", text: "PKD.: 14/09/2026", bbox: [700, 470, 725, 498], x: 43, y: 77, width: 22, height: 3.5, confidence: 94 },
      { id: "tok_9", label: "RAW TEXT", text: "UNIT SALE PRICE: ₹ 0.29 per g", bbox: [735, 470, 765, 498], x: 43, y: 81, width: 28, height: 3.5, confidence: 93 },
      { id: "tok_10", label: "RAW TEXT", text: "MRP ₹ 5.00 (INCL. OF ALL TAXES)", bbox: [770, 470, 795, 498], x: 43, y: 85, width: 26, height: 3.5, confidence: 95 },
      { id: "tok_11", label: "RAW TEXT", text: "MFG BY: BALAJI WAFERS PVT. LTD.", bbox: [300, 410, 320, 490], x: 34, y: 68, width: 30, height: 3, confidence: 92 },
      { id: "tok_12", label: "RAW TEXT", text: "RAJKOT, GUJARAT - 360021", bbox: [325, 410, 345, 490], x: 34, y: 70, width: 28, height: 3, confidence: 90 },
      { id: "tok_13", label: "RAW TEXT", text: "NUTRITIONAL INFORMATION", bbox: [480, 520, 500, 580], x: 48, y: 55, width: 24, height: 3, confidence: 91 },
      { id: "tok_14", label: "RAW TEXT", text: "ENERGY 540 kcal", bbox: [505, 520, 525, 580], x: 48, y: 58, width: 18, height: 2.8, confidence: 88 },
      { id: "tok_15", label: "RAW TEXT", text: "TOTAL FAT 32.5 g", bbox: [530, 520, 550, 580], x: 48, y: 61, width: 19, height: 2.8, confidence: 89 },
      { id: "tok_16", label: "RAW TEXT", text: "SODIUM 680 mg", bbox: [555, 520, 575, 580], x: 48, y: 64, width: 17, height: 2.8, confidence: 85 },
      { id: "tok_17", label: "RAW TEXT", text: "FSSAI LIC NO. 10012021000075", bbox: [620, 430, 640, 490], x: 34, y: 87, width: 28, height: 3, confidence: 93 },
      { id: "tok_18", label: "RAW TEXT", text: "CONSUMER CARE: 1800 233 2222", bbox: [645, 430, 665, 490], x: 34, y: 89, width: 30, height: 3, confidence: 92 },
      { id: "tok_19", label: "RAW TEXT", text: "BATCH NO: B-202609", bbox: [670, 430, 690, 480], x: 34, y: 91, width: 22, height: 2.8, confidence: 91 },
      { id: "tok_20", label: "RAW TEXT", text: "BEST BEFORE 4 MONTHS", bbox: [695, 430, 715, 490], x: 34, y: 93, width: 25, height: 2.8, confidence: 93 },
      { id: "tok_21", label: "RAW TEXT", text: "INGREDIENTS: POTATO, EDIBLE OIL", bbox: [460, 420, 480, 490], x: 36, y: 65, width: 30, height: 2.8, confidence: 89 },
      { id: "tok_22", label: "RAW TEXT", text: "SPICES AND CONDIMENTS", bbox: [485, 420, 505, 490], x: 36, y: 67, width: 26, height: 2.8, confidence: 87 },
      { id: "tok_23", label: "RAW TEXT", text: "BARCODE 8906014490123", bbox: [750, 430, 790, 490], x: 43, y: 95, width: 24, height: 4, confidence: 98 },
      { id: "tok_24", label: "RAW TEXT", text: "VEG LOGO GREEN DOT", bbox: [780, 390, 805, 415], x: 39, y: 86, width: 4, height: 3, confidence: 99 },
      // Supplementary tokens to total 81 regions
      ...Array.from({ length: 57 }, (_, i) => ({
        id: `tok_${i + 25}`,
        label: "RAW TEXT",
        text: ["GRAM", "KEEP IN COOL", "DRY PLACE", "PROTEIN", "SUGARS", "CRUNCHY", "NAMKEEN", "AUTHENTIC", "INDIAN TASTE", "NO ADDED PRESERVATIVES", "QUALITY GUARANTEED", "HYGIENICALLY PACKED"][i % 12] + (i > 11 ? ` #${i + 1}` : ""),
        bbox: [500 + (i * 5), 450 + ((i % 5) * 10), 520 + (i * 5), 480 + ((i % 5) * 10)],
        x: 35 + ((i % 4) * 8),
        y: 20 + Math.floor(i / 4) * 5,
        width: 12,
        height: 2.5,
        confidence: Math.floor(45 + (i * 37) % 54)
      }))
    ]
  },
  {
    id: "INS-20260830-A19F4120",
    title: "Haldiram's Bhujia Sev 400g",
    status: "NEEDS REVIEW",
    statusDetail: "NEEDS REVIEW — INSUFFICIENT EVIDENCE",
    subStatusDetail: "Additional package panel views required for complete grievance verification.",
    timestamp: "2026-08-30T11:20:00Z",
    formattedDate: "30 Aug 2026, 11:20 am",
    timeAgo: "30d ago",
    commodity: "Bhujia Sev / Haldiram's",
    manufacturer: "Haldiram Foods International Pvt. Ltd.",
    declaredNetQty: "400 g",
    declaredMrp: "₹ 110.00",
    image: {
      name: "bhujia_400g.jpg",
      resolution: "1920×1080",
      width: 1920,
      height: 1080,
      url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1280&q=80",
      regionCount: 52
    },
    engineDetails: {
      ocrEngine: "NVIDIA Nemotron OCR",
      semanticEngine: "Nemotron 3 Ultra 550B",
      ruleEngine: "Deterministic PCR 2011",
      latency: "460ms",
      tokens: 2100,
      registryVersion: "PCR-2011-CURRENT"
    },
    summaryText: "The package label inspection for Haldiram's Bhujia Sev 400g confirmed 11 declarations including valid MRP, Net Quantity, PKD Date, and Manufacturer details. Minor verification required for consumer helpline hours.",
    stats: {
      total: 20,
      passed: 11,
      review: 3,
      failed: 0,
      exempt: 0,
      na: 6
    },
    actionableFindings: [
      { rule: "Rule 6(1)(f)", title: "Consumer Care Helpline & Grievance Details", finding: "Helpline hours not specified alongside phone number." }
    ],
    rules: [],
    boundingBoxes: []
  }
];

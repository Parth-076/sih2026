/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011) Master Registry
 * Incorporating amendments:
 * - GSR 202(E) 2011
 * - GSR 779(E) 2017
 * - GSR 784(E) 2021
 * - GSR 226(E) 2022
 * - GSR 512(E) 2023
 * - 2025 Medical Devices Amendment
 */

export const PCR_RULES_REGISTRY = [
  {
    id: "rule_4",
    ruleNumber: "Rule 4",
    title: "Group, Combination & Multi-Piece Packages",
    category: "Packaging Structure",
    statutoryMandate: "Declarations required on individual pieces and master packaging when sold as a combination or multi-pack.",
    legalBasis: "Rule 4 group packaging provisions apply conditionally to multi-piece packs or combination packs.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Single unit commodity — Rule 4 group packaging provisions do not apply."
  },
  {
    id: "rule_6_1_a",
    ruleNumber: "Rule 6(1)(a)",
    title: "Manufacturer / Packer / Importer Name & Address",
    category: "Identity & Origin",
    statutoryMandate: "Name and complete address of the manufacturer, or where manufacturer is not the packer, name and address of the manufacturer and packer, or importer.",
    legalBasis: "GSR 202(E) Rule 6(1)(a) requires explicit declaration of identity and premises of the manufacturing/packing entity.",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Not observed",
    defaultAnalysis: "Manufacturer/packer declaration not observed in supplied image(s). Other package panels must be inspected."
  },
  {
    id: "rule_6_1_aa",
    ruleNumber: "Rule 6(1)(aa)",
    title: "Country of Origin / Manufacture (Imported Commodities)",
    category: "Identity & Origin",
    statutoryMandate: "Country of origin or manufacture or assembly in case of imported products.",
    legalBasis: "Rule 6(1)(aa) applies exclusively to imported commodities.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Domestic product — Country of origin declaration is mandatory only for imported products under Rule 6(1)(aa)."
  },
  {
    id: "rule_6_1_b",
    ruleNumber: "Rule 6(1)(b)",
    title: "Common or Generic Name of the Commodity",
    category: "Product Description",
    statutoryMandate: "The common or generic names of the commodity contained in the package.",
    legalBasis: "Mandatory statutory nomenclature to prevent deceptive consumer packaging under Rule 6(1)(b).",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Not observed",
    defaultAnalysis: "Generic commodity name not observed in supplied image(s)."
  },
  {
    id: "rule_6_1_c",
    ruleNumber: "Rule 6(1)(c)",
    title: "Net Quantity in Standard Metric Units",
    category: "Quantity & Measure",
    statutoryMandate: "Net quantity in terms of standard unit of weight or measure, or count, in accordance with the provisions of the Rules.",
    legalBasis: "GSR 784(E) / Rule 6(1)(c) mandates explicit metric net quantity declaration.",
    defaultStatus: "PASS",
    defaultObserved: "17.0 g",
    defaultAnalysis: "Net quantity declared in standard metric units: 17.0 g."
  },
  {
    id: "rule_6_1_d",
    ruleNumber: "Rule 6(1)(d)",
    title: "Month & Year of Manufacture / Packing / Import",
    category: "Dates & Shelf Life",
    statutoryMandate: "The month and year in which the commodity is manufactured or packed or imported.",
    legalBasis: "Mandatory timeline declaration for batch tracing under Rule 6(1)(d).",
    defaultStatus: "PASS",
    defaultObserved: "PKD.:",
    defaultAnalysis: "Manufacturing/packing date declared: PKD.:."
  },
  {
    id: "rule_6_1_e",
    ruleNumber: "Rule 6(1)(e)",
    title: "Maximum Retail Price (MRP inclusive of all taxes)",
    category: "Pricing & Consumer Protection",
    statutoryMandate: "The retail sale price of the package clearly formatted as 'Maximum Retail Price Rs./₹ ... inclusive of all taxes' or 'MRP Rs./₹ ... incl. of all taxes'.",
    legalBasis: "GSR 202(E) / GSR 779(E) strict statutory pricing mandate.",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Not observed",
    defaultAnalysis: "MRP declaration not observed in supplied image(s)."
  },
  {
    id: "rule_6_1_f",
    ruleNumber: "Rule 6(1)(f)",
    title: "Consumer Care Helpline & Grievance Details",
    category: "Consumer Redressal",
    statutoryMandate: "Name, address, telephone number, and e-mail address of the person or office that can be contacted in case of consumer complaints.",
    legalBasis: "Statutory mandatory multi-channel consumer grievance contact under Rule 6(1)(f).",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Not observed",
    defaultAnalysis: "Consumer care contact information not observed in supplied image(s)."
  },
  {
    id: "rule_6_1_m",
    ruleNumber: "Rule 6(1)(m)",
    title: "Unit Sale Price (USP) Declaration",
    category: "Pricing & Consumer Protection",
    statutoryMandate: "Unit sale price declared in rupees/paise per gram, kilogram, milliliter, liter, or number as per GSR 784(E) / GSR 226(E).",
    legalBasis: "GSR 784(E) 2021 & GSR 226(E) 2022 mandate Unit Sale Price (USP) for price transparency.",
    defaultStatus: "PASS",
    defaultObserved: "UNIT SALE PRICE",
    defaultAnalysis: "Unit Sale Price declared as 'UNIT SALE PRICE'."
  },
  {
    id: "rule_6_1_proviso",
    ruleNumber: "Rule 6(1) Proviso",
    title: "Best Before or Use By Date (Perishable Commodities)",
    category: "Dates & Shelf Life",
    statutoryMandate: "Best before or use by date, month and year for human consumption commodities or perishable products.",
    legalBasis: "Statutory consumer safety provision for perishable food and consumables.",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Not observed",
    defaultAnalysis: "Best before date not observed in supplied image(s)."
  },
  {
    id: "rule_7_8",
    ruleNumber: "Rule 7 & 8",
    title: "Principal Display Panel Area & Minimum Character Height",
    category: "Display & Typography",
    statutoryMandate: "Characters of declarations must meet statutory minimum font height relative to the Principal Display Panel (PDP) square area.",
    legalBasis: "Rule 7 & 8 read with Table I/II specify exact mm height based on PDP surface area in cm².",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Pixel bounding boxes available without scale calibration",
    defaultAnalysis: "Physical character height cannot be verified from the supplied image without scale/calibration."
  },
  {
    id: "rule_9",
    ruleNumber: "Rule 9",
    title: "Manner of Declarations, Legibility & Prominence",
    category: "Display & Typography",
    statutoryMandate: "Declarations shall be legible, prominent, definite and plain, contrasting conspicuously with the background.",
    legalBasis: "Rule 9 requires high optical contrast, unobstructed visibility, and unequivocal typography.",
    defaultStatus: "PASS",
    defaultObserved: "High optical clarity and distinct contrast",
    defaultAnalysis: "Mandatory declarations are legible and prominent."
  },
  {
    id: "rule_10",
    ruleNumber: "Rule 10",
    title: "Declaration of Complete Address",
    category: "Identity & Origin",
    statutoryMandate: "Address declaration shall be complete, containing postal details, street/locality, city, state and PIN code.",
    legalBasis: "Rule 10 stipulates that a mere city name or post box number without complete premise details is insufficient.",
    defaultStatus: "NEEDS REVIEW",
    defaultObserved: "Not observed",
    defaultAnalysis: "Address declaration not observed in supplied image(s)."
  },
  {
    id: "rule_12_13",
    ruleNumber: "Rule 12 & 13",
    title: "Standard Units of Weight, Measure or Count",
    category: "Quantity & Measure",
    statutoryMandate: "Quantities expressed in metric system standard units (g, kg, ml, l, m) without non-standard symbols or imperial units.",
    legalBasis: "Rule 12 & 13 prohibit symbols other than authorized SI/metric unit representations.",
    defaultStatus: "PASS",
    defaultObserved: "g",
    defaultAnalysis: "Standard metric unit 'g' conforms with Rule 12 & 13."
  },
  {
    id: "rule_18",
    ruleNumber: "Rule 18",
    title: "Provisions on Retail Sale Price Revisions & Smudging",
    category: "Pricing & Consumer Protection",
    statutoryMandate: "Prohibition on alterations, smudging, or overwriting of declared Maximum Retail Price (MRP).",
    legalBasis: "Rule 18(1) penalizes price tampering, double labeling, or smudged print.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Rule 18 applies conditionally when price alterations or re-stickering are under inspection."
  },
  {
    id: "rule_24",
    ruleNumber: "Rule 24",
    title: "Wholesale Packages Declarations",
    category: "Trade Classification",
    statutoryMandate: "Specific declarations applicable to wholesale packages as per Chapter III.",
    legalBasis: "Chapter III provisions apply solely to non-retail wholesale intermediate shipping containers.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Retail package — Wholesale package provisions under Chapter III do not apply."
  },
  {
    id: "rule_25",
    ruleNumber: "Rule 25",
    title: "Export Packages Requirements & Domestic Sale Restriction",
    category: "Trade Classification",
    statutoryMandate: "Exemption conditions and marking requirements for export commodities.",
    legalBasis: "Export packages intended solely for overseas export are regulated under Rule 25.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Domestic retail package — Export exemptions under Rule 25 do not apply."
  },
  {
    id: "rule_26",
    ruleNumber: "Rule 26",
    title: "Statutory Exemptions under Rule 26",
    category: "Exemptions",
    statutoryMandate: "Exemption thresholds (packages under 10g/10ml, agricultural produce over 50kg, fast food, etc.).",
    legalBasis: "Statutory exemptions under Rule 26 criteria.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Standard packaged commodity subject to general Chapter II declarations (no Rule 26 exemption applies)."
  },
  {
    id: "rule_6_1_qr",
    ruleNumber: "Rule 6(1) Electronic QR Proviso",
    title: "Electronic Products QR Code Declaration Provisions (2023 Amendment)",
    category: "Digital Compliance",
    statutoryMandate: "Option for electronic products to declare certain details through digital QR code provisions under GSR 512(E) 2023.",
    legalBasis: "GSR 512(E) 2023 amendment allows electronic products to provide certain mandatory declarations via QR code.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "Electronic products QR code provisions (2023 Amendment) do not apply to general non-electronic goods."
  },
  {
    id: "rule_medical_devices",
    ruleNumber: "Rule Medical Devices Exclusion (2025 Amendment)",
    title: "Medical Devices Special Statutory Treatment (2025 Amendment)",
    category: "Exemptions",
    statutoryMandate: "Exclusion and special labeling alignment with Medical Devices Rules, 2017.",
    legalBasis: "2025 Medical Devices Amendment harmonizes packaged commodities regulations with specialized healthcare standards.",
    defaultStatus: "NOT APPLICABLE",
    defaultObserved: "—",
    defaultAnalysis: "General packaged commodity — Medical Devices Rules override does not apply."
  }
];

export const STATUS_COLORS = {
  "PASS": {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "PASS"
  },
  "FAILED": {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    label: "FAILED"
  },
  "NEEDS REVIEW": {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "NEEDS REVIEW"
  },
  "NOT APPLICABLE": {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    label: "NOT APPLICABLE"
  },
  "EXEMPT": {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    label: "EXEMPT"
  }
};

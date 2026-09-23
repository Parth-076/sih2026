import { normalizeUnit, parseAmount, tryParseDate } from "../utils/labelNormalization";

export interface ExtractedAmount {
  value: number;
  raw: string;
}

export interface ExtractedQuantity {
  value: number;
  unit: string;
  raw: string;
}

export interface ExtractedDate {
  raw: string;
  parsed: string | null; // ISO string, or null if the format couldn't be parsed confidently
}

export interface ExtractedDeclarations {
  mrp: ExtractedAmount | null;
  netQuantity: ExtractedQuantity | null;
  manufacturingDate: ExtractedDate | null;
  packingDate: ExtractedDate | null;
  bestBeforeOrExpiry: ExtractedDate | null;
  countryOfOrigin: string | null;
  manufacturer: string | null;
  consumerCare: string | null;
  batchNumber: string | null;
}

/**
 * Pattern-based extraction over OCR full text — deliberately NOT exact
 * string matching (brief §11): "MRP Rs. 99", "M.R.P. 99", "₹99", and
 * "Maximum Retail Price: Rs 99" all resolve to the same field, and units
 * (g/gm/grams, kg/kgs, ml/mL, l/litre) are normalized via
 * utils/labelNormalization.ts.
 *
 * This is a practical baseline, not a claim of complete label
 * understanding — OCR line breaks and label layout variation mean some
 * real labels won't match. Every extracted field keeps the raw matched
 * text alongside any normalized value, so nothing is silently invented.
 */
export function extractDeclarations(fullText: string): ExtractedDeclarations {
  return {
    mrp: extractMrp(fullText),
    netQuantity: extractNetQuantity(fullText),
    manufacturingDate: extractDate(fullText, MFG_DATE_PATTERNS),
    packingDate: extractDate(fullText, PACKING_DATE_PATTERNS),
    bestBeforeOrExpiry: extractDate(fullText, EXPIRY_DATE_PATTERNS),
    countryOfOrigin: extractCountryOfOrigin(fullText),
    manufacturer: extractManufacturer(fullText),
    consumerCare: extractConsumerCare(fullText),
    batchNumber: extractBatchNumber(fullText),
  };
}

function extractMrp(text: string): ExtractedAmount | null {
  const pattern =
    /(?:m\.?\s*r\.?\s*p\.?|maximum\s+retail\s+price)\s*[:\-]?\s*(?:\(\s*)?(?:incl(?:usive)?\.?\s*of\s*all\s*taxes)?\s*(?:\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;
  const match = text.match(pattern);
  if (!match) return null;

  const value = parseAmount(match[1]);
  if (value === null) return null;

  return { value, raw: match[0].trim() };
}

function extractNetQuantity(text: string): ExtractedQuantity | null {
  const pattern =
    /net\s*(?:qty\.?|quantity|wt\.?|weight|contents)?\s*[:\-]?\s*([\d.]+)\s*(kgs?|kilograms?|gms?|grams?|g|mls?|milli\s*litres?|litres?|liters?|ltrs?|l|pcs?|pieces?|nos)\b/i;
  const match = text.match(pattern);
  if (!match) return null;

  const value = parseAmount(match[1]);
  const unit = normalizeUnit(match[2]);
  if (value === null || unit === null) return null;

  return { value, unit, raw: match[0].trim() };
}

const MFG_DATE_PATTERNS = [
  /(?:mfg\.?\s*date|manufactured\s+on|manufacturing\s+date|mfd\.?)\s*[:\-]?\s*([\d]{1,2}[\/\-.][\d]{1,2}[\/\-.][\d]{2,4}|[\d]{1,2}[\/\-.][\d]{2,4}|(?:\d{1,2}\s+)?[A-Za-z]{3,}\s+\d{4})/i,
];
const PACKING_DATE_PATTERNS = [
  /(?:pkd\.?\s*date|packed\s+on|packaging\s+date|pkg\.?\s*date)\s*[:\-]?\s*([\d]{1,2}[\/\-.][\d]{1,2}[\/\-.][\d]{2,4}|[\d]{1,2}[\/\-.][\d]{2,4}|(?:\d{1,2}\s+)?[A-Za-z]{3,}\s+\d{4})/i,
];
const EXPIRY_DATE_PATTERNS = [
  /(?:best\s*before|use\s*by|expiry\s*date|exp\.?\s*date|exp\.?)\s*[:\-]?\s*([\d]{1,2}[\/\-.][\d]{1,2}[\/\-.][\d]{2,4}|[\d]{1,2}[\/\-.][\d]{2,4}|(?:\d{1,2}\s+)?[A-Za-z]{3,}\s+\d{4}|\d+\s*months?\s+from\s+(?:mfg|manufacturing|packaging))/i,
];

function extractDate(text: string, patterns: RegExp[]): ExtractedDate | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1]?.trim() ?? match[0].trim();
      const parsed = tryParseDate(raw);
      return { raw, parsed: parsed ? parsed.toISOString() : null };
    }
  }
  return null;
}

function extractCountryOfOrigin(text: string): string | null {
  const match = text.match(/country\s+of\s+origin\s*[:\-]?\s*([A-Za-z][A-Za-z .]{1,40})/i);
  if (!match) return null;
  return cleanLine(match[1]);
}

function extractManufacturer(text: string): string | null {
  const match = text.match(
    /(?:manufactured\s+by|marketed\s+by|packed\s+by|manufacturer)\s*[:\-]?\s*([^\n]{3,80})/i
  );
  if (!match) return null;
  return cleanLine(match[1]);
}

function extractConsumerCare(text: string): string | null {
  // Prefer an explicit "consumer/customer care" line if present.
  const labeled = text.match(
    /(?:consumer\s+care|customer\s+care|customer\s+support)\s*[:\-]?\s*([^\n]{3,120})/i
  );
  if (labeled) return cleanLine(labeled[1]);

  // Fall back to a bare phone number or email if no explicit label was found.
  const phone = text.match(/\b(?:\+?91[\-\s]?)?[1-9]\d{2,4}[\-\s]?\d{3,4}[\-\s]?\d{3,4}\b/);
  const email = text.match(/[\w.+-]+@[\w-]+\.[A-Za-z]{2,}/);
  if (phone && email) return `${phone[0]}, ${email[0]}`;
  if (phone) return phone[0];
  if (email) return email[0];
  return null;
}

function extractBatchNumber(text: string): string | null {
  const match = text.match(
    /(?:batch|lot)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/]{1,20})/i
  );
  if (!match) return null;
  return match[1].trim();
}

function cleanLine(raw: string): string {
  return raw.split(/[\n\r]/)[0].trim().replace(/[.,;]+$/, "");
}

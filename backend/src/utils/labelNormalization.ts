/**
 * Normalizes the many ways units appear on Indian packaged-goods labels
 * (brief §11: "g / gm / grams", "kg / kgs", "ml / mL", "L / litre") down to
 * a small canonical set. Returns null for anything unrecognized rather than
 * guessing.
 */
const UNIT_MAP: Record<string, string> = {
  g: "g",
  gm: "g",
  gms: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kgs: "kg",
  kilogram: "kg",
  kilograms: "kg",
  ml: "ml",
  mls: "ml",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  l: "l",
  ltr: "l",
  ltrs: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  pcs: "pcs",
  pc: "pcs",
  piece: "pcs",
  pieces: "pcs",
  nos: "pcs",
};

export function normalizeUnit(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\.$/, "");
  return UNIT_MAP[key] ?? null;
}

/** Parses a printed money amount like "1,234.50" into a plain number. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * Best-effort parse of common Indian label date formats into an ISO date.
 * Returns null (rather than a guessed date) for anything ambiguous — the
 * raw printed text is always preserved alongside this, so nothing is lost
 * when parsing fails.
 */
export function tryParseDate(raw: string): Date | null {
  const text = raw.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  let m = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const date = new Date(Date.UTC(year, Number(mo) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // MM/YYYY (common for best-before, no specific day printed)
  m = text.match(/^(\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const [, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const date = new Date(Date.UTC(year, Number(mo) - 1, 1));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // "12 Jan 2027" / "Jan 2027"
  m = text.match(/^(?:(\d{1,2})\s+)?([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) {
    const [, d, monthName, y] = m;
    const monthKey = monthName.slice(0, 3).toLowerCase();
    const month = MONTHS[monthKey];
    if (month === undefined) return null;
    const date = new Date(Date.UTC(Number(y), month, d ? Number(d) : 1));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

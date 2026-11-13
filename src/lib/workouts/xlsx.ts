/**
 * Writes an .xlsx, with no library.
 *
 * A spreadsheet file is a zip of XML parts, and the subset needed to
 * say "here are some sheets of numbers and text" is small. The
 * alternative was half a megabyte of dependency on a page that opens on
 * a phone, to produce a file that has no formulas, no styles and no
 * merged cells in it.
 *
 * Entries are stored, not deflated. CompressionStream would shrink them
 * but makes writing the zip asynchronous and the central directory
 * harder to lay out; a year of sets is a few hundred kilobytes either
 * way, and Drive and Excel do not care.
 *
 * Strings are written inline rather than through a shared-strings part,
 * which costs a few bytes per cell and removes a whole file and its
 * index from the format.
 */

/**
 * A computed cell: the formula, plus the value it currently works out
 * to. The cached value matters — a spreadsheet shows it until it
 * recalculates, and some viewers never do, so a formula written without
 * one opens as a sheet full of blanks.
 */
export interface Formula {
  f: string
  v?: number
}

export type Cell = string | number | null | Formula

export interface Sheet {
  name: string
  rows: Cell[][]
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
export function columnName(index: number): string {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

/**
 * A sheet name Excel will accept: at most 31 characters, and none of
 * the handful it reserves for its own reference syntax.
 */
function safeName(name: string, index: number): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31)
  return cleaned || `Sheet${index + 1}`
}

function sheetXml(rows: Cell[][]): string {
  const body = rows
    .map((cells, rowIndex) => {
      const r = rowIndex + 1
      const written = cells
        .map((value, columnIndex) => {
          if (value === null || value === '') return ''
          const ref = `${columnName(columnIndex)}${r}`
          if (typeof value === 'object') {
            const cached = typeof value.v === 'number' ? `<v>${value.v}</v>` : ''
            return `<c r="${ref}"><f>${escapeXml(value.f)}</f>${cached}</c>`
          }
          if (typeof value === 'number') {
            return Number.isFinite(value) ? `<c r="${ref}"><v>${value}</v></c>` : ''
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
        })
        .join('')
      return written ? `<row r="${r}">${written}</row>` : ''
    })
    .join('')

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${body}</sheetData></worksheet>`
  )
}

function parts(sheets: Sheet[]): { path: string; text: string }[] {
  const named = sheets.map((sheet, index) => ({ ...sheet, safe: safeName(sheet.name, index) }))

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    named
      .map(
        (_ignored, index) =>
          `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('') +
    '</Types>'

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>'

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    named
      .map(
        (sheet, index) =>
          `<sheet name="${escapeXml(sheet.safe)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
      )
      .join('') +
    '</sheets></workbook>'

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    named
      .map(
        (_ignored, index) =>
          `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
      )
      .join('') +
    '</Relationships>'

  return [
    { path: '[Content_Types].xml', text: contentTypes },
    { path: '_rels/.rels', text: rootRels },
    { path: 'xl/workbook.xml', text: workbook },
    { path: 'xl/_rels/workbook.xml.rels', text: workbookRels },
    ...named.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      text: sheetXml(sheet.rows),
    })),
  ]
}

export function buildWorkbook(sheets: Sheet[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const files = parts(sheets).map((part) => {
    const name = encoder.encode(part.path)
    const data = encoder.encode(part.text)
    return { name, data, crc: crc32(data) }
  })

  const LOCAL = 30
  const CENTRAL = 46
  const END = 22

  const total =
    files.reduce((sum, f) => sum + LOCAL + f.name.length + f.data.length, 0) +
    files.reduce((sum, f) => sum + CENTRAL + f.name.length, 0) +
    END

  const buffer = new ArrayBuffer(total)
  const out = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let at = 0
  const offsets: number[] = []

  for (const file of files) {
    offsets.push(at)
    view.setUint32(at, 0x04034b50, true)
    view.setUint16(at + 4, 20, true)
    // Bit 11 says the name is UTF-8, which Cyrillic sheet names need.
    view.setUint16(at + 6, 0x0800, true)
    view.setUint16(at + 8, 0, true)
    view.setUint16(at + 10, 0, true)
    view.setUint16(at + 12, 0x2821, true)
    view.setUint32(at + 14, file.crc, true)
    view.setUint32(at + 18, file.data.length, true)
    view.setUint32(at + 22, file.data.length, true)
    view.setUint16(at + 26, file.name.length, true)
    view.setUint16(at + 28, 0, true)
    at += LOCAL
    out.set(file.name, at)
    at += file.name.length
    out.set(file.data, at)
    at += file.data.length
  }

  const directoryAt = at
  files.forEach((file, index) => {
    view.setUint32(at, 0x02014b50, true)
    view.setUint16(at + 4, 20, true)
    view.setUint16(at + 6, 20, true)
    view.setUint16(at + 8, 0x0800, true)
    view.setUint16(at + 10, 0, true)
    view.setUint16(at + 12, 0, true)
    view.setUint16(at + 14, 0x2821, true)
    view.setUint32(at + 16, file.crc, true)
    view.setUint32(at + 20, file.data.length, true)
    view.setUint32(at + 24, file.data.length, true)
    view.setUint16(at + 28, file.name.length, true)
    view.setUint16(at + 30, 0, true)
    view.setUint16(at + 32, 0, true)
    view.setUint16(at + 34, 0, true)
    view.setUint16(at + 36, 0, true)
    view.setUint32(at + 38, 0, true)
    view.setUint32(at + 42, offsets[index], true)
    at += CENTRAL
    out.set(file.name, at)
    at += file.name.length
  })

  view.setUint32(at, 0x06054b50, true)
  view.setUint16(at + 4, 0, true)
  view.setUint16(at + 6, 0, true)
  view.setUint16(at + 8, files.length, true)
  view.setUint16(at + 10, files.length, true)
  view.setUint32(at + 12, at - directoryAt, true)
  view.setUint32(at + 16, directoryAt, true)
  view.setUint16(at + 20, 0, true)

  return out
}

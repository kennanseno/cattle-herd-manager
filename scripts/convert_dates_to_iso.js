const fs = require('fs')
const path = require('path')

function splitCsvLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; continue }
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue }
    cur += ch
  }
  result.push(cur)
  return result
}

function pad(n) { return n.toString().padStart(2,'0') }

function toISOFromDMY(s) {
  // expect d/m/yyyy or dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (!m) return null
  let [_, d, mo, y] = m
  if (y.length === 2) y = '20' + y
  return `${y}-${pad(mo)}-${pad(d)}`
}

const fp = path.join(process.cwd(), 'data', 'cattle.csv')
if (!fs.existsSync(fp)) { console.error('cattle.csv not found'); process.exit(1) }
const lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/)
if (lines.length <= 1) { console.log('no data'); process.exit(0) }
const header = splitCsvLine(lines[0])
const idx = header.findIndex(h => h.trim() === 'dateOfBirth')
if (idx === -1) { console.error('dateOfBirth column not found'); process.exit(1) }

let changed = 0
const out = [lines[0]]
for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (!line) { out.push(line); continue }
  const cols = splitCsvLine(line)
  const val = (cols[idx] || '').trim()
  if (!val) { out.push(line); continue }
  // already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) { out.push(line); continue }
  // try DMY
  const iso = toISOFromDMY(val)
  if (iso) {
    cols[idx] = iso
    changed++
    out.push(cols.join(','))
    continue
  }
  // try common US M/D/Y
  const m2 = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m2) {
    const [_, p1, p2, y] = m2
    // if p1>12 treat as D/M/Y, else assume D/M/Y as dataset uses DMY
    const iso2 = toISOFromDMY(val)
    if (iso2) { cols[idx] = iso2; changed++; out.push(cols.join(',')); continue }
  }
  // otherwise leave as-is
  out.push(line)
}

fs.writeFileSync(fp, out.join('\n'), 'utf8')
console.log(`Converted ${changed} dateOfBirth values to ISO in data/cattle.csv`)

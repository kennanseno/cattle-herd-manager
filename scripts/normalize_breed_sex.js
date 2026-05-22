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

const fp = path.join(process.cwd(), 'data', 'cattle.csv')
if (!fs.existsSync(fp)) { console.error('cattle.csv not found'); process.exit(1) }
const lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/)
if (lines.length <= 1) { console.log('no data'); process.exit(0) }
const header = splitCsvLine(lines[0])
const sexIdx = header.findIndex(h => h.trim() === 'sex')
const breedIdx = header.findIndex(h => h.trim() === 'breed')
if (sexIdx === -1 || breedIdx === -1) { console.error('sex or breed column not found'); process.exit(1) }

let changedSex = 0
let changedBreed = 0
const out = [lines[0]]
for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (!line) { out.push(line); continue }
  const cols = splitCsvLine(line)
  // normalize sex
  const sexVal = (cols[sexIdx] || '').trim()
  if (sexVal) {
    const v = sexVal.toLowerCase()
    if (v === 'male' || v === 'm') {
      if (cols[sexIdx] !== 'male') { cols[sexIdx] = 'male'; changedSex++ }
    } else if (v === 'female' || v === 'f') {
      if (cols[sexIdx] !== 'female') { cols[sexIdx] = 'female'; changedSex++ }
    } else {
      // leave as-is
    }
  }
  // set breed to Brahman for all rows
  const breedVal = (cols[breedIdx] || '').trim()
  if (breedVal !== 'Brahman') { cols[breedIdx] = 'Brahman'; changedBreed++ }

  out.push(cols.join(','))
}

fs.writeFileSync(fp, out.join('\n'), 'utf8')
console.log(`Set breed=Brahman for ${changedBreed} rows; normalized sex for ${changedSex} rows`)

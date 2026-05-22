const fs = require('fs')
const path = require('path')

const fp = path.join(process.cwd(), 'data', 'cattle.csv')
if (!fs.existsSync(fp)) { console.error('cattle.csv not found'); process.exit(1) }
const content = fs.readFileSync(fp, 'utf8')
const lines = content.split(/\r?\n/)
if (lines.length <= 1) { console.log('no data'); process.exit(0) }
const header = lines[0]
const rows = lines.slice(1).map(l => l)

function mapStatus(s) {
  if (!s) return ''
  const v = s.trim().toLowerCase()
  if (v === 'alive' || v === 'active') return 'active'
  if (v === 'sold') return 'sold'
  if (v === 'deceased' || v === 'dead') return 'deceased'
  if (v === 'archived') return 'archived'
  return v
}

const out = rows.map((r) => {
  if (!r) return r
  const cols = r.split(',')
  // status is 10th column (index 9) according to header in this project
  if (cols.length >= 10) {
    cols[9] = mapStatus(cols[9])
    return cols.join(',')
  }
  return r
})

fs.writeFileSync(fp, [header, ...out].join('\n'), 'utf8')
console.log('Normalized statuses in cattle.csv')

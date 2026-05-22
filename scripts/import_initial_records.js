const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

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

function readLines(fp) {
  return fs.readFileSync(fp, 'utf8').split(/\r?\n/)
}

function getFinanceCategory(type, description) {
  const normalized = description.toLowerCase()
  if (type === 'income') {
    if (normalized.includes('milk')) return 'Milk Sale'
    if (normalized.includes('stud')) return 'Stud Fee'
    if (normalized.includes('subsidy')) return 'Government Subsidy'
    return 'Cattle Sale'
  }

  if (/salary|payroll|labor|wages|worker/.test(normalized)) return 'Labor'
  if (/fencing|electric fence|cage|tank|tractor|chopper|engine|bunker|channel|equipment|ai tank|cage|truck|trailer/.test(normalized)) return 'Equipment'
  if (/deworm|ivermectin|vitamin|injection|medicine|ai|preg check|pregnancy|vaccin|worm|vet|veterinarian|drench/.test(normalized)) return 'Veterinary'
  if (/silage|napier|feed|mineral|salt|hay|grass|grazing|fodder|maize|grain|corn|ration/.test(normalized)) return 'Feed'
  if (/transport|freight|delivery|truck|haul|shipping|fuel|diesel/.test(normalized)) return 'Transport'
  if (/water|electric|utilities|power|internet|phone|gas|sewer/.test(normalized)) return 'Utilities'
  if (/breeding|ai|bull|heifer|calf|cow|sire|dam/.test(normalized)) return 'Breeding'
  return 'Other Expense'
}

function appendRowsCsv(targetPath, header, rows) {
  if (!rows || rows.length === 0) return
  const lines = rows.map(r => header.map(k => (r[k] ?? '')).join(','))
  fs.appendFileSync(targetPath, '\n' + lines.join('\n'))
}

function importHerd() {
  const src = path.join('data','initial-record','Cattle Operation - Herd Record - Herd Record.csv')
  if (!fs.existsSync(src)) { console.log('Herd source not found:', src); return {added:0} }
  const lines = readLines(src).filter(Boolean)
  if (lines.length === 0) return {added:0}
  const entries = []
  for (let i=1;i<lines.length;i++) {
    const cols = splitCsvLine(lines[i])
    if (cols.length === 0) continue
    const tag = cols[0] && cols[0].trim()
    if (!tag) continue
    const rec = {}
    rec.tagNumber = tag.replace(/\s+/g,' ')
    rec.dateOfBirth = cols[1] ? cols[1].trim() : ''
    rec.sex = cols[2] ? cols[2].trim() : ''
    rec.sireTagNumber = cols[3] ? cols[3].trim() : ''
    rec.damTagNumber = cols[4] ? cols[4].trim() : ''
    rec.breed = cols[5] ? cols[5].trim() : ''
    rec.status = cols[6] ? cols[6].trim() : ''
    rec.notes = cols[8] ? cols[8].trim() : ''
    entries.push(rec)
  }

  const target = path.join('data','cattle.csv')
  if (!fs.existsSync(target)) { console.log('Target cattle.csv missing:', target); return {added:0} }
  const targetHeaderLine = readLines(target)[0]
  const targetHeader = splitCsvLine(targetHeaderLine)
  const existLines = readLines(target).slice(1).filter(Boolean)
  const existingTags = new Set(existLines.map(l => splitCsvLine(l)[0]))
  const toAdd = entries.filter(e => !existingTags.has(e.tagNumber))
  appendRowsCsv(target, targetHeader, toAdd)
  return {added: toAdd.length}
}

function importFinances() {
  const src = path.join('data','initial-record','Cattle Operation - Expenses - Expenses.csv')
  if (!fs.existsSync(src)) { console.log('Finances source not found:', src); return {added:0} }
  const content = fs.readFileSync(src, 'utf8')
  const rows = parse(content, { columns: false, skip_empty_lines: true, relax_quotes: true, trim: true })
  const entries = []

  for (const row of rows.slice(2)) {
    const [expenseDate, expenseDesc, expenseValue, , incomeDate, incomeDesc, incomeValue] = row
    if (expenseDate && expenseValue) {
      const description = expenseDesc ? expenseDesc.toString().trim() : ''
      const amount = expenseValue.toString().replace(/[^0-9.-]/g, '')
      entries.push({
        date: expenseDate,
        type: 'expense',
        category: getFinanceCategory('expense', description),
        amount,
        description,
        notes: '',
        relatedTagNumber: '',
      })
    }
    if (incomeDate && incomeValue) {
      const description = incomeDesc ? incomeDesc.toString().trim() : ''
      const amount = incomeValue.toString().replace(/[^0-9.-]/g, '')
      entries.push({
        date: incomeDate,
        type: 'income',
        category: getFinanceCategory('income', description),
        amount,
        description,
        notes: '',
        relatedTagNumber: '',
      })
    }
  }

  const target = path.join('data','finances.csv')
  if (!fs.existsSync(target)) { console.log('Target finances.csv missing:', target); return {added:0} }
  const targetHeaderLine = readLines(target)[0]
  const targetHeader = splitCsvLine(targetHeaderLine)
  appendRowsCsv(target, targetHeader, entries)
  return {added: entries.length}
}

function main() {
  console.log('Importing initial records...')
  const herd = importHerd()
  console.log(`Herd rows added: ${herd.added}`)
  const fin = importFinances()
  console.log(`Finances rows added: ${fin.added}`)
}

main()

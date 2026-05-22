const fs = require('fs');
const path = require('path');

function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  result.push(cur);
  return result;
}

function formatISO(year, month, day = 1) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function parseAcquiredDate(value) {
  const regex = /Acquired\s+(\d{1,2})\/(\d{2,4})\s*@\s*est\.?\s*(\d{1,3})\s*mo/iu;
  const fallback = /Acquired\s+(\d{1,2})\/(\d{2,4})\s*@\s*est\.?\s*(\d{1,3})\s*months/iu;
  const d = value.match(regex) || value.match(fallback);
  if (!d) return null;
  let [, month, year, months] = d;
  month = parseInt(month, 10);
  year = parseInt(year, 10);
  months = parseInt(months, 10);
  if (year < 100) year += year < 70 ? 2000 : 1900;
  // estimated birth = acquired date minus age estimate in months
  let estimateMonth = month;
  let estimateYear = year;
  let remaining = months;
  while (remaining > 0) {
    estimateMonth -= 1;
    if (estimateMonth < 1) {
      estimateMonth = 12;
      estimateYear -= 1;
    }
    remaining -= 1;
  }
  return formatISO(estimateYear, estimateMonth, 1);
}

const fp = path.join(process.cwd(), 'data', 'cattle.csv');
if (!fs.existsSync(fp)) {
  console.error('data/cattle.csv not found');
  process.exit(1);
}

const content = fs.readFileSync(fp, 'utf8');
const lines = content.split(/\r?\n/);
const header = splitCsvLine(lines[0]);
const dobIdx = header.findIndex((h) => h.trim() === 'dateOfBirth');
const notesIdx = header.findIndex((h) => h.trim() === 'notes');
if (dobIdx === -1 || notesIdx === -1) {
  console.error('Required columns not found');
  process.exit(1);
}

let changed = 0;
const out = [lines[0]];
for (let i = 1; i < lines.length; i += 1) {
  const line = lines[i];
  if (!line) {
    out.push(line);
    continue;
  }
  const cols = splitCsvLine(line);
  const dobValue = (cols[dobIdx] || '').trim();
  if (!dobValue || /^\d{4}-\d{2}-\d{2}$/.test(dobValue) === false) {
    const estimated = parseAcquiredDate(dobValue);
    if (estimated) {
      const noteValue = (cols[notesIdx] || '').trim();
      const originalNote = `Original DOB string: ${dobValue}`;
      cols[dobIdx] = estimated;
      cols[notesIdx] = noteValue ? `${noteValue} | ${originalNote}` : originalNote;
      changed += 1;
    }
  }
  out.push(cols.join(','));
}

fs.writeFileSync(fp, out.join('\n'), 'utf8');
console.log(`Updated ${changed} cattle rows with estimated dateOfBirth from acquired notes.`);

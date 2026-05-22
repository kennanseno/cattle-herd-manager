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

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISO(value) {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return trimmed;
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!dmyMatch) return null;
  let [_, day, month, year] = dmyMatch;
  day = parseInt(day, 10);
  month = parseInt(month, 10);
  year = parseInt(year, 10);
  if (year < 100) year += 2000;
  return `${year}-${pad(month)}-${pad(day)}`;
}

const fp = path.join(process.cwd(), 'data', 'finances.csv');
if (!fs.existsSync(fp)) {
  console.error('data/finances.csv not found');
  process.exit(1);
}

const content = fs.readFileSync(fp, 'utf8');
const lines = content.split(/\r?\n/);
const header = splitCsvLine(lines[0]);
const dateIndex = header.findIndex((h) => h.trim() === 'date');
if (dateIndex === -1) {
  console.error('date column not found');
  process.exit(1);
}

let updated = 0;
const out = [lines[0]];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line) {
    out.push(line);
    continue;
  }
  const cols = splitCsvLine(line);
  const original = cols[dateIndex] ? cols[dateIndex].trim() : '';
  const iso = toISO(original);
  if (iso && iso !== original) {
    cols[dateIndex] = iso;
    updated += 1;
  }
  out.push(cols.join(','));
}
fs.writeFileSync(fp, out.join('\n'), 'utf8');
console.log(`Converted ${updated} finance date fields to ISO format.`);

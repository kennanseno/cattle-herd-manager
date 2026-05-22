const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

function toIsoDate(value) {
  const trimmed = value.trim();
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!dmy) return null;
  let [_, day, month, year] = dmy;
  day = parseInt(day, 10);
  month = parseInt(month, 10);
  year = parseInt(year, 10);
  if (year < 100) year += 2000;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function getCategory(type, desc) {
  const normalized = desc.toLowerCase();
  if (type === 'income') {
    if (normalized.includes('milk')) return 'Milk Sale';
    if (normalized.includes('stud')) return 'Stud Fee';
    if (normalized.includes('subsidy')) return 'Government Subsidy';
    return 'Cattle Sale';
  }
  if (/salary|payroll|labor|wages|worker/.test(normalized)) return 'Labor';
  if (/fencing|electric fence|cage|tank|tractor|chopper|engine|bunker|channel|equipment|ai tank|cage|tub|truck|chopper/.test(normalized)) return 'Equipment';
  if (/deworm|ivermectin|vitamin|injection|medicine|ai|preg check|pregnancy|vaccin|worm|vet|veterinarian|drench/.test(normalized)) return 'Veterinary';
  if (/silage|napier|feed|mineral|salt|hay|grass|grazing|fodder|maize|grain|corn|ration/.test(normalized)) return 'Feed';
  if (/transport|freight|delivery|truck|haul|shipping|fuel|diesel/.test(normalized)) return 'Transport';
  if (/water|electric|utilities|power|internet|phone|gas|sewer/.test(normalized)) return 'Utilities';
  if (/breeding|ai|bull|heifer|calf|cow|sire|dam/.test(normalized)) return 'Breeding';
  return 'Other Expense';
}

function buildRecord({ date, type, category, amount, description }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date,
    type,
    category,
    amount,
    description,
    notes: '',
    relatedTagNumber: '',
    createdAt: '',
    updatedAt: '',
  };
}

const sourcePath = path.join(process.cwd(), 'data', 'initial-record', 'Cattle Operation - Expenses - Expenses.csv');
const targetPath = path.join(process.cwd(), 'data', 'finances.csv');
if (!fs.existsSync(sourcePath)) {
  console.error('Source file not found:', sourcePath);
  process.exit(1);
}
const content = fs.readFileSync(sourcePath, 'utf8');
const rows = parse(content, { columns: false, skip_empty_lines: false });
const records = [];
for (let i = 2; i < rows.length; i += 1) {
  const row = rows[i];
  if (!row || (row.every((cell) => !cell || !cell.toString().trim()))) continue;
  const [eDate, eDesc, eAmt, , iDate, iDesc, iAmt] = row;
  const expDate = eDate ? eDate.toString().trim() : '';
  const incDate = iDate ? iDate.toString().trim() : '';
  const expAmount = eAmt ? eAmt.toString().trim().replace(/[^0-9.-]/g, '') : '';
  const incAmount = iAmt ? iAmt.toString().trim().replace(/[^0-9.-]/g, '') : '';
  const expDesc = eDesc ? eDesc.toString().trim() : '';
  const incDesc = iDesc ? iDesc.toString().trim() : '';
  if (expDate && expAmount) {
    const iso = toIsoDate(expDate);
    if (iso) {
      records.push(buildRecord({
        date: iso,
        type: 'expense',
        category: getCategory('expense', expDesc),
        amount: expAmount,
        description: expDesc,
      }));
    }
  }
  if (incDate && incAmount) {
    const iso = toIsoDate(incDate);
    if (iso) {
      records.push(buildRecord({
        date: iso,
        type: 'income',
        category: getCategory('income', incDesc),
        amount: incAmount,
        description: incDesc,
      }));
    }
  }
}
const output = stringify(records, { header: true, columns: ['date','type','category','amount','description','notes','relatedTagNumber','id','createdAt','updatedAt'] });
fs.writeFileSync(targetPath, output, 'utf8');
console.log(`Rebuilt finances.csv with ${records.length} records.`);

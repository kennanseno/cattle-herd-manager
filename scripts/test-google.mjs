// One-off connectivity test for the Google Sheets storage driver.
// Loads env from the shell (source .env.sheets first) and never prints secrets.
const need = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEETS_SPREADSHEET_ID',
];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}
console.log('Env vars present:', need.join(', '));

const { googleDriver } = await import('../lib/storage/google.ts');

let ok = true;

// 1. Sheets read access on every table.
for (const table of ['cattle', 'breeding', 'health', 'finances']) {
  try {
    const rows = await googleDriver.readTable(table);
    console.log(`✓ Sheets read  "${table}": ${rows.length} row(s)`);
  } catch (e) {
    ok = false;
    console.error(`✗ Sheets read  "${table}":`, e?.message || e);
  }
}

// Settings read.
try {
  const s = await googleDriver.readSettings({});
  console.log(`✓ Sheets read  "settings": ${Object.keys(s).length} key(s)`);
} catch (e) {
  ok = false;
  console.error('✗ Sheets read  "settings":', e?.message || e);
}

console.log(ok ? '\nAll checks passed. Google Sheets is connected.' : '\nSome checks failed (see above).');
process.exit(ok ? 0 : 1);

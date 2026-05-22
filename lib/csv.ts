import { parse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const imagesDir = path.join(DATA_DIR, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
}

export function getDataPath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

export function readCSV<T extends object>(filename: string): T[] {
  ensureDataDir();
  const filePath = getDataPath(filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.trim()) return [];
  try {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as T[];
  } catch {
    return [];
  }
}

export function writeCSV<T extends object>(filename: string, records: T[]): void {
  ensureDataDir();
  const filePath = getDataPath(filename);
  if (records.length === 0) {
    // Preserve headers by reading existing file for column names
    const existing = readCSV<T>(filename);
    if (existing.length === 0 && fs.existsSync(filePath)) return;
  }
  // Collect all column names from every record so that fields present on only
  // some records (e.g. `photos` on Cattle) are never silently dropped by
  // csv-stringify, which otherwise derives columns from the first record only.
  const columnsSet = new Set<string>();
  for (const r of records) for (const k of Object.keys(r)) columnsSet.add(k);
  const columns = columnsSet.size > 0 ? Array.from(columnsSet) : undefined;

  const content = csvStringify(records as Record<string, unknown>[], { header: true, ...(columns ? { columns } : {}) });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function readSettings<T>(filename: string, defaults: T): T {
  ensureDataDir();
  const filePath = getDataPath(filename);
  if (!fs.existsSync(filePath)) return defaults;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { ...defaults, ...JSON.parse(content) } as T;
  } catch {
    return defaults;
  }
}

export function writeSettings<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = getDataPath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

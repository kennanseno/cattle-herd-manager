import { google, type sheets_v4 } from 'googleapis';
import type { StorageDriver, StoredImage, TableName } from './types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const SETTINGS_TAB = 'settings';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function spreadsheetId(): string {
  return required('GOOGLE_SHEETS_SPREADSHEET_ID');
}

let authClient: InstanceType<typeof google.auth.JWT> | null = null;
let sheetsApi: sheets_v4.Sheets | null = null;

function getAuth() {
  if (authClient) return authClient;
  const email = required('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  // Private keys are stored with escaped newlines in env vars.
  const key = required('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n');
  authClient = new google.auth.JWT({ email, key, scopes: SCOPES });
  return authClient;
}

function sheets(): sheets_v4.Sheets {
  if (!sheetsApi) sheetsApi = google.sheets({ version: 'v4', auth: getAuth() });
  return sheetsApi;
}

// ─── Sheets helpers ──────────────────────────────────────────────────────────

const knownTabs = new Set<string>();

/** Create the tab if it does not already exist. */
async function ensureTab(title: string): Promise<void> {
  if (knownTabs.has(title)) return;
  const api = sheets();
  const meta = await api.spreadsheets.get({ spreadsheetId: spreadsheetId() });
  const titles = (meta.data.sheets || [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));
  titles.forEach((t) => knownTabs.add(t));
  if (titles.includes(title)) return;
  await api.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  knownTabs.add(title);
}

function rowsToObjects<T>(values: string[][]): T[] {
  if (values.length === 0) return [];
  const [header, ...rows] = values;
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((col, i) => {
      if (col) obj[col] = row[i] ?? '';
    });
    return obj as T;
  });
}

async function readRange(tab: string): Promise<string[][]> {
  try {
    const res = await sheets().spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: tab,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return (res.data.values as string[][] | undefined)?.map((r) => r.map((c) => (c == null ? '' : String(c)))) ?? [];
  } catch {
    return [];
  }
}

async function overwriteTab(tab: string, values: (string | number)[][]): Promise<void> {
  await ensureTab(tab);
  const api = sheets();
  await api.spreadsheets.values.clear({ spreadsheetId: spreadsheetId(), range: tab });
  if (values.length === 0) return;
  await api.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export const googleDriver: StorageDriver = {
  async readTable<T extends object>(name: TableName): Promise<T[]> {
    return rowsToObjects<T>(await readRange(name));
  },

  async writeTable<T extends object>(name: TableName, rows: T[]): Promise<void> {
    // Build a stable column union so optional fields are never dropped.
    const columns = new Set<string>();
    for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
    let header = Array.from(columns);
    if (header.length === 0) {
      // Preserve existing header row when clearing all data.
      const existing = await readRange(name);
      header = existing[0] ?? [];
      await overwriteTab(name, header.length ? [header] : []);
      return;
    }
    const values: (string | number)[][] = [header];
    for (const row of rows) {
      values.push(header.map((col) => {
        const v = (row as Record<string, unknown>)[col];
        return v == null ? '' : String(v);
      }));
    }
    await overwriteTab(name, values);
  },

  async readSettings<T extends object>(defaults: T): Promise<T> {
    const values = await readRange(SETTINGS_TAB);
    const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    // Settings stored as key/value rows (skip optional header row).
    for (const row of values) {
      const [key, value] = row;
      if (key && key !== 'key') result[key] = value ?? '';
    }
    return result as T;
  },

  async writeSettings<T extends object>(data: T): Promise<void> {
    const values: (string | number)[][] = [['key', 'value']];
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      values.push([key, value == null ? '' : String(value)]);
    }
    await overwriteTab(SETTINGS_TAB, values);
  },

  // Image storage is not available on the Google Sheets backend. Photo uploads
  // are only supported by the local filesystem driver.
  async uploadImage(): Promise<void> {
    throw new Error('Image storage is not available with the Google Sheets backend.');
  },

  async getImage(): Promise<StoredImage | null> {
    return null;
  },

  async deleteImage(): Promise<void> {
    // No-op: no image store is configured for this backend.
  },

  async listImages(): Promise<string[]> {
    return [];
  },
};

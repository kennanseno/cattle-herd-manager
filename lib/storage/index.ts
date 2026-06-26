import { localDriver } from './local';
import type { StorageDriver, StoredImage, TableName } from './types';

/** True when the Google Sheets credentials are configured. */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  );
}

let driverPromise: Promise<StorageDriver> | null = null;

async function getDriver(): Promise<StorageDriver> {
  if (!driverPromise) {
    driverPromise = isGoogleConfigured()
      ? import('./google').then((m) => m.googleDriver)
      : Promise.resolve(localDriver);
  }
  return driverPromise;
}

// ─── Short-lived read cache ──────────────────────────────────────────────────
// Reads are cached per process for a few seconds to avoid hitting the backend
// (e.g. the Google Sheets API) on every navigation. The cache is cleared for a
// key as soon as that data is written, so edits are reflected immediately.

const CACHE_TTL_MS = 15_000;

type CacheEntry = { value: Promise<unknown>; expires: number };
const readCache = new Map<string, CacheEntry>();

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = readCache.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;
  const value = fetcher();
  readCache.set(key, { value, expires: now + CACHE_TTL_MS });
  // Drop failed lookups so the next read retries instead of caching the error.
  value.catch(() => {
    if (readCache.get(key)?.value === value) readCache.delete(key);
  });
  return value;
}

function invalidate(key: string): void {
  readCache.delete(key);
}

const SETTINGS_KEY = 'settings';
const tableKey = (name: TableName) => `table:${name}`;

/**
 * Storage facade. Delegates to the Google Sheets driver when credentials are
 * present, otherwise falls back to the local CSV/filesystem driver.
 */
export const storage: StorageDriver = {
  async readTable<T extends object>(name: TableName): Promise<T[]> {
    return cached(tableKey(name), async () => (await getDriver()).readTable<T>(name));
  },
  async writeTable<T extends object>(name: TableName, rows: T[]): Promise<void> {
    await (await getDriver()).writeTable<T>(name, rows);
    invalidate(tableKey(name));
  },
  async readSettings<T extends object>(defaults: T): Promise<T> {
    return cached(SETTINGS_KEY, async () => (await getDriver()).readSettings<T>(defaults));
  },
  async writeSettings<T extends object>(data: T): Promise<void> {
    await (await getDriver()).writeSettings<T>(data);
    invalidate(SETTINGS_KEY);
  },
  async uploadImage(filename: string, mimeType: string, data: Buffer): Promise<void> {
    return (await getDriver()).uploadImage(filename, mimeType, data);
  },
  async getImage(filename: string): Promise<StoredImage | null> {
    return (await getDriver()).getImage(filename);
  },
  async deleteImage(filename: string): Promise<void> {
    return (await getDriver()).deleteImage(filename);
  },
  async listImages(): Promise<string[]> {
    return (await getDriver()).listImages();
  },
};

export type { StorageDriver, StoredImage, TableName } from './types';

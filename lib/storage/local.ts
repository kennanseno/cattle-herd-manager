import fs from 'fs';
import path from 'path';
import {
  readCSV,
  writeCSV,
  readSettings as readSettingsFile,
  writeSettings as writeSettingsFile,
} from '../csv';
import { mimeFromFilename, type StorageDriver, type StoredImage, type TableName } from './types';

const IMAGES_DIR = path.join(process.cwd(), 'data', 'images');
const SETTINGS_FILE = 'settings.json';

function imagePath(filename: string): string {
  return path.join(IMAGES_DIR, path.basename(filename));
}

function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Filesystem + CSV storage driver. Used for local development when Google
 * credentials are not configured. Mirrors the original file-backed behaviour.
 */
export const localDriver: StorageDriver = {
  async readTable<T extends object>(name: TableName): Promise<T[]> {
    return readCSV<T>(`${name}.csv`);
  },

  async writeTable<T extends object>(name: TableName, rows: T[]): Promise<void> {
    writeCSV<T>(`${name}.csv`, rows);
  },

  async readSettings<T extends object>(defaults: T): Promise<T> {
    return readSettingsFile<T>(SETTINGS_FILE, defaults);
  },

  async writeSettings<T extends object>(data: T): Promise<void> {
    writeSettingsFile<T>(SETTINGS_FILE, data);
  },

  async uploadImage(filename: string, _mimeType: string, data: Buffer): Promise<void> {
    ensureImagesDir();
    fs.writeFileSync(imagePath(filename), data);
  },

  async getImage(filename: string): Promise<StoredImage | null> {
    const fp = imagePath(filename);
    if (!fs.existsSync(fp)) return null;
    return { data: fs.readFileSync(fp), mimeType: mimeFromFilename(filename) };
  },

  async deleteImage(filename: string): Promise<void> {
    const fp = imagePath(filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  },

  async listImages(): Promise<string[]> {
    if (!fs.existsSync(IMAGES_DIR)) return [];
    return fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => fs.statSync(path.join(IMAGES_DIR, f)).isFile());
  },
};

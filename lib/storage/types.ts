export type TableName = 'cattle' | 'breeding' | 'health' | 'finances';

export interface StoredImage {
  data: Buffer;
  mimeType: string;
}

export interface StorageDriver {
  readTable<T extends object>(name: TableName): Promise<T[]>;
  writeTable<T extends object>(name: TableName, rows: T[]): Promise<void>;
  readSettings<T extends object>(defaults: T): Promise<T>;
  writeSettings<T extends object>(data: T): Promise<void>;
  uploadImage(filename: string, mimeType: string, data: Buffer): Promise<void>;
  getImage(filename: string): Promise<StoredImage | null>;
  deleteImage(filename: string): Promise<void>;
  listImages(): Promise<string[]>;
}

export const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export function mimeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return IMAGE_MIME_TYPES[ext] || 'image/jpeg';
}

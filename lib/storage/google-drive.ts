import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import type { StoredImage } from './types';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

let driveApi: drive_v3.Drive | null = null;

function drive(): drive_v3.Drive {
  if (driveApi) return driveApi;

  const auth = new google.auth.OAuth2(
    required('GOOGLE_DRIVE_CLIENT_ID'),
    required('GOOGLE_DRIVE_CLIENT_SECRET'),
  );
  auth.setCredentials({ refresh_token: required('GOOGLE_DRIVE_REFRESH_TOKEN') });
  driveApi = google.drive({ version: 'v3', auth });
  return driveApi;
}

function folderId(): string {
  return required('GOOGLE_DRIVE_FOLDER_ID');
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findFile(filename: string): Promise<drive_v3.Schema$File | null> {
  const response = await drive().files.list({
    q: `'${escapeQueryValue(folderId())}' in parents and name = '${escapeQueryValue(filename)}' and trashed = false`,
    fields: 'files(id,name,mimeType)',
  });
  return response.data.files?.[0] ?? null;
}

export const googleDriveImages = {
  async uploadImage(filename: string, mimeType: string, data: Buffer): Promise<void> {
    const existing = await findFile(filename);
    const media = { mimeType, body: Readable.from(data) };

    if (existing?.id) {
      await drive().files.update({ fileId: existing.id, media });
      return;
    }

    await drive().files.create({
      requestBody: { name: filename, parents: [folderId()] },
      media,
      fields: 'id',
    });
  },

  async getImage(filename: string): Promise<StoredImage | null> {
    const file = await findFile(filename);
    if (!file?.id) return null;

    const response = await drive().files.get(
      { fileId: file.id, alt: 'media' },
      { responseType: 'arraybuffer' },
    );
    return {
      data: Buffer.from(response.data as ArrayBuffer),
      mimeType: file.mimeType || 'application/octet-stream',
    };
  },

  async deleteImage(filename: string): Promise<void> {
    const file = await findFile(filename);
    if (file?.id) await drive().files.delete({ fileId: file.id });
  },

  async listImages(): Promise<string[]> {
    const response = await drive().files.list({
      q: `'${escapeQueryValue(folderId())}' in parents and trashed = false`,
      fields: 'files(name)',
    });
    return (response.data.files ?? [])
      .map((file) => file.name)
      .filter((name): name is string => Boolean(name));
  },
};

export { DRIVE_SCOPE };

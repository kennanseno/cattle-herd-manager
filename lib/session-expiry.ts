export const SESSION_METADATA_COOKIE = "chm_session_meta";
export const SESSION_DURATION_MS = 15 * 60 * 1000;
export const SESSION_WARNING_TIME_MS = 2 * 60 * 1000;
export const SESSION_METADATA_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionMetadata {
  issuedAt: number;
  expiresAt: number;
}

export function createSessionMetadata(now = Date.now()): SessionMetadata {
  return {
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
}

export function serializeSessionMetadata(metadata: SessionMetadata): string {
  return encodeURIComponent(JSON.stringify(metadata));
}

export function parseSessionMetadata(value: string | undefined): SessionMetadata | null {
  if (!value) return null;

  try {
    const metadata = JSON.parse(decodeURIComponent(value)) as Partial<SessionMetadata>;
    if (
      typeof metadata.issuedAt !== "number" ||
      !Number.isFinite(metadata.issuedAt) ||
      typeof metadata.expiresAt !== "number" ||
      !Number.isFinite(metadata.expiresAt)
    ) {
      return null;
    }
    return { issuedAt: metadata.issuedAt, expiresAt: metadata.expiresAt };
  } catch {
    return null;
  }
}

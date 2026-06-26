// Password-gate helpers. Pure functions only (no Node-specific APIs) so they can
// run in both the proxy (server) and route handlers. Uses the Web Crypto API,
// which is available globally in the Next.js Node.js runtime.

export const AUTH_COOKIE = "chm_auth";

// The cookie stores an HMAC of a fixed message keyed by the configured password,
// never the password itself. Changing APP_PASSWORD invalidates existing sessions.
const SESSION_MESSAGE = "cattle-herd-manager:authenticated:v1";

async function hmacHex(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The session token expected in the auth cookie for a given password. */
export function sessionToken(password: string): Promise<string> {
  return hmacHex(password, SESSION_MESSAGE);
}

/** Constant-time string comparison to avoid leaking match position via timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Whether the password gate is enabled (APP_PASSWORD configured). */
export function isAuthEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

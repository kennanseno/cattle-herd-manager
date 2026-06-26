# Authentication & Session Management

This document describes how authentication and session management work in the Cattle Herd Manager.

## Overview

The app uses a simple password-based authentication system with optional protection enabled via the `APP_PASSWORD` environment variable. Sessions are time-limited with an expiration warning to ensure security.

## Password Protection

### Enabling/Disabling

- **To enable:** Set the `APP_PASSWORD` environment variable to any string (20+ characters recommended).
- **To disable:** Leave `APP_PASSWORD` unset (default for local development).

### How It Works

1. Unauthenticated requests are redirected to `/login`
2. Users enter the password, which is sent to `/api/auth/login`
3. On success, a signed HttpOnly session cookie is issued
4. The cookie contains an HMAC of a fixed message, keyed by the password (never stores the password itself)
5. Changing `APP_PASSWORD` automatically invalidates all existing sessions

## Session Management

### Session Duration

- **Session lifespan:** 15 minutes from login or refresh
- **Warning threshold:** 2 minutes before expiration
- **Behavior on expiration:** User is redirected to `/login` with `?expired=true` query parameter

### Session Extension Dialog

When a session is about to expire (2 minutes remaining), an **AlertDialog** appears in the app, showing:

- Time remaining (e.g., "2:00")
- Two action buttons:
  - **"Continue"** — calls `/api/auth/refresh` to issue a new 15-minute session
  - **"Logout"** — calls `/api/auth/logout` to end the session immediately

If the user clicks "Continue", their session is extended. If they do nothing, the session expires and they are logged out.

### Session Metadata

Two cookies are used:

1. **`chm_auth`** (HttpOnly) — Contains the HMAC session token
2. **`chm_session_meta`** — Contains JSON metadata: `{ issuedAt, expiresAt }` (timestamps in ms)

The client reads `chm_session_meta` to check session expiration status.

## API Endpoints

### `POST /api/auth/login`

**Input:**
```json
{
  "password": "user-provided-password"
}
```

**Output (on success):**
```json
{
  "ok": true,
  "expiresAt": 1719345600000
}
```

**Behavior:**
- Sets both `chm_auth` and `chm_session_meta` cookies
- Implements brute-force throttle: 5 failures → 5-minute lockout per client IP

### `POST /api/auth/refresh`

Extends an existing session by 15 more minutes.

**Output (on success):**
```json
{
  "ok": true,
  "expiresAt": 1719346500000
}
```

**Error responses:**
- `401` if no valid session cookie exists
- `401` if the session cookie is invalid/forged

### `POST /api/auth/logout`

Clears both session cookies and logs the user out.

## Client-Side Implementation

### `useSessionExpiry()` Hook

Located in `lib/useSessionExpiry.ts`, this hook:

- Reads the `chm_session_meta` cookie
- Checks expiration every 10 seconds
- Triggers a warning when 2 minutes remain
- Auto-redirects to `/login` when the session expires

**Returns:**
```typescript
{
  isExpired: boolean;           // True if session has expired
  isExpiring: boolean;          // True if 2 minutes remain
  timeLeft: number | null;      // Milliseconds until expiration (if expiring)
  handleContinue: () => Promise<void>;  // Refresh the session
  handleLogout: () => Promise<void>;    // Log out immediately
}
```

### `SessionExpiryDialog` Component

Located in `components/SessionExpiryDialog.tsx`, this component:

- Wraps `useSessionExpiry()` hook
- Displays an AlertDialog when `isExpiring` is true
- Shows formatted countdown timer
- Handles "Continue" and "Logout" actions

## Security Notes

- **HttpOnly cookies:** The auth token is HttpOnly, preventing XSS attacks from stealing the session.
- **Timing-safe comparison:** Session validation uses constant-time string comparison to prevent timing attacks.
- **Password never logged:** Only HMACs are stored/transmitted, never the password itself.
- **Brute-force throttle:** Per-client IP throttling (5 failures = 5-minute lockout), though this is best-effort on serverless platforms.
- **Time-based expiration:** Fixed 15-minute sessions with no activity tracking (session expires at absolute time, not sliding window).

## Changing Session Duration

To change the session duration, edit the `SESSION_DURATION_MS` constant in `lib/auth.ts`:

```typescript
export const SESSION_DURATION_MS = 15 * 60 * 1000; // Change 15 to your desired minutes
```

This affects:
- Login and refresh endpoints
- Session metadata cookie expiration
- Client-side warning threshold (always 2 minutes before expiration)

**Note:** Changing this requires a server restart.

## Testing Session Expiration Locally

1. Set `APP_PASSWORD=test`
2. Run `npm run dev`
3. Log in with password "test"
4. Wait 13 minutes — a dialog should appear
5. Click "Continue" to test session refresh
6. Alternatively, manually edit the browser's `chm_session_meta` cookie to set `expiresAt` to a past timestamp to test expiration

## Deployment Considerations

### Vercel

- Brute-force throttle is best-effort (resets on redeploy)
- Use a strong password (20+ characters) as your primary defense
- Set `APP_PASSWORD` under **Project → Settings → Environment Variables**

### Single-Instance VPS

- Brute-force throttle is reliable (in-memory state persists)
- Consider using a moderately strong password

### Multi-Instance / Load Balanced

- Brute-force throttle is per-instance (requests may bypass it via load balancing)
- Use a strong password; consider additional security layers (WAF, IP allowlist, etc.)

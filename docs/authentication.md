# Authentication and sessions

## Authentication

The app uses Supabase Auth. Its built-in registration and login forms use
email/password credentials; provider configuration and account lifecycle are
managed in the Supabase project. The app does not use the former
deployment-wide `APP_PASSWORD` gate.

Set `NEXT_PUBLIC_SUPABASE_URL` and either
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
the app environment. The public key is designed for client use; farm access
is enforced by row-level security. Never put a Supabase service-role key in
the app or browser environment.

On registration, a database trigger creates one farm for the new Auth user.
Farm data is scoped to that owner. If Supabase email confirmation is enabled,
registration does not immediately create an active session; the current
registration screen asks users to disable confirmations for the no-verification
flow.

Protected page and API requests are checked by `proxy.ts`. Server data access
also requires a valid Supabase user and resolves that user's farm.

## Session expiration

The app applies a fixed, absolute session window:

- Session window: 15 minutes from login or refresh
- Warning: 2 minutes before the window expires
- Continuing: refreshes the Supabase session and starts a new 15-minute
  application window
- Timeout: signs out the Supabase session, clears the expiry metadata, and
  redirects to login

This is not a sliding inactivity timeout: ordinary activity does not extend
the 15-minute window.

Supabase's cookies hold the authentication session. The app also uses a
`chm_session_meta` cookie containing `{ issuedAt, expiresAt }` timestamps to
show the warning and enforce the app's fixed window. This cookie is not an
authentication credential; the server validates the actual Supabase user.

The warning is displayed by `components/SessionExpiryDialog.tsx`, with timer
state in `lib/useSessionExpiry.ts`. Continue and logout use:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Session window constants are defined in `lib/session-expiry.ts`. If they are
changed, keep the UI countdown, refresh behavior, and server-side expiry check
consistent.

## Farm and account deletion

Farm Settings offers irreversible account deletion. It requires typing the
current farm name and checking a separate acknowledgment. The
`delete_own_farm` database function confirms the signed-in user and farm name,
then deletes the Auth user; foreign-key cascades remove that user's farm and
app records. Data stored outside this app is not affected. Apply the matching
Supabase migration before using the control.

## Local setup and troubleshooting

1. Configure the Supabase project URL and publishable/anon key in `.env.local`.
2. Apply all files in `supabase/migrations/` to the Supabase project.
3. For immediate registration, disable email confirmation in Supabase Auth.
4. Restart the Next.js server after environment changes.
5. If login fails, confirm the account exists in Supabase Auth and that the
   app points at the same Supabase project.

The app requires Node.js 20 or later. `APP_PASSWORD`, the legacy `chm_auth`
cookie, and the retired password/HMAC login are not part of the current auth
flow.

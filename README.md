# Cattle Herd Manager

A multi-tenant cattle and farm management app built with Next.js, Supabase
Authentication, and farm-scoped Supabase Postgres records. Each user account
has one private farm workspace.

## Features

- Cattle, breeding, health, and finance records
- Dashboard summaries and cattle ownership certificate PDFs
- Per-farm settings and theme selection
- Supabase Auth with row-level security for farm data

Image upload/download, farm backup export, and legacy data import are not
supported. Each farm starts with an empty workspace.

## Requirements

- Node.js 20 or later
- npm
- A Supabase project

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Apply the SQL files in `supabase/migrations/` in filename order. With the
   Supabase CLI:

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

   These migrations create farm-scoped tables, enable row-level security,
   provision a farm when a new Auth user is created, and add the farm/account
   deletion function. Review SQL before applying it. If you already applied
   migrations manually, ensure the Supabase migration history is in sync
   before running `db push`.
4. In Supabase Auth settings, configure the sign-in provider(s) you intend to
   use. The app's built-in registration and login forms use email and password.
   For the current registration flow, disable email confirmations so new users
   receive an active session immediately.
5. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:9999](http://localhost:9999), then register or log
   in. Each newly registered user gets a fresh farm workspace.

## Environment variables

`.env.example` documents the app's supported configuration. Copy it to
`.env.local`, add values locally, and never commit `.env.local` or expose
secrets with a `NEXT_PUBLIC_` prefix.

| Variable | Required for | Where to find it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | App authentication and database | Supabase project API settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App authentication and database | Supabase project API settings |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical URL for social metadata | Your production domain |

The app also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a backward-compatible
alternative key name, but it is not needed when the publishable key is set.
On Vercel, the production deployment URL is used for metadata if
`NEXT_PUBLIC_SITE_URL` is not configured. Set it to your custom domain when
you have one.

## Farm deletion

Farm Settings has a permanent delete action. It requires the exact farm name
and a separate acknowledgment, then deletes the signed-in Auth account and
cascades its Supabase farm records. It does not affect data stored outside this
app. Apply all Supabase migrations, including the delete function, before
using it.

## Sessions

The app uses Supabase Auth cookies. A 15-minute absolute session window is
shown with a warning 2 minutes before expiry. **Continue** refreshes the
Supabase session and starts a new window; otherwise the app signs the user
out. This is a fixed session window, not activity-based sliding expiration.
See [Authentication and sessions](docs/authentication.md).

## Useful commands

```bash
npm run dev       # development server on port 9999
npm run build     # production build
npm run start     # production server on port 9999
npm run lint      # ESLint
```

The development server uses port `9999`. PM2 helper commands are also
available: `pm2:start`, `pm2:stop`, `pm2:restart`, `pm2:logs`, and `pm2:status`.

## Documentation

- [Authentication and sessions](docs/authentication.md)
- [Database schema](docs/schema.md)

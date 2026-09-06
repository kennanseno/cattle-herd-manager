# Getting the Google Sheets `.env` values

This guide walks through configuring the credentials the app needs to use
Google Sheets as its storage backend:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

Google Drive image storage uses a separate OAuth account:

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

Everything here is **free**.

> **Use a personal `@gmail.com` account.** Work/school (Google Workspace)
> accounts often block service-account key downloads via an org policy
> (`iam.disableServiceAccountKeyCreation`). Personal accounts have no such
> policy.

---

## 1. Create a Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and sign
   in with a personal Gmail account (an incognito window avoids auto-signing in
   with a work account).
2. In the top bar, open the project dropdown → **New Project**.
3. Name it (e.g. `cattle-herd`) → **Create**, then make sure it's selected.

## 2. Enable the Google Sheets API

With your project selected, open the
[Google Sheets API library page](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
and click **Enable**.

> The Drive API is needed for uploaded farm and cattle images.

Also open the
[Google Drive API library page](https://console.cloud.google.com/apis/library/drive.googleapis.com)
and click **Enable**.

## 3. Create the service account → gives `GOOGLE_SERVICE_ACCOUNT_EMAIL`

1. Go to
   [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts).
2. **Create Service Account** → give it a name (e.g. `cattle-app`) →
   **Create and Continue**.
3. Skip the optional "grant roles" step → **Continue** → **Done**.
4. Copy the service account email — it looks like
   `cattle-app@cattle-herd-xxxxx.iam.gserviceaccount.com`. This is your
   **`GOOGLE_SERVICE_ACCOUNT_EMAIL`**. You'll also need it again in step 5.

## 4. Create a JSON key → gives `GOOGLE_PRIVATE_KEY`

1. Click the service account → **Keys** tab.
2. **Add Key** → **Create new key** → **JSON** → **Create**. A `.json` file
   downloads.
3. Open the file. The `private_key` field (a long
   `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` string) is
   your **`GOOGLE_PRIVATE_KEY`**.
   - Keep the literal `\n` sequences as-is.
   - When putting it in a `.env` file, wrap the value in double quotes.
   - The `client_email` field is the same as the email from step 3.

> Keep this file secret. Never commit it or the `.env` file containing the key.

## 5. Create the spreadsheet → gives `GOOGLE_SHEETS_SPREADSHEET_ID`

1. Create a new sheet at [sheets.new](https://sheets.new).
2. Copy the ID from the URL — the part between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`. This is
   your **`GOOGLE_SHEETS_SPREADSHEET_ID`**.
3. Click **Share**, paste the **service account email** from step 3, set the
   role to **Editor**, uncheck "Notify people", and **Share**.

> Sharing is required — without it the app can't read or write. The app creates
> the needed tabs (`cattle`, `breeding`, `health`, `finances`, `settings`)
> automatically on first write.

---

## 6. Create a Google OAuth client

1. Open **APIs & Services → OAuth consent screen** in Google Cloud Console.
2. Configure the app, choose **External** for a personal Gmail account, and
   add the Google account that will own the images as a test user if prompted.
3. Open **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth client ID**.
5. Choose **Desktop app**, create it, and copy the client ID and client secret.
   These are `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`.

> Move the consent screen to **In production** for a long-lived deployment.
> OAuth refresh tokens issued while an app is in Testing mode can expire after
> seven days.

## 7. Authorize Drive image storage

1. Add the OAuth client ID and secret to `.env.local`.
2. Run:

   ```bash
   set -a && source .env.local && set +a && npm run auth:google-drive
   ```

3. Open the authorization URL printed in the terminal.
4. Grant access to the Google account that should own the farm images.
5. Copy the printed `GOOGLE_DRIVE_REFRESH_TOKEN` into `.env.local`.

Create an `images` folder in that same Google Drive account and copy its ID
from the folder URL. This is `GOOGLE_DRIVE_FOLDER_ID`.

## 8. Put the values in place

**Local testing** — create a `.env.sheets` file (gitignored) from
[.env.example](../.env.example):

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=cattle-app@cattle-herd-xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1AbCdEf...
GOOGLE_DRIVE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=1XyZ...
```

Run with those vars loaded:

```bash
set -a && source .env.sheets && set +a && npm run dev
```

Or verify the connection without starting the app:

```bash
set -a && source .env.sheets && set +a && node_modules/.bin/tsx scripts/test-google.mjs
```

**Vercel** — add all seven Google variables under **Project → Settings →
Environment Variables**. Keep the client secret, refresh token, private key,
and app password secret.

> **Lock down the deployment.** To require a password on every page and API
> route, also set `APP_PASSWORD` in the same Environment Variables screen. Use a
> long, random value — see [Password protection](../README.md#password-protection)
> for how the gate and its brute-force lockout work.

---

## Troubleshooting

- **"Service account key creation is disabled"** — your account is a Workspace
  org account; switch to a personal Gmail (see the note at the top).
- **`403` / "The caller does not have permission"** — the spreadsheet isn't
  shared with the service account email, or the wrong sheet ID is set.
- **"Missing required environment variable"** — one of the Sheets or Drive
   variables is empty or not loaded into the process.
- **Photo uploads fail** — confirm the Drive API is enabled, the refresh token
   belongs to the Google account that owns the folder, and the folder ID is
   correct.

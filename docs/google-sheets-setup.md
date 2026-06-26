# Getting the Google Sheets `.env` values

This guide walks through creating the four credentials the app needs to use
Google Sheets as its storage backend:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

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

> The Drive API is **not** needed — this app only uses Sheets.

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

## 6. Put the values in place

**Local testing** — create a `.env.sheets` file (gitignored) from
[.env.example](../.env.example):

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=cattle-app@cattle-herd-xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1AbCdEf...
```

Run with those vars loaded:

```bash
set -a && source .env.sheets && set +a && npm run dev
```

Or verify the connection without starting the app:

```bash
set -a && source .env.sheets && set +a && node_modules/.bin/tsx scripts/test-google.mjs
```

**Vercel** — add the three variables under **Project → Settings →
Environment Variables**. When pasting the private key there, paste the value
**without** the surrounding quotes.

---

## Troubleshooting

- **"Service account key creation is disabled"** — your account is a Workspace
  org account; switch to a personal Gmail (see the note at the top).
- **`403` / "The caller does not have permission"** — the spreadsheet isn't
  shared with the service account email, or the wrong sheet ID is set.
- **"Missing required environment variable"** — one of the three vars is empty
  or not loaded into the process.
- **Photo uploads fail** — expected. Images aren't supported on the Sheets
  backend (service accounts have no Drive storage quota); use the local backend
  for photos.

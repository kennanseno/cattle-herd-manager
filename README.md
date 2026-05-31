# Cattle Herd Manager

A small herd management app built with Next.js App Router and CSV-backed data storage.

## Overview

This app manages cattle records, breeding, health, finances, and settings. Data is stored locally using CSV files in the `data/` directory, and cattle images are served from `data/images/`.

## Prerequisites

- Node.js 20 or later
- npm (or `yarn` / `pnpm` if preferred)

## Install

```bash
npm install
```

## Run in development

```bash
npm run dev
```

Then visit:

```bash
http://localhost:9999
```

The app is configured to run on port `9999` in development.

## Build and start

```bash
npm run build
npm run start
```

## Useful scripts

```bash
npm run dev         # start development server on port 9999
npm run build       # build production app
npm run start       # start built app on port 9999
npm run lint        # run ESLint
```

## PM2 support

This repo also includes `pm2` helper scripts for running the app as a process manager:

```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
npm run pm2:status
```

## Local data files

The app uses the following local files:

- `data/cattle.csv`
- `data/breeding.csv`
- `data/health.csv`
- `data/finances.csv`
- `data/settings.json`
- `data/images/` for uploaded photos and certificate images

If these files do not exist yet, the app may create them or expect them to be present when importing data.

## Features

- Cattle record management
- Breeding records and estimated calving windows
- Health and finance tracking
- PDF export for cattle ownership certificates
- Image upload and file serving via API routes

## Notes

- The app uses `next dev -p 9999`, so the development server is intentionally configured on port `9999`.
- Uploaded images are served through the built-in image API under `/api/images/`.

## Deploy

This app can be deployed to any environment that supports Next.js. Use standard Next.js deployment workflows and ensure the local CSV/data directory is available if persistent storage is required.

## Desktop (Electron) distribution

A lightweight Electron wrapper is included to produce a desktop app that runs the built Next.js site inside a Chromium window.

### Development

Run the Next dev server and open Electron:

```bash
# in one terminal
npm run dev

# in another terminal
npm run electron:dev
```

### Production (run Electron with built app)

```bash
npm run electron:start
```

### Building installers with electron-forge

Build distributable installers for macOS and Windows:

```bash
# Make all platform installers (macOS DMG, Windows NSIS/MSI, and zips)
npm run electron:make

# Make macOS DMG only
npm run electron:make:macos

# Make Windows installer only
npm run electron:make:windows
```

Installers and build outputs are created in the `out/` directory.

#### macOS
- `.dmg` file for distribution (drag-and-drop installer)

#### Windows
- `.exe` installer with Squirrel (auto-updates capable)
- Uninstaller included

### Notes
- `electron:dev` expects the dev server on `http://localhost:9999` (same as `npm run dev`).
- `electron:start` runs `npm run build` then starts Electron which will spawn `npm run start` and load the app.
- To build installers, you must be on the target platform (e.g., build macOS installers on macOS). Alternatively, use CI/CD (GitHub Actions, etc.) for cross-platform builds.
- The forge config in `package.json` specifies DMG (macOS) and Squirrel (Windows) makers by default.

### Automated builds with GitHub Actions

A GitHub Actions workflow (`.github/workflows/build-installers.yml`) is configured to automatically build installers on:
- Push to `main` or `develop` branches (artifacts uploaded to workflow run)
- Push of any git tag matching `v*` (creates a GitHub Release with installers attached)

**How to trigger a release:**

1. Commit your changes and push to `main`
2. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will build macOS DMG and Windows EXE installers
4. A GitHub Release will be created and the installers attached
5. Users can download installers directly from the Releases page

**Manual workflow trigger:**

You can also trigger a build manually from the GitHub Actions tab in the repository without a tag (useful for testing).


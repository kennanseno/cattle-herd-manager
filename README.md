# Cattle Herd Manager.

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

Important:

- Files under data/ are local runtime state for your environment.
- In normal development, avoid committing data/*.csv or data/settings.json changes unless you are intentionally updating shared seed/sample data.
- Before committing code-only changes, review git status to ensure local herd/finance/health data changes are not staged.

## Features

- Cattle record management
- Breeding records and estimated calving windows
- Health and finance tracking
- PDF export for cattle ownership certificates
- Image upload and file serving via API routes

## Feature walkthrough video

To view the app features visually, open:

- [cattle-manager-feature-video.webm](cattle-manager-feature-video.webm)

Or view the animated demo directly in the README:

![Feature walkthrough](assets/cattle-manager-feature.gif)

## Notes

- The app uses `next dev -p 9999`, so the development server is intentionally configured on port `9999`.
- Uploaded images are served through the built-in image API under `/api/images/`.

## Deploy

This app can be deployed to any environment that supports Next.js. Use standard Next.js deployment workflows and ensure the local CSV/data directory is available if persistent storage is required.

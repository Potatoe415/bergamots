# RUNBOOK

Status: Current.
Load this file only if the task contains or implies: run / command / script / setup / start / test / check / lint / build / deploy / migrate / seed / install.

---

## Setup
- `npm install`

## Development
- `npm run dev` — starts the Vite dev server.
  - Hub: `http://localhost:5173/`
  - Wordplayer game (e.g. Pictionary): `http://localhost:5173/wordplayer.html?game=pictionary`

## Test
- No automated test suite exists yet (see `docs/TECH.md` Open_Questions).
- Manual check: `npm run check` (lint + format-check + build).

## Build
- `npm run build` — production build via Vite, output in `dist/`.
- `npm run preview` — serve the production build locally.

## Lint / Format
- `npm run lint` — ESLint (`eslint.config.mjs`).
- `npm run format` — Prettier write.
- `npm run format:check` — Prettier check only.

## Deploy
- Hosting target: Firebase Hosting, serving `dist/` (`firebase.json`).
- CI (`.github/workflows/ci.yml`) runs lint + format-check + build on push/PR to `main`/`master`. It does not deploy.
- Actual deploy to Firebase Hosting is manual (`firebase deploy`, requires Firebase CLI + project auth) and is not scripted in this repo.

## Troubleshooting
- New game not showing on the hub: verify the entry exists in `public/hub-config.json` and that `assets/thumbnail.jpg` exists under `public/games/<id>/`.
- Wordplayer game not loading words: verify `public/data/<id>/<id>_words.json` exists and its path matches the `data` field in `public/hub-config.json`.
- Yatzy multiplayer not syncing: check `public/games/yatsy/firebase-config.js` is present and valid; Firebase Realtime Database rules are managed outside this repo.

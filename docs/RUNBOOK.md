# RUNBOOK

Stack: Node.js + Socket.IO (server) · React + Vite + Tailwind (client) · npm workspaces

---

## Setup

```bash
npm install          # installs all workspaces from the repo root
```

---

## Development

Run both servers (requires `concurrently`):

```bash
npm run dev          # from repo root — starts server on :3001 and client on :5173
```

Or start individually:

```bash
npm run dev:server   # Socket.IO server on http://localhost:3001
npm run dev:client   # Vite dev server on http://localhost:5173
```

---

## Test

```bash
npm test             # runs shared/gameEngine unit tests via Vitest
```

---

## Build

```bash
npm run build -w client   # builds client to client/dist/
```

---

## Deploy

TBD — see docs/TECH.md

---

## Troubleshooting

**CORS errors:** server uses `cors({ origin: '*' })` for dev. Restrict in production.

**Socket not connecting:** ensure server is running on :3001 before opening the client.
Set `VITE_SERVER_URL=https://your-server.com` in `client/.env` for non-local targets.

**tsx not found:** `npm install` from repo root installs it in server/node_modules.

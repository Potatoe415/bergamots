# GAMES MAP

Living document. Update whenever a game is added, removed, or its shared
deps / `NOTES.md` status changes.

Purpose: read this **before** opening any file under `public/games/` or
`public/data/`. It tells you which single folder a game lives in, so a
task scoped to one game never needs to read another game's code. See
`AGENTS.md` Section 1 ("Game-scoped work") for the isolation rule this
map exists to support.

---

## Wordpack games

Share one engine: `wordplayer.html` + `wordplayer.js` (root, Vite-bundled)
+ `public/shared/js/engine.js` (see `shared/CONTRACT.md`). To edit one
game's content, touch **only its data file** — never the engine, unless
the change must apply to every wordpack game at once.

| id | data file |
|---|---|
| `pictionary` | `public/data/pictionary/pictionary_words.json` |
| `taboo` | `public/data/taboo/taboo_words.json` |
| `esquisse` | `public/data/esquisse/esquisse_words.json` |
| `pigeonpigeon` | `public/data/pigeonpigeon/pigeonpigeon_words.json` |

Flag: `public/games/pictionary/index.html` + `main.js` are orphaned —
`hub-config.json` launches Pictionary via `wordplayer.html?game=pictionary`,
not this folder. Pre-existing dead code, left untouched per `AGENTS.md`.

## Custom games (own folder, own code, launched standalone)

| id | folder | main file(s) — lines | shared deps | `NOTES.md`? |
|---|---|---|---|---|
| `blackstories` | `public/games/blackstories/` | `blackstories.js` (251) | header, profile | no |
| `olemains` | `public/games/olemains/` | 6 files, ~510 total (already split, none >300) | engine, header, profile | no |
| `cafards` | `public/games/cafards/` | `game.js` (238) | header, profile | no |
| `millionaire` | `public/games/millionaire/` | `app.js` (1069, **over 300-line limit**) | header, profile | no — see `docs/BACKLOG.md` |
| `pyramide` | `public/games/pyramide/` | `app.js` (847), `i18n.js` (317) — **both over limit** | header, profile | no — see `docs/BACKLOG.md` |
| `yatsy` | `public/games/yatsy/` | 14 files; `app.js` (1216), `i18n.js` (392), `render.js` (633), `session.js` (575) — **4 files over limit** | header, profile, Supabase | no — see `docs/BACKLOG.md` Later |
| `diceduel` | `public/games/diceduel/js/` | `engine.js` (327), `ui.js` (303) — both just over limit | header, profile | no |

"Shared deps" = which `shared/CONTRACT.md` modules the game imports. Read
that contract, not the shared source, unless it doesn't answer your
question.

## External games (code lives outside this repo)

Nothing to open here beyond a thumbnail. Launch is a plain URL in
`hub-config.json` (`kind: "external"`).

| id | deployed at | repo | what's in *this* repo |
|---|---|---|---|
| `easyfrog` | easyfrog.web.app | separate, not tracked here | thumbnail only |
| `tranquil` | tranquil-woad.vercel.app | `tranquil` | thumbnail only |
| `coinche`, `bouilla`, `president`, `bataillecorse` | coinchapp.vercel.app | `coinchapp` | shared thumbnails under `public/games/coinchapp/assets/` |
| `gameboy-web` | gameboy-web.vercel.app | `gameboy-web` | thumbnail only |

---

## Adding a new game

Follow `docs/NEW_GAME.md` — the full checklist (technical + visual
conventions, hub-config.json schema, verification steps). It ends with:
add one row to this file, and add a `NOTES.md` in the game's folder once
its main file passes ~150–200 lines (a short summary of what an agent
needs before editing, so future edits can skip reading the full source;
below that size, the code itself is the doc).

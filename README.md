## Bergamots

Vanilla HTML/CSS/JavaScript multi-game hub powered by Vite. Data-driven: games are listed in `public/hub-config.json`; word-based games use the universal **wordplayer** (single HTML shell + `public/data/<gameId>/words.json` per game).

### Commands

- **Install dependencies**
  - `npm install`

- **Start dev server**
  - `npm run dev`
  - Then open:
    - Hub: `http://localhost:5173/`
    - Wordplayer game (e.g. Pictionary): `http://localhost:5173/wordplayer.html?game=pictionary`

- **Build for production**
  - `npm run build`

- **Preview production build**
  - `npm run preview`

- **Lint**
  - `npm run lint`

- **Format (write)**
  - `npm run format`

- **Format (check only)**
  - `npm run format:check`

- **Full check (lint + format-check + build)**
  - `npm run check`

### Structure

- **`public/`**: Static assets and game data (unprocessed, served at site root)
  - **`public/hub-config.json`**: Master list of games; hub fetches this to build the dashboard grid.
  - **`public/data/<gameId>/words.json`**: Readonly word datasets for wordplayer (and any game that consumes them). One file per game; payload has `gameId`, `title`, `controls`, `words`.
  - **`public/games/<id>/`**: One folder per standalone/custom game. Each has at least **`assets/`** with `thumbnail.jpg` (for hub tiles); custom games add their own `index.html`, JS, CSS.
  - **`public/assets/`**: Hub/global assets (e.g. main banner).

- **`shared/css/`**: Shared styles (`base.css`, `wordplayer.css`).
- **`shared/js/`**: Shared logic (`engine.js` for data loading, randomizers; `dom.js` if used).
- **`index.html`** + **`hub.js`**: Hub entry; fetches `hub-config.json` and renders game tiles.
- **`wordplayer.html`** + **`wordplayer.js`**: Shared word-based game engine. Reads `?game=<id>`, fetches `hub-config.json`, finds the matching wordpack entry, loads the game’s `data` URL (e.g. `/data/<id>/words.json`), then renders words and controls using multilingual fields from the JSON.

### How to add a new game (zero code)

1. **Create a game folder** under `public/games/<your-game-id>/`.

2. **Add assets**
   - Put at least `thumbnail.jpg` in `public/games/<your-game-id>/assets/`.

3. **For a wordplayer game (e.g. Pictionary, Taboo)**
   - Add `public/data/<your-game-id>/words.json` with this shape:
     - `gameId`, `title`, `controls` (e.g. `["next"]` or `["pass","validate"]`), `words` (array of objects with `id`, `text`, and optional `fr`/`en`/`es`).
   - Ensure `public/games/<your-game-id>/assets/thumbnail.jpg` exists for the hub tile.

4. **Register in the hub**
   - Edit `public/hub-config.json` and add an entry:
     - Wordpack (shared engine): `{ "id": "your-game-id", "title": "Your Game", "kind": "wordpack", "engine": "wordplayer", "launch": "/wordplayer.html?game=your-game-id", "data": "/data/your-game-id/words.json", "thumbnail": "/games/your-game-id/assets/thumbnail.jpg" }`
     - Custom (standalone): `{ "id": "your-game-id", "title": "Your Game", "kind": "custom", "launch": "/games/your-game-id/index.html", "thumbnail": "/games/your-game-id/assets/thumbnail.jpg" }`
     - External: `{ "id": "your-game-id", "title": "Your Game", "kind": "external", "launch": "https://...", "thumbnail": "/games/your-game-id/assets/thumbnail.jpg" }`

No changes to `hub.js` or `vite.config.js` are required; wordplayer discovers the data path from `hub-config.json`.

### Optional: use shared styles/scripts

- Reuse `shared/css/base.css` and `shared/js/` from custom game HTML/JS to keep the look and behavior consistent.

# Bergamots

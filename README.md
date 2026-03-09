## Games Hub

Vanilla HTML/CSS/JavaScript multi-game hub powered by Vite. Data-driven: games are listed in `public/hub-config.json`; word-based games use the universal **wordplayer** (single HTML shell + config/words.json per game).

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
  - **`public/games/<id>/`**: One folder per game. Each has:
    - **`assets/`**: At least `thumbnail.jpg` (required for hub tiles).
    - **`config/words.json`**: For wordplayer games — payload with `gameId`, `title`, `controls`, `words`.
  - **`public/assets/`**: Global assets (e.g. main banner).

- **`shared/css/`**: Shared styles (`base.css`, `wordplayer.css`).
- **`shared/js/`**: Shared logic (`engine.js` for data loading, randomizers; `dom.js` if used).
- **`index.html`** + **`hub.js`**: Hub entry; fetches `hub-config.json` and renders game tiles.
- **`wordplayer.html`** + **`wordplayer.js`**: Universal game UI for word-based games; reads `?game=<id>`, loads `public/games/<id>/config/words.json`, and renders words + controls from the JSON.

### How to add a new game (zero code)

1. **Create a game folder** under `public/games/<your-game-id>/`.

2. **Add assets**
   - Put at least `thumbnail.jpg` in `public/games/<your-game-id>/assets/`.

3. **For a wordplayer game (e.g. Pictionary, Taboo)**
   - Add `public/games/<your-game-id>/config/words.json` with this shape:
     - `gameId`, `title`, `controls` (e.g. `["next"]` or `["pass","validate"]`), `words` (array of `{ id, text, ... }`).

4. **Register in the hub**
   - Edit `public/hub-config.json` and add an entry, for example:
     - Wordplayer: `{ "id": "your-game-id", "title": "Your Game", "type": "wordplayer", "thumbnail": "./games/your-game-id/assets/thumbnail.jpg" }`
     - Custom (own HTML or external): `{ "id": "your-game-id", "title": "Your Game", "type": "custom", "indexPath": "./games/your-game-id/index.html", "thumbnail": "./games/your-game-id/assets/thumbnail.jpg" }`

No changes to `hub.js`, `wordplayer.js`, or `vite.config.js` are required.

### Optional: use shared styles/scripts

- Reuse `shared/css/base.css` and `shared/js/` from custom game HTML/JS to keep the look and behavior consistent.

# games-hub

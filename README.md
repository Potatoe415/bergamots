## Games Hub

Vanilla HTML/CSS/JavaScript multi-game hub powered by Vite.

### Commands

- **Install dependencies**
  - `npm install`

- **Start dev server**
  - `npm run dev`
  - Then open:
    - Hub: `http://localhost:5173/apps/hub/`
    - Demo game: `http://localhost:5173/apps/demo-game/`

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

- **`apps/hub/`**: Hub app (grid of games)
- **`apps/demo-game/`**: Minimal demo game
- **`shared/css/`**: Shared styles (`base.css`)
- **`shared/js/`**: Shared JS helpers (`dom.js`)
- **`public/`**: Static assets copied as-is on build

### How to add a new game

1. **Copy the demo game**
   - Duplicate `apps/demo-game/` as `apps/your-game-id/`.
   - Update HTML title and any game-specific copy.

2. **Wire up Vite input (optional for new standalone entry)**
   - In `vite.config.js`, add your game HTML to `build.rollupOptions.input`:

```js
input: {
  hub: resolve(__dirname, "apps/hub/index.html"),
  demoGame: resolve(__dirname, "apps/demo-game/index.html"),
  yourGameId: resolve(__dirname, "apps/your-game-id/index.html")
}
```

3. **Register the game in the hub**
   - Edit `apps/hub/games.js` and add a new entry:

```js
export const games = [
  {
    id: "demo-game",
    title: "Demo Game",
    path: "../demo-game/",
    description: "A tiny placeholder game to validate the hub setup."
  },
  {
    id: "your-game-id",
    title: "Your Game Title",
    path: "../your-game-id/",
    description: "Short description shown in the hub grid."
  }
];
```

4. **Use shared utilities (optional but recommended)**
   - Reuse `shared/css/base.css` and `shared/js/dom.js` from your game’s HTML/JS to keep things consistent.

# games-hub
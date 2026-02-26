import { resolve } from "node:path";

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  root: ".",
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, "apps/hub/index.html"),
        demoGame: resolve(__dirname, "apps/demo-game/index.html")
      }
    },
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
};

export default config;


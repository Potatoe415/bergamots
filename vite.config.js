import { resolve } from "node:path";

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  root: ".",
  build: {
    rollupOptions: {
      input: {
        hub: resolve(__dirname, "index.html"),
        demoGame: resolve(__dirname, "apps/demo-game/index.html"),
        easyfrog: resolve(__dirname, "apps/easyfrog/index.html"),
        pictionary: resolve(__dirname, "apps/pictionary/index.html"),
        blackstories: resolve(__dirname, "apps/blackstories/index.html"),
        esquisse: resolve(__dirname, "apps/esquisse/index.html")
      }
    },
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
};

export default config;
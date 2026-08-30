import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    host: true, // Autorise l'accès via l'IP locale (0.0.0.0)
    port: 5173 // Optionnel : fixe le port si tu veux être sûr
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        wordplayer: resolve(__dirname, "wordplayer.html")
      }
    }
  },
  publicDir: "public"
});

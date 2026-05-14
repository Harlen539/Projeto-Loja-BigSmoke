import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

function copyLegacyStoreAssets() {
  return {
    name: "copy-legacy-store-assets",
    closeBundle() {
      const distSrc = resolve(rootDir, "dist/src");
      mkdirSync(distSrc, { recursive: true });
      copyFileSync(resolve(rootDir, "src/script.js"), resolve(distSrc, "script.js"));
      copyFileSync(resolve(rootDir, "src/produto.js"), resolve(distSrc, "produto.js"));
      copyFileSync(resolve(rootDir, "src/Style.css"), resolve(distSrc, "Style.css"));
      cpSync(resolve(rootDir, "src/imagens"), resolve(distSrc, "imagens"), { recursive: true });
    }
  };
}

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || (process.env.VERCEL ? "/" : command === "build" ? "/loja/" : "/"),
  plugins: [react(), copyLegacyStoreAssets()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        produto: resolve(rootDir, "src/produto.html"),
        pedidos: resolve(rootDir, "src/pedidos.html"),
        perfil: resolve(rootDir, "src/perfil.html"),
        politica: resolve(rootDir, "src/politica.html")
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000"
    }
  }
}));

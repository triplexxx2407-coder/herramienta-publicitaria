// Versión de un solo archivo HTML de la demo (sin servidor). Se genera con: npm run build:archivo
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const aqui = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  root: aqui,
  base: "./",
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      { find: "next/link", replacement: `${aqui}shims/next-link.tsx` },
      { find: "next/navigation", replacement: `${aqui}shims/next-navigation.ts` },
      { find: /^@\//, replacement: raiz },
    ],
  },
  build: {
    outDir: `${raiz}salida-archivo`,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});

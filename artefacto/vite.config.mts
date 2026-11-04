// Versión de un solo archivo HTML de la demo (sin servidor). Se genera con: npm run build:archivo
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const aqui = fileURLToPath(new URL("./", import.meta.url));

/** Las fotos de ejemplo se meten dentro del archivo para que no dependan de un servidor. */
function fotosDentro(): Plugin {
  return {
    name: "fotos-dentro",
    transform(codigo, id) {
      if (!id.endsWith("proyecto-ejemplo.json")) return null;
      return codigo.replace(/\/fotos\/([\w-]+\.svg)/g, (_, archivo: string) => {
        const svg = fs.readFileSync(`${raiz}public/fotos/${archivo}`);
        return `data:image/svg+xml;base64,${svg.toString("base64")}`;
      });
    },
  };
}

export default defineConfig({
  root: aqui,
  base: "./",
  plugins: [tailwindcss(), fotosDentro()],
  resolve: {
    alias: [
      { find: "next/link", replacement: `${aqui}shims/next-link.tsx` },
      { find: "next/navigation", replacement: `${aqui}shims/next-navigation.ts` },
      { find: "@/lib/datos/consultar-empresas", replacement: `${aqui}consultar-local.ts` },
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

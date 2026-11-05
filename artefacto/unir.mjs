// Mete el JS y el CSS generados dentro de un solo archivo: salida-archivo/demo-prospeccion.html
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(import.meta.dirname, "../salida-archivo");
let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
html = html.replace(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g, (_, f) => {
  const js = fs.readFileSync(path.join(dir, f), "utf8").replace(/<\/script/gi, "<\\/script");
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g, (_, f) => `<style>${fs.readFileSync(path.join(dir, f), "utf8")}</style>`);
if (/src="\.\/|href="\.\//.test(html)) throw new Error("Quedó un archivo sin unir");
fs.writeFileSync(path.join(dir, "demo-prospeccion.html"), html);
console.log("Listo:", path.join(dir, "demo-prospeccion.html"), Math.round(html.length / 1024), "KB");

// Variante para publicar como página de claude.ai: sólo el contenido (la plataforma pone <html>, <head> y <body>).
const titulo = html.match(/<title>[\s\S]*?<\/title>/)[0];
// Promesa de márgenes laterales (la página ya los respeta con max(1rem, env(safe-area-inset-*))).
const metaLados = html.match(/<meta name="claude:viewport-fit-sides"[^>]*>/)?.[0] ?? "";
// Tipografías de Google Fonts (lo único externo que se permite cargar).
const fuentes = [...html.matchAll(/<link\b[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>/g)].map((m) => m[0]).join("\n");
const estilos = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join("\n");
const guiones = [...html.matchAll(/<script type="module">[\s\S]*?<\/script>/g)].map((m) => m[0]).join("\n");
const pagina = [titulo, metaLados, fuentes, estilos, '<div id="app"></div>', guiones].filter(Boolean).join("\n") + "\n";
fs.writeFileSync(path.join(dir, "demo-prospeccion-pagina.html"), pagina);
console.log("Listo:", path.join(dir, "demo-prospeccion-pagina.html"));

// Carpeta que publica el servidor de Cloudflare: un solo archivo, la pantalla completa.
const sitio = path.join(dir, "sitio");
fs.mkdirSync(sitio, { recursive: true });
fs.writeFileSync(path.join(sitio, "index.html"), html);
console.log("Listo:", path.join(sitio, "index.html"));

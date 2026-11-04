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
const estilos = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join("\n");
const guiones = [...html.matchAll(/<script type="module">[\s\S]*?<\/script>/g)].map((m) => m[0]).join("\n");
const pagina = `${titulo}\n${estilos}\n<div id="app"></div>\n${guiones}\n`;
fs.writeFileSync(path.join(dir, "demo-prospeccion-pagina.html"), pagina);
console.log("Listo:", path.join(dir, "demo-prospeccion-pagina.html"));

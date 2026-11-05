/**
 * Sacar el texto legible de un correo: partes, codificaciones y versión con formato.
 * Está aparte (sin nada de Cloudflare) para poder probarlo.
 */

export function encabezado(cabeza: string, nombre: string): string | null {
  // Un encabezado puede seguir en la línea de abajo si empieza con espacio.
  const lineas = cabeza.split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].toLowerCase().startsWith(`${nombre.toLowerCase()}:`)) {
      let valor = lineas[i].slice(nombre.length + 1).trim();
      while (i + 1 < lineas.length && /^[ \t]/.test(lineas[i + 1])) {
        valor += ` ${lineas[i + 1].trim()}`;
        i += 1;
      }
      return valor;
    }
  }
  return null;
}

export function deBase64(datos: string): string {
  const bytes = Uint8Array.from(atob(datos.replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function deCitaImprimible(datos: string): string {
  const sinCortes = datos.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < sinCortes.length; i++) {
    if (sinCortes[i] === "=" && /^[0-9a-fA-F]{2}$/.test(sinCortes.slice(i + 1, i + 3))) {
      bytes.push(parseInt(sinCortes.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(sinCortes.charCodeAt(i));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Saca el texto legible de un correo. Si viene en varias partes (texto y versión con
 * formato) se queda con la de texto; si viene codificado, lo descifra.
 */
export function textoPlano(crudo: string, cabezaMime = ""): string {
  const hallado = leerParte(cabezaMime, crudo, 0);
  const texto = hallado ? (hallado.html ? deHtml(hallado.texto) : hallado.texto) : crudo;
  // Las respuestas traen pegada la plática anterior; nos quedamos con lo nuevo.
  return texto
    .split(/\r?\n/)
    .filter((l) => !/^\s*>/.test(l))
    .join("\n")
    .split(/\r?\n-{2,}\s*$/)[0]
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 8000);
}

/** Una parte del correo: sus encabezados y su cuerpo. Busca el texto, aunque venga anidado. */
function leerParte(cabeza: string, cuerpo: string, nivel: number): { texto: string; html: boolean } | null {
  if (nivel > 6) return null;
  const tipo = (encabezado(cabeza, "Content-Type") ?? "text/plain").toLowerCase();
  if (tipo.startsWith("multipart/")) {
    const frontera = /boundary="?([^";\s]+)"?/i.exec(encabezado(cabeza, "Content-Type") ?? "")?.[1];
    if (!frontera) return null;
    let html: { texto: string; html: boolean } | null = null;
    for (const trozo of cuerpo.split(`--${frontera}`).slice(1)) {
      if (trozo.startsWith("--")) break; // la marca de cierre
      const corte = trozo.search(/\r?\n\r?\n/);
      const cabezaHija = corte === -1 ? "" : trozo.slice(0, corte).replace(/^\r?\n/, "");
      const cuerpoHijo = corte === -1 ? trozo : trozo.slice(corte).replace(/^\s+/, "");
      const hija = leerParte(cabezaHija, cuerpoHijo, nivel + 1);
      if (!hija) continue;
      if (!hija.html) return hija;
      html = html ?? hija;
    }
    return html;
  }
  if (tipo.startsWith("text/plain") || tipo.startsWith("text/html")) {
    if (/attachment/i.test(encabezado(cabeza, "Content-Disposition") ?? "")) return null;
    const codificacion = (encabezado(cabeza, "Content-Transfer-Encoding") ?? "").toLowerCase();
    let texto = cuerpo;
    try {
      if (codificacion === "base64") texto = deBase64(cuerpo);
      else if (codificacion === "quoted-printable") texto = deCitaImprimible(cuerpo);
    } catch {
      /* lo dejamos como vino */
    }
    return { texto, html: tipo.startsWith("text/html") };
  }
  return null;
}

/** Cuando un correo sólo trae versión con formato, se le quitan las etiquetas. */
function deHtml(html: string): string {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n");
}


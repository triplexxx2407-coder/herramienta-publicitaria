/** Revisar que un aviso de Meta venga de verdad de Meta. Aparte y sin nada de Cloudflare, para poder probarlo. */

function aHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compara sin que el tiempo que tarda delate cuántas letras acertaron. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let resto = 0;
  for (let i = 0; i < a.length; i++) resto |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return resto === 0;
}

/** ¿El aviso viene de verdad de Meta? Se revisa la firma (X-Hub-Signature-256) con el secreto de la app. */
export async function firmaValida(cuerpoCrudo: string, cabecera: string | null, secreto: string): Promise<boolean> {
  if (!cabecera?.startsWith("sha256=")) return false;
  const llave = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const firma = await crypto.subtle.sign("HMAC", llave, new TextEncoder().encode(cuerpoCrudo));
  return iguales(`sha256=${aHex(firma)}`, cabecera.trim().toLowerCase());
}

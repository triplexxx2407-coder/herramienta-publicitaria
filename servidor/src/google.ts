/**
 * «Conectar con Google»: en lugar de pegar una contraseña de aplicación por cada correo,
 * la persona le da permiso a NEXORA una vez y Google le entrega un permiso renovable (refresh token).
 *
 * Ese permiso se guarda en la base como «oauth:<permiso>» (columna `token` de `cuentas`) y nunca sale del servidor.
 * La clave de la app de Google (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET) vive en los secretos de Cloudflare.
 * Sin nada de Cloudflare aquí dentro, para poder probarlo.
 */

import { firmarTexto, firmasIguales } from "./firma";

export const PREFIJO = "oauth:";

export interface ClaveGoogle {
  clientId: string;
  clientSecret: string;
}

/** El estado va firmado: así la vuelta de Google sólo vale si la empezó el dueño, para esa cuenta y hace poco. */
export async function crearEstado(secreto: string, cuentaId: string, ahora = Date.now()): Promise<string> {
  const cuerpo = `${cuentaId}.${ahora + 10 * 60 * 1000}`;
  return `${cuerpo}.${await firmarTexto(secreto, cuerpo)}`;
}

export async function leerEstado(secreto: string, estado: string, ahora = Date.now()): Promise<string | null> {
  const partes = estado.split(".");
  if (partes.length !== 3) return null;
  const [cuentaId, vence, firma] = partes;
  if (!firmasIguales(await firmarTexto(secreto, `${cuentaId}.${vence}`), firma)) return null;
  return Number(vence) > ahora ? cuentaId : null;
}

export function urlDeGoogle(clave: ClaveGoogle, redireccion: string, estado: string, correo: string): string {
  const q = new URLSearchParams({
    client_id: clave.clientId,
    redirect_uri: redireccion,
    response_type: "code",
    scope: "https://mail.google.com/",
    access_type: "offline",
    prompt: "consent",
    login_hint: correo,
    state: estado,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

async function pedirAGoogle(cuerpo: Record<string, string>): Promise<{ access_token?: string; refresh_token?: string; error?: string }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(cuerpo),
    signal: AbortSignal.timeout(8000),
  });
  return (await r.json().catch(() => ({ error: `Google contestó ${r.status}` }))) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };
}

/** Cambia el código que trae el usuario de vuelta por el permiso renovable. */
export async function intercambiarCodigo(clave: ClaveGoogle, codigo: string, redireccion: string) {
  return pedirAGoogle({
    code: codigo,
    client_id: clave.clientId,
    client_secret: clave.clientSecret,
    redirect_uri: redireccion,
    grant_type: "authorization_code",
  });
}

/** Un permiso de uso corto (una hora) a partir del permiso renovable guardado. */
export async function accesoNuevo(clave: ClaveGoogle, permisoGuardado: string): Promise<string> {
  const r = await pedirAGoogle({
    refresh_token: permisoGuardado.slice(PREFIJO.length),
    client_id: clave.clientId,
    client_secret: clave.clientSecret,
    grant_type: "refresh_token",
  });
  if (!r.access_token) throw new Error(`Google no renovó el permiso${r.error ? ` (${r.error})` : ""}`);
  return r.access_token;
}

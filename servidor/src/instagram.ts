/**
 * «Conectar Instagram» sin Facebook: la entrada de Meta que es sólo para Instagram
 * («Instagram API con inicio de sesión de Instagram»). Código puro, sólo fetch.
 *
 * El token de estas cuentas se guarda con el prefijo `igl:` para distinguirlo del de una página
 * de Facebook: se manda por otra dirección (graph.instagram.com) y se renueva cada tanto.
 */

export const PREFIJO_IG = "igl:";
const VERSION = "v21.0";
export const GRAFO_IG = `https://graph.instagram.com/${VERSION}`;

export interface ClaveInstagram {
  appId: string;
  appSecret: string;
}

export function urlDeInstagram(clave: ClaveInstagram, redireccion: string, estado: string): string {
  const p = new URLSearchParams({
    client_id: clave.appId,
    redirect_uri: redireccion,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_manage_messages",
    state: estado,
    force_reauth: "true",
  });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

async function leer<T>(r: Response): Promise<T | { error: string }> {
  const d = (await r.json().catch(() => null)) as (T & { error_message?: string; error?: { message?: string } }) | null;
  if (!d) return { error: `Instagram contestó ${r.status}` };
  if (!r.ok) return { error: d.error_message ?? d.error?.message ?? `Instagram contestó ${r.status}` };
  return d;
}

/** Cambia el código por un token largo (60 días) y trae el número y el @usuario de la cuenta. */
export async function conectarInstagram(
  clave: ClaveInstagram,
  codigo: string,
  redireccion: string,
): Promise<{ token: string; id: string; usuario: string } | { error: string }> {
  const cuerpo = new URLSearchParams({
    client_id: clave.appId,
    client_secret: clave.appSecret,
    grant_type: "authorization_code",
    redirect_uri: redireccion,
    code: codigo.replace(/#_$/, ""),
  });
  const corto = await leer<{ access_token?: string; data?: { access_token?: string }[] }>(
    await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: cuerpo, signal: AbortSignal.timeout(8000) }),
  );
  if ("error" in corto && typeof corto.error === "string") return { error: corto.error };
  const tokenCorto = ("access_token" in corto && corto.access_token) || ("data" in corto && corto.data?.[0]?.access_token) || "";
  if (!tokenCorto) return { error: "Instagram no dio el permiso" };

  const largo = await leer<{ access_token?: string }>(
    await fetch(
      `${GRAFO_IG}/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: clave.appSecret, access_token: tokenCorto })}`,
      { signal: AbortSignal.timeout(8000) },
    ),
  );
  const token = ("access_token" in largo && largo.access_token) || tokenCorto;

  const yo = await leer<{ user_id?: string; id?: string; username?: string }>(
    await fetch(`${GRAFO_IG}/me?fields=user_id,username`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) }),
  );
  if ("error" in yo && typeof yo.error === "string") return { error: yo.error };
  const id = ("user_id" in yo && yo.user_id) || ("id" in yo && yo.id) || "";
  if (!id) return { error: "Instagram no dijo de qué cuenta es" };
  return { token, id: String(id), usuario: ("username" in yo && yo.username) || String(id) };
}

/** Le dice a Instagram que mande a NEXORA los mensajes de esa cuenta. */
export async function suscribirInstagram(token: string): Promise<boolean> {
  try {
    const r = await fetch(`${GRAFO_IG}/me/subscribed_apps?subscribed_fields=messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Alarga 60 días más un token (Instagram sólo deja con más de un día de vida). Devuelve el nuevo o null. */
export async function renovarTokenInstagram(token: string): Promise<string | null> {
  try {
    const r = await fetch(`${GRAFO_IG}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token })}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = (await r.json().catch(() => null)) as { access_token?: string } | null;
    return d?.access_token ?? null;
  } catch {
    return null;
  }
}

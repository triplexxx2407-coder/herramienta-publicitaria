/**
 * «Conectar con Facebook»: entra el dueño con su Facebook, elige las páginas y NEXORA saca solo
 * el token y el número de cada página y de su Instagram. Código puro (sólo fetch), sin Cloudflare.
 */

const VERSION = "v21.0";
const GRAFO = `https://graph.facebook.com/${VERSION}`;

export interface ClaveMeta {
  appId: string;
  appSecret: string;
  /** Inicio de sesión para empresas: el número de la «configuración» creada en Meta. Si está, sustituye a los permisos sueltos. */
  configId?: string;
}

export interface PaginaMeta {
  id: string;
  nombre: string;
  token: string;
  instagram: { id: string; usuario: string } | null;
}

/** Lo que se le pide al dueño: ver sus páginas y leer/mandar mensajes de ellas y de su Instagram. */
const PERMISOS = [
  "pages_show_list",
  "pages_messaging",
  "pages_manage_metadata",
];

export function urlDeFacebook(clave: ClaveMeta, redireccion: string, estado: string): string {
  const p = new URLSearchParams({ client_id: clave.appId, redirect_uri: redireccion, state: estado, response_type: "code" });
  if (clave.configId) {
    p.set("config_id", clave.configId);
    p.set("override_default_response_type", "true");
  } else {
    p.set("scope", PERMISOS.join(","));
  }
  return `https://www.facebook.com/${VERSION}/dialog/oauth?${p}`;
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T | { error: { message?: string } }> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  return (await r.json().catch(() => ({ error: { message: `Meta contestó ${r.status}` } }))) as T;
}

/** Cambia el código por un token largo, y con él saca las páginas (cuyos tokens ya no vencen). */
export async function paginasDelDueno(
  clave: ClaveMeta,
  codigo: string,
  redireccion: string,
): Promise<{ paginas: PaginaMeta[]; diagnostico: string } | { error: string }> {
  const corto = await pedir<{ access_token?: string }>(
    `${GRAFO}/oauth/access_token?${new URLSearchParams({
      client_id: clave.appId,
      client_secret: clave.appSecret,
      redirect_uri: redireccion,
      code: codigo,
    })}`,
  );
  if (!("access_token" in corto) || !corto.access_token) {
    return { error: ("error" in corto && corto.error.message) || "Meta no dio el permiso" };
  }
  const largo = await pedir<{ access_token?: string }>(
    `${GRAFO}/oauth/access_token?${new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: clave.appId,
      client_secret: clave.appSecret,
      fb_exchange_token: corto.access_token,
    })}`,
  );
  const usuarioToken = "access_token" in largo && largo.access_token ? largo.access_token : corto.access_token;
  const lista = await pedir<{
    data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[];
  }>(
    `${GRAFO}/me/accounts?${new URLSearchParams({
      fields: "id,name,access_token",
      limit: "50",
      access_token: usuarioToken,
    })}`,
  );
  if (!("data" in lista) || !lista.data) {
    return { error: ("error" in lista && lista.error.message) || "Meta no dio la lista de páginas" };
  }
  // Para entender por qué no sale ninguna página: qué permisos dio de verdad y quién es.
  let diagnostico = "";
  if (lista.data.length === 0) {
    const permisos = await pedir<{ data?: { permission: string; status: string }[] }>(
      `${GRAFO}/me/permissions?access_token=${encodeURIComponent(usuarioToken)}`,
    );
    const yo = await pedir<{ id?: string; name?: string }>(`${GRAFO}/me?fields=id,name&access_token=${encodeURIComponent(usuarioToken)}`);
    diagnostico =
      `entró como ${"name" in yo ? yo.name : "?"}; permisos: ` +
      ("data" in permisos && permisos.data ? permisos.data.map((x) => `${x.permission}=${x.status}`).join(", ") : "no se pudieron leer");
  }
  return {
    diagnostico,
    paginas: lista.data.map((p) => ({
      id: p.id,
      nombre: p.name,
      token: p.access_token,
      instagram: p.instagram_business_account
        ? { id: p.instagram_business_account.id, usuario: p.instagram_business_account.username ?? p.instagram_business_account.id }
        : null,
    })),
  };
}

/** Le dice a Meta que mande a NEXORA los mensajes de esa página. */
export async function suscribirPagina(paginaId: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${GRAFO}/${encodeURIComponent(paginaId)}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ subscribed_fields: ["messages", "messaging_postbacks"] }),
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

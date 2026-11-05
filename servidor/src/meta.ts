/**
 * Instagram Direct y Facebook Messenger, por la API oficial de Meta.
 *
 * Entra por un aviso (webhook) que Meta manda al instante, y sale por la API de Graph.
 * Está aparte del correo a propósito: no comparten nada y no se estorban.
 *
 * Los tokens de cada cuenta viven en la base (tabla `cuentas`, columna `token`) y nunca
 * se mandan a la pantalla. Los dos secretos del servidor (META_APP_SECRET y META_VERIFY_TOKEN)
 * viven en los secretos de Cloudflare, nunca en el código.
 */

import { apuntar, cuentaDeMeta, guardarEntrante, platicaDe } from "./bandeja";
import { firmaValida } from "./firma";
import { GRAFO_IG, PREFIJO_IG } from "./instagram";
import type { Red } from "../../lib/tipos";

export { firmaValida };

/** La versión de la API de Graph. Meta las va retirando cada par de años: aquí se cambia en un solo lugar. */
const VERSION = "v21.0";
const GRAFO = `https://graph.facebook.com/${VERSION}`;

interface EventoMeta {
  object?: string;
  entry?: {
    id?: string;
    messaging?: {
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: { mid?: string; text?: string; is_echo?: boolean };
    }[];
  }[];
}

/** A qué dirección de Meta se le habla según el token: el de «Conectar Instagram» va por graph.instagram.com. */
function destinoDe(tokenGuardado: string): { base: string; token: string } {
  return tokenGuardado.startsWith(PREFIJO_IG)
    ? { base: GRAFO_IG, token: tokenGuardado.slice(PREFIJO_IG.length) }
    : { base: GRAFO, token: tokenGuardado };
}

/** Cómo se llama quien escribió. Si Meta no lo da, se usa su número de identificación. */
async function nombreDe(red: Red, personaId: string, tokenGuardado: string): Promise<string> {
  try {
    const { base, token } = destinoDe(tokenGuardado);
    const campos = red === "instagram" ? "name,username" : "first_name,last_name";
    const r = await fetch(`${base}/${encodeURIComponent(personaId)}?fields=${campos}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return personaId;
    const d = (await r.json()) as { name?: string; username?: string; first_name?: string; last_name?: string };
    return d.name || [d.first_name, d.last_name].filter(Boolean).join(" ") || d.username || personaId;
  } catch {
    return personaId;
  }
}

/** Guarda los mensajes que avisó Meta. Devuelve cuántos entraron. */
export async function guardarDeMeta(db: D1Database, evento: EventoMeta): Promise<number> {
  const red: Red | null = evento.object === "instagram" ? "instagram" : evento.object === "page" ? "facebook" : null;
  if (!red) return 0;
  let guardados = 0;
  for (const entrada of evento.entry ?? []) {
    for (const m of entrada.messaging ?? []) {
      // Lo que mandamos nosotros vuelve como «eco»: no es un mensaje nuevo.
      if (!m.message?.mid || m.message.is_echo || !m.message.text) continue;
      const quien = m.sender?.id;
      const recibio = m.recipient?.id ?? entrada.id;
      if (!quien || !recibio) continue;
      const cuenta = await cuentaDeMeta(db, red, recibio);
      if (!cuenta) {
        await apuntar(db, red, "error", `llegó un mensaje para ${recibio}, que no está ligado a ninguna empresa`);
        continue;
      }
      const yaHablaban = await db
        .prepare("SELECT 1 AS si FROM conversaciones WHERE cuenta_id = ? AND usuario_externo = ?")
        .bind(cuenta.id, quien)
        .first();
      const nombre = yaHablaban || !cuenta.token ? quien : await nombreDe(red, quien, cuenta.token);
      const platica = await platicaDe(db, { cuentaId: cuenta.id, usuarioExterno: quien, nombre });
      const nuevo = await guardarEntrante(db, {
        platicaId: platica.id,
        texto: m.message.text,
        fecha: new Date(m.timestamp ?? Date.now()).toISOString(),
        externoId: m.message.mid,
      });
      if (nuevo) guardados += 1;
    }
  }
  return guardados;
}

/** Manda tu respuesta por la API de Meta. Sólo se puede contestar a quien escribió primero. */
export async function enviarPorMeta(
  red: Red,
  tokenGuardado: string,
  destinatario: string,
  texto: string,
): Promise<{ entregado: boolean; error?: string }> {
  try {
    const { base, token } = destinoDe(tokenGuardado);
    const r = await fetch(`${base}/me/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: destinatario },
        messaging_type: "RESPONSE",
        message: { text: texto.slice(0, red === "instagram" ? 900 : 1900) },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) return { entregado: true };
    const d = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { entregado: false, error: d?.error?.message ?? `Meta contestó ${r.status}` };
  } catch (falla) {
    return { entregado: false, error: (falla as Error).message };
  }
}

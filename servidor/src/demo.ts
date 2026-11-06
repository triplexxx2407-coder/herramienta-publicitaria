/**
 * Modo demostración: llena una empresa con chats de ejemplo de las cinco redes
 * para enseñar cómo funciona NEXORA sin conectar nada de verdad.
 * Todo lo que se escribe aquí es inventado; no se manda a ninguna red.
 */

import { crearCuenta, platicaDe } from "./bandeja";
import type { Red } from "../../lib/tipos";

interface Charla {
  red: Red;
  persona: string;
  usuario: string;
  mensajes: { de: "yo" | "ellos"; texto: string; haceMinutos: number }[];
}

const CHARLAS: Charla[] = [
  {
    red: "instagram",
    persona: "Laura M.",
    usuario: "@laura.mrz",
    mensajes: [{ de: "ellos", texto: "Hola, vi el video del desarrollo. ¿Todavía tienen de dos recámaras?", haceMinutos: 4 }],
  },
  {
    red: "whatsapp",
    persona: "Jorge Treviño",
    usuario: "+52 664 555 0142",
    mensajes: [{ de: "ellos", texto: "Buenas tardes, me pasaron su número. ¿Me manda precios y formas de pago?", haceMinutos: 25 }],
  },
  {
    red: "tiktok",
    persona: "Diana R.",
    usuario: "@diana.rl",
    mensajes: [{ de: "ellos", texto: "oye y dónde queda exactamente?", haceMinutos: 118 }],
  },
  {
    red: "facebook",
    persona: "Marco Salinas",
    usuario: "marco.salinas",
    mensajes: [
      { de: "ellos", texto: "¿Aceptan pagar con crédito del banco?", haceMinutos: 300 },
      { de: "yo", texto: "Claro, Marco. Trabajamos con banco e Infonavit. ¿Le mando los dos escenarios?", haceMinutos: 280 },
      { de: "ellos", texto: "Sí por favor, y si se puede una cita el sábado.", haceMinutos: 41 },
    ],
  },
  {
    red: "correo",
    persona: "Patricia Lozano",
    usuario: "patricia@example.com",
    mensajes: [
      {
        de: "ellos",
        texto: "Asunto: Interés en el penthouse\n\nBuen día. Me interesa el penthouse de la torre B. ¿Podrían enviarme el plano y el precio final?",
        haceMinutos: 600,
      },
    ],
  },
  {
    red: "whatsapp",
    persona: "Laura M.",
    usuario: "+52 664 555 0188",
    mensajes: [
      { de: "ellos", texto: "Le escribo por aquí mejor. ¿Manejan crédito bancario?", haceMinutos: 200 },
      { de: "yo", texto: "Claro que sí, Laura. Trabajamos con banco e Infonavit. ¿Le late que le mande los dos escenarios?", haceMinutos: 190 },
    ],
  },
];

const IDENTIFICADOR: Record<Red, string> = {
  instagram: "@demo.instagram",
  whatsapp: "+52 000 000 0000",
  facebook: "Página de demostración",
  tiktok: "@demo.tiktok",
  correo: "demo@example.com",
};

/** Borra las pláticas de esa empresa y pone las de ejemplo. Devuelve cuántas quedaron. */
export async function llenarDemostracion(db: D1Database, empresaId: string, ahora = new Date()): Promise<number> {
  const deLaEmpresa = "SELECT id FROM conversaciones WHERE empresa_id = ?";
  await db.batch([
    db.prepare(`DELETE FROM mensajes WHERE conversacion_id IN (${deLaEmpresa})`).bind(empresaId),
    db.prepare("DELETE FROM conversaciones WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM personas WHERE empresa_id = ?").bind(empresaId),
  ]);

  const sufijo = empresaId.slice(-6).toLowerCase();
  const cuentas = new Map<Red, string>();
  for (const red of Object.keys(IDENTIFICADOR) as Red[]) {
    const existente = await db
      .prepare("SELECT id FROM cuentas WHERE empresa_id = ? AND red = ? ORDER BY creada_en LIMIT 1")
      .bind(empresaId, red)
      .first<{ id: string }>();
    if (existente) {
      cuentas.set(red, existente.id);
    } else {
      const { id } = await crearCuenta(db, { empresaId, red, identificador: `${IDENTIFICADOR[red]} ${sufijo}`.trim() }, ahora);
      cuentas.set(red, id);
    }
  }

  for (const c of CHARLAS) {
    const cuentaId = cuentas.get(c.red)!;
    const platica = await platicaDe(db, { cuentaId, usuarioExterno: c.usuario, nombre: c.persona }, ahora);
    let ultimo = "";
    let ultimoDeEllos = "";
    let n = 0;
    for (const m of c.mensajes) {
      const fecha = new Date(ahora.getTime() - m.haceMinutos * 60_000).toISOString();
      await db
        .prepare(
          `INSERT INTO mensajes (id, conversacion_id, de, texto, fecha, externo_id, entrega, creado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), platica.id, m.de, m.texto, fecha, `demo-${n++}`, m.de === "yo" ? "entregado" : "recibido", fecha)
        .run();
      if (fecha > ultimo) ultimo = fecha;
      if (m.de === "ellos" && fecha > ultimoDeEllos) ultimoDeEllos = fecha;
    }
    await db
      .prepare("UPDATE conversaciones SET ultimo_en = ?, ultimo_de_ellos_en = ?, leida_en = NULL WHERE id = ?")
      .bind(ultimo, ultimoDeEllos || null, platica.id)
      .run();
  }
  return CHARLAS.length;
}

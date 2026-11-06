/** Enlaces de WhatsApp, personas que escribieron, estadísticas y el WhatsApp de prueba. */

import { codigoRef, type Chat, type Contacto, type Enlace, type Estadisticas, type Etapa, type Totales } from "../../lib/ventas";
import { id } from "./perfiles";

/* ── Enlaces de WhatsApp con medición ── */

/** Un código corto para la dirección pública del enlace (sin letras que se confundan). */
function codigoCorto(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => letras[b % letras.length]).join("");
}

interface FilaEnlace {
  id: string;
  empresa_id: string;
  nombre: string;
  telefono: string;
  mensaje: string | null;
  clics: number;
  escribieron: number;
  citas: number;
  ventas: number;
}

export async function enlacesDe(db: D1Database, empresaId: string): Promise<Enlace[]> {
  const { results } = await db
    .prepare(
      `SELECT e.id, e.empresa_id, e.nombre, e.telefono, e.mensaje, e.clics,
              (SELECT COUNT(*) FROM contactos c WHERE c.enlace_id = e.id) AS escribieron,
              (SELECT COUNT(*) FROM contactos c WHERE c.enlace_id = e.id AND c.etapa IN ('cita', 'venta')) AS citas,
              (SELECT COUNT(*) FROM contactos c WHERE c.enlace_id = e.id AND c.etapa = 'venta') AS ventas
       FROM enlaces e WHERE e.empresa_id = ? ORDER BY e.creada_en DESC`,
    )
    .bind(empresaId)
    .all<FilaEnlace>();
  return results.map((e) => ({
    id: e.id,
    empresaId: e.empresa_id,
    nombre: e.nombre,
    telefono: e.telefono,
    mensaje: e.mensaje ?? "",
    ref: codigoRef(e.id),
    visitas: e.clics,
    escribieron: e.escribieron,
    citas: e.citas,
    ventas: e.ventas,
  }));
}

export async function crearEnlace(
  db: D1Database,
  empresaId: string,
  d: { nombre: string; telefono: string; mensaje: string },
  ahora = new Date(),
): Promise<string> {
  const codigo = codigoCorto();
  await db
    .prepare("INSERT INTO enlaces (id, empresa_id, nombre, telefono, mensaje, clics, creada_en) VALUES (?, ?, ?, ?, ?, 0, ?)")
    .bind(codigo, empresaId, d.nombre, d.telefono, d.mensaje, ahora.toISOString())
    .run();
  return codigo;
}

export async function editarEnlace(db: D1Database, enlaceId: string, d: { nombre: string; telefono: string; mensaje: string }): Promise<boolean> {
  const r = await db
    .prepare("UPDATE enlaces SET nombre = ?, telefono = ?, mensaje = ? WHERE id = ?")
    .bind(d.nombre, d.telefono, d.mensaje, enlaceId)
    .run();
  return !!r.meta.changes;
}

export async function borrarEnlace(db: D1Database, enlaceId: string): Promise<boolean> {
  const r = await db.batch([
    db.prepare("DELETE FROM contactos WHERE enlace_id = ?").bind(enlaceId),
    db.prepare("UPDATE mensajes_prueba SET enlace_id = NULL WHERE enlace_id = ?").bind(enlaceId),
    db.prepare("DELETE FROM enlaces WHERE id = ?").bind(enlaceId),
  ]);
  return !!r[2].meta.changes;
}

/** Cuenta una visita y devuelve a dónde mandar a la persona, o null si el enlace no existe. */
export async function contarClic(db: D1Database, enlaceId: string): Promise<{ telefono: string; mensaje: string; ref: string } | null> {
  const e = await db
    .prepare("SELECT telefono, mensaje FROM enlaces WHERE id = ?")
    .bind(enlaceId)
    .first<{ telefono: string; mensaje: string | null }>();
  if (!e) return null;
  await db.prepare("UPDATE enlaces SET clics = clics + 1 WHERE id = ?").bind(enlaceId).run();
  return { telefono: e.telefono, mensaje: e.mensaje ?? "", ref: codigoRef(enlaceId) };
}

/* ── Personas que escribieron ── */

export async function contactosDe(db: D1Database, empresaId: string): Promise<Contacto[]> {
  const { results } = await db
    .prepare(
      `SELECT c.id, c.enlace_id, e.nombre AS enlace, c.nota, c.etapa, c.creada_en
       FROM contactos c JOIN enlaces e ON e.id = c.enlace_id
       WHERE c.empresa_id = ? ORDER BY c.creada_en DESC, c.rowid DESC`,
    )
    .bind(empresaId)
    .all<{ id: string; enlace_id: string; enlace: string; nota: string; etapa: Etapa; creada_en: string }>();
  return results.map((c) => ({ id: c.id, enlaceId: c.enlace_id, enlace: c.enlace, nota: c.nota, etapa: c.etapa, fecha: c.creada_en }));
}

/** Apunta que alguien escribió por ese enlace. Devuelve null si el enlace no es de la empresa. */
export async function crearContacto(db: D1Database, empresaId: string, enlaceId: string, nota: string, ahora = new Date()): Promise<string | null> {
  const hay = await db.prepare("SELECT id FROM enlaces WHERE id = ? AND empresa_id = ?").bind(enlaceId, empresaId).first();
  if (!hay) return null;
  const nuevo = id();
  await db
    .prepare("INSERT INTO contactos (id, empresa_id, enlace_id, nota, etapa, creada_en) VALUES (?, ?, ?, ?, 'escribio', ?)")
    .bind(nuevo, empresaId, enlaceId, nota, ahora.toISOString())
    .run();
  return nuevo;
}

export async function ponerEtapa(db: D1Database, contactoId: string, etapa: Etapa): Promise<boolean> {
  const r = await db.prepare("UPDATE contactos SET etapa = ? WHERE id = ?").bind(etapa, contactoId).run();
  return !!r.meta.changes;
}

export async function borrarContacto(db: D1Database, contactoId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM contactos WHERE id = ?").bind(contactoId).run();
  return !!r.meta.changes;
}

/* ── Estadísticas ── */

export async function estadisticasDe(db: D1Database, empresaId: string): Promise<Estadisticas> {
  const enlaces = await enlacesDe(db, empresaId);
  const totales: Totales = { visitas: 0, escribieron: 0, citas: 0, ventas: 0 };
  for (const e of enlaces) {
    totales.visitas += e.visitas;
    totales.escribieron += e.escribieron;
    totales.citas += e.citas;
    totales.ventas += e.ventas;
  }
  enlaces.sort((a, b) => b.ventas - a.ventas || b.citas - a.citas || b.escribieron - a.escribieron || b.visitas - a.visitas);
  return { totales, enlaces };
}

/* ── WhatsApp de prueba ── */

const NOMBRES = [
  "Marco Salinas",
  "Laura Méndez",
  "Jorge Treviño",
  "Diana Ríos",
  "Patricia Lozano",
  "Andrés Cota",
  "Sofía Verdugo",
  "Luis Ortega",
  "Mariana Ibarra",
  "Carlos Beltrán",
  "Fernanda Quiroz",
  "Ricardo Valdez",
];

const RESPUESTAS = [
  "¡Hola! Claro, con gusto te paso la información. ¿Buscas de una o dos recámaras?",
  "Gracias por escribir. ¿Te mando precios y formas de pago?",
  "Perfecto, ¿te late que agendemos una visita esta semana?",
];

function telefonoAzar(): string {
  return `664 555 ${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function elegir<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

export async function chatsDe(db: D1Database, empresaId: string): Promise<Chat[]> {
  const { results } = await db
    .prepare(
      `SELECT m.id, m.persona, m.telefono, m.de, m.texto, m.fecha, e.nombre AS enlace
       FROM mensajes_prueba m LEFT JOIN enlaces e ON e.id = m.enlace_id
       WHERE m.empresa_id = ? ORDER BY m.fecha, m.rowid`,
    )
    .bind(empresaId)
    .all<{ id: string; persona: string; telefono: string; de: "yo" | "ellos"; texto: string; fecha: string; enlace: string | null }>();
  const chats = new Map<string, Chat>();
  for (const m of results) {
    const clave = `${m.persona}|${m.telefono}`;
    const chat = chats.get(clave) ?? { persona: m.persona, telefono: m.telefono, enlace: m.enlace, mensajes: [] };
    chat.mensajes.push({ id: m.id, de: m.de, texto: m.texto, fecha: m.fecha });
    chats.set(clave, chat);
  }
  // El más reciente primero.
  return [...chats.values()].sort((a, b) => b.mensajes[b.mensajes.length - 1].fecha.localeCompare(a.mensajes[a.mensajes.length - 1].fecha));
}

/** Alguien toca el enlace y escribe: cuenta la visita y llega su primer mensaje. */
export async function simularMensaje(db: D1Database, empresaId: string, enlaceId: string, ahora = new Date()): Promise<{ persona: string } | null> {
  const e = await db
    .prepare("SELECT mensaje FROM enlaces WHERE id = ? AND empresa_id = ?")
    .bind(enlaceId, empresaId)
    .first<{ mensaje: string | null }>();
  if (!e) return null;
  const { results: usadas } = await db.prepare("SELECT DISTINCT persona FROM mensajes_prueba WHERE empresa_id = ?").bind(empresaId).all<{ persona: string }>();
  const ocupados = new Set(usadas.map((u) => u.persona));
  let persona = elegir(NOMBRES);
  for (let n = 2; ocupados.has(persona); n++) persona = `${elegir(NOMBRES)} ${n}`;
  await db.batch([
    db.prepare("UPDATE enlaces SET clics = clics + 1 WHERE id = ?").bind(enlaceId),
    db
      .prepare("INSERT INTO contactos (id, empresa_id, enlace_id, nota, etapa, creada_en) VALUES (?, ?, ?, ?, 'escribio', ?)")
      .bind(id(), empresaId, enlaceId, persona, ahora.toISOString()),
    db
      .prepare("INSERT INTO mensajes_prueba (id, empresa_id, enlace_id, persona, telefono, de, texto, fecha) VALUES (?, ?, ?, ?, ?, 'ellos', ?, ?)")
      .bind(id(), empresaId, enlaceId, persona, telefonoAzar(), `${e.mensaje?.trim() || "Hola, quiero más información"} (ref ${codigoRef(enlaceId)})`, ahora.toISOString()),
  ]);
  return { persona };
}

/** Alguien sólo toca el enlace y no escribe. */
export async function simularVisita(db: D1Database, empresaId: string, enlaceId: string): Promise<boolean> {
  const r = await db.prepare("UPDATE enlaces SET clics = clics + 1 WHERE id = ? AND empresa_id = ?").bind(enlaceId, empresaId).run();
  return !!r.meta.changes;
}

/** Tu respuesta en el WhatsApp de prueba. */
export async function responderPrueba(db: D1Database, empresaId: string, persona: string, texto: string, ahora = new Date()): Promise<boolean> {
  const previo = await db
    .prepare("SELECT telefono, enlace_id FROM mensajes_prueba WHERE empresa_id = ? AND persona = ? LIMIT 1")
    .bind(empresaId, persona)
    .first<{ telefono: string; enlace_id: string | null }>();
  if (!previo) return false;
  await db
    .prepare("INSERT INTO mensajes_prueba (id, empresa_id, enlace_id, persona, telefono, de, texto, fecha) VALUES (?, ?, ?, ?, ?, 'yo', ?, ?)")
    .bind(id(), empresaId, previo.enlace_id, persona, previo.telefono, texto, ahora.toISOString())
    .run();
  return true;
}

/* ── Datos de prueba ── */

/** Deja la empresa con enlaces, visitas, personas y chats de ejemplo para ver cómo se vería todo. */
export async function llenarDatosDePrueba(db: D1Database, empresaId: string, ahora = new Date()): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM mensajes_prueba WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM contactos WHERE empresa_id = ?").bind(empresaId),
  ]);

  let enlaces = await enlacesDe(db, empresaId);
  if (enlaces.length === 0) {
    const nuevos = [
      { nombre: "TikTok: recorrido del penthouse", mensaje: "Hola, vi el recorrido del penthouse" },
      { nombre: "Anuncio de Facebook: preventa", mensaje: "Hola, vi el anuncio de la preventa" },
      { nombre: "Letrero de la obra (QR)", mensaje: "Hola, vi el letrero de la obra" },
    ];
    for (const n of nuevos) await crearEnlace(db, empresaId, { ...n, telefono: "664 555 0100" }, ahora);
    enlaces = await enlacesDe(db, empresaId);
  }

  const aleatorio = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const stmts: D1PreparedStatement[] = [];
  const usados = new Set<string>();
  for (const e of enlaces) {
    const visitas = aleatorio(40, 160);
    stmts.push(db.prepare("UPDATE enlaces SET clics = ? WHERE id = ?").bind(visitas, e.id));
    const gente = aleatorio(4, 9);
    for (let n = 0; n < gente; n++) {
      let persona = elegir(NOMBRES);
      for (let k = 2; usados.has(persona); k++) persona = `${elegir(NOMBRES)} ${k}`;
      usados.add(persona);
      const telefono = telefonoAzar();
      const primero = new Date(ahora.getTime() - aleatorio(10, 60 * 24 * 5) * 60_000);
      const suerte = Math.random();
      const etapa: Etapa = suerte < 0.1 ? "venta" : suerte < 0.35 ? "cita" : "escribio";
      stmts.push(
        db
          .prepare("INSERT INTO contactos (id, empresa_id, enlace_id, nota, etapa, creada_en) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(id(), empresaId, e.id, persona, etapa, primero.toISOString()),
      );
      const guion: { de: "yo" | "ellos"; texto: string; despues: number }[] = [
        { de: "ellos", texto: `${e.mensaje || "Hola, quiero más información"} (ref ${e.ref})`, despues: 0 },
      ];
      if (Math.random() < 0.7) guion.push({ de: "yo", texto: elegir(RESPUESTAS), despues: aleatorio(1, 30) });
      if (Math.random() < 0.4) guion.push({ de: "ellos", texto: "Sí, por favor. ¿Cuánto es el enganche?", despues: aleatorio(31, 120) });
      for (const m of guion) {
        stmts.push(
          db
            .prepare("INSERT INTO mensajes_prueba (id, empresa_id, enlace_id, persona, telefono, de, texto, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(id(), empresaId, e.id, persona, telefono, m.de, m.texto, new Date(primero.getTime() + m.despues * 60_000).toISOString()),
        );
      }
    }
  }
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
}

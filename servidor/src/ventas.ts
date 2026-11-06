/** Enlaces de WhatsApp, contenidos con sus números, estadísticas y el WhatsApp de prueba. */

import type { Chat, Contenido, Enlace, Estadisticas, Tipo, Totales } from "../../lib/ventas";
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
  mensajes: number;
}

export async function enlacesDe(db: D1Database, empresaId: string): Promise<Enlace[]> {
  const { results } = await db
    .prepare(
      `SELECT e.id, e.empresa_id, e.nombre, e.telefono, e.mensaje, e.clics,
              (SELECT COUNT(DISTINCT m.persona) FROM mensajes_prueba m WHERE m.enlace_id = e.id AND m.de = 'ellos') AS escribieron,
              (SELECT COUNT(*) FROM mensajes_prueba m WHERE m.enlace_id = e.id AND m.de = 'ellos') AS mensajes
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
    visitas: e.clics,
    escribieron: e.escribieron,
    mensajes: e.mensajes,
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
    db.prepare("UPDATE contenidos SET enlace_id = NULL WHERE enlace_id = ?").bind(enlaceId),
    db.prepare("UPDATE mensajes_prueba SET enlace_id = NULL WHERE enlace_id = ?").bind(enlaceId),
    db.prepare("DELETE FROM enlaces WHERE id = ?").bind(enlaceId),
  ]);
  return !!r[2].meta.changes;
}

/** Cuenta una visita y devuelve a dónde mandar a la persona, o null si el enlace no existe. */
export async function contarClic(db: D1Database, enlaceId: string): Promise<{ telefono: string; mensaje: string } | null> {
  const e = await db
    .prepare("SELECT telefono, mensaje FROM enlaces WHERE id = ?")
    .bind(enlaceId)
    .first<{ telefono: string; mensaje: string | null }>();
  if (!e) return null;
  await db.prepare("UPDATE enlaces SET clics = clics + 1 WHERE id = ?").bind(enlaceId).run();
  return { telefono: e.telefono, mensaje: e.mensaje ?? "" };
}

/* ── Contenidos (videos, publicaciones, anuncios) ── */

export interface DatosContenido {
  tipo: Tipo;
  red: string;
  titulo: string;
  enlaceId: string | null;
  vistas: number;
  clics: number;
  likes: number;
}

async function enlaceDeLaEmpresa(db: D1Database, empresaId: string, enlaceId: string | null): Promise<string | null> {
  if (!enlaceId) return null;
  const hay = await db.prepare("SELECT id FROM enlaces WHERE id = ? AND empresa_id = ?").bind(enlaceId, empresaId).first();
  return hay ? enlaceId : null;
}

export async function crearContenido(db: D1Database, empresaId: string, d: DatosContenido, ahora = new Date()): Promise<string> {
  const nuevo = id();
  const enlace = await enlaceDeLaEmpresa(db, empresaId, d.enlaceId);
  await db
    .prepare(
      "INSERT INTO contenidos (id, empresa_id, tipo, red, titulo, enlace_id, vistas, clics, likes, creada_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(nuevo, empresaId, d.tipo, d.red, d.titulo, enlace, d.vistas, d.clics, d.likes, ahora.toISOString())
    .run();
  return nuevo;
}

export async function editarContenido(db: D1Database, contenidoId: string, d: DatosContenido): Promise<boolean> {
  const actual = await db.prepare("SELECT empresa_id FROM contenidos WHERE id = ?").bind(contenidoId).first<{ empresa_id: string }>();
  if (!actual) return false;
  const enlace = await enlaceDeLaEmpresa(db, actual.empresa_id, d.enlaceId);
  const r = await db
    .prepare("UPDATE contenidos SET tipo = ?, red = ?, titulo = ?, enlace_id = ?, vistas = ?, clics = ?, likes = ? WHERE id = ?")
    .bind(d.tipo, d.red, d.titulo, enlace, d.vistas, d.clics, d.likes, contenidoId)
    .run();
  return !!r.meta.changes;
}

export async function borrarContenido(db: D1Database, contenidoId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM contenidos WHERE id = ?").bind(contenidoId).run();
  return !!r.meta.changes;
}

/* ── Estadísticas ── */

const CERO: Totales = { vistas: 0, clics: 0, likes: 0, visitas: 0, escribieron: 0, mensajes: 0 };

export async function estadisticasDe(db: D1Database, empresaId: string): Promise<Estadisticas> {
  const enlaces = await enlacesDe(db, empresaId);
  const porEnlace = new Map(enlaces.map((e) => [e.id, e]));
  const { results } = await db
    .prepare("SELECT id, tipo, red, titulo, enlace_id, vistas, clics, likes FROM contenidos WHERE empresa_id = ? ORDER BY vistas DESC, creada_en DESC")
    .bind(empresaId)
    .all<{ id: string; tipo: Tipo; red: string; titulo: string; enlace_id: string | null; vistas: number; clics: number; likes: number }>();

  const contenidos: Contenido[] = results.map((c) => {
    const e = c.enlace_id ? porEnlace.get(c.enlace_id) : undefined;
    return {
      id: c.id,
      empresaId,
      tipo: c.tipo,
      red: c.red,
      titulo: c.titulo,
      enlaceId: e ? e.id : null,
      enlace: e ? e.nombre : null,
      vistas: c.vistas,
      clics: c.clics,
      likes: c.likes,
      visitas: e?.visitas ?? 0,
      escribieron: e?.escribieron ?? 0,
    };
  });

  // Por red: lo que da la red (vistas, clics, likes) y lo que mide NEXORA. Un mismo enlace
  // puesto en dos contenidos de la misma red se cuenta una sola vez.
  const porRed = new Map<string, Totales & { enlaces: Set<string> }>();
  for (const c of contenidos) {
    const r = porRed.get(c.red) ?? { ...CERO, enlaces: new Set<string>() };
    r.vistas += c.vistas;
    r.clics += c.clics;
    r.likes += c.likes;
    if (c.enlaceId && !r.enlaces.has(c.enlaceId)) {
      r.enlaces.add(c.enlaceId);
      const e = porEnlace.get(c.enlaceId);
      if (e) {
        r.visitas += e.visitas;
        r.escribieron += e.escribieron;
        r.mensajes += e.mensajes;
      }
    }
    porRed.set(c.red, r);
  }

  const totales: Totales = { ...CERO };
  for (const c of contenidos) {
    totales.vistas += c.vistas;
    totales.clics += c.clics;
    totales.likes += c.likes;
  }
  for (const e of enlaces) {
    totales.visitas += e.visitas;
    totales.escribieron += e.escribieron;
    totales.mensajes += e.mensajes;
  }

  return {
    totales,
    porRed: [...porRed.entries()]
      .map(([red, { enlaces: _e, ...t }]) => ({ red, ...t }))
      .sort((a, b) => b.vistas - a.vistas),
    contenidos,
    enlaces,
  };
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
      .prepare("INSERT INTO mensajes_prueba (id, empresa_id, enlace_id, persona, telefono, de, texto, fecha) VALUES (?, ?, ?, ?, ?, 'ellos', ?, ?)")
      .bind(id(), empresaId, enlaceId, persona, telefonoAzar(), e.mensaje?.trim() || "Hola, quiero más información", ahora.toISOString()),
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

/** Deja la empresa con contenidos, visitas y chats de ejemplo para ver cómo se vería todo. */
export async function llenarDatosDePrueba(db: D1Database, empresaId: string, ahora = new Date()): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM mensajes_prueba WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM contenidos WHERE empresa_id = ?").bind(empresaId),
  ]);

  let enlaces = await enlacesDe(db, empresaId);
  if (enlaces.length === 0) {
    const nuevos = [
      { nombre: "Video avance de obra", mensaje: "Hola, vi el video de avance de obra" },
      { nombre: "Anuncio de preventa", mensaje: "Hola, vi el anuncio de la preventa" },
      { nombre: "Reel del penthouse", mensaje: "Hola, me interesa el penthouse" },
    ];
    for (const n of nuevos) await crearEnlace(db, empresaId, { ...n, telefono: "664 555 0100" }, ahora);
    enlaces = await enlacesDe(db, empresaId);
  }

  const aleatorio = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pon = (n: number) => enlaces[n % enlaces.length].id;
  const muestras: [Tipo, string, string, number][] = [
    ["video", "instagram", "Reel: avance de obra", 0],
    ["anuncio", "facebook", "Anuncio: preventa de la torre", 1],
    ["video", "tiktok", "TikTok: recorrido del penthouse", 2],
    ["publicacion", "instagram", "Foto: vista desde el piso 12", 2],
    ["anuncio", "instagram", "Anuncio en historias: últimos lugares", 1],
    ["publicacion", "facebook", "Publicación: ubicación y amenidades", 0],
    ["video", "tiktok", "TikTok: así va la obra", 0],
  ];
  const stmts: D1PreparedStatement[] = [];
  for (const [tipo, red, titulo, n] of muestras) {
    const vistas = tipo === "anuncio" ? aleatorio(8000, 45000) : aleatorio(1500, 30000);
    stmts.push(
      db
        .prepare(
          "INSERT INTO contenidos (id, empresa_id, tipo, red, titulo, enlace_id, vistas, clics, likes, creada_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id(), empresaId, tipo, red, titulo, pon(n), vistas, Math.floor(vistas * (aleatorio(15, 60) / 1000)), Math.floor(vistas * (aleatorio(20, 90) / 1000)), ahora.toISOString()),
    );
  }

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
      const hace = aleatorio(10, 60 * 24 * 5) * 60_000;
      const primero = new Date(ahora.getTime() - hace);
      const guion: { de: "yo" | "ellos"; texto: string; despues: number }[] = [
        { de: "ellos", texto: e.mensaje || "Hola, quiero más información", despues: 0 },
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
  // D1 acepta lotes grandes, pero se parte por si acaso.
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
}

/** Interesados, publicaciones y enlaces de WhatsApp de cada perfil. */

import { ETAPAS, type Enlace, type Etapa, type Interesado, type Publicacion, type Resultados } from "../../lib/ventas";
import { id } from "./perfiles";

/* ── Interesados ── */

interface FilaInteresado {
  id: string;
  empresa_id: string;
  nombre: string;
  telefono: string;
  red: string;
  enlace_id: string | null;
  enlace: string | null;
  etapa: Etapa;
  notas: string | null;
  siguiente_en: string | null;
  creada_en: string;
}

function interesado(f: FilaInteresado): Interesado {
  return {
    id: f.id,
    empresaId: f.empresa_id,
    nombre: f.nombre,
    telefono: f.telefono,
    red: f.red,
    enlaceId: f.enlace_id,
    enlace: f.enlace,
    etapa: f.etapa,
    notas: f.notas ?? "",
    siguiente: f.siguiente_en,
    creadaEn: f.creada_en,
  };
}

export async function interesadosDe(db: D1Database, empresaId: string): Promise<Interesado[]> {
  const { results } = await db
    .prepare(
      `SELECT i.*, e.nombre AS enlace FROM interesados i LEFT JOIN enlaces e ON e.id = i.enlace_id
       WHERE i.empresa_id = ? ORDER BY i.creada_en DESC`,
    )
    .bind(empresaId)
    .all<FilaInteresado>();
  return results.map(interesado);
}

export interface DatosInteresado {
  nombre: string;
  telefono: string;
  red: string;
  enlaceId: string | null;
  etapa: Etapa;
  notas: string;
  siguiente: string | null;
}

export async function crearInteresado(db: D1Database, empresaId: string, d: DatosInteresado, ahora = new Date()): Promise<string> {
  const nuevo = id();
  // El enlace tiene que ser de la misma empresa.
  const enlace = d.enlaceId
    ? await db.prepare("SELECT id FROM enlaces WHERE id = ? AND empresa_id = ?").bind(d.enlaceId, empresaId).first()
    : null;
  await db
    .prepare(
      `INSERT INTO interesados (id, empresa_id, nombre, telefono, red, enlace_id, etapa, notas, siguiente_en, creada_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(nuevo, empresaId, d.nombre, d.telefono, d.red, enlace ? d.enlaceId : null, d.etapa, d.notas, d.siguiente, ahora.toISOString())
    .run();
  return nuevo;
}

export async function editarInteresado(db: D1Database, interesadoId: string, d: DatosInteresado): Promise<boolean> {
  const actual = await db.prepare("SELECT empresa_id FROM interesados WHERE id = ?").bind(interesadoId).first<{ empresa_id: string }>();
  if (!actual) return false;
  const enlace = d.enlaceId
    ? await db.prepare("SELECT id FROM enlaces WHERE id = ? AND empresa_id = ?").bind(d.enlaceId, actual.empresa_id).first()
    : null;
  const r = await db
    .prepare(
      `UPDATE interesados SET nombre = ?, telefono = ?, red = ?, enlace_id = ?, etapa = ?, notas = ?, siguiente_en = ? WHERE id = ?`,
    )
    .bind(d.nombre, d.telefono, d.red, enlace ? d.enlaceId : null, d.etapa, d.notas, d.siguiente, interesadoId)
    .run();
  return !!r.meta.changes;
}

export async function borrarInteresado(db: D1Database, interesadoId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM interesados WHERE id = ?").bind(interesadoId).run();
  return !!r.meta.changes;
}

/* ── Publicaciones ── */

export async function publicacionesDe(db: D1Database, empresaId: string): Promise<Publicacion[]> {
  const { results } = await db
    .prepare("SELECT * FROM publicaciones WHERE empresa_id = ? ORDER BY fecha, creada_en")
    .bind(empresaId)
    .all<{ id: string; empresa_id: string; red: string; titulo: string; texto: string | null; fecha: string; hecha: number; enlace_id: string | null }>();
  return results.map((p) => ({
    id: p.id,
    empresaId: p.empresa_id,
    red: p.red,
    titulo: p.titulo,
    texto: p.texto ?? "",
    fecha: p.fecha,
    hecha: !!p.hecha,
    enlaceId: p.enlace_id,
  }));
}

export interface DatosPublicacion {
  red: string;
  titulo: string;
  texto: string;
  fecha: string;
  hecha: boolean;
  enlaceId: string | null;
}

export async function crearPublicacion(db: D1Database, empresaId: string, d: DatosPublicacion, ahora = new Date()): Promise<string> {
  const nueva = id();
  const enlace = d.enlaceId
    ? await db.prepare("SELECT id FROM enlaces WHERE id = ? AND empresa_id = ?").bind(d.enlaceId, empresaId).first()
    : null;
  await db
    .prepare(
      "INSERT INTO publicaciones (id, empresa_id, red, titulo, texto, fecha, hecha, enlace_id, creada_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(nueva, empresaId, d.red, d.titulo, d.texto, d.fecha, d.hecha ? 1 : 0, enlace ? d.enlaceId : null, ahora.toISOString())
    .run();
  return nueva;
}

export async function editarPublicacion(db: D1Database, publicacionId: string, d: DatosPublicacion): Promise<boolean> {
  const actual = await db.prepare("SELECT empresa_id FROM publicaciones WHERE id = ?").bind(publicacionId).first<{ empresa_id: string }>();
  if (!actual) return false;
  const enlace = d.enlaceId
    ? await db.prepare("SELECT id FROM enlaces WHERE id = ? AND empresa_id = ?").bind(d.enlaceId, actual.empresa_id).first()
    : null;
  const r = await db
    .prepare("UPDATE publicaciones SET red = ?, titulo = ?, texto = ?, fecha = ?, hecha = ?, enlace_id = ? WHERE id = ?")
    .bind(d.red, d.titulo, d.texto, d.fecha, d.hecha ? 1 : 0, enlace ? d.enlaceId : null, publicacionId)
    .run();
  return !!r.meta.changes;
}

export async function borrarPublicacion(db: D1Database, publicacionId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM publicaciones WHERE id = ?").bind(publicacionId).run();
  return !!r.meta.changes;
}

/* ── Enlaces de WhatsApp con medición ── */

/** Un código corto para la dirección pública del enlace (sin letras que se confundan). */
function codigoCorto(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => letras[b % letras.length]).join("");
}

export async function enlacesDe(db: D1Database, empresaId: string): Promise<Enlace[]> {
  const { results } = await db
    .prepare(
      `SELECT e.id, e.empresa_id, e.nombre, e.telefono, e.mensaje, e.clics,
              (SELECT COUNT(*) FROM interesados i WHERE i.enlace_id = e.id) AS interesados
       FROM enlaces e WHERE e.empresa_id = ? ORDER BY e.creada_en DESC`,
    )
    .bind(empresaId)
    .all<{ id: string; empresa_id: string; nombre: string; telefono: string; mensaje: string | null; clics: number; interesados: number }>();
  return results.map((e) => ({
    id: e.id,
    empresaId: e.empresa_id,
    nombre: e.nombre,
    telefono: e.telefono,
    mensaje: e.mensaje ?? "",
    clics: e.clics,
    interesados: e.interesados,
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
    db.prepare("UPDATE interesados SET enlace_id = NULL WHERE enlace_id = ?").bind(enlaceId),
    db.prepare("UPDATE publicaciones SET enlace_id = NULL WHERE enlace_id = ?").bind(enlaceId),
    db.prepare("DELETE FROM enlaces WHERE id = ?").bind(enlaceId),
  ]);
  return !!r[2].meta.changes;
}

/** Cuenta un clic y devuelve a dónde mandar a la persona, o null si el enlace no existe. */
export async function contarClic(db: D1Database, enlaceId: string): Promise<{ telefono: string; mensaje: string } | null> {
  const e = await db
    .prepare("SELECT telefono, mensaje FROM enlaces WHERE id = ?")
    .bind(enlaceId)
    .first<{ telefono: string; mensaje: string | null }>();
  if (!e) return null;
  await db.prepare("UPDATE enlaces SET clics = clics + 1 WHERE id = ?").bind(enlaceId).run();
  return { telefono: e.telefono, mensaje: e.mensaje ?? "" };
}

/* ── Resultados ── */

export async function resultadosDe(db: D1Database, empresaId: string): Promise<Resultados> {
  const { results: etapas } = await db
    .prepare("SELECT etapa, COUNT(*) AS n FROM interesados WHERE empresa_id = ? GROUP BY etapa")
    .bind(empresaId)
    .all<{ etapa: Etapa; n: number }>();
  const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e, 0])) as Record<Etapa, number>;
  for (const f of etapas) porEtapa[f.etapa] = f.n;

  const { results: filas } = await db
    .prepare(
      `SELECT e.id, e.nombre, e.clics,
              COUNT(i.id) AS interesados,
              SUM(CASE WHEN i.etapa IN ('cita','apartado','vendido') THEN 1 ELSE 0 END) AS citas,
              SUM(CASE WHEN i.etapa = 'vendido' THEN 1 ELSE 0 END) AS vendidos
       FROM enlaces e LEFT JOIN interesados i ON i.enlace_id = e.id
       WHERE e.empresa_id = ? GROUP BY e.id ORDER BY interesados DESC, e.clics DESC`,
    )
    .bind(empresaId)
    .all<{ id: string; nombre: string; clics: number; interesados: number; citas: number | null; vendidos: number | null }>();

  const suelto = await db
    .prepare(
      `SELECT COUNT(*) AS interesados,
              SUM(CASE WHEN etapa IN ('cita','apartado','vendido') THEN 1 ELSE 0 END) AS citas,
              SUM(CASE WHEN etapa = 'vendido' THEN 1 ELSE 0 END) AS vendidos
       FROM interesados WHERE empresa_id = ? AND enlace_id IS NULL`,
    )
    .bind(empresaId)
    .first<{ interesados: number; citas: number | null; vendidos: number | null }>();

  return {
    porEtapa,
    enlaces: filas.map((f) => ({ ...f, citas: f.citas ?? 0, vendidos: f.vendidos ?? 0 })),
    sinEnlace: { interesados: suelto?.interesados ?? 0, citas: suelto?.citas ?? 0, vendidos: suelto?.vendidos ?? 0 },
  };
}

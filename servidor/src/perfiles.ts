/**
 * Los perfiles (las empresas que atiende el equipo) y las redes que cada uno usa.
 * Una «cuenta» aquí sólo es el nombre de la red de la empresa (su @usuario, número…):
 * NEXORA no se conecta a nada, sólo lo apunta para tenerlo a la mano.
 */

import type { Red } from "../../lib/tipos";

export function id(): string {
  return crypto.randomUUID();
}

export interface Empresa {
  id: string;
  nombre: string;
  giro: string | null;
  cuentas: { id: string; red: Red; identificador: string }[];
}

/** Los perfiles, cada uno con sus redes. */
export async function empresas(db: D1Database): Promise<Empresa[]> {
  const { results: filas } = await db
    .prepare("SELECT id, nombre, giro FROM empresas ORDER BY nombre")
    .all<{ id: string; nombre: string; giro: string | null }>();
  const { results: cuentas } = await db
    .prepare("SELECT id, empresa_id, red, identificador FROM cuentas ORDER BY red, identificador")
    .all<{ id: string; empresa_id: string; red: Red; identificador: string }>();
  return filas.map((e) => ({
    ...e,
    cuentas: cuentas.filter((c) => c.empresa_id === e.id).map((c) => ({ id: c.id, red: c.red, identificador: c.identificador })),
  }));
}

export async function crearEmpresa(
  db: D1Database,
  datos: { nombre: string; giro?: string | null },
  ahora = new Date(),
): Promise<{ id: string }> {
  const empresaId = id();
  await db
    .prepare("INSERT INTO empresas (id, nombre, giro, creada_en) VALUES (?, ?, ?, ?)")
    .bind(empresaId, datos.nombre, datos.giro ?? null, ahora.toISOString())
    .run();
  return { id: empresaId };
}

/** Cambia el nombre o el giro de un perfil. Devuelve false si no existe. */
export async function editarEmpresa(
  db: D1Database,
  datos: { id: string; nombre: string; giro: string | null },
): Promise<boolean> {
  const r = await db
    .prepare("UPDATE empresas SET nombre = ?, giro = ? WHERE id = ?")
    .bind(datos.nombre, datos.giro, datos.id)
    .run();
  return !!r.meta.changes;
}

/** Borra un perfil con todo lo suyo. */
export async function borrarEmpresa(db: D1Database, empresaId: string): Promise<boolean> {
  const r = await db.batch([
    db.prepare("DELETE FROM interesados WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM publicaciones WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM enlaces WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM cuentas WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM empresas WHERE id = ?").bind(empresaId),
  ]);
  return !!r[r.length - 1].meta.changes;
}

/** Da de alta una red de la empresa (su Instagram, su TikTok…). */
export async function crearCuenta(
  db: D1Database,
  datos: { empresaId: string; red: Red; identificador: string },
  ahora = new Date(),
): Promise<{ id: string }> {
  const cuentaId = id();
  await db
    .prepare("INSERT INTO cuentas (id, empresa_id, red, identificador, creada_en) VALUES (?, ?, ?, ?, ?)")
    .bind(cuentaId, datos.empresaId, datos.red, datos.identificador.trim().toLowerCase(), ahora.toISOString())
    .run();
  return { id: cuentaId };
}

export async function borrarCuenta(db: D1Database, cuentaId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM cuentas WHERE id = ?").bind(cuentaId).run();
  return !!r.meta.changes;
}

/** Apunta algo en la bitácora, para ver qué pasó cuando algo falle. */
export async function apuntar(
  db: D1Database,
  canal: string,
  nivel: "info" | "error",
  mensaje: string,
  ahora = new Date(),
): Promise<void> {
  await db
    .prepare("INSERT INTO bitacora (cuando, canal, nivel, mensaje) VALUES (?, ?, ?, ?)")
    .bind(ahora.toISOString(), canal, nivel, mensaje.slice(0, 2000))
    .run();
}

/**
 * La bandeja del lado del servidor: leer y guardar pláticas y mensajes en la base.
 *
 * Las reglas de cada red (el plazo para contestar) viven en lib/redes.ts y se comparten con
 * la pantalla, para que el servidor y lo que ves digan lo mismo.
 */

import { REDES } from "../../lib/redes";
import type { Red } from "../../lib/tipos";

export interface MensajeGuardado {
  id: string;
  de: "yo" | "ellos";
  texto: string;
  fecha: string;
  entrega: "recibido" | "pendiente" | "entregado" | "falló";
  error: string | null;
}

export interface ConversacionGuardada {
  id: string;
  /** De qué empresa es la plática. */
  empresaId: string;
  empresa: string;
  /** Qué cuenta de esa empresa recibió el mensaje (@usuario, número o correo). */
  cuentaId: string;
  cuenta: string;
  red: Red;
  personaId: string;
  persona: string;
  usuario: string;
  ultimoEn: string;
  ultimoDeEllosEn: string | null;
  noLeida: boolean;
  archivadaEn: string | null;
  mensajes: MensajeGuardado[];
}

function id(): string {
  return crypto.randomUUID();
}

/**
 * Las pláticas con sus mensajes, de la más reciente a la más vieja.
 * Con `empresaId` trae sólo las de esa empresa.
 */
export async function conversacionesGuardadas(
  db: D1Database,
  opciones: { empresaId?: string | null; limite?: number } = {},
): Promise<ConversacionGuardada[]> {
  const limite = opciones.limite ?? 200;
  const filtro = opciones.empresaId ? "WHERE c.empresa_id = ?" : "";
  const valores: (string | number)[] = opciones.empresaId ? [opciones.empresaId, limite] : [limite];
  const { results: platicas } = await db
    .prepare(
      `SELECT c.id, c.empresa_id, e.nombre AS empresa, c.cuenta_id, k.identificador AS cuenta,
              c.red, c.persona_id, c.usuario_externo, c.ultimo_en, c.ultimo_de_ellos_en, c.leida_en, c.archivada_en, p.nombre
       FROM conversaciones c
       JOIN personas p ON p.id = c.persona_id
       JOIN empresas e ON e.id = c.empresa_id
       JOIN cuentas k ON k.id = c.cuenta_id
       ${filtro}
       ORDER BY c.ultimo_en DESC LIMIT ?`,
    )
    .bind(...valores)
    .all<{
      id: string;
      empresa_id: string;
      empresa: string;
      cuenta_id: string;
      cuenta: string;
      red: Red;
      persona_id: string;
      usuario_externo: string;
      ultimo_en: string;
      ultimo_de_ellos_en: string | null;
      leida_en: string | null;
      archivada_en: string | null;
      nombre: string;
    }>();
  if (!platicas.length) return [];

  const huecos = platicas.map(() => "?").join(",");
  const { results: mensajes } = await db
    .prepare(
      `SELECT id, conversacion_id, de, texto, fecha, entrega, error FROM mensajes
       WHERE conversacion_id IN (${huecos}) ORDER BY fecha`,
    )
    .bind(...platicas.map((p) => p.id))
    .all<MensajeGuardado & { conversacion_id: string }>();

  const porPlatica = new Map<string, MensajeGuardado[]>();
  for (const m of mensajes) {
    const lista = porPlatica.get(m.conversacion_id) ?? [];
    lista.push({ id: m.id, de: m.de, texto: m.texto, fecha: m.fecha, entrega: m.entrega, error: m.error });
    porPlatica.set(m.conversacion_id, lista);
  }

  return platicas.map((p) => ({
    id: p.id,
    empresaId: p.empresa_id,
    empresa: p.empresa,
    cuentaId: p.cuenta_id,
    cuenta: p.cuenta,
    red: p.red,
    personaId: p.persona_id,
    persona: p.nombre,
    usuario: p.usuario_externo,
    ultimoEn: p.ultimo_en,
    ultimoDeEllosEn: p.ultimo_de_ellos_en,
    // Nueva si llegó algo de ellos después de la última vez que la abriste.
    noLeida: !!p.ultimo_de_ellos_en && (!p.leida_en || p.leida_en < p.ultimo_de_ellos_en),
    archivadaEn: p.archivada_en,
    mensajes: porPlatica.get(p.id) ?? [],
  }));
}

/** Archiva una plática (o la saca del archivo). Devuelve false si ya no existe. */
export async function archivarPlatica(db: D1Database, platicaId: string, archivar: boolean, ahora = new Date()): Promise<boolean> {
  const r = await db
    .prepare("UPDATE conversaciones SET archivada_en = ? WHERE id = ?")
    .bind(archivar ? ahora.toISOString() : null, platicaId)
    .run();
  return !!r.meta.changes;
}

/** Borra de verdad las pláticas que llevan más de 7 días archivadas. Devuelve cuántas. */
export async function borrarArchivadasViejas(db: D1Database, ahora = new Date()): Promise<number> {
  const limite = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const viejas = "SELECT id FROM conversaciones WHERE archivada_en IS NOT NULL AND archivada_en < ?";
  const r = await db.batch([
    db.prepare(`DELETE FROM mensajes WHERE conversacion_id IN (${viejas})`).bind(limite),
    db.prepare("DELETE FROM conversaciones WHERE archivada_en IS NOT NULL AND archivada_en < ?").bind(limite),
  ]);
  // Los interesados que se quedaron sin ninguna plática ya no sirven.
  await db.prepare("DELETE FROM personas WHERE id NOT IN (SELECT persona_id FROM conversaciones)").run();
  return r[1].meta.changes ?? 0;
}

/** Busca la plática de ese interesado con esa cuenta de la empresa, o la crea junto con su ficha. */
export async function platicaDe(
  db: D1Database,
  datos: { cuentaId: string; usuarioExterno: string; nombre: string },
  ahora = new Date(),
): Promise<{ id: string; personaId: string; empresaId: string }> {
  const cuenta = await db
    .prepare("SELECT empresa_id, red FROM cuentas WHERE id = ?")
    .bind(datos.cuentaId)
    .first<{ empresa_id: string; red: Red }>();
  if (!cuenta) throw new Error("esa cuenta no está dada de alta");

  const existente = await db
    .prepare("SELECT id, persona_id FROM conversaciones WHERE cuenta_id = ? AND usuario_externo = ?")
    .bind(datos.cuentaId, datos.usuarioExterno)
    .first<{ id: string; persona_id: string }>();
  if (existente) return { id: existente.id, personaId: existente.persona_id, empresaId: cuenta.empresa_id };

  // Si en la misma empresa ya hay una ficha con ese nombre, se reusa: así quien escribe
  // por dos redes sigue siendo un solo interesado. Nunca se mezcla entre empresas.
  const ficha = await db
    .prepare("SELECT id FROM personas WHERE empresa_id = ? AND nombre = ?")
    .bind(cuenta.empresa_id, datos.nombre)
    .first<{ id: string }>();
  const personaId = ficha?.id ?? id();
  if (!ficha) {
    await db
      .prepare("INSERT INTO personas (id, empresa_id, nombre, etapa, creada_en) VALUES (?, ?, ?, 'nuevo', ?)")
      .bind(personaId, cuenta.empresa_id, datos.nombre, ahora.toISOString())
      .run();
  }
  const platicaId = id();
  await db
    .prepare(
      `INSERT INTO conversaciones (id, empresa_id, cuenta_id, red, persona_id, usuario_externo, ultimo_en, creada_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      platicaId,
      cuenta.empresa_id,
      datos.cuentaId,
      cuenta.red,
      personaId,
      datos.usuarioExterno,
      ahora.toISOString(),
      ahora.toISOString(),
    )
    .run();
  return { id: platicaId, personaId, empresaId: cuenta.empresa_id };
}

export interface Empresa {
  id: string;
  nombre: string;
  giro: string | null;
  cuentas: { id: string; red: Red; identificador: string; idMeta: string | null; tieneToken: boolean }[];
}

/** Las empresas que atiende el equipo, cada una con sus cuentas. */
export async function empresas(db: D1Database): Promise<Empresa[]> {
  const { results: filas } = await db
    .prepare("SELECT id, nombre, giro FROM empresas ORDER BY nombre")
    .all<{ id: string; nombre: string; giro: string | null }>();
  const { results: cuentas } = await db
    .prepare("SELECT id, empresa_id, red, identificador, id_meta, token IS NOT NULL AS con_token FROM cuentas ORDER BY red, identificador")
    .all<{ id: string; empresa_id: string; red: Red; identificador: string; id_meta: string | null; con_token: number }>();
  return filas.map((e) => ({
    ...e,
    cuentas: cuentas
      .filter((c) => c.empresa_id === e.id)
      .map((c) => ({ id: c.id, red: c.red, identificador: c.identificador, idMeta: c.id_meta, tieneToken: !!c.con_token })),
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

/** Cambia el nombre o el giro de una empresa. Devuelve false si no existe. */
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

/** Borra una empresa con todo lo suyo: cuentas, pláticas, mensajes e interesados. */
export async function borrarEmpresa(db: D1Database, empresaId: string): Promise<boolean> {
  // Se borra a mano en orden, por si la base no tiene prendido el borrado en cascada.
  const platicas = "SELECT id FROM conversaciones WHERE empresa_id = ?";
  const r = await db.batch([
    db.prepare(`DELETE FROM mensajes WHERE conversacion_id IN (${platicas})`).bind(empresaId),
    db.prepare("DELETE FROM conversaciones WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM personas WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM cuentas WHERE empresa_id = ?").bind(empresaId),
    db.prepare("DELETE FROM empresas WHERE id = ?").bind(empresaId),
  ]);
  return !!r[r.length - 1].meta.changes;
}

/** Quita una cuenta de una empresa, con sus pláticas. */
export async function borrarCuenta(db: D1Database, cuentaId: string): Promise<boolean> {
  const platicas = "SELECT id FROM conversaciones WHERE cuenta_id = ?";
  const r = await db.batch([
    db.prepare(`DELETE FROM mensajes WHERE conversacion_id IN (${platicas})`).bind(cuentaId),
    db.prepare("DELETE FROM conversaciones WHERE cuenta_id = ?").bind(cuentaId),
    db.prepare("DELETE FROM cuentas WHERE id = ?").bind(cuentaId),
  ]);
  // Los interesados que se quedaron sin ninguna plática ya no sirven.
  await db.prepare("DELETE FROM personas WHERE id NOT IN (SELECT persona_id FROM conversaciones)").run();
  return !!r[r.length - 1].meta.changes;
}

/** Da de alta un canal de una empresa (su Instagram, su correo…). */
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

/** Deja la cuenta de Meta de esa empresa lista: si ya existía la actualiza, si no la crea. */
export async function guardarCuentaMeta(
  db: D1Database,
  datos: { empresaId: string; red: "instagram" | "facebook"; identificador: string; idMeta: string; token: string },
  ahora = new Date(),
): Promise<void> {
  const existente = await db
    .prepare("SELECT id FROM cuentas WHERE red = ? AND (id_meta = ? OR identificador = ?)")
    .bind(datos.red, datos.idMeta, datos.identificador.trim().toLowerCase())
    .first<{ id: string }>();
  if (existente) {
    await db
      .prepare("UPDATE cuentas SET empresa_id = ?, id_meta = ?, token = ? WHERE id = ?")
      .bind(datos.empresaId, datos.idMeta, datos.token, existente.id)
      .run();
    return;
  }
  const { id: cuentaId } = await crearCuenta(db, { empresaId: datos.empresaId, red: datos.red, identificador: datos.identificador }, ahora);
  await guardarConexionMeta(db, { cuentaId, idMeta: datos.idMeta, token: datos.token });
}

/** Pega el número de la cuenta en Meta y su token. Con token vacío conserva el que ya había. */
export async function guardarConexionMeta(
  db: D1Database,
  datos: { cuentaId: string; idMeta: string; token: string },
): Promise<boolean> {
  const r = await db
    .prepare("UPDATE cuentas SET id_meta = ?, token = COALESCE(NULLIF(?, ''), token) WHERE id = ? AND red IN ('instagram', 'facebook')")
    .bind(datos.idMeta, datos.token, datos.cuentaId)
    .run();
  return !!r.meta.changes;
}

/** Guarda (o borra, con null) la contraseña de aplicación de un correo. Nunca sale del servidor. */
export async function guardarClaveCorreo(db: D1Database, cuentaId: string, clave: string | null): Promise<boolean> {
  const r = await db.prepare("UPDATE cuentas SET token = ? WHERE id = ? AND red = 'correo'").bind(clave, cuentaId).run();
  return !!r.meta.changes;
}

/** Los correos dados de alta desde la pantalla, con su contraseña de aplicación. */
export async function correosConClave(db: D1Database): Promise<{ id: string; usuario: string; clave: string }[]> {
  const { results } = await db
    .prepare("SELECT id, identificador, token FROM cuentas WHERE red = 'correo' AND token IS NOT NULL")
    .all<{ id: string; identificador: string; token: string }>();
  return results.map((c) => ({ id: c.id, usuario: c.identificador, clave: c.token }));
}

/** La cuenta que recibió un aviso de Meta, y su token para pedir el nombre de quien escribió. */
export async function cuentaDeMeta(
  db: D1Database,
  red: Red,
  idMeta: string,
): Promise<{ id: string; token: string | null } | null> {
  return db
    .prepare("SELECT id, token FROM cuentas WHERE red = ? AND id_meta = ?")
    .bind(red, idMeta)
    .first<{ id: string; token: string | null }>();
}

/** El token de una cuenta, para mandar una respuesta. */
export async function tokenDeCuenta(db: D1Database, cuentaId: string): Promise<string | null> {
  const fila = await db.prepare("SELECT token FROM cuentas WHERE id = ?").bind(cuentaId).first<{ token: string | null }>();
  return fila?.token ?? null;
}

/** Qué cuenta de qué empresa es esa dirección o @usuario en esa red. */
export async function cuentaPorIdentificador(
  db: D1Database,
  red: Red,
  identificador: string,
): Promise<{ id: string; empresaId: string } | null> {
  const fila = await db
    .prepare("SELECT id, empresa_id FROM cuentas WHERE red = ? AND identificador = ?")
    .bind(red, identificador.trim().toLowerCase())
    .first<{ id: string; empresa_id: string }>();
  return fila ? { id: fila.id, empresaId: fila.empresa_id } : null;
}

/**
 * Guarda un mensaje que llegó. Si ya estaba guardado (mismo id de la red) no hace nada:
 * los lectores de correo y los avisos de las redes a veces repiten el mismo mensaje.
 */
export async function guardarEntrante(
  db: D1Database,
  datos: { platicaId: string; texto: string; fecha: string; externoId: string },
  ahora = new Date(),
): Promise<boolean> {
  const resultado = await db
    .prepare(
      `INSERT OR IGNORE INTO mensajes (id, conversacion_id, de, texto, fecha, externo_id, entrega, creado_en)
       VALUES (?, ?, 'ellos', ?, ?, ?, 'recibido', ?)`,
    )
    .bind(id(), datos.platicaId, datos.texto, datos.fecha, datos.externoId, ahora.toISOString())
    .run();
  if (!resultado.meta.changes) return false;
  await db
    .prepare(
      `UPDATE conversaciones SET ultimo_en = MAX(ultimo_en, ?), ultimo_de_ellos_en = MAX(COALESCE(ultimo_de_ellos_en, ''), ?)
       WHERE id = ?`,
    )
    .bind(datos.fecha, datos.fecha, datos.platicaId)
    .run();
  return true;
}

/** Apunta tu respuesta como «pendiente»; el canal la manda y luego dice cómo le fue. */
export async function guardarSaliente(
  db: D1Database,
  datos: { platicaId: string; texto: string },
  ahora = new Date(),
): Promise<MensajeGuardado> {
  const mensajeId = id();
  const fecha = ahora.toISOString();
  await db
    .prepare(
      `INSERT INTO mensajes (id, conversacion_id, de, texto, fecha, entrega, creado_en)
       VALUES (?, ?, 'yo', ?, ?, 'pendiente', ?)`,
    )
    .bind(mensajeId, datos.platicaId, datos.texto, fecha, fecha)
    .run();
  await db
    .prepare("UPDATE conversaciones SET ultimo_en = ?, leida_en = ? WHERE id = ?")
    .bind(fecha, fecha, datos.platicaId)
    .run();
  return { id: mensajeId, de: "yo", texto: datos.texto, fecha, entrega: "pendiente", error: null };
}

export async function marcarEntrega(
  db: D1Database,
  mensajeId: string,
  entrega: "entregado" | "falló",
  error?: string,
): Promise<void> {
  await db
    .prepare("UPDATE mensajes SET entrega = ?, error = ? WHERE id = ?")
    .bind(entrega, error ?? null, mensajeId)
    .run();
}

export async function marcarLeida(db: D1Database, platicaId: string, ahora = new Date()): Promise<void> {
  await db.prepare("UPDATE conversaciones SET leida_en = ? WHERE id = ?").bind(ahora.toISOString(), platicaId).run();
}

/** ¿Todavía se puede contestar por esa red, según su plazo? */
export function dentroDelPlazo(c: { red: Red; ultimoDeEllosEn: string | null }, ahora = new Date()): boolean {
  const horas = REDES[c.red].plazoHoras;
  if (horas === null) return true;
  if (!c.ultimoDeEllosEn) return REDES[c.red].puedeIniciar;
  return new Date(c.ultimoDeEllosEn).getTime() + horas * 3600_000 > ahora.getTime();
}

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

export async function leerEstado(db: D1Database, clave: string): Promise<string | null> {
  const fila = await db.prepare("SELECT valor FROM estado_canal WHERE clave = ?").bind(clave).first<{ valor: string }>();
  return fila?.valor ?? null;
}

export async function guardarEstado(db: D1Database, clave: string, valor: string, ahora = new Date()): Promise<void> {
  await db
    .prepare(
      `INSERT INTO estado_canal (clave, valor, actualizado_en) VALUES (?, ?, ?)
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = excluded.actualizado_en`,
    )
    .bind(clave, valor, ahora.toISOString())
    .run();
}

/** Guarda el hilo de la red (en correo, el id del último mensaje) para poder contestar ahí mismo. */
export async function guardarHilo(db: D1Database, platicaId: string, hilo: string): Promise<void> {
  await db.prepare("UPDATE conversaciones SET hilo_externo = ? WHERE id = ?").bind(hilo, platicaId).run();
}

/** Los datos que hacen falta para contestar una plática. */
export async function platicaParaResponder(
  db: D1Database,
  platicaId: string,
): Promise<{
  id: string;
  red: Red;
  usuario: string;
  hilo: string | null;
  ultimoDeEllosEn: string | null;
  cuentaId: string;
  cuenta: string;
  empresa: string;
} | null> {
  const fila = await db
    .prepare(
      `SELECT c.id, c.red, c.usuario_externo, c.hilo_externo, c.ultimo_de_ellos_en, c.cuenta_id,
              k.identificador AS cuenta, e.nombre AS empresa
       FROM conversaciones c JOIN cuentas k ON k.id = c.cuenta_id JOIN empresas e ON e.id = c.empresa_id
       WHERE c.id = ?`,
    )
    .bind(platicaId)
    .first<{
      cuenta_id: string;
      cuenta: string;
      empresa: string;
      id: string;
      red: Red;
      usuario_externo: string;
      hilo_externo: string | null;
      ultimo_de_ellos_en: string | null;
    }>();
  if (!fila) return null;
  return {
    id: fila.id,
    red: fila.red,
    usuario: fila.usuario_externo,
    hilo: fila.hilo_externo,
    ultimoDeEllosEn: fila.ultimo_de_ellos_en,
    cuentaId: fila.cuenta_id,
    cuenta: fila.cuenta,
    empresa: fila.empresa,
  };
}

/**
 * Quién entra y quién no.
 *
 * Las contraseñas nunca se guardan tal cual: se guarda su huella (PBKDF2 con 210,000 vueltas,
 * que es lo que recomienda OWASP para SHA-256). La galleta de sesión lleva un token al azar y en
 * la base sólo queda su huella, así que ni leyendo la base se puede entrar como otro.
 */

const VUELTAS = 210_000;
export const DURACION_SESION_DIAS = 30;
export const GALLETA = "nexora_sesion";

const codificador = new TextEncoder();

function aHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function alAzar(bytes = 32): string {
  return aHex(crypto.getRandomValues(new Uint8Array(bytes)).buffer);
}

/** Huella de una contraseña, con su sal. */
export async function huellaDeContrasena(contrasena: string, sal: string): Promise<string> {
  const material = await crypto.subtle.importKey("raw", codificador.encode(contrasena), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: codificador.encode(sal), iterations: VUELTAS, hash: "SHA-256" },
    material,
    256,
  );
  return aHex(bits);
}

/** Huella del token de sesión (SHA-256 basta: el token ya es al azar y largo). */
export async function huellaDeToken(token: string): Promise<string> {
  return aHex(await crypto.subtle.digest("SHA-256", codificador.encode(token)));
}

/** Compara sin delatar en cuánto se parecen (tiempo constante). */
export function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let distintos = 0;
  for (let i = 0; i < a.length; i++) distintos |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return distintos === 0;
}

export interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  papel: "dueño" | "invitado";
}

interface FilaUsuario extends Usuario {
  huella: string;
  sal: string;
}

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

/** Revisa correo y contraseña. Devuelve el usuario o null, sin decir cuál de los dos falló. */
export async function revisarContrasena(db: D1Database, correo: string, contrasena: string): Promise<Usuario | null> {
  const fila = await db
    .prepare("SELECT id, correo, nombre, papel, huella, sal FROM usuarios WHERE correo = ?")
    .bind(normalizarCorreo(correo))
    .first<FilaUsuario>();
  // Aunque no exista el usuario se calcula una huella, para que no se note por el tiempo de respuesta.
  const sal = fila?.sal ?? "sal-que-no-existe";
  const esperada = fila?.huella ?? "0".repeat(64);
  const calculada = await huellaDeContrasena(contrasena, sal);
  if (!fila || !igualesSeguro(calculada, esperada)) return null;
  return { id: fila.id, correo: fila.correo, nombre: fila.nombre, papel: fila.papel };
}

export async function crearUsuario(
  db: D1Database,
  datos: { correo: string; nombre: string; contrasena: string; papel: Usuario["papel"] },
  ahora = new Date(),
): Promise<Usuario> {
  const sal = alAzar(16);
  const huella = await huellaDeContrasena(datos.contrasena, sal);
  const id = alAzar(12);
  await db
    .prepare("INSERT INTO usuarios (id, correo, nombre, huella, sal, papel, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, normalizarCorreo(datos.correo), datos.nombre, huella, sal, datos.papel, ahora.toISOString())
    .run();
  return { id, correo: normalizarCorreo(datos.correo), nombre: datos.nombre, papel: datos.papel };
}

export async function abrirSesion(db: D1Database, usuarioId: string, ahora = new Date()): Promise<string> {
  const token = alAzar(32);
  const expira = new Date(ahora.getTime() + DURACION_SESION_DIAS * 24 * 60 * 60 * 1000);
  await db
    .prepare("INSERT INTO sesiones (huella, usuario_id, creada_en, expira_en) VALUES (?, ?, ?, ?)")
    .bind(await huellaDeToken(token), usuarioId, ahora.toISOString(), expira.toISOString())
    .run();
  return token;
}

export async function usuarioDeLaSesion(db: D1Database, token: string | null, ahora = new Date()): Promise<Usuario | null> {
  if (!token) return null;
  const fila = await db
    .prepare(
      `SELECT u.id, u.correo, u.nombre, u.papel, s.expira_en
       FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.huella = ?`,
    )
    .bind(await huellaDeToken(token))
    .first<Usuario & { expira_en: string }>();
  if (!fila) return null;
  if (new Date(fila.expira_en) <= ahora) {
    await cerrarSesion(db, token);
    return null;
  }
  return { id: fila.id, correo: fila.correo, nombre: fila.nombre, papel: fila.papel };
}

export async function cerrarSesion(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM sesiones WHERE huella = ?").bind(await huellaDeToken(token)).run();
}

/** Borra las sesiones ya vencidas (lo corre el reloj del servidor). */
export async function limpiarSesiones(db: D1Database, ahora = new Date()): Promise<void> {
  await db.prepare("DELETE FROM sesiones WHERE expira_en <= ?").bind(ahora.toISOString()).run();
}

export function leerGalleta(peticion: Request, nombre: string): string | null {
  const crudas = peticion.headers.get("Cookie");
  if (!crudas) return null;
  for (const parte of crudas.split(";")) {
    const [clave, ...resto] = parte.trim().split("=");
    if (clave === nombre) return decodeURIComponent(resto.join("="));
  }
  return null;
}

export function galletaDeSesion(token: string, segundos = DURACION_SESION_DIAS * 24 * 60 * 60): string {
  // HttpOnly: que no la pueda leer ningún programa de la página. SameSite=Lax: que no sirva desde otro sitio.
  return `${GALLETA}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${segundos}`;
}

export function galletaBorrada(): string {
  return `${GALLETA}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

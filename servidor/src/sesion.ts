/**
 * Quién entra y quién no.
 *
 * Las contraseñas nunca se guardan tal cual: se guarda su huella (PBKDF2 con SHA-256). La galleta
 * de sesión lleva un token al azar y en la base sólo queda su huella, así que ni leyendo la base
 * se puede entrar como otro.
 *
 * Sobre las vueltas: el plan gratis de Cloudflare da 10 ms de cálculo por petición, y 210,000
 * vueltas (lo que pide OWASP) tardan unos 30 ms, así que la petición se corta. Se usan 40,000
 * (unos 6 ms) y, para compensar, se frenan los intentos fallidos (ver `demasiadosIntentos`).
 * Cada huella guarda cuántas vueltas usó («pbkdf2$40000$…»): si algún día se paga el plan, se
 * suben las vueltas y las huellas viejas siguen sirviendo.
 */

const VUELTAS = 40_000;
/** Las huellas sin prefijo son de antes y usaban esto. */
const VUELTAS_VIEJAS = 210_000;
export const DURACION_SESION_DIAS = 30;
export const GALLETA = "nexora_sesion";

const codificador = new TextEncoder();

function aHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function alAzar(bytes = 32): string {
  return aHex(crypto.getRandomValues(new Uint8Array(bytes)).buffer);
}

async function pbkdf2(contrasena: string, sal: string, vueltas: number): Promise<string> {
  const material = await crypto.subtle.importKey("raw", codificador.encode(contrasena), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: codificador.encode(sal), iterations: vueltas, hash: "SHA-256" },
    material,
    256,
  );
  return aHex(bits);
}

/** Huella de una contraseña, con su sal. Lleva adelante cuántas vueltas usó. */
export async function huellaDeContrasena(contrasena: string, sal: string, vueltas = VUELTAS): Promise<string> {
  return `pbkdf2$${vueltas}$${await pbkdf2(contrasena, sal, vueltas)}`;
}

/** ¿Esa contraseña corresponde a esa huella guardada? */
export async function contrasenaCoincide(contrasena: string, sal: string, guardada: string): Promise<boolean> {
  const partes = /^pbkdf2\$(\d+)\$([0-9a-f]+)$/.exec(guardada);
  const vueltas = partes ? Number(partes[1]) : VUELTAS_VIEJAS;
  const esperada = partes ? partes[2] : guardada;
  return igualesSeguro(await pbkdf2(contrasena, sal, vueltas), esperada);
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
  const guardada = fila?.huella ?? `pbkdf2$${VUELTAS}$${"0".repeat(64)}`;
  const coincide = await contrasenaCoincide(contrasena, sal, guardada);
  if (!fila || !coincide) return null;
  return { id: fila.id, correo: fila.correo, nombre: fila.nombre, papel: fila.papel };
}

/**
 * Freno contra quien intenta adivinar contraseñas: con 10 intentos fallidos en 15 minutos
 * (de quien sea) se deja de revisar un rato. Es una herramienta de pocas personas, así que
 * un freno general basta y no hace falta guardar direcciones de nadie.
 */
export async function demasiadosIntentos(db: D1Database, ahora = new Date()): Promise<boolean> {
  const desde = new Date(ahora.getTime() - 15 * 60 * 1000).toISOString();
  const fila = await db
    .prepare("SELECT COUNT(*) AS n FROM bitacora WHERE canal = 'sesion' AND mensaje = 'intento de entrada fallido' AND cuando > ?")
    .bind(desde)
    .first<{ n: number }>();
  return (fila?.n ?? 0) >= 10;
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

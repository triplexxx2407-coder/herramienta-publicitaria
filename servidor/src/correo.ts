/**
 * El canal de correo: lee lo que llega (IMAP) y manda lo que contestas (SMTP).
 *
 * Va directo contra el servidor de Gmail, hablando su idioma por un cable seguro.
 * No usa ningún servicio de envío de terceros: sale de tu propio buzón, como si lo
 * escribieras tú. La contraseña que usa es una «contraseña de aplicación» de Google,
 * nunca la de tu cuenta, y vive sólo en las variables del servidor.
 *
 * Importante: estos cables sólo se pueden abrir dentro de un manejador (fetch, scheduled),
 * nunca al cargar el archivo.
 */

import { connect } from "cloudflare:sockets";
import { deBase64, deCitaImprimible, encabezado, textoPlano } from "./mime";

export interface CuentaCorreo {
  usuario: string;
  /** Contraseña de aplicación de Google (16 letras), no la del correo. */
  contrasena: string;
  servidorEntrada?: string;
  servidorSalida?: string;
}

export interface CorreoRecibido {
  /** El id que le da Gmail; sirve para no guardar dos veces el mismo. */
  uid: string;
  de: string;
  nombre: string;
  asunto: string;
  fecha: string;
  texto: string;
  idMensaje: string | null;
}

const CORTE = "\r\n";

/** Lee de un cable respetando los «bultos» ({123}) que manda IMAP. */
class Lector {
  private pendiente = new Uint8Array(0);
  private cerrado = false;

  constructor(private flujo: ReadableStreamDefaultReader<Uint8Array>) {}

  private async traerMas(): Promise<boolean> {
    if (this.cerrado) return false;
    const { value, done } = await this.flujo.read();
    if (done || !value) {
      this.cerrado = true;
      return false;
    }
    const junto = new Uint8Array(this.pendiente.length + value.length);
    junto.set(this.pendiente, 0);
    junto.set(value, this.pendiente.length);
    this.pendiente = junto;
    return true;
  }

  /** Una línea, sin el salto del final. */
  async linea(): Promise<string> {
    for (;;) {
      for (let i = 0; i < this.pendiente.length - 1; i++) {
        if (this.pendiente[i] === 13 && this.pendiente[i + 1] === 10) {
          const linea = new TextDecoder().decode(this.pendiente.subarray(0, i));
          this.pendiente = this.pendiente.subarray(i + 2);
          return linea;
        }
      }
      if (!(await this.traerMas())) {
        const resto = new TextDecoder().decode(this.pendiente);
        this.pendiente = new Uint8Array(0);
        if (!resto) throw new Error("el servidor de correo cerró la conexión");
        return resto;
      }
    }
  }

  /** Exactamente esos bytes (un «bulto» de IMAP). */
  async bulto(cuantos: number): Promise<string> {
    while (this.pendiente.length < cuantos) {
      if (!(await this.traerMas())) throw new Error("el correo llegó cortado");
    }
    const trozo = new TextDecoder().decode(this.pendiente.subarray(0, cuantos));
    this.pendiente = this.pendiente.subarray(cuantos);
    return trozo;
  }
}

/** Una plática con el servidor de correo: le escribes una orden y lees su respuesta. */
class Charla {
  private contador = 0;
  readonly lector: Lector;
  private escritor: WritableStreamDefaultWriter<Uint8Array>;

  constructor(
    private cable: Socket,
    lector: Lector,
  ) {
    this.lector = lector;
    this.escritor = cable.writable.getWriter();
  }

  async escribir(texto: string): Promise<void> {
    await this.escritor.write(new TextEncoder().encode(texto));
  }

  siguienteEtiqueta(): string {
    this.contador += 1;
    return `n${this.contador}`;
  }

  /**
   * Manda una orden de IMAP y junta todo lo que contesta hasta su respuesta final.
   * Los «bultos» se leen por su tamaño, así que un correo con texto raro no la confunde.
   */
  async orden(orden: string): Promise<string[]> {
    const etiqueta = this.siguienteEtiqueta();
    await this.escribir(`${etiqueta} ${orden}${CORTE}`);
    const lineas: string[] = [];
    for (;;) {
      let linea = await this.lector.linea();
      const bulto = /\{(\d+)\}$/.exec(linea);
      if (bulto) {
        const contenido = await this.lector.bulto(Number(bulto[1]));
        linea = linea.slice(0, bulto.index) + contenido + (await this.lector.linea());
      }
      lineas.push(linea);
      if (linea.startsWith(`${etiqueta} `)) {
        if (!/^\S+ OK/.test(linea)) {
          // Nunca repetimos la orden completa: podría llevar la contraseña.
          throw new Error(`el correo no aceptó la orden (${orden.split(" ")[0]})`);
        }
        return lineas;
      }
    }
  }

  cerrar(): void {
    try {
      this.escritor.releaseLock();
    } catch {
      /* ya estaba suelto */
    }
    void this.cable.close().catch(() => {});
  }
}

function entreComillas(valor: string): string {
  return `"${valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Trae los correos nuevos: los que llegaron después del último que ya guardamos.
 * `desdeUid` es la memoria; si viene vacía trae nada más los últimos pocos, para no
 * volcar años de bandeja la primera vez.
 */
export async function leerCorreosNuevos(
  cuenta: CuentaCorreo,
  desdeUid: string | null,
  cuantosLaPrimeraVez = 10,
): Promise<{ correos: CorreoRecibido[]; ultimoUid: string | null }> {
  const cable = connect(
    { hostname: cuenta.servidorEntrada ?? "imap.gmail.com", port: 993 },
    { secureTransport: "on", allowHalfOpen: false },
  );
  const lector = new Lector(cable.readable.getReader());
  const charla = new Charla(cable, lector);
  try {
    await lector.linea(); // el saludo del servidor
    await charla.orden(`LOGIN ${entreComillas(cuenta.usuario)} ${entreComillas(cuenta.contrasena)}`);
    await charla.orden("SELECT INBOX");

    let uids: number[] = [];
    if (desdeUid) {
      const busqueda = await charla.orden(`UID SEARCH UID ${Number(desdeUid) + 1}:*`);
      uids = numerosDeLaBusqueda(busqueda).filter((u) => u > Number(desdeUid));
    } else {
      const busqueda = await charla.orden("UID SEARCH ALL");
      uids = numerosDeLaBusqueda(busqueda).slice(-cuantosLaPrimeraVez);
    }
    if (!uids.length) return { correos: [], ultimoUid: desdeUid };

    const correos: CorreoRecibido[] = [];
    for (const uid of uids) {
      const cabeza = unirBultos(
        await charla.orden(`UID FETCH ${uid} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID CONTENT-TYPE CONTENT-TRANSFER-ENCODING)])`),
      );
      const cuerpo = unirBultos(await charla.orden(`UID FETCH ${uid} (BODY.PEEK[TEXT])`));
      const quien = partirRemitente(encabezado(cabeza, "From") ?? "");
      correos.push({
        uid: String(uid),
        de: quien.correo,
        nombre: quien.nombre,
        asunto: limpiarEncabezado(encabezado(cabeza, "Subject") ?? "(sin asunto)"),
        fecha: aFechaIso(encabezado(cabeza, "Date")),
        texto: textoPlano(cuerpo, cabeza),
        idMensaje: encabezado(cabeza, "Message-ID"),
      });
    }
    return { correos, ultimoUid: String(Math.max(...uids)) };
  } finally {
    charla.cerrar();
  }
}

function numerosDeLaBusqueda(lineas: string[]): number[] {
  for (const linea of lineas) {
    if (linea.startsWith("* SEARCH")) {
      return linea
        .slice("* SEARCH".length)
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b);
    }
  }
  return [];
}

/** Se queda con el contenido de los bultos y tira el envoltorio de IMAP. */
function unirBultos(lineas: string[]): string {
  const utiles = lineas.filter((l) => l.startsWith("*"));
  const texto = utiles.join("\n");
  const abre = texto.indexOf("]");
  return abre === -1 ? texto : texto.slice(abre + 1).replace(/^\s*/, "").replace(/\)\s*$/, "");
}

/** «Juan Pérez <juan@ejemplo.com>» se parte en nombre y correo. */
export function partirRemitente(crudo: string): { nombre: string; correo: string } {
  const conPicos = /^(.*)<([^>]+)>\s*$/.exec(crudo.trim());
  if (conPicos) {
    const nombre = limpiarEncabezado(conPicos[1].trim().replace(/^"|"$/g, ""));
    const correo = conPicos[2].trim().toLowerCase();
    return { nombre: nombre || correo, correo };
  }
  const correo = crudo.trim().toLowerCase();
  return { nombre: correo, correo };
}

/** Los acentos viajan codificados (=?UTF-8?B?...?=); aquí se vuelven legibles. */
export function limpiarEncabezado(valor: string): string {
  return valor.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (todo, _juego, modo, datos) => {
    try {
      if (modo.toLowerCase() === "b") return deBase64(datos);
      return deCitaImprimible(datos.replace(/_/g, " "));
    } catch {
      return todo;
    }
  });
}

function aFechaIso(valor: string | null): string {
  const fecha = valor ? new Date(valor) : new Date();
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
}

/** Manda tu respuesta por tu propio buzón, en el mismo hilo del correo que te escribieron. */
export async function mandarCorreo(
  cuenta: CuentaCorreo,
  datos: { para: string; asunto: string; texto: string; enRespuestaA?: string | null; deNombre?: string },
): Promise<void> {
  const cable = connect(
    { hostname: cuenta.servidorSalida ?? "smtp.gmail.com", port: 465 },
    { secureTransport: "on", allowHalfOpen: false },
  );
  const lector = new Lector(cable.readable.getReader());
  const escritor = cable.writable.getWriter();
  const decir = async (linea: string, esperado = "2") => {
    await escritor.write(new TextEncoder().encode(`${linea}${CORTE}`));
    const respuesta = await respuestaSmtp(lector);
    if (!respuesta.startsWith(esperado)) {
      throw new Error(`el correo no aceptó el paso ${linea.split(" ")[0]}: ${respuesta.slice(0, 80)}`);
    }
  };
  try {
    await respuestaSmtp(lector); // el saludo
    await decir("EHLO nexora");
    await decir("AUTH LOGIN", "3");
    await decir(aBase64(cuenta.usuario), "3");
    await decir(aBase64(cuenta.contrasena), "2");
    await decir(`MAIL FROM:<${cuenta.usuario}>`);
    await decir(`RCPT TO:<${datos.para}>`);
    await decir("DATA", "3");
    const cuerpo = armarMensaje(cuenta, datos);
    await escritor.write(new TextEncoder().encode(`${cuerpo}${CORTE}.${CORTE}`));
    const guardado = await respuestaSmtp(lector);
    if (!guardado.startsWith("2")) throw new Error(`el correo no se pudo mandar: ${guardado.slice(0, 80)}`);
    await escritor.write(new TextEncoder().encode(`QUIT${CORTE}`));
  } finally {
    try {
      escritor.releaseLock();
    } catch {
      /* ya estaba suelto */
    }
    void cable.close().catch(() => {});
  }
}

async function respuestaSmtp(lector: Lector): Promise<string> {
  // Puede contestar en varias líneas: «250-...» sigue, «250 ...» termina.
  let ultima = await lector.linea();
  while (/^\d{3}-/.test(ultima)) ultima = await lector.linea();
  return ultima;
}

function aBase64(texto: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(texto)));
}

function armarMensaje(
  cuenta: CuentaCorreo,
  datos: { para: string; asunto: string; texto: string; enRespuestaA?: string | null; deNombre?: string },
): string {
  const de = datos.deNombre
    ? `=?UTF-8?B?${aBase64(datos.deNombre)}?= <${cuenta.usuario}>`
    : cuenta.usuario;
  const lineas = [
    `From: ${de}`,
    `To: ${datos.para}`,
    `Subject: =?UTF-8?B?${aBase64(datos.asunto)}?=`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (datos.enRespuestaA) {
    lineas.push(`In-Reply-To: ${datos.enRespuestaA}`, `References: ${datos.enRespuestaA}`);
  }
  // En base64 y cortado en renglones: así ningún punto solo al principio de línea
  // corta el mensaje a medias.
  const texto = aBase64(datos.texto).replace(/(.{76})/g, "$1\r\n");
  return `${lineas.join(CORTE)}${CORTE}${CORTE}${texto}`;
}

export { textoPlano };

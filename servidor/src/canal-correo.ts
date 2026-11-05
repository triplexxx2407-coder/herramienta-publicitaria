/**
 * El puente entre el buzón de correo y la bandeja de Nexora.
 *
 * Está aparte a propósito: si algún día el correo se lee de otra manera, se cambia
 * nada más este archivo y la bandeja ni se enterar.
 */

import {
  apuntar,
  correosConClave,
  cuentaPorIdentificador,
  guardarEntrante,
  guardarHilo,
  guardarEstado,
  leerEstado,
  marcarEntrega,
  platicaDe,
  platicaParaResponder,
} from "./bandeja";
import { leerCorreosNuevos, mandarCorreo, type CuentaCorreo } from "./correo";
import { PREFIJO, accesoNuevo, type ClaveGoogle } from "./google";

const MEMORIA = "correo:ultimo_uid";

export class CorreoSinEmpresa extends Error {
  constructor(correo: string) {
    super(`el correo ${correo} no está dado de alta en ninguna empresa`);
  }
}

/**
 * Revisa el buzón y guarda en la bandeja lo que llegó nuevo. Devuelve cuántos entraron.
 * El buzón tiene que estar dado de alta como cuenta de una empresa: así cada mensaje
 * sabe de qué empresa es y qué cuenta lo recibió.
 */
export async function revisarCorreo(db: D1Database, cuenta: CuentaCorreo): Promise<number> {
  const deEmpresa = await cuentaPorIdentificador(db, "correo", cuenta.usuario);
  if (!deEmpresa) {
    await apuntar(db, "correo", "error", `el buzón ${cuenta.usuario} no está ligado a ninguna empresa`);
    throw new CorreoSinEmpresa(cuenta.usuario);
  }
  const memoria = `${MEMORIA}:${deEmpresa.id}`;
  const desde = await leerEstado(db, memoria);
  let resultado;
  try {
    resultado = await leerCorreosNuevos(cuenta, desde);
  } catch (falla) {
    await apuntar(db, "correo", "error", `no se pudo leer el buzón: ${(falla as Error).message}`);
    throw falla;
  }

  let guardados = 0;
  for (const correo of resultado.correos) {
    // Lo que te mandas a ti mismo no es un prospecto.
    if (correo.de === cuenta.usuario.toLowerCase()) continue;
    const platica = await platicaDe(db, {
      cuentaId: deEmpresa.id,
      usuarioExterno: correo.de,
      nombre: correo.nombre || correo.de,
    });
    const texto = correo.asunto ? `${correo.asunto}\n\n${correo.texto}` : correo.texto;
    const nuevo = await guardarEntrante(db, {
      platicaId: platica.id,
      texto,
      fecha: correo.fecha,
      externoId: correo.idMensaje ?? `uid:${correo.uid}`,
    });
    if (nuevo) {
      guardados += 1;
      if (correo.idMensaje) await guardarHilo(db, platica.id, correo.idMensaje);
    }
  }

  if (resultado.ultimoUid && resultado.ultimoUid !== desde) {
    await guardarEstado(db, memoria, resultado.ultimoUid);
  }
  if (guardados) await apuntar(db, "correo", "info", `entraron ${guardados} mensajes nuevos`);
  return guardados;
}

/**
 * Arma lo que hace falta para entrar a un buzón: si se conectó con Google, pide un permiso de uso corto;
 * si se pegó una contraseña de aplicación, usa esa.
 */
export async function credencialDeCorreo(usuario: string, clave: string, google: ClaveGoogle | null): Promise<CuentaCorreo> {
  if (!clave.startsWith(PREFIJO)) return { usuario, contrasena: clave };
  if (!google) throw new Error("falta GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el servidor");
  return { usuario, contrasena: "", accessToken: await accesoNuevo(google, clave) };
}

/**
 * Revisa todos los buzones: los que se dieron de alta desde la pantalla (cada uno con su propia
 * contraseña de aplicación) y, si existe, el que viene en los secretos del servidor.
 * Un buzón que falla no detiene a los demás.
 */
export async function revisarTodosLosCorreos(
  db: D1Database,
  deSecretos: CuentaCorreo | null,
  google: ClaveGoogle | null = null,
): Promise<{ nuevos: number; errores: string[] }> {
  const guardadas = await correosConClave(db);
  const pendientes = guardadas.map((c) => ({ usuario: c.usuario, clave: c.clave }));
  if (deSecretos && !pendientes.some((c) => c.usuario === deSecretos.usuario)) {
    pendientes.push({ usuario: deSecretos.usuario, clave: deSecretos.contrasena });
  }
  let nuevos = 0;
  const errores: string[] = [];
  for (const p of pendientes) {
    try {
      nuevos += await revisarCorreo(db, await credencialDeCorreo(p.usuario, p.clave, google));
    } catch (falla) {
      // Los fallos de lectura ya quedaron apuntados en la bitácora.
      errores.push(`${p.usuario}: ${(falla as Error).message}`);
    }
  }
  return { nuevos, errores };
}

/** Manda por correo una respuesta que ya quedó apuntada como pendiente. */
export async function entregarPorCorreo(
  db: D1Database,
  cuenta: CuentaCorreo,
  datos: { platicaId: string; mensajeId: string; texto: string; deNombre?: string },
): Promise<{ entregado: boolean; error?: string }> {
  const platica = await platicaParaResponder(db, datos.platicaId);
  if (!platica) return { entregado: false, error: "esa plática ya no existe" };
  try {
    await mandarCorreo(cuenta, {
      para: platica.usuario,
      asunto: "Re: tu mensaje",
      texto: datos.texto,
      enRespuestaA: platica.hilo,
      deNombre: datos.deNombre,
    });
    await marcarEntrega(db, datos.mensajeId, "entregado");
    return { entregado: true };
  } catch (falla) {
    const error = (falla as Error).message;
    await marcarEntrega(db, datos.mensajeId, "falló", error);
    await apuntar(db, "correo", "error", `no se pudo mandar: ${error}`);
    return { entregado: false, error };
  }
}

"use client";

/**
 * De dónde salen las pláticas: del servidor de verdad o de los ejemplos.
 *
 * Al abrir la página se pregunta al servidor (/api/salud). Si contesta, NEXORA trabaja
 * «de verdad»: pide entrar con usuario y contraseña y trae las pláticas guardadas.
 * Si no contesta (el archivo suelto o la vista de claude.ai), se queda con los ejemplos.
 */

import { useSyncExternalStore } from "react";
import type { Conversacion } from "@/lib/bandeja";
import type { EmpresaCliente, MensajeRed, Red } from "@/lib/tipos";

export type Modo = "revisando" | "ejemplo" | "entrar" | "real";

export interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  papel: "dueño" | "invitado";
}

interface Fuente {
  modo: Modo;
  usuario: Usuario | null;
  empresas: EmpresaCliente[];
  conversaciones: Conversacion[];
  /** Algo que salió mal y hay que decirle a la persona. */
  aviso: string | null;
}

let fuente: Fuente = { modo: "revisando", usuario: null, empresas: [], conversaciones: [], aviso: null };
const FUENTE_SERVIDOR: Fuente = fuente;
const oyentes = new Set<() => void>();
let iniciada = false;
let reloj: ReturnType<typeof setInterval> | null = null;

function cambiar(parte: Partial<Fuente>) {
  fuente = { ...fuente, ...parte };
  for (const o of oyentes) o();
}

export function useFuente(): Fuente {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => {
        oyentes.delete(o);
      };
    },
    () => fuente,
    () => FUENTE_SERVIDOR,
  );
}

async function pedir<T>(ruta: string, cuerpo?: unknown): Promise<{ estado: number; datos: T | null }> {
  const respuesta = await fetch(ruta, {
    method: cuerpo === undefined ? "GET" : "POST",
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    credentials: "same-origin",
    cache: "no-store",
  });
  const tipo = respuesta.headers.get("Content-Type") ?? "";
  const datos = tipo.includes("application/json") ? ((await respuesta.json()) as T) : null;
  return { estado: respuesta.status, datos };
}

/** Pregunta si hay servidor. Se llama una sola vez al abrir. */
export async function iniciarFuente(): Promise<void> {
  if (iniciada) return;
  iniciada = true;
  try {
    if (!/^https?:$/.test(window.location.protocol)) throw new Error("archivo suelto");
    const salud = await pedir<{ bien: boolean }>("/api/salud");
    if (!salud.datos?.bien) throw new Error("sin servidor");
  } catch {
    cambiar({ modo: "ejemplo" });
    return;
  }
  const yo = await pedir<{ usuario: Usuario }>("/api/yo");
  if (yo.estado !== 200 || !yo.datos) {
    cambiar({ modo: "entrar" });
    return;
  }
  cambiar({ usuario: yo.datos.usuario });
  await cargar();
  vigilar();
}

let revisando = false;

/**
 * Cada 10 segundos, con la pantalla a la vista, le pide al servidor que mire el buzón de correo
 * y luego trae lo nuevo. Así lo que te escriben aparece casi al instante; el reloj del servidor
 * (cada minuto) cubre cuando nadie tiene Nexora abierta.
 */
function vigilar() {
  if (reloj) clearInterval(reloj);
  reloj = setInterval(() => {
    if (document.visibilityState !== "visible" || revisando) return;
    revisando = true;
    void (async () => {
      try {
        await cargar();
      } catch {
        /* se vuelve a intentar en 10 segundos */
      } finally {
        revisando = false;
      }
    })();
  }, 10_000);
}

interface ConversacionDelServidor {
  id: string;
  empresaId: string;
  empresa: string;
  cuentaId: string;
  cuenta: string;
  red: Red;
  personaId: string;
  persona: string;
  usuario: string;
  noLeida: boolean;
  archivadaEn: string | null;
  mensajes: (MensajeRed & { entrega: MensajeRed["entrega"]; error: string | null })[];
}

interface EmpresaDelServidor {
  id: string;
  nombre: string;
  giro: string | null;
  cuentas: EmpresaCliente["cuentas"];
}

export async function cargar(): Promise<void> {
  try {
    const [bandeja, empresas] = await Promise.all([
      pedir<{ conversaciones: ConversacionDelServidor[] }>("/api/bandeja"),
      pedir<{ empresas: EmpresaDelServidor[] }>("/api/empresas"),
    ]);
    if (bandeja.estado === 401 || empresas.estado === 401) {
      cambiar({ modo: "entrar", usuario: null, conversaciones: [], empresas: [] });
      return;
    }
    if (!bandeja.datos || !empresas.datos) throw new Error("respuesta rara");
    cambiar({
      modo: "real",
      aviso: null,
      empresas: empresas.datos.empresas.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        giro: e.giro ?? "Empresa",
        producto: "",
        cuentas: e.cuentas,
      })),
      conversaciones: bandeja.datos.conversaciones
        .filter((c) => c.mensajes.length)
        .map((c) => {
          const mensajes = c.mensajes.map((m) => ({
            id: m.id,
            de: m.de,
            texto: m.texto,
            fecha: m.fecha,
            entrega: m.entrega,
            error: m.error,
          }));
          const deEllos = mensajes.filter((m) => m.de === "ellos");
          return {
            id: c.id,
            empresaId: c.empresaId,
            empresa: c.empresa,
            cuentaId: c.cuentaId,
            cuenta: c.cuenta,
            red: c.red,
            personaId: c.personaId,
            persona: c.persona,
            usuario: c.usuario,
            mensajes,
            ultimo: mensajes[mensajes.length - 1],
            ultimoDeEllos: deEllos[deEllos.length - 1] ?? null,
            noLeida: c.noLeida,
            archivadaEn: c.archivadaEn,
          };
        }),
    });
  } catch {
    cambiar({ aviso: "No se pudo hablar con el servidor. Reviso otra vez en unos segundos." });
  }
}

export async function entrar(correo: string, contrasena: string): Promise<string | null> {
  try {
    const r = await pedir<{ usuario?: Usuario; error?: string }>("/api/entrar", { correo, contrasena });
    if (r.estado !== 200 || !r.datos?.usuario) return r.datos?.error ?? "No se pudo entrar.";
    cambiar({ usuario: r.datos.usuario });
    await cargar();
    vigilar();
    return null;
  } catch {
    return "No se pudo hablar con el servidor.";
  }
}

export async function salir(): Promise<void> {
  try {
    await pedir("/api/salir", {});
  } finally {
    if (reloj) clearInterval(reloj);
    cambiar({ modo: "entrar", usuario: null, conversaciones: [], empresas: [] });
  }
}

/** Manda tu respuesta. Devuelve el aviso si algo salió mal. */
export async function responderDeVerdad(platicaId: string, texto: string): Promise<string | null> {
  try {
    const r = await pedir<{ error?: string; aviso?: string }>("/api/responder", { platicaId, texto });
    await cargar();
    if (r.estado !== 200) return r.datos?.error ?? "No se pudo mandar.";
    return r.datos?.aviso ?? null;
  } catch {
    return "No se pudo hablar con el servidor.";
  }
}

export async function marcarLeidaDeVerdad(platicaId: string): Promise<void> {
  // Se marca aquí de una vez, para que el punto azul se quite sin esperar.
  cambiar({ conversaciones: fuente.conversaciones.map((c) => (c.id === platicaId ? { ...c, noLeida: false } : c)) });
  try {
    await pedir("/api/leida", { platicaId });
  } catch {
    /* la próxima carga lo corrige */
  }
}

/** Archiva una plática, o la saca del archivo. Se borra sola a los 7 días de archivada. */
export async function archivarDeVerdad(platicaId: string, archivar: boolean): Promise<string | null> {
  // Se mueve aquí de una vez, sin esperar al servidor.
  cambiar({
    conversaciones: fuente.conversaciones.map((c) =>
      c.id === platicaId ? { ...c, archivadaEn: archivar ? new Date().toISOString() : null } : c,
    ),
  });
  try {
    const r = await pedir<{ error?: string }>("/api/archivar", { platicaId, archivar });
    if (r.estado !== 200) {
      await cargar();
      return r.datos?.error ?? "No se pudo archivar.";
    }
    return null;
  } catch {
    await cargar();
    return "No se pudo hablar con el servidor.";
  }
}

/* ── Administrar empresas y sus cuentas (sólo el dueño) ── */

async function cambiarYRecargar(ruta: string, cuerpo: unknown): Promise<string | null> {
  try {
    const r = await pedir<{ error?: string }>(ruta, cuerpo);
    await cargar();
    if (r.estado !== 200) {
      const error = r.datos?.error ?? "No se pudo guardar.";
      return error.charAt(0).toUpperCase() + error.slice(1);
    }
    return null;
  } catch {
    return "No se pudo hablar con el servidor.";
  }
}

export async function crearEmpresa(nombre: string, giro: string): Promise<{ id?: string; error: string | null }> {
  try {
    const r = await pedir<{ empresa?: { id: string }; error?: string }>("/api/empresas", { nombre, giro });
    await cargar();
    if (r.estado !== 200 || !r.datos?.empresa) {
      const error = r.datos?.error ?? "No se pudo guardar.";
      return { error: error.charAt(0).toUpperCase() + error.slice(1) };
    }
    return { id: r.datos.empresa.id, error: null };
  } catch {
    return { error: "No se pudo hablar con el servidor." };
  }
}

export function editarEmpresa(id: string, nombre: string, giro: string) {
  return cambiarYRecargar("/api/empresas/editar", { id, nombre, giro });
}

export function borrarEmpresa(id: string) {
  return cambiarYRecargar("/api/empresas/borrar", { id });
}

export function agregarCuenta(empresaId: string, red: Red, identificador: string) {
  return cambiarYRecargar("/api/cuentas", { empresaId, red, identificador });
}

/** Llena la empresa con chats de ejemplo de las cinco redes. */
export function llenarDemostracion(empresaId: string) {
  return cambiarYRecargar("/api/demo", { empresaId });
}

export function quitarCuenta(id: string) {
  return cambiarYRecargar("/api/cuentas/borrar", { id });
}

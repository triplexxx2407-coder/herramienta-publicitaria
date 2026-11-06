"use client";

/**
 * La sesión y los perfiles. Al abrir la página se pregunta al servidor (/api/salud): si contesta,
 * se pide entrar con usuario y contraseña. Si no contesta (el archivo suelto), NEXORA avisa
 * que necesita el servidor.
 */

import { useSyncExternalStore } from "react";
import type { EmpresaCliente, Red } from "@/lib/tipos";

export type Modo = "revisando" | "sinservidor" | "entrar" | "real";

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
  /** El perfil que estás viendo. */
  empresaActiva: string | null;
}

const CLAVE_PERFIL = "nexora-perfil";

function perfilGuardado(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_PERFIL);
  } catch {
    return null;
  }
}

let fuente: Fuente = { modo: "revisando", usuario: null, empresas: [], empresaActiva: null };
const FUENTE_SERVIDOR: Fuente = fuente;
const oyentes = new Set<() => void>();
let iniciada = false;

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

/** El perfil que se está viendo, o el primero si el guardado ya no existe. */
export function useEmpresaActiva(): EmpresaCliente | null {
  const { empresas, empresaActiva } = useFuente();
  return empresas.find((e) => e.id === empresaActiva) ?? empresas[0] ?? null;
}

export async function pedir<T>(ruta: string, cuerpo?: unknown): Promise<{ estado: number; datos: T | null }> {
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
    cambiar({ modo: "sinservidor" });
    return;
  }
  const yo = await pedir<{ usuario: Usuario }>("/api/yo");
  if (yo.estado !== 200 || !yo.datos) {
    cambiar({ modo: "entrar" });
    return;
  }
  cambiar({ usuario: yo.datos.usuario, empresaActiva: perfilGuardado() });
  await cargar();
}

/** Trae los perfiles. */
export async function cargar(): Promise<void> {
  try {
    const r = await pedir<{ empresas: { id: string; nombre: string; giro: string | null; cuentas: { id: string; red: Red; identificador: string }[] }[] }>(
      "/api/empresas",
    );
    if (r.estado === 401) {
      cambiar({ modo: "entrar", usuario: null, empresas: [] });
      return;
    }
    if (!r.datos) throw new Error("respuesta rara");
    cambiar({
      modo: "real",
      empresas: r.datos.empresas.map((e) => ({ id: e.id, nombre: e.nombre, giro: e.giro ?? "Empresa", cuentas: e.cuentas })),
    });
  } catch {
    /* se vuelve a intentar con la siguiente acción */
  }
}

export async function entrar(correo: string, contrasena: string): Promise<string | null> {
  try {
    const r = await pedir<{ usuario?: Usuario; error?: string }>("/api/entrar", { correo, contrasena });
    if (r.estado !== 200 || !r.datos?.usuario) return r.datos?.error ?? "No se pudo entrar.";
    cambiar({ usuario: r.datos.usuario, empresaActiva: perfilGuardado() });
    await cargar();
    return null;
  } catch {
    return "No se pudo hablar con el servidor.";
  }
}

export async function salir(): Promise<void> {
  try {
    await pedir("/api/salir", {});
  } finally {
    cambiar({ modo: "entrar", usuario: null, empresas: [] });
  }
}

/** Cambia el perfil que se está viendo. */
export function elegirEmpresa(id: string): void {
  try {
    window.localStorage.setItem(CLAVE_PERFIL, id);
  } catch {
    /* sin almacenamiento: se recuerda sólo mientras esté abierta */
  }
  cambiar({ empresaActiva: id });
}

/* ── Administrar perfiles y sus redes (sólo el dueño) ── */

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

export function quitarCuenta(id: string) {
  return cambiarYRecargar("/api/cuentas/borrar", { id });
}

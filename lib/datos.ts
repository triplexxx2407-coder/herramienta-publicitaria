"use client";

/**
 * Los datos de cada pantalla (interesados, publicaciones, enlaces, resultados) de un perfil.
 * Se guardan en memoria y cada pantalla los pide al abrirse y después de cada cambio.
 */

import { useEffect, useSyncExternalStore } from "react";
import { pedir } from "@/lib/fuente";

const guardados = new Map<string, unknown>();
const oyentes = new Set<() => void>();

function clave(ruta: string, empresaId: string): string {
  return `${ruta}|${empresaId}`;
}

function avisarCambio() {
  for (const o of oyentes) o();
}

/** Vuelve a pedir esos datos al servidor. */
export async function recargar(ruta: string, empresaId: string): Promise<void> {
  try {
    const r = await pedir<unknown>(`/api/${ruta}?empresa=${encodeURIComponent(empresaId)}`);
    if (r.estado === 200 && r.datos) {
      guardados.set(clave(ruta, empresaId), r.datos);
      avisarCambio();
    }
  } catch {
    /* se vuelve a intentar en la siguiente acción */
  }
}

/** Los datos de esa ruta para ese perfil, o null mientras llegan. */
export function useDatos<T>(ruta: string, empresaId: string | null): T | null {
  useEffect(() => {
    if (empresaId) void recargar(ruta, empresaId);
  }, [ruta, empresaId]);
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => {
        oyentes.delete(o);
      };
    },
    () => (empresaId ? ((guardados.get(clave(ruta, empresaId)) as T | undefined) ?? null) : null),
    () => null,
  );
}

/**
 * Manda un cambio al servidor y vuelve a pedir lo que cambió. Devuelve el error (en palabras
 * sencillas) o null si salió bien, junto con lo que contestó el servidor.
 */
export async function guardar(
  ruta: string,
  cuerpo: Record<string, unknown>,
  recargas: [string, string][],
): Promise<{ error: string | null; id?: string }> {
  try {
    const r = await pedir<{ error?: string; id?: string }>(`/api/${ruta}`, cuerpo);
    await Promise.all(recargas.map(([rr, e]) => recargar(rr, e)));
    if (r.estado !== 200) {
      const error = r.datos?.error ?? "No se pudo guardar.";
      return { error: error.charAt(0).toUpperCase() + error.slice(1) };
    }
    return { error: null, id: r.datos?.id };
  } catch {
    return { error: "No se pudo hablar con el servidor." };
  }
}

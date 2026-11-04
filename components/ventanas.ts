"use client";

import { useSyncExternalStore } from "react";

/** Abre y cierra la hoja "Mi desarrollo" desde cualquier pantalla. */
let abierta = false;
const oyentes = new Set<() => void>();

export function abrirMiDesarrollo() {
  abierta = true;
  for (const o of oyentes) o();
}

export function cerrarMiDesarrollo() {
  abierta = false;
  for (const o of oyentes) o();
}

export function useMiDesarrolloAbierto(): boolean {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => {
        oyentes.delete(o);
      };
    },
    () => abierta,
    () => false,
  );
}

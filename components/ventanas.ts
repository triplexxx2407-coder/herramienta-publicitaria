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

/** Qué plática abrir al llegar a «Chat» (por ejemplo, desde «Seguimiento»). */
let chatPendiente: string | null = null;

export function pedirChatCon(id: string) {
  chatPendiente = id;
}

export function chatPedido(): string | null {
  return chatPendiente;
}

export function olvidarChatPedido() {
  chatPendiente = null;
}

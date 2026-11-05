"use client";

import { useSyncExternalStore } from "react";

/**
 * Qué abrir al llegar a otra pantalla: por ejemplo, la campana pide abrir una plática y la bandeja
 * la abre. Cada petición lleva un número, así la pantalla sabe cuándo es una
 * petición nueva aunque sea el mismo negocio, y no hace falta borrar nada.
 */
export type Pedido = { id: string; numero: number };

const pendientes: Record<string, Pedido | undefined> = {};
const oyentesPendientes = new Set<() => void>();
let contador = 0;

export function pedirAbrir(ruta: string, id: string) {
  pendientes[ruta] = { id, numero: ++contador };
  for (const o of oyentesPendientes) o();
}

/** La pantalla ya abrió lo que se le pidió, así que la petición se borra. */
export function olvidarPedido(ruta: string) {
  if (!pendientes[ruta]) return;
  pendientes[ruta] = undefined;
  for (const o of oyentesPendientes) o();
}

/** Lo último que se pidió abrir en esta ruta, o null. */
export function loPedido(ruta: string): Pedido | null {
  return pendientes[ruta] ?? null;
}

/** Igual que `loPedido`, pero la pantalla se entera aunque ya estuviera abierta. */
export function useLoPedido(ruta: string): Pedido | null {
  return useSyncExternalStore(
    (o) => {
      oyentesPendientes.add(o);
      return () => {
        oyentesPendientes.delete(o);
      };
    },
    () => loPedido(ruta),
    () => null,
  );
}

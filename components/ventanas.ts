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

/**
 * Qué abrir al llegar a otra pantalla: por ejemplo, el buscador de arriba o la campana piden abrir
 * una plática y «Chat» la abre. Cada petición lleva un número, así la pantalla sabe cuándo es una
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

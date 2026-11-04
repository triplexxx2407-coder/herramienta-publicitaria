"use client";

import { useSyncExternalStore } from "react";
import { estadoInicial, leerEstadoGuardado } from "@/lib/estado";
import type { EstadoDemo } from "@/lib/tipos";

/**
 * Guarda el estado de la demo en el navegador (localStorage).
 * Todo acceso va dentro de try/catch: en modo privado o con el almacenamiento
 * bloqueado la demo sigue funcionando, sólo que no recuerda nada al recargar.
 */
const CLAVE = "demo-prospeccion-v1";
const ESTADO_SERVIDOR = estadoInicial();

let actual: EstadoDemo | null = null;
let guardadoFallo = false;
const oyentes = new Set<() => void>();

function leer(): EstadoDemo {
  if (actual) return actual;
  let texto: string | null = null;
  try {
    texto = window.localStorage.getItem(CLAVE);
  } catch {
    texto = null;
  }
  actual = leerEstadoGuardado(texto);
  return actual;
}

function avisar() {
  for (const o of oyentes) o();
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  const alCambiarOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) {
      actual = leerEstadoGuardado(e.newValue);
      avisar();
    }
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

export function actualizarEstado(cambio: (e: EstadoDemo) => EstadoDemo) {
  const nuevo = cambio(leer());
  if (nuevo === actual) return;
  actual = nuevo;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(nuevo));
    guardadoFallo = false;
  } catch {
    guardadoFallo = true;
  }
  avisar();
}

export function reiniciarEstado(nuevo: EstadoDemo = estadoInicial()) {
  actualizarEstado(() => nuevo);
}

export function useEstado(): EstadoDemo {
  return useSyncExternalStore(suscribir, leer, () => ESTADO_SERVIDOR);
}

/** false mientras la página se arma en el servidor; true ya en el navegador. */
export function useEnNavegador(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function guardadoNoDisponible(): boolean {
  return guardadoFallo;
}

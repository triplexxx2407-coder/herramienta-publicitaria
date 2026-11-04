"use client";

import { CircleCheck } from "lucide-react";
import { useSyncExternalStore } from "react";

/** Mensajitos que aparecen abajo unos segundos ("Agregado a tu lista"). */
interface Mensaje {
  id: number;
  texto: string;
}

let mensajes: Mensaje[] = [];
let siguiente = 1;
const oyentes = new Set<() => void>();
const NINGUNO: Mensaje[] = [];

function avisarCambio() {
  for (const o of oyentes) o();
}

export function avisar(texto: string) {
  const id = siguiente++;
  mensajes = [...mensajes.slice(-2), { id, texto }];
  avisarCambio();
  setTimeout(() => {
    mensajes = mensajes.filter((m) => m.id !== id);
    avisarCambio();
  }, 2600);
}

function suscribir(o: () => void) {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
}

export function ContenedorAvisos() {
  const lista = useSyncExternalStore(suscribir, () => mensajes, () => NINGUNO);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-center gap-2 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] lg:bottom-8"
    >
      {lista.map((m) => (
        <div
          key={m.id}
          role="status"
          className="entrada inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2.5 text-sm font-semibold text-white shadow-flotante"
        >
          <CircleCheck size={18} aria-hidden className="text-verde-500" />
          {m.texto}
        </div>
      ))}
    </div>
  );
}

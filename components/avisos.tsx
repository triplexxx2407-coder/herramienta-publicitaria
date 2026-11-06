"use client";

import { CircleCheck } from "lucide-react";
import { useSyncExternalStore } from "react";

/** Mensajitos que aparecen arriba unos segundos ("Agregado a tu lista"), a veces con un botón «Deshacer». */
interface Accion {
  texto: string;
  alHacer: () => void;
}

interface Mensaje {
  id: number;
  texto: string;
  accion?: Accion;
}

let mensajes: Mensaje[] = [];
let siguiente = 1;
const oyentes = new Set<() => void>();
const NINGUNO: Mensaje[] = [];

function avisarCambio() {
  for (const o of oyentes) o();
}

function quitar(id: number) {
  mensajes = mensajes.filter((m) => m.id !== id);
  avisarCambio();
}

export function avisar(texto: string, accion?: Accion) {
  const id = siguiente++;
  // Uno a la vez: el nuevo reemplaza al anterior para no amontonar mensajes.
  mensajes = [{ id, texto, accion }];
  avisarCambio();
  // Con botón se queda más tiempo, para alcanzar a tocarlo.
  setTimeout(() => quitar(id), accion ? 6000 : 2600);
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
      className="pointer-events-none fixed inset-x-0 top-[calc(4.25rem+env(safe-area-inset-top,0px))] z-[60] flex flex-col items-center gap-2 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] lg:top-6"
    >
      {lista.map((m) => (
        <div
          key={m.id}
          role="status"
          className="entrada inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          <CircleCheck size={18} aria-hidden className="text-emerald-400" />
          {m.texto}
          {m.accion ? (
            <button
              type="button"
              onClick={() => {
                m.accion?.alHacer();
                quitar(m.id);
              }}
              className="pointer-events-auto -my-1 -mr-2 ml-1 rounded-full px-2.5 py-1 font-bold text-indigo-300 underline-offset-2 hover:bg-white/10 hover:underline"
            >
              {m.accion.texto}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

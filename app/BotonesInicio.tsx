"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { reiniciarEstado } from "@/lib/almacen";
import { estadoDeRecorrido, estadoInicial } from "@/lib/estado";

export function BotonesInicio() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            reiniciarEstado(estadoDeRecorrido());
            router.push("/contactos");
          }}
          className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
        >
          Cargar recorrido de ejemplo
        </button>
        <button
          type="button"
          onClick={() => {
            reiniciarEstado(estadoInicial());
            setMensaje("Listo. La demo quedó vacía; empieza en «Buscar empresas».");
          }}
          className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
        >
          Empezar de cero
        </button>
      </div>
      <p className="text-sm text-slate-500">
        «Cargar recorrido de ejemplo» llena la demo con negocios inventados de Tijuana y sus correos ya aprobados, para
        presentarla rápido.
      </p>
      {mensaje ? <p role="status" className="font-medium text-teal-800">{mensaje}</p> : null}
    </div>
  );
}

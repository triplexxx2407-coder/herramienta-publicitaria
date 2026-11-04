"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotonProximamente } from "@/components/BotonProximamente";
import { Cargando } from "@/components/Cargando";
import { EncabezadoPantalla } from "@/components/EncabezadoPantalla";
import { Etiqueta } from "@/components/Etiqueta";
import { SiguientePaso } from "@/components/SiguientePaso";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar } from "@/lib/contactos";
import { formatoHora, generarPlan, OPCIONES_PLAN, type DiaDelPlan } from "@/lib/plan-envio";

const CANTIDAD_EJEMPLO = 150;
const DIAS_VISIBLES = 7;

export function PantallaEnvio() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [modo, setModo] = useState<"mios" | "ejemplo">("mios");
  if (!enNavegador) return <Cargando />;

  const aprobados = contactosParaRedactar(estado).filter((c) => estado.borradores[c.id]?.estado === "aprobado");
  const usarEjemplo = modo === "ejemplo" || aprobados.length === 0;
  const cantidad = usarEjemplo ? CANTIDAD_EJEMPLO : aprobados.length;
  const manana = new Date();
  manana.setHours(0, 0, 0, 0);
  manana.setDate(manana.getDate() + 1);
  const plan = generarPlan(cantidad, { inicio: manana });
  const nombreDe = (i: number) => (usarEjemplo ? `Correo de ejemplo #${i + 1}` : aprobados[i]?.nombre ?? "");

  return (
    <div>
      <EncabezadoPantalla
        paso={4}
        titulo="Envío"
        ayuda={
          <>
            <p>Aquí verías cómo se mandarían tus correos aprobados desde tu propia cuenta de correo, poco a poco.</p>
            <p>
              En esta demo el envío está apagado: nada sale de aquí. Lo que ves es una simulación del calendario de
              envío.
            </p>
          </>
        }
      />

      <section className="mb-6 flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold">
            {aprobados.length} {aprobados.length === 1 ? "correo aprobado" : "correos aprobados"}
          </p>
          <p className="text-slate-600">El envío real todavía no está conectado.</p>
        </div>
        <BotonProximamente texto="Enviar" grande />
      </section>

      <section className="mb-6 rounded-xl border-2 border-violet-200 bg-violet-50/50 p-4">
        <h2 className="mb-2 text-xl font-bold">¿Por qué no se mandan todos de golpe?</h2>
        <div className="space-y-2 text-slate-700">
          <p>
            Si una cuenta nueva manda cien correos en un minuto, Gmail y Outlook la toman como spam: los correos caen
            en la carpeta de basura o te bloquean la cuenta.
          </p>
          <p>
            Por eso se mandan como lo haría una persona: unos cuantos por hora, con pausas al azar de{" "}
            {OPCIONES_PLAN.minutosMin} a {OPCIONES_PLAN.minutosMax} minutos, empezando con {OPCIONES_PLAN.cupoInicial} al
            día y subiendo {OPCIONES_PLAN.aumentoDiario} cada día hasta un máximo de {OPCIONES_PLAN.cupoMaximo}. A esto
            se le llama «calentar» la cuenta.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            Plan de envío <Etiqueta tipo="simulado">Simulación</Etiqueta>
          </h2>
          <div className="flex rounded-lg border border-slate-300 bg-white p-1 text-sm font-semibold" role="group" aria-label="Qué correos ver">
            <button
              type="button"
              aria-pressed={!usarEjemplo}
              disabled={aprobados.length === 0}
              onClick={() => setModo("mios")}
              className={`rounded-md px-3 py-1.5 disabled:opacity-40 ${!usarEjemplo ? "bg-teal-700 text-white" : ""}`}
            >
              Mis aprobados ({aprobados.length})
            </button>
            <button
              type="button"
              aria-pressed={usarEjemplo}
              onClick={() => setModo("ejemplo")}
              className={`rounded-md px-3 py-1.5 ${usarEjemplo ? "bg-teal-700 text-white" : ""}`}
            >
              Ejemplo con {CANTIDAD_EJEMPLO}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <Aviso tipo="simulado">Simulación, no se envía nada.</Aviso>
        </div>

        {aprobados.length === 0 ? (
          <p className="mb-4 text-slate-600">
            Todavía no tienes correos aprobados; te mostramos el ejemplo con {CANTIDAD_EJEMPLO}. Apruébalos en{" "}
            <Link href="/redactar" className="font-semibold text-teal-800 underline">
              Redactar
            </Link>
            .
          </p>
        ) : null}

        <p className="mb-4 font-medium text-slate-700">
          {cantidad} correos se repartirían en {plan.length} {plan.length === 1 ? "día" : "días"}.
        </p>

        <ol className="space-y-4">
          {plan.slice(0, DIAS_VISIBLES).map((dia) => (
            <li key={dia.numero}>
              <DiaLineaDeTiempo dia={dia} nombreDe={nombreDe} />
            </li>
          ))}
        </ol>
        {plan.length > DIAS_VISIBLES ? (
          <p className="mt-4 text-slate-600">
            … y {plan.length - DIAS_VISIBLES} días más, con hasta {OPCIONES_PLAN.cupoMaximo} correos por día.
          </p>
        ) : null}
      </section>

      <SiguientePaso ruta="/seguimiento" texto="Ver el seguimiento" />
    </div>
  );
}

function DiaLineaDeTiempo({ dia, nombreDe }: { dia: DiaDelPlan; nombreDe: (i: number) => string }) {
  const inicio = OPCIONES_PLAN.horaInicio * 60;
  const fin = OPCIONES_PLAN.horaFin * 60;
  const horas = Array.from({ length: OPCIONES_PLAN.horaFin - OPCIONES_PLAN.horaInicio + 1 }, (_, i) => OPCIONES_PLAN.horaInicio + i);
  const fecha = dia.fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const primero = dia.envios[0];
  const ultimo = dia.envios[dia.envios.length - 1];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">
          Día {dia.numero} <span className="font-normal text-slate-500">· {fecha}</span>
        </p>
        <p className="text-sm text-slate-600">
          {dia.envios.length} correos (límite del día: {dia.cupo})
          {primero && ultimo ? ` · de ${formatoHora(primero.minuto)} a ${formatoHora(ultimo.minuto)}` : ""}
        </p>
      </div>
      <div className="mx-4">
      <div className="relative h-10" aria-hidden>
        <div className="absolute inset-x-0 top-4 h-2 rounded-full bg-slate-100" />
        {dia.envios.map((e) => (
          <span
            key={e.indice}
            className="absolute top-3 h-4 w-1.5 -translate-x-1/2 rounded-full bg-teal-600"
            style={{ left: `${((e.minuto - inicio) / (fin - inicio)) * 100}%` }}
          />
        ))}
      </div>
      <div className="relative h-5 text-xs text-slate-500" aria-hidden>
        {horas.map((h, i) => (
          <span
            key={h}
            className={`absolute -translate-x-1/2 ${i % 2 ? "hidden sm:inline" : ""}`}
            style={{ left: `${((h * 60 - inicio) / (fin - inicio)) * 100}%` }}
          >
            {h}:00
          </span>
        ))}
      </div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-semibold text-teal-800">Ver horarios</summary>
        <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {dia.envios.map((e) => (
            <li key={e.indice} className="flex gap-2">
              <span className="w-12 shrink-0 font-mono text-slate-500">{formatoHora(e.minuto)}</span>
              <span className="truncate">{nombreDe(e.indice)}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

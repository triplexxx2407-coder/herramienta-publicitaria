"use client";

import { ArrowRight, ChevronDown, FlaskConical, Lock, PenLine, Send } from "lucide-react";
import { useState } from "react";
import { BOTON_BARRA, BarraAccion, BotonEnlace, Cargando, Encabezado, Insignia, Tarjeta, cx } from "@/components/ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar, nombreVisible } from "@/lib/contactos";
import { formatoHora, generarPlan, OPCIONES_PLAN, type DiaDelPlan } from "@/lib/plan-envio";

const CANTIDAD_EJEMPLO = 150;
const DIAS_CON_HORARIO = 3;
const DIAS_EN_GRAFICA = 10;

function fechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

/** «jue 5 nov» → «Jue 5 nov» (sólo la primera letra en mayúscula). */
function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function PantallaEnvio() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  if (!enNavegador) return <Cargando />;

  const aprobados = contactosParaRedactar(estado).filter((c) => estado.borradores[c.id]?.estado === "aprobado");
  const manana = new Date();
  manana.setHours(0, 0, 0, 0);
  manana.setDate(manana.getDate() + 1);
  const plan = generarPlan(aprobados.length, { inicio: manana });
  const planEjemplo = generarPlan(CANTIDAD_EJEMPLO, { inicio: manana });
  const nombreDe = (i: number) => nombreVisible(aprobados[i]?.nombre ?? "", aprobados[i]?.esEjemplo);

  return (
    <div>
      <Encabezado
        paso={4}
        titulo="Envío"
        subtitulo="Así saldrían tus correos: poco a poco y desde tu propio correo."
        ayuda={
          <>
            <p>Aquí ves cuándo saldría cada correo aprobado si el envío estuviera conectado a tu cuenta de correo.</p>
            <p>En esta demo el envío está apagado: nada sale de aquí. Es una simulación del calendario.</p>
          </>
        }
      />

      {/* Botón de enviar, apagado */}
      <section className="entrada relative mb-4 overflow-hidden rounded-[28px] bg-tinta p-5 text-white shadow-tarjeta sm:p-7">
        <div aria-hidden className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-marca-600/35 blur-3xl" />
        <div aria-hidden className="absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-marca-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/65">Listos para salir</p>
            <p className="text-6xl leading-none font-bold tracking-tight">{aprobados.length}</p>
            <p className="mt-1 text-lg text-white/85">{aprobados.length === 1 ? "correo aprobado" : "correos aprobados"}</p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex h-36 w-36 shrink-0 cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-white/35 bg-white/[0.07] text-white/75"
          >
            <Send size={34} aria-hidden className="-translate-x-0.5" />
            <span className="text-xl font-bold">Enviar</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
              <Lock size={11} aria-hidden /> Próximamente
            </span>
          </button>
        </div>
      </section>

      <p className="rayas-simulado entrada mb-7 flex items-center gap-2.5 rounded-2xl border border-violeta-200 bg-violeta-50 px-4 py-3 font-semibold text-violeta-700">
        <FlaskConical size={19} aria-hidden className="shrink-0" />
        Simulación, no se envía nada.
      </p>

      <section aria-labelledby="titulo-asi-saldrian">
        <h2 id="titulo-asi-saldrian" className="mb-3 flex flex-wrap items-center gap-2 font-display text-xl font-bold">
          Así saldrían tus correos <Insignia tipo="simulado">Simulación</Insignia>
        </h2>
        {aprobados.length ? (
          <>
            <ol className="space-y-3">
              {plan.slice(0, DIAS_CON_HORARIO).map((dia) => (
                <li key={dia.numero}>
                  <DiaLineaDeTiempo dia={dia} nombreDe={nombreDe} />
                </li>
              ))}
            </ol>
            {plan.length > DIAS_CON_HORARIO ? (
              <p className="mt-3 text-sm text-suave">
                … y {plan.length - DIAS_CON_HORARIO} {plan.length - DIAS_CON_HORARIO === 1 ? "día más" : "días más"}.
              </p>
            ) : null}
          </>
        ) : (
          <Tarjeta className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 text-suave">Todavía no apruebas ningún correo. Abajo ves un ejemplo con {CANTIDAD_EJEMPLO}.</p>
            <BotonEnlace href="/redactar" variante="secundario" icono={<PenLine size={17} aria-hidden />}>
              Ir a redactar
            </BotonEnlace>
          </Tarjeta>
        )}
      </section>

      <section aria-labelledby="titulo-si-fueran" className="mt-8">
        <h2 id="titulo-si-fueran" className="font-display text-xl font-bold">
          ¿Y si fueran {CANTIDAD_EJEMPLO}?
        </h2>
        <p className="mt-1 mb-3 text-suave">
          {OPCIONES_PLAN.cupoInicial} el primer día y {OPCIONES_PLAN.aumentoDiario} más cada día, hasta {OPCIONES_PLAN.cupoMaximo}. Así
          Gmail y Outlook no te marcan como spam.
        </p>
        <GraficaPorDia plan={planEjemplo} />
      </section>

      <BarraAccion notaComputadora="Simulación: no se envía nada">
        <BotonEnlace href="/seguimiento" className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />}>
          Siguiente: ver quién respondió
        </BotonEnlace>
      </BarraAccion>
    </div>
  );
}

/** Columnas: correos por día. Una sola serie, así que no lleva leyenda (el título dice qué es). */
function GraficaPorDia({ plan }: { plan: DiaDelPlan[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const dias = plan.slice(0, DIAS_EN_GRAFICA);
  const maximo = OPCIONES_PLAN.cupoMaximo;
  const marcas = [0, maximo / 2, maximo];
  const conEtiqueta = new Set([0, dias.length - 1]);

  return (
    <Tarjeta className="entrada p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-tinta">Correos por día</h3>
        <Insignia tipo="simulado">Simulación</Insignia>
      </div>

      <div className="flex gap-2">
        {/* Eje con números redondos */}
        <div aria-hidden className="cifras relative h-40 w-6 shrink-0 text-right text-[11px] text-tenue">
          {marcas.map((m) => (
            <span key={m} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (m / maximo) * 100}%` }}>
              {m}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-40">
            {marcas.map((m) => (
              <div key={m} aria-hidden className="absolute inset-x-0 h-px bg-linea" style={{ top: `${100 - (m / maximo) * 100}%` }} />
            ))}
            <ul className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${dias.length}, minmax(0, 1fr))` }}>
              {dias.map((dia, i) => {
                const alto = (dia.envios.length / maximo) * 100;
                return (
                  <li key={dia.numero} className="relative">
                    <button
                      type="button"
                      aria-label={`Día ${dia.numero}: ${dia.envios.length} correos`}
                      onPointerEnter={() => setActivo(i)}
                      onPointerLeave={() => setActivo(null)}
                      onFocus={() => setActivo(i)}
                      onBlur={() => setActivo(null)}
                      className="absolute inset-0 flex items-end justify-center rounded-lg outline-offset-0"
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "w-6 max-w-[calc(100%-2px)] rounded-t-[4px] transition-colors",
                          activo === i ? "bg-marca-500" : "bg-marca-600",
                        )}
                        style={{ height: `${alto}%` }}
                      />
                    </button>
                    {conEtiqueta.has(i) && activo !== i ? (
                      <span
                        aria-hidden
                        className="cifras pointer-events-none absolute inset-x-0 text-center text-xs font-bold text-tinta-2"
                        style={{ bottom: `calc(${alto}% + 4px)` }}
                      >
                        {dia.envios.length}
                      </span>
                    ) : null}
                    {activo === i ? (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-xl bg-tinta px-2.5 py-1.5 text-center whitespace-nowrap text-white shadow-flotante"
                        style={{ bottom: `calc(${alto}% + 8px)` }}
                      >
                        <span className="block text-sm font-bold">{dia.envios.length} correos</span>
                        <span className="block text-[11px] text-white/70">
                          Día {dia.numero} · {fechaCorta(dia.fecha)}
                        </span>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
          <div aria-hidden className="mt-1.5 grid text-center text-[11px] font-semibold text-tenue" style={{ gridTemplateColumns: `repeat(${dias.length}, minmax(0, 1fr))` }}>
            {dias.map((dia) => (
              <span key={dia.numero} className="truncate">
                Día {dia.numero}
              </span>
            ))}
          </div>
        </div>
      </div>
      {plan.length > DIAS_EN_GRAFICA ? (
        <p className="mt-2 text-xs text-suave">Se muestran los primeros {DIAS_EN_GRAFICA} días.</p>
      ) : null}

      <details className="group mt-3">
        <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-marca-700">
          Ver como tabla <ChevronDown size={15} aria-hidden className="transition-transform group-open:rotate-180" />
        </summary>
        <table className="mt-2 w-full max-w-sm text-sm">
          <thead>
            <tr className="text-left text-xs text-suave">
              <th className="py-1 font-semibold">Día</th>
              <th className="py-1 font-semibold">Fecha</th>
              <th className="py-1 text-right font-semibold">Correos</th>
            </tr>
          </thead>
          <tbody className="cifras divide-y divide-linea">
            {plan.map((dia) => (
              <tr key={dia.numero}>
                <td className="py-1">{dia.numero}</td>
                <td className="py-1">{fechaCorta(dia.fecha)}</td>
                <td className="py-1 text-right font-semibold">{dia.envios.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Tarjeta>
  );
}

function DiaLineaDeTiempo({ dia, nombreDe }: { dia: DiaDelPlan; nombreDe: (i: number) => string }) {
  const inicio = OPCIONES_PLAN.horaInicio * 60;
  const fin = OPCIONES_PLAN.horaFin * 60;
  const horas = [];
  for (let h = OPCIONES_PLAN.horaInicio; h <= OPCIONES_PLAN.horaFin; h += 3) horas.push(h);
  const primero = dia.envios[0];
  const ultimo = dia.envios[dia.envios.length - 1];

  return (
    <Tarjeta className="p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-marca-50 text-marca-700">
          <span className="text-[10px] leading-none font-bold uppercase">Día</span>
          <span className="text-lg leading-none font-bold">{dia.numero}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-tinta">{conMayuscula(fechaCorta(dia.fecha))}</p>
          <p className="text-sm text-suave">
            {dia.envios.length} {dia.envios.length === 1 ? "correo" : "correos"}
            {primero && ultimo ? ` · de ${formatoHora(primero.minuto)} a ${formatoHora(ultimo.minuto)}` : ""}
          </p>
        </div>
      </div>
      <div className="px-1">
        <div className="relative h-6" aria-hidden>
          <div className="absolute inset-x-0 top-2 h-2 rounded-full bg-marca-50" />
          {dia.envios.map((e) => (
            <span
              key={e.indice}
              className="absolute top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-marca-600"
              style={{ left: `${((e.minuto - inicio) / (fin - inicio)) * 100}%` }}
            />
          ))}
        </div>
        <div className="cifras relative h-4 text-[11px] text-tenue" aria-hidden>
          {horas.map((h) => (
            <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h * 60 - inicio) / (fin - inicio)) * 100}%` }}>
              {h}:00
            </span>
          ))}
        </div>
      </div>
      <details className="group mt-3">
        <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-marca-700">
          Ver horarios <ChevronDown size={15} aria-hidden className="transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {dia.envios.map((e) => (
            <li key={e.indice} className="flex gap-2">
              <span className="cifras w-11 shrink-0 text-tenue">{formatoHora(e.minuto)}</span>
              <span className="truncate text-tinta-2">{nombreDe(e.indice)}</span>
            </li>
          ))}
        </ol>
      </details>
    </Tarjeta>
  );
}

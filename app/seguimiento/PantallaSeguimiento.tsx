"use client";

import { ArrowRight, ChartColumn, FlaskConical, MailOpen, PenLine, Reply, Send, Sparkles, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { avisar } from "@/components/avisos";
import {
  BOTON_BARRA,
  BarraAccion,
  Boton,
  BotonEnlace,
  BotonProximamente,
  Cargando,
  Encabezado,
  EstadoVacio,
  Insignia,
  Tarjeta,
  cx,
} from "@/components/ui";
import { reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar, nombreVisible } from "@/lib/contactos";
import { estadoDeRecorrido } from "@/lib/estado";
import { DIAS_PARA_SEGUNDO_MENSAJE, simularSeguimiento, type EstadoSimulado } from "@/lib/seguimiento";

/** Lo más lejos que llegó cada correo, en una palabra. */
function situacion(f: EstadoSimulado): { texto: string; clase: string; orden: number } {
  if (f.respondio) return { texto: "Respondió", clase: "bg-violeta-500 text-white", orden: 0 };
  if (f.abrio) return { texto: "Lo abrió", clase: "bg-violeta-50 text-violeta-700", orden: 1 };
  return { texto: "No lo ha abierto", clase: "bg-fondo text-suave", orden: 2 };
}

export function PantallaSeguimiento() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  if (!enNavegador) return <Cargando />;

  const aprobados = contactosParaRedactar(estado).filter((c) => estado.borradores[c.id]?.estado === "aprobado");
  const filas = simularSeguimiento(aprobados);
  const cuenta = (f: (x: EstadoSimulado) => boolean) => filas.filter(f).length;
  const segundo = filas.filter((f) => f.necesitaSegundoMensaje);
  const ordenadas = [...filas].sort((a, b) => situacion(a).orden - situacion(b).orden);

  return (
    <div>
      <Encabezado
        paso={5}
        titulo="Seguimiento"
        subtitulo="Quién abrió, quién respondió y a quién volver a escribirle."
        ayuda={
          <>
            <p>Aquí verías qué pasó con cada correo y a quién conviene escribirle otra vez.</p>
            <p>Como la demo no envía nada, estos números son inventados sólo para mostrar cómo se vería. No son resultados.</p>
          </>
        }
      />

      <p className="rayas-simulado entrada mb-5 flex items-start gap-2.5 rounded-2xl border border-violeta-200 bg-violeta-50 px-4 py-3 font-semibold text-violeta-700">
        <FlaskConical size={19} aria-hidden className="mt-0.5 shrink-0" />
        Tablero simulado. Ningún correo se envió; «enviado», «abrió» y «respondió» son inventados.
      </p>

      {aprobados.length === 0 ? (
        <EstadoVacio
          icono={<ChartColumn size={30} aria-hidden />}
          titulo="Aún no hay correos aprobados"
          texto="Aprueba tus correos en «Redactar» y aquí verás cómo irían."
        >
          <BotonEnlace href="/redactar" icono={<PenLine size={18} aria-hidden />}>
            Ir a redactar
          </BotonEnlace>
          <Boton
            variante="secundario"
            icono={<Sparkles size={18} aria-hidden />}
            onClick={() => {
              const nuevo = estadoDeRecorrido();
              reiniciarEstado(nuevo);
              avisar(`Listo: ${nuevo.contactos.length} negocios de ejemplo`);
            }}
          >
            Llenar con un ejemplo
          </Boton>
        </EstadoVacio>
      ) : (
        <>
          <ul className="mb-7 grid grid-cols-3 gap-2 sm:gap-3">
            <Cifra icono={Send} titulo="Enviados" valor={cuenta((f) => f.enviado)} />
            <Cifra icono={MailOpen} titulo="Abrieron" valor={cuenta((f) => f.abrio)} />
            <Cifra icono={Reply} titulo="Respondieron" valor={cuenta((f) => f.respondio)} />
          </ul>

          {segundo.length ? (
            <section aria-labelledby="titulo-otra-vez" className="mb-7">
              <h2 id="titulo-otra-vez" className="flex flex-wrap items-center gap-2 font-display text-xl font-bold">
                Volver a escribirles <span className="font-sans text-lg font-semibold text-suave">({segundo.length})</span>
                <Insignia tipo="ejemplo" />
              </h2>
              <p className="mt-1 mb-3 text-suave">No han respondido en {DIAS_PARA_SEGUNDO_MENSAJE} días o más.</p>
              <Tarjeta className="overflow-hidden">
                <ul className="divide-y divide-linea">
                  {segundo.map((f) => (
                    <li key={f.contacto.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <Avatar nombre={f.contacto.nombre} tamano={36} />
                      <span className="min-w-0 flex-1 truncate font-semibold text-tinta">{nombreVisible(f.contacto.nombre, f.contacto.esEjemplo)}</span>
                      <span className="shrink-0 text-sm text-suave">Hace {f.diasDesdeEnvio} días</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-linea bg-fondo/60 px-4 py-3 sm:px-5">
                  <BotonProximamente texto="Escribirles otra vez" className="w-full justify-center sm:w-auto" />
                </div>
              </Tarjeta>
            </section>
          ) : null}

          <section aria-labelledby="titulo-cada-uno">
            <h2 id="titulo-cada-uno" className="mb-3 flex flex-wrap items-center gap-2 font-display text-xl font-bold">
              Cómo va cada uno <Insignia tipo="ejemplo" />
            </h2>
            <Tarjeta className="overflow-hidden">
              <ul className="divide-y divide-linea">
                {ordenadas.map((f) => {
                  const s = situacion(f);
                  return (
                    <li key={f.contacto.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <Avatar nombre={f.contacto.nombre} tamano={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-tinta">{nombreVisible(f.contacto.nombre, f.contacto.esEjemplo)}</span>
                        <span className="block text-xs text-tenue">Enviado hace {f.diasDesdeEnvio} días</span>
                      </span>
                      <span className={cx("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", s.clase)}>{s.texto}</span>
                    </li>
                  );
                })}
              </ul>
            </Tarjeta>
          </section>

          <BarraAccion notaComputadora="Números de ejemplo: nada se envió">
            <BotonEnlace href="/expediente" className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />}>
              Siguiente: el expediente
            </BotonEnlace>
          </BarraAccion>
        </>
      )}
    </div>
  );
}

function Cifra({ icono: Icono, titulo, valor }: { icono: LucideIcon; titulo: string; valor: number }) {
  return (
    <li className="entrada rayas-simulado rounded-tarjeta border-2 border-dashed border-violeta-200 bg-violeta-50/60 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violeta-700 sm:h-10 sm:w-10 sm:rounded-2xl">
          <Icono size={18} aria-hidden />
        </span>
        <span className="hidden sm:block">
          <Insignia tipo="ejemplo" />
        </span>
      </div>
      <p className="mt-2.5 text-3xl leading-tight font-bold text-tinta">{valor}</p>
      <p className="text-sm font-semibold text-suave">{titulo}</p>
      <span className="mt-1.5 block sm:hidden">
        <Insignia tipo="ejemplo" />
      </span>
    </li>
  );
}

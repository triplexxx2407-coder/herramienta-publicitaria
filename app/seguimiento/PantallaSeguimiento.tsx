"use client";

import { ArrowRight, ChartColumn, Check, CircleCheck, FlaskConical, MailOpen, Minus, PenLine, Reply, Send, Sparkles, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { avisar } from "@/components/avisos";
import { Boton, BotonEnlace, BotonProximamente, Cargando, Encabezado, EstadoVacio, Insignia, Tarjeta, cx } from "@/components/ui";
import { reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar } from "@/lib/contactos";
import { estadoDeRecorrido } from "@/lib/estado";
import { DIAS_PARA_SEGUNDO_MENSAJE, simularSeguimiento } from "@/lib/seguimiento";

export function PantallaSeguimiento() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  if (!enNavegador) return <Cargando />;

  const aprobados = contactosParaRedactar(estado).filter((c) => estado.borradores[c.id]?.estado === "aprobado");
  const filas = simularSeguimiento(aprobados);
  const cuenta = (f: (x: (typeof filas)[number]) => boolean) => filas.filter(f).length;
  const segundo = filas.filter((f) => f.necesitaSegundoMensaje);

  return (
    <div>
      <Encabezado
        paso={5}
        titulo="Seguimiento"
        subtitulo="Quién abrió, quién respondió y a quién volver a escribirle."
        ayuda={
          <>
            <p>Aquí verías qué pasó con cada correo: si lo abrieron, si te respondieron y a quién conviene escribirle otra vez.</p>
            <p>
              Como la demo no envía nada, todo lo que dice «Simulado» es inventado sólo para mostrar cómo se vería. No es
              un resultado ni una predicción.
            </p>
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
          texto="Apruébalos en «Redactar» o carga el recorrido de ejemplo para ver el tablero."
        >
          <BotonEnlace href="/redactar" icono={<PenLine size={18} aria-hidden />}>
            Ir a Redactar
          </BotonEnlace>
          <Boton
            variante="secundario"
            icono={<Sparkles size={18} aria-hidden />}
            onClick={() => {
              reiniciarEstado(estadoDeRecorrido());
              avisar("Recorrido de ejemplo cargado");
            }}
          >
            Cargar ejemplo
          </Boton>
        </EstadoVacio>
      ) : (
        <>
          <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cifra icono={CircleCheck} titulo="Aprobados" valor={aprobados.length} />
            <Cifra icono={Send} titulo="Enviados" valor={cuenta((f) => f.enviado)} simulado />
            <Cifra icono={MailOpen} titulo="Abrieron" valor={cuenta((f) => f.abrio)} simulado />
            <Cifra icono={Reply} titulo="Respondieron" valor={cuenta((f) => f.respondio)} simulado />
          </ul>

          <section className="mb-6">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold">Necesitan segundo mensaje</h2>
              <Insignia tipo="simulado" />
            </div>
            <p className="mb-3 text-sm text-suave">
              No han respondido en {DIAS_PARA_SEGUNDO_MENSAJE} días o más. Un segundo mensaje corto y amable es lo normal.
            </p>
            {segundo.length ? (
              <Tarjeta className="overflow-hidden">
                <ul className="divide-y divide-linea">
                  {segundo.map((f) => (
                    <li key={f.contacto.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                      <Avatar nombre={f.contacto.nombre} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-tinta">{f.contacto.nombre}</span>
                        <span className="block text-sm text-suave">Hace {f.diasDesdeEnvio} días · simulado</span>
                      </span>
                      <BotonProximamente texto="Preparar segundo mensaje" className="w-full justify-center sm:w-auto" />
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            ) : (
              <p className="rounded-tarjeta bg-white px-5 py-6 text-center text-suave">Nadie por ahora.</p>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold">Por contacto</h2>
              <Insignia tipo="simulado" />
            </div>
            <Tarjeta className="overflow-hidden">
              <ul className="divide-y divide-linea">
                {filas.map((f) => (
                  <li key={f.contacto.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                    <Avatar nombre={f.contacto.nombre} tamano={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-tinta">{f.contacto.nombre}</span>
                      <span className="block text-xs text-tenue">Hace {f.diasDesdeEnvio} días</span>
                    </span>
                    <span className="flex w-full gap-1.5 pl-12 sm:w-auto sm:pl-0">
                      <Paso si={f.enviado} texto="Enviado" />
                      <Paso si={f.abrio} texto="Abrió" />
                      <Paso si={f.respondio} texto="Respondió" />
                    </span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
            <p className="mt-2 text-sm text-tenue">Todos los valores de esta lista son simulados.</p>
          </section>
        </>
      )}

      <div className="mt-8 flex justify-end">
        <BotonEnlace href="/expediente" tamano="lg" icono={<ArrowRight size={19} aria-hidden />}>
          Siguiente: expediente
        </BotonEnlace>
      </div>
    </div>
  );
}

function Cifra({
  icono: Icono,
  titulo,
  valor,
  simulado = false,
}: {
  icono: LucideIcon;
  titulo: string;
  valor: number;
  simulado?: boolean;
}) {
  return (
    <li
      className={cx(
        "entrada rounded-tarjeta p-4",
        simulado ? "rayas-simulado border-2 border-dashed border-violeta-200 bg-violeta-50/60" : "border border-linea/80 bg-superficie shadow-tarjeta",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-2xl",
            simulado ? "bg-white text-violeta-700" : "bg-marca-50 text-marca-600",
          )}
        >
          <Icono size={19} aria-hidden />
        </span>
        <Insignia tipo={simulado ? "simulado" : "tusdatos"} />
      </div>
      <p className="mt-3 text-sm font-semibold text-suave">{titulo}</p>
      <p className="text-3xl leading-tight font-bold text-tinta">{valor}</p>
    </li>
  );
}

function Paso({ si, texto }: { si: boolean; texto: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        si ? "bg-violeta-50 text-violeta-700" : "bg-fondo text-tenue",
      )}
    >
      {si ? <Check size={13} strokeWidth={3} aria-hidden /> : <Minus size={13} aria-hidden />}
      {texto}
      <span className="sr-only">{si ? ": sí" : ": no"}</span>
    </span>
  );
}

"use client";

import { ArrowRight, Lock, MapPin, Pencil, RotateCcw, Search, Sparkles, Tag } from "lucide-react";
import { useState } from "react";
import { avisar } from "@/components/avisos";
import { AyudaPlegable, Boton, BotonEnlace, Cargando, Insignia, Tarjeta } from "@/components/ui";
import { abrirMiDesarrollo } from "@/components/ventanas";
import { reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { listosParaEnviar, porEscribir } from "@/lib/contactos";
import { enviosHechos, platicas } from "@/lib/envio";
import { AJUSTES_EJEMPLO, estadoDeRecorrido, estadoInicial } from "@/lib/estado";
import type { EstadoDemo } from "@/lib/tipos";

/** Lo que conviene hacer ahora, según lo que ya hiciste. */
function loQueSigue(estado: EstadoDemo) {
  const pendientes = porEscribir(estado).length;
  const listos = listosParaEnviar(estado).length;
  const sinLeer = platicas(estado).filter((p) => p.noLeida).length;
  if (pendientes > listos) {
    const faltan = pendientes - listos;
    return {
      numero: 2,
      titulo: "Redactar",
      texto: faltan === 1 ? "Te falta aprobar 1 correo." : `Te faltan ${faltan} correos por aprobar.`,
      ruta: "/redactar",
    };
  }
  if (listos) {
    return {
      numero: 3,
      titulo: "Envío",
      texto: listos === 1 ? "Tienes 1 correo listo para enviar." : `Tienes ${listos} correos listos para enviar.`,
      ruta: "/envio",
    };
  }
  if (sinLeer) {
    return {
      numero: 5,
      titulo: "Chat",
      texto: sinLeer === 1 ? "1 negocio te contestó." : `${sinLeer} negocios te contestaron.`,
      ruta: "/chat",
    };
  }
  if (enviosHechos(estado).length) {
    return { numero: 4, titulo: "Seguimiento", texto: "Mira quién te contestó y quién no.", ruta: "/seguimiento" };
  }
  return { numero: 1, titulo: "Buscar empresas", texto: "Marca a quién quieres escribirle.", ruta: "/buscar" };
}

export function PantallaInicio() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [confirmar, setConfirmar] = useState(false);
  if (!enNavegador) return <Cargando />;

  const { ajustes } = estado;
  const porEnviar = porEscribir(estado).length;
  const enviados = enviosHechos(estado).length;
  const contestaron = platicas(estado).length;
  const hayAlgo = estado.contactos.length > 0;
  const portada = ajustes.fotos[0]?.url ?? AJUSTES_EJEMPLO.fotos[0]?.url;
  const sigue = loQueSigue(estado);

  function llenarConEjemplo() {
    const nuevo = estadoDeRecorrido();
    reiniciarEstado(nuevo);
    setConfirmar(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    avisar(`Listo: ${porEscribir(nuevo).length} correos de ejemplo`);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
      <div className="space-y-5">
        {/* Portada del desarrollo */}
        <section className="entrada relative overflow-hidden rounded-[28px] bg-tinta text-white shadow-tarjeta">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada} alt="Imagen de ejemplo del desarrollo" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-tinta from-15% via-tinta/60 via-50% to-tinta/0" />
          <div className="relative flex min-h-[20rem] flex-col p-5 sm:min-h-[24rem] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Insignia tipo="ejemplo" claro />
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] leading-4 font-bold tracking-wide uppercase backdrop-blur">
                  Preventa
                </span>
              </div>
              <Boton variante="claro" tamano="sm" icono={<Pencil size={15} aria-hidden />} onClick={abrirMiDesarrollo}>
                Editar
              </Boton>
            </div>
            <div className="mt-auto space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/70">Mi desarrollo</p>
                <h1 className="font-display text-[2rem] leading-[1.1] font-bold sm:text-[2.6rem]">{ajustes.nombreDesarrollo}</h1>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-white/85">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={16} aria-hidden /> {ajustes.ciudad}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={16} aria-hidden /> Desde {ajustes.precioDesde}
                  </span>
                </p>
              </div>
              {hayAlgo ? (
                <dl className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      ["Por enviar", porEnviar],
                      ["Enviados", enviados],
                      ["Contestaron", contestaron],
                    ] as const
                  ).map(([titulo, valor]) => (
                    <div key={titulo} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md">
                      <dt className="text-xs font-semibold text-white/70">{titulo}</dt>
                      <dd className="text-2xl font-bold sm:text-[1.7rem]">{valor}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </section>

        {/* Qué hacer ahora: un solo botón grande */}
        <Tarjeta className="entrada p-5 sm:p-6">
          {!hayAlgo ? (
            <>
              <h2 className="font-display text-xl font-bold">¿Cómo empiezo?</h2>
              <p className="mt-1 text-suave">Marca negocios, revisa su correo y envíalo. Es de prueba: nada sale de aquí.</p>
              <BotonEnlace href="/buscar" tamano="lg" className="mt-5 w-full sm:w-auto" icono={<Search size={19} aria-hidden />}>
                Empezar
              </BotonEnlace>
              <button
                type="button"
                onClick={llenarConEjemplo}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 py-2 text-[15px] font-semibold text-marca-700 hover:underline sm:ml-4 sm:w-auto"
              >
                <Sparkles size={16} aria-hidden /> O mira un ejemplo ya lleno
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold tracking-[0.14em] text-marca-600 uppercase">Lo que sigue · Paso {sigue.numero}</p>
              <h2 className="mt-0.5 font-display text-xl font-bold">{sigue.titulo}</h2>
              <p className="mt-1 text-suave">{sigue.texto}</p>
              <BotonEnlace href={sigue.ruta} tamano="lg" className="mt-5 w-full sm:w-auto" icono={<ArrowRight size={19} aria-hidden />}>
                Continuar
              </BotonEnlace>
            </>
          )}
        </Tarjeta>

      </div>

      <div className="space-y-5">
        <Tarjeta className="entrada p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-tinta text-white">
              <Lock size={18} aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-lg leading-tight font-bold">Es una demo</h2>
              <p className="text-sm text-suave">Nada se envía y los negocios son inventados.</p>
            </div>
          </div>
          {hayAlgo ? (
            <div className="mt-4 flex flex-col gap-2">
              {confirmar ? (
                <div className="rounded-2xl bg-rojo-50 p-3">
                  <p className="text-sm font-semibold text-rojo-700">¿Borrar todo lo que hiciste?</p>
                  <div className="mt-2 flex gap-2">
                    <Boton
                      variante="peligro"
                      tamano="sm"
                      onClick={() => {
                        reiniciarEstado(estadoInicial());
                        setConfirmar(false);
                        avisar("Listo: la demo quedó vacía");
                      }}
                    >
                      Sí, borrar
                    </Boton>
                    <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmar(false)}>
                      Cancelar
                    </Boton>
                  </div>
                </div>
              ) : (
                <Boton variante="fantasma" onClick={() => setConfirmar(true)} icono={<RotateCcw size={17} aria-hidden />}>
                  Borrar todo y empezar de nuevo
                </Boton>
              )}
            </div>
          ) : null}
        </Tarjeta>

        <AyudaPlegable>
          <p>Esta app te ayuda a encontrar negocios, escribirle un correo personal a cada uno y platicar con los que te contestan.</p>
          <p>Es una demostración: ningún correo sale de aquí y lo que hagas se queda sólo en este navegador.</p>
        </AyudaPlegable>
      </div>
    </div>
  );
}

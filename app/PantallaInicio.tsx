"use client";

import { ArrowRight, Building2, Mail, MailCheck, MapPin, MessageSquare, RotateCcw, Sparkles, SquarePen, Tag, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { avisar } from "@/components/avisos";
import { AyudaPlegable, Boton, BotonEnlace, Cargando, Insignia, Tarjeta, cx } from "@/components/ui";
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
    return { numero: 5, titulo: "Chat", texto: sinLeer === 1 ? "1 negocio te contestó." : `${sinLeer} negocios te contestaron.`, ruta: "/chat" };
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        {/* Portada del desarrollo */}
        <section className="entrada relative overflow-hidden rounded-tarjeta shadow-tarjeta">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada} alt="Imagen de ejemplo del desarrollo" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-proyecto-oscuro from-10% via-[#5c0d0d]/80 via-55% to-proyecto/25" />
          <div className="relative flex min-h-[19rem] flex-col p-5 text-white sm:min-h-[22rem] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Insignia tipo="ejemplo" claro />
                <Insignia tipo="ejemplo" claro>
                  Preventa exclusiva
                </Insignia>
              </div>
              <Boton
                variante="secundario"
                tamano="sm"
                className="bg-white/20 hover:bg-white/30"
                icono={<SquarePen size={15} aria-hidden />}
                onClick={abrirMiDesarrollo}
              >
                Editar
              </Boton>
            </div>
            <div className="mt-auto">
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-white/75 uppercase">
                <Building2 size={13} aria-hidden /> Mi desarrollo inmobiliario
              </p>
              <h1 className="mt-1 font-display text-[2rem] leading-[1.1] font-bold sm:text-[2.5rem]">{ajustes.nombreDesarrollo}</h1>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} aria-hidden /> {ajustes.ciudad}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Tag size={16} aria-hidden /> Desde {ajustes.precioDesde}
                </span>
              </p>
            </div>
          </div>
        </section>

        {hayAlgo ? (
          <ul className="grid grid-cols-3 gap-3">
            <Cifra icono={Mail} titulo="Por enviar" valor={porEnviar} />
            <Cifra icono={MailCheck} titulo="Enviados" valor={enviados} />
            <Cifra icono={MessageSquare} titulo="Contestaron" valor={contestaron} />
          </ul>
        ) : null}
      </div>

      <div className="space-y-4">
        {/* Qué hacer ahora: un solo botón grande */}
        <Tarjeta className="entrada p-5">
          {!hayAlgo ? (
            <>
              <h2 className="font-display text-xl font-bold">¿Cómo empiezo?</h2>
              <p className="mt-1 text-suave">Marca negocios, revisa su correo y envíalo. Es de prueba: nada sale de aquí.</p>
              <BotonEnlace href="/buscar" tamano="lg" className="mt-5 w-full" icono={<ArrowRight size={19} aria-hidden />}>
                Empezar
              </BotonEnlace>
              <button
                type="button"
                onClick={llenarConEjemplo}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 py-2 text-[15px] font-semibold text-marca-400 hover:underline"
              >
                <Sparkles size={16} aria-hidden /> O mira un ejemplo ya lleno
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold tracking-[0.14em] text-marca-400 uppercase">Lo que sigue · Paso {sigue.numero}</p>
              <h2 className="mt-0.5 font-display text-xl font-bold">{sigue.titulo}</h2>
              <p className="mt-1 text-suave">{sigue.texto}</p>
              <BotonEnlace href={sigue.ruta} tamano="lg" className="mt-5 w-full" icono={<ArrowRight size={19} aria-hidden />}>
                Continuar
              </BotonEnlace>
            </>
          )}
        </Tarjeta>

        {hayAlgo ? (
          <Tarjeta className="entrada p-4">
            {confirmar ? (
              <>
                <p className="text-sm font-semibold text-rojo-700">¿Borrar todo lo que hiciste?</p>
                <div className="mt-2.5 flex gap-2">
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
              </>
            ) : (
              <Boton variante="fantasma" className="w-full" onClick={() => setConfirmar(true)} icono={<RotateCcw size={17} aria-hidden />}>
                Borrar todo y empezar de nuevo
              </Boton>
            )}
          </Tarjeta>
        ) : null}

        <AyudaPlegable>
          <p>Esta app te ayuda a encontrar negocios, escribirle un correo personal a cada uno y platicar con los que te contestan.</p>
          <p>Es una demostración: ningún correo sale de aquí y lo que hagas se queda sólo en este navegador.</p>
        </AyudaPlegable>
      </div>
    </div>
  );
}

function Cifra({ icono: Icono, titulo, valor }: { icono: LucideIcon; titulo: string; valor: number }) {
  return (
    <li className={cx("entrada rounded-tarjeta border border-linea bg-superficie p-3.5 shadow-tarjeta")}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-marca-600/20 text-marca-400">
        <Icono size={18} aria-hidden />
      </span>
      <p className="cifras mt-2.5 text-3xl leading-none font-bold text-tinta">{valor}</p>
      <p className="mt-1 text-sm font-semibold text-suave">{titulo}</p>
    </li>
  );
}

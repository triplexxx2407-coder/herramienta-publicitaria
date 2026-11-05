"use client";

import { ArrowRight, Building2, Mail, MailCheck, MessageSquare, RotateCcw, Sparkles, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { avisar } from "@/components/avisos";
import {
  CargandoPanel,
  ContenidoClaro,
  EnlacePie,
  HojaBlanca,
  IconoCirculo,
  MarcaEjemplo,
  PanelNexora,
  PastillaCliente,
} from "@/components/PanelNexora";
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
  if (!enNavegador) return <CargandoPanel />;

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
    <PanelNexora
      titulo={ajustes.nombreDesarrollo}
      ayuda={
        <>
          <p>Esta app te ayuda a encontrar negocios, escribirle un correo personal a cada uno y platicar con los que te contestan.</p>
          <p>Es una demostración: ningún correo sale de aquí y lo que hagas se queda sólo en este navegador.</p>
        </>
      }
      pastilla={
        <PastillaCliente
          icono={
            <IconoCirculo>
              <Building2 size={20} strokeWidth={2.4} />
            </IconoCirculo>
          }
          texto={hayAlgo ? `Lo que sigue: ${sigue.titulo}` : "Empieza aquí"}
        />
      }
      etiquetaLista="Cómo vas"
      claseLista={hayAlgo ? undefined : "hidden lg:block"}
      lista={
        <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-[11px]">
          <Cifra icono={Mail} titulo="Por enviar" valor={porEnviar} />
          <Cifra icono={MailCheck} titulo="Enviados" valor={enviados} />
          <Cifra icono={MessageSquare} titulo="Contestaron" valor={contestaron} />
        </ul>
      }
      etiquetaPrincipal="Tu proyecto"
      principal={
        <ContenidoClaro className="space-y-3">
          <HojaBlanca className="mx-auto max-w-3xl overflow-hidden">
            <div className="relative h-40 bg-proyecto sm:h-52 lg:h-[clamp(9rem,30dvh,17rem)]">
              {portada ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portada} alt="Imagen de ejemplo del desarrollo" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <MarcaEjemplo className="absolute top-3 left-3" />
            </div>
            <div className="px-5 py-5 sm:px-6">
              {!hayAlgo ? (
                <>
                  <h2 className="text-xl font-bold text-chat-tinta">¿Cómo empiezo?</h2>
                  <p className="mt-1 text-chat-tenue">Marca negocios, revisa su correo y envíalo. Es de prueba: nada sale de aquí.</p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <EnlacePie href="/buscar" icono={<ArrowRight size={18} aria-hidden />}>
                      Empezar
                    </EnlacePie>
                    <button
                      type="button"
                      onClick={llenarConEjemplo}
                      className="inline-flex items-center justify-center gap-1.5 py-2 text-[15px] font-semibold text-marca-700 hover:underline"
                    >
                      <Sparkles size={16} aria-hidden /> O mira un ejemplo ya lleno
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold tracking-[0.06em] text-marca-700 uppercase">Lo que sigue · Paso {sigue.numero}</p>
                  <h2 className="mt-0.5 text-xl font-bold text-chat-tinta">{sigue.titulo}</h2>
                  <p className="mt-1 text-chat-tenue">{sigue.texto}</p>
                  <EnlacePie href={sigue.ruta} className="mt-5" icono={<ArrowRight size={18} aria-hidden />}>
                    Continuar
                  </EnlacePie>
                </>
              )}
            </div>
          </HojaBlanca>

          {hayAlgo ? (
            <div className="mx-auto max-w-3xl text-center">
              {confirmar ? (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-lg bg-white/80 px-3 py-2 shadow-sm">
                  <p className="text-sm font-semibold text-[#8e1b1b]">¿Borrar todo lo que hiciste?</p>
                  <button
                    type="button"
                    onClick={() => {
                      reiniciarEstado(estadoInicial());
                      setConfirmar(false);
                      avisar("Listo: la demo quedó vacía");
                    }}
                    className="h-9 rounded-[4px] bg-proyecto px-3.5 text-sm font-bold text-white hover:bg-proyecto-claro"
                  >
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmar(false)}
                    className="h-9 rounded-[4px] px-3 text-sm font-semibold text-chat-tinta hover:bg-black/5"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmar(true)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-[4px] px-3 text-sm font-semibold text-chat-tenue hover:bg-black/5 hover:text-chat-tinta"
                >
                  <RotateCcw size={16} aria-hidden /> Borrar todo y empezar de nuevo
                </button>
              )}
            </div>
          ) : null}
        </ContenidoClaro>
      }
    />
  );
}

/** Una cifra de cómo vas, en forma de pastilla. */
function Cifra({ icono: Icono, titulo, valor }: { icono: LucideIcon; titulo: string; valor: number }) {
  return (
    <li className="flex flex-col items-center gap-1 rounded-2xl bg-pildora px-2 py-2.5 text-center lg:min-h-[46px] lg:flex-row lg:gap-2.5 lg:rounded-full lg:py-1 lg:pr-4 lg:pl-1 lg:text-left">
      <span className="hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/10 text-marca-400 lg:flex">
        <Icono size={18} aria-hidden />
      </span>
      <span className="cifras order-first text-[24px] leading-none font-bold text-white lg:order-last lg:text-[22px]">{valor}</span>
      <span className="text-[12.5px] font-semibold text-tinta-2 lg:flex-1 lg:text-[14px]">{titulo}</span>
    </li>
  );
}

"use client";

import { ArrowRight, ChevronRight, FlaskConical, LoaderCircle, PenLine, Search, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { avisar } from "@/components/avisos";
import { Hoja } from "@/components/Hoja";
import { olvidarPedido, useLoPedido } from "@/components/ventanas";
import { VistaCorreo } from "@/components/VistaCorreo";
import { BOTON_BARRA, BarraAccion, Boton, BotonEnlace, Cargando, Encabezado, EstadoVacio, Tarjeta } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { listosParaEnviar, nombreVisible, porEscribir } from "@/lib/contactos";
import { enviarSimulado, enviosHechos } from "@/lib/envio";
import { cuandoCorto } from "@/lib/fechas";

export function PantallaEnvio() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [enviando, setEnviando] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);

  // Si otra pantalla pide abrir un correo enviado (el buscador de arriba o la campana), se abre aunque ya
  // estuvieras aquí. El número de la petición evita abrirlo dos veces.
  const pedido = useLoPedido("/envio");
  const [pedidoVisto, setPedidoVisto] = useState(0);
  if (pedido && pedido.numero !== pedidoVisto) {
    setPedidoVisto(pedido.numero);
    setAbierto(pedido.id);
  }
  useEffect(() => {
    if (pedido) olvidarPedido("/envio");
  }, [pedido]);

  if (!enNavegador) return <Cargando />;

  const listos = listosParaEnviar(estado);
  const sinAprobar = porEscribir(estado).length - listos.length;
  const envios = enviosHechos(estado);
  const viendo = envios.find((e) => e.contacto.id === abierto);

  function enviar() {
    const cuantos = listos.length;
    setEnviando(true);
    // Simulación: sólo se anota como enviado en este navegador. No hay ninguna conexión.
    setTimeout(() => {
      actualizarEstado((e) => enviarSimulado(e, new Date()));
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      avisar(cuantos === 1 ? "¡Listo! Se envió 1 correo" : `¡Listo! Se enviaron ${cuantos} correos`);
    }, 900);
  }

  return (
    <div>
      <Encabezado
        paso={3}
        titulo="Envío"
        subtitulo={envios.length ? "A quién le escribiste y a qué hora." : "Revisa cuántos van y toca «Enviar»."}
        ayuda={
          <>
            <p>Aquí envías los correos que aprobaste y ves a quién le escribiste y a qué hora. Toca uno para ver lo que le mandaste.</p>
            <p>Es una simulación: ningún correo sale de aquí. En la versión real saldrían desde tu propio correo, poco a poco, para que no te marquen como spam.</p>
          </>
        }
      />

      {listos.length || envios.length ? (
        <>
          <section className="entrada relative mb-3 overflow-hidden rounded-tarjeta border border-linea bg-linear-to-br from-superficie-2 to-superficie p-5 text-white shadow-tarjeta sm:p-6">
            <div aria-hidden className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-marca-600/35 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <Send size={26} aria-hidden className="-translate-x-0.5" />
              </span>
              {envios.length ? (
                <div className="min-w-0 flex-1">
                  <p className="cifras text-5xl leading-none font-bold tracking-tight">{envios.length}</p>
                  <p className="mt-1 text-lg text-white/85">{envios.length === 1 ? "correo enviado" : "correos enviados"}</p>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="cifras text-5xl leading-none font-bold tracking-tight">{listos.length}</p>
                  <p className="mt-1 text-lg text-white/85">{listos.length === 1 ? "correo listo para enviar" : "correos listos para enviar"}</p>
                </div>
              )}
            </div>
            {envios.length && listos.length ? (
              <p className="relative mt-4 rounded-2xl bg-white/10 px-4 py-2.5 font-semibold">
                {listos.length === 1 ? "1 correo listo para enviar" : `${listos.length} correos listos para enviar`}
              </p>
            ) : null}
          </section>

          <p className="entrada mb-6 flex items-center gap-2 px-1 text-sm font-semibold text-violeta-700">
            <FlaskConical size={16} aria-hidden className="shrink-0" />
            Simulación: no sale ningún correo de verdad.
          </p>

          {sinAprobar > 0 ? (
            <p className="mb-6 rounded-2xl bg-ambar-50 px-4 py-3 text-sm font-semibold text-ambar-700">
              {sinAprobar === 1 ? "Te falta aprobar 1 correo." : `Te faltan ${sinAprobar} correos por aprobar.`}{" "}
              <BotonEnlace href="/redactar" variante="fantasma" tamano="sm" className="-my-1 underline">
                Ir a Redactar
              </BotonEnlace>
            </p>
          ) : null}

          {envios.length ? (
            <section aria-labelledby="titulo-enviados">
              <h2 id="titulo-enviados" className="mb-3 font-display text-xl font-bold">
                Enviados
              </h2>
              <Tarjeta className="overflow-hidden">
                <ul className="divide-y divide-linea">
                  {envios.map((e) => (
                    <li key={e.contacto.id}>
                      <button
                        type="button"
                        onClick={() => setAbierto(e.contacto.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-superficie-2/70 sm:px-5"
                      >
                        <Avatar nombre={e.contacto.nombre} tamano={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-tinta">
                            {nombreVisible(e.contacto.nombre, e.contacto.esEjemplo)}
                          </span>
                          <span className="block truncate text-sm text-suave">{e.correo.para}</span>
                        </span>
                        <span className="cifras shrink-0 text-sm font-semibold text-tinta-2">{cuandoCorto(e.correo.fecha)}</span>
                        <ChevronRight size={18} aria-hidden className="shrink-0 text-tenue" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            </section>
          ) : null}

          <BarraAccion>
            {listos.length ? (
              <Boton
                className={BOTON_BARRA}
                disabled={enviando}
                onClick={enviar}
                icono={
                  enviando ? (
                    <LoaderCircle size={19} aria-hidden className="animate-spin" />
                  ) : (
                    <Send size={19} aria-hidden />
                  )
                }
              >
                {enviando ? "Enviando…" : listos.length === 1 ? "Enviar 1 correo" : `Enviar ${listos.length} correos`}
              </Boton>
            ) : (
              <BotonEnlace href="/seguimiento" className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />}>
                Siguiente: ver quién contestó
              </BotonEnlace>
            )}
          </BarraAccion>
        </>
      ) : (
        <EstadoVacio
          icono={<Send size={30} aria-hidden />}
          titulo="No tienes correos listos"
          texto={sinAprobar > 0 ? "Aprueba tus correos en «Redactar» y aquí los envías." : "Elige negocios en «Buscar» y redacta su correo."}
        >
          {sinAprobar > 0 ? (
            <BotonEnlace href="/redactar" icono={<PenLine size={18} aria-hidden />}>
              Ir a Redactar
            </BotonEnlace>
          ) : (
            <BotonEnlace href="/buscar" icono={<Search size={18} aria-hidden />}>
              Ir a Buscar
            </BotonEnlace>
          )}
        </EstadoVacio>
      )}

      <Hoja abierta={!!viendo} onCerrar={() => setAbierto(null)} titulo="Correo enviado">
        {viendo ? <VistaCorreo envio={viendo} ajustes={estado.ajustes} /> : null}
      </Hoja>
    </div>
  );
}

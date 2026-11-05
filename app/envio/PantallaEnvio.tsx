"use client";

import { ArrowRight, LoaderCircle, PenLine, Search, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { avisar } from "@/components/avisos";
import {
  AvisoEjemplo,
  BotonPie,
  CargandoPanel,
  ContenidoClaro,
  EnlacePie,
  IconoCirculo,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  TituloLista,
  VacioClaro,
  useEsComputadora,
} from "@/components/PanelNexora";
import { olvidarPedido, useLoPedido } from "@/components/ventanas";
import { VistaCorreo } from "@/components/VistaCorreo";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { listosParaEnviar, nombreVisible, porEscribir } from "@/lib/contactos";
import { enviarSimulado, enviosHechos, type Envio } from "@/lib/envio";
import { cuandoCorto } from "@/lib/fechas";
import { armarCorreo } from "@/lib/redaccion";

export function PantallaEnvio() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const esComputadora = useEsComputadora();
  const [enviando, setEnviando] = useState(false);
  // El correo abierto. En el celular, null es «viendo la lista».
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

  if (!enNavegador) return <CargandoPanel />;

  const listos = listosParaEnviar(estado);
  const sinAprobar = porEscribir(estado).length - listos.length;
  const envios = enviosHechos(estado);

  // Los que están por salir se ven como saldrían, con el pie legal.
  const porSalir: Envio[] = listos.map((c) => {
    const correo = armarCorreo(estado.borradores[c.id], c, estado.ajustes);
    return { contacto: c, correo: { contactoId: c.id, para: c.correo ?? "", asunto: correo.asunto, texto: correo.texto, fecha: "" }, respuesta: null };
  });
  const elegido = envios.find((e) => e.contacto.id === abierto) ?? porSalir.find((e) => e.contacto.id === abierto);
  // En la computadora siempre se ve uno: el primero por salir o, si ya enviaste todo, el más nuevo.
  const viendo = elegido ?? (esComputadora ? (porSalir[0] ?? envios[0]) : undefined);
  const viendoPendiente = !!viendo && !viendo.correo.fecha;

  function enviar() {
    const cuantos = listos.length;
    setEnviando(true);
    // Simulación: sólo se anota como enviado en este navegador. No hay ninguna conexión.
    setTimeout(() => {
      actualizarEstado((e) => enviarSimulado(e, new Date()));
      setEnviando(false);
      setAbierto(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      avisar(cuantos === 1 ? "¡Listo! Se envió 1 correo" : `¡Listo! Se enviaron ${cuantos} correos`);
    }, 900);
  }

  const cuenta = envios.length
    ? { numero: envios.length, texto: envios.length === 1 ? "correo enviado" : "correos enviados" }
    : { numero: listos.length, texto: listos.length === 1 ? "correo listo para enviar" : "correos listos para enviar" };

  const boton = listos.length ? (
    <BotonPie
      disabled={enviando}
      onClick={enviar}
      icono={enviando ? <LoaderCircle size={18} aria-hidden className="animate-spin" /> : <Send size={18} aria-hidden />}
    >
      {enviando ? "Enviando…" : listos.length === 1 ? "Enviar 1 correo" : `Enviar ${listos.length} correos`}
    </BotonPie>
  ) : envios.length ? (
    <EnlacePie href="/seguimiento" icono={<ArrowRight size={18} aria-hidden />}>
      Siguiente: ver quién contestó
    </EnlacePie>
  ) : undefined;
  const nota = listos.length ? "Simulación: no sale ningún correo de verdad." : undefined;

  return (
    <PanelNexora
      titulo="Envío"
      ayuda={
        <>
          <p>Aquí envías los correos que aprobaste y ves a quién le escribiste y a qué hora. Toca uno para ver lo que le mandaste.</p>
          <p>Es una simulación: ningún correo sale de aquí. En la versión real saldrían desde tu propio correo, poco a poco, para que no te marquen como spam.</p>
        </>
      }
      pastilla={
        viendo ? (
          <PastillaCliente texto={viendo.correo.para} />
        ) : listos.length || envios.length ? (
          <PastillaCliente
            icono={
              <IconoCirculo>
                <Send size={19} strokeWidth={2.4} className="-translate-x-px" />
              </IconoCirculo>
            }
            texto={envios.length ? `${envios.length} ${envios.length === 1 ? "enviado" : "enviados"}` : `${listos.length} por enviar`}
          />
        ) : undefined
      }
      etiquetaLista="Tus correos"
      lista={
        listos.length || envios.length ? (
          <div className="space-y-3">
            {/* En el celular la cuenta ya va en la pastilla verde de arriba. */}
            <div className="hidden items-center gap-2.5 rounded-full bg-pildora py-1.5 pr-4 pl-1.5 lg:flex">
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-marca-600 text-white">
                <Send size={19} aria-hidden className="-translate-x-px" />
              </span>
              <p className="min-w-0 leading-tight">
                <span className="cifras block text-[26px] leading-none font-bold text-white">{cuenta.numero}</span>
                <span className="block truncate text-[12.5px] font-semibold text-tinta-2">{cuenta.texto}</span>
              </p>
            </div>
            {envios.length && listos.length ? (
              <p className="px-2 pt-1 text-[13px] font-semibold text-tinta-2 lg:pt-0">
                {listos.length === 1 ? "Y 1 listo para enviar" : `Y ${listos.length} listos para enviar`}
              </p>
            ) : null}
            {sinAprobar > 0 ? (
              <p className="rounded-2xl bg-ambar-50 px-3.5 py-2.5 text-[13px] font-semibold text-ambar-700">
                {sinAprobar === 1 ? "Te falta aprobar 1 correo." : `Te faltan ${sinAprobar} correos por aprobar.`}{" "}
                <Link href="/redactar" className="underline">
                  Ir a Redactar
                </Link>
              </p>
            ) : null}

            {porSalir.length ? (
              <section aria-label="Listos para enviar" className="space-y-[11px]">
                <TituloLista className="pt-1">Listos para enviar ({porSalir.length})</TituloLista>
                <ul className="space-y-[11px]">
                  {porSalir.map((e) => (
                    <li key={e.contacto.id}>
                      <Fila envio={e} activa={e.contacto.id === viendo?.contacto.id} onAbrir={() => setAbierto(e.contacto.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {envios.length ? (
              <section aria-label="Enviados" className="space-y-[11px]">
                <TituloLista className="pt-1">Enviados ({envios.length})</TituloLista>
                <ul className="space-y-[11px]">
                  {envios.map((e) => (
                    <li key={e.contacto.id}>
                      <Fila envio={e} activa={e.contacto.id === viendo?.contacto.id} onAbrir={() => setAbierto(e.contacto.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : (
          <p className="px-2 py-3 text-sm text-tinta-2">No tienes correos listos.</p>
        )
      }
      etiquetaPrincipal={viendo ? (viendoPendiente ? "Correo listo para enviar" : "Correo enviado") : "Correo"}
      modo="detalle"
      detalleAbierto={!!elegido}
      onCerrarDetalle={() => setAbierto(null)}
      encabezadoDetalle={viendo ? <PastillaCliente texto={viendo.correo.para} /> : undefined}
      principal={
        <ContenidoClaro className="space-y-3">
          {viendo ? (
            <>
              <AvisoEjemplo>Simulación: no sale ningún correo de verdad.</AvisoEjemplo>
              <VistaCorreo envio={viendo} ajustes={estado.ajustes} pendiente={viendoPendiente} />
            </>
          ) : (
            <VacioClaro
              icono={<Send size={28} aria-hidden className="-translate-x-0.5" />}
              titulo="No tienes correos listos"
              texto={sinAprobar > 0 ? "Aprueba tus correos en «Redactar» y aquí los envías." : "Elige negocios en «Buscar» y redacta su correo."}
            >
              {sinAprobar > 0 ? (
                <EnlacePie href="/redactar" icono={<PenLine size={18} aria-hidden />}>
                  Ir a Redactar
                </EnlacePie>
              ) : (
                <EnlacePie href="/buscar" icono={<Search size={18} aria-hidden />}>
                  Ir a Buscar
                </EnlacePie>
              )}
            </VacioClaro>
          )}
        </ContenidoClaro>
      }
      pie={boton}
      notaPie={nota}
      pieLista={boton ?? null}
      notaPieLista={nota}
    />
  );
}

function Fila({ envio: e, activa, onAbrir }: { envio: Envio; activa: boolean; onAbrir: () => void }) {
  const nombre = nombreVisible(e.contacto.nombre, e.contacto.esEjemplo);
  const cuando = e.correo.fecha ? cuandoCorto(e.correo.fecha) : "";
  return (
    <PildoraLista
      activa={activa}
      titulo={nombre}
      detalle={cuando ? `${cuando} · ${e.correo.para}` : e.correo.para}
      onClick={onAbrir}
    />
  );
}

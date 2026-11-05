"use client";

import { ArrowRight, Ban, ChartLine, ChevronDown, Clock, MessageCircle, Reply, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import {
  BotonPie,
  CargandoPanel,
  ContenidoClaro,
  EnlacePie,
  HojaBlanca,
  IconoCirculo,
  MarcaEjemplo,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  VacioClaro,
} from "@/components/PanelNexora";
import { pedirAbrir } from "@/components/ventanas";
import { VistaCorreo } from "@/components/VistaCorreo";
import { cx } from "@/components/ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreVisible } from "@/lib/contactos";
import { enviosHechos, pideBaja, type Envio } from "@/lib/envio";
import { cuandoCorto } from "@/lib/fechas";

export function PantallaSeguimiento() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const router = useRouter();
  // El negocio abierto. Mientras no tocas ninguno, a la derecha se ve el resumen.
  const [abierto, setAbierto] = useState<string | null>(null);
  if (!enNavegador) return <CargandoPanel />;

  const envios = enviosHechos(estado);
  const contestaron = envios.filter((e) => e.respuesta).sort((a, b) => b.respuesta!.fecha.localeCompare(a.respuesta!.fecha));
  const noContestaron = envios.filter((e) => !e.respuesta);
  const viendo = envios.find((e) => e.contacto.id === abierto);
  const resumen = `${contestaron.length} de ${envios.length} te contestaron`;

  function abrirChat(id: string) {
    pedirAbrir("/chat", id);
    router.push("/chat");
  }

  const botonLista = contestaron.length ? (
    <EnlacePie href="/chat" icono={<ArrowRight size={18} aria-hidden />}>
      Siguiente: el chat
    </EnlacePie>
  ) : null;

  return (
    <PanelNexora
      titulo="Seguimiento"
      ayuda={
        <>
          <p>Abre una lista para ver quién te contestó y quién no. Toca un negocio para ver lo que le escribiste.</p>
          <p>Como la demo no envía nada, las respuestas son de ejemplo: las inventa la demo para que veas cómo se vería.</p>
        </>
      }
      pastilla={
        viendo ? (
          <PastillaCliente texto={viendo.correo.para} />
        ) : envios.length ? (
          <PastillaCliente
            icono={
              <IconoCirculo>
                <ChartLine size={20} strokeWidth={2.4} />
              </IconoCirculo>
            }
            texto={resumen}
          />
        ) : undefined
      }
      etiquetaLista="Quién te contestó"
      lista={
        envios.length ? (
          <div className="space-y-[11px]">
            <p className="flex items-center gap-2 px-1.5 text-[12.5px] font-semibold text-tinta-2">
              <MarcaEjemplo /> Las respuestas las inventa la demo.
            </p>
            <Lista titulo="Te contestaron" cuenta={contestaron.length}>
              {contestaron.map((e) => (
                <li key={e.contacto.id}>
                  <Fila
                    envio={e}
                    activa={e.contacto.id === viendo?.contacto.id}
                    detalle={pideBaja(e.respuesta!.texto) ? "Pidió no recibir correos" : `${cuandoCorto(e.respuesta!.fecha)} · ${e.correo.para}`}
                    extra={pideBaja(e.respuesta!.texto) ? <Ban size={16} aria-hidden className="text-rojo-700" /> : null}
                    onAbrir={() => setAbierto(e.contacto.id)}
                  />
                </li>
              ))}
            </Lista>
            <Lista titulo="No te contestaron" cuenta={noContestaron.length}>
              {noContestaron.map((e) => (
                <li key={e.contacto.id}>
                  <Fila
                    envio={e}
                    activa={e.contacto.id === viendo?.contacto.id}
                    detalle={`${cuandoCorto(e.correo.fecha)} · ${e.correo.para}`}
                    onAbrir={() => setAbierto(e.contacto.id)}
                  />
                </li>
              ))}
            </Lista>
          </div>
        ) : (
          <p className="px-2 py-3 text-sm text-tinta-2">Todavía no envías ningún correo.</p>
        )
      }
      etiquetaPrincipal={viendo ? (viendo.respuesta ? "Te contestó" : "Correo enviado") : "Resumen"}
      modo="detalle"
      detalleAbierto={!!viendo}
      onCerrarDetalle={() => setAbierto(null)}
      encabezadoDetalle={viendo ? <PastillaCliente texto={viendo.correo.para} /> : undefined}
      principal={
        <ContenidoClaro>
          {viendo ? (
            <VistaCorreo envio={viendo} ajustes={estado.ajustes} />
          ) : envios.length ? (
            <Resumen contestaron={contestaron.length} noContestaron={noContestaron.length} />
          ) : (
            <VacioClaro
              icono={<ChartLine size={28} aria-hidden />}
              titulo="Todavía no envías ningún correo"
              texto="Cuando envíes tus correos, aquí verás quién te contestó."
            >
              <EnlacePie href="/envio" icono={<Send size={18} aria-hidden />}>
                Ir a Envío
              </EnlacePie>
            </VacioClaro>
          )}
        </ContenidoClaro>
      }
      pie={
        viendo?.respuesta ? (
          <BotonPie icono={<MessageCircle size={18} aria-hidden />} onClick={() => abrirChat(viendo.contacto.id)}>
            Abrir el chat
          </BotonPie>
        ) : (
          (botonLista ?? undefined)
        )
      }
      pieLista={botonLista}
    />
  );
}

/** Lo que se ve a la derecha mientras no abres a nadie: cuántos contestaron y cuántos no. */
function Resumen({ contestaron, noContestaron }: { contestaron: number; noContestaron: number }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <HojaBlanca className="px-4 py-4 sm:px-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#17603a]">
            <Reply size={17} aria-hidden /> Te contestaron
          </p>
          <p className="cifras mt-1 text-4xl font-bold text-chat-tinta">{contestaron}</p>
        </HojaBlanca>
        <HojaBlanca className="px-4 py-4 sm:px-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-chat-tenue">
            <Clock size={17} aria-hidden /> No te contestaron
          </p>
          <p className="cifras mt-1 text-4xl font-bold text-chat-tinta">{noContestaron}</p>
        </HojaBlanca>
      </div>
      <p className="px-1 text-center text-sm text-chat-tenue">Abre una de las dos listas y toca un negocio para ver lo que le escribiste.</p>
    </div>
  );
}

/** Una lista que se abre y se cierra, con cuántos hay a la vista. */
function Lista({ titulo, cuenta, children }: { titulo: string; cuenta: number; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((a) => !a)}
        className={cx(
          "flex min-h-[46px] w-full items-center gap-2.5 rounded-full py-1 pr-3.5 pl-1 text-left transition-colors",
          abierta ? "bg-marca-600 text-white" : "bg-pildora text-tinta hover:bg-[#24466f]",
        )}
      >
        <span
          className={cx(
            "cifras flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[17px] font-bold",
            abierta ? "bg-white text-marca-700" : "bg-white/10 text-white",
          )}
        >
          {cuenta}
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{titulo}</span>
        <ChevronDown size={18} aria-hidden className={cx("shrink-0 transition-transform", abierta && "rotate-180")} />
      </button>
      <div id={id} hidden={!abierta} className="pt-[11px]">
        {cuenta ? <ul className="space-y-[11px]">{children}</ul> : <p className="px-3 py-1 text-sm text-tinta-2">Nadie por ahora.</p>}
      </div>
    </div>
  );
}

function Fila({
  envio: e,
  activa,
  detalle,
  extra,
  onAbrir,
}: {
  envio: Envio;
  activa: boolean;
  detalle: string;
  extra?: ReactNode;
  onAbrir: () => void;
}) {
  return (
    <PildoraLista
      activa={activa}
      titulo={nombreVisible(e.contacto.nombre, e.contacto.esEjemplo)}
      detalle={detalle}
      extra={extra}
      onClick={onAbrir}
    />
  );
}

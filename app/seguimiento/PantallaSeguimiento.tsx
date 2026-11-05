"use client";

import { ArrowRight, Ban, ChartColumn, ChevronDown, ChevronRight, Clock, MessageCircle, Reply, Send, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { Hoja } from "@/components/Hoja";
import { VistaCorreo } from "@/components/VistaCorreo";
import { pedirAbrir } from "@/components/ventanas";
import { BOTON_BARRA, BarraAccion, Boton, BotonEnlace, Cargando, Encabezado, EstadoVacio, Insignia, Tarjeta, cx } from "@/components/ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreVisible } from "@/lib/contactos";
import { enviosHechos, pideBaja, type Envio } from "@/lib/envio";
import { cuandoCorto } from "@/lib/fechas";

export function PantallaSeguimiento() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const router = useRouter();
  const [abierto, setAbierto] = useState<string | null>(null);
  if (!enNavegador) return <Cargando />;

  const envios = enviosHechos(estado);
  const contestaron = envios.filter((e) => e.respuesta).sort((a, b) => b.respuesta!.fecha.localeCompare(a.respuesta!.fecha));
  const noContestaron = envios.filter((e) => !e.respuesta);
  const viendo = envios.find((e) => e.contacto.id === abierto);

  function abrirChat(id: string) {
    pedirAbrir("/chat", id);
    router.push("/chat");
  }

  return (
    <div>
      <Encabezado
        paso={4}
        titulo="Seguimiento"
        subtitulo="Quién te contestó y quién no."
        ayuda={
          <>
            <p>Abre una lista para ver quién te contestó y quién no. Toca un negocio para ver lo que le escribiste.</p>
            <p>Como la demo no envía nada, las respuestas son de ejemplo: las inventa la demo para que veas cómo se vería.</p>
          </>
        }
      />

      {envios.length === 0 ? (
        <EstadoVacio
          icono={<ChartColumn size={30} aria-hidden />}
          titulo="Todavía no envías ningún correo"
          texto="Cuando envíes tus correos, aquí verás quién te contestó."
        >
          <BotonEnlace href="/envio" icono={<Send size={18} aria-hidden />}>
            Ir a Envío
          </BotonEnlace>
        </EstadoVacio>
      ) : (
        <>
          <p className="entrada mb-4 flex items-center gap-2 px-1 text-sm font-semibold text-violeta-700">
            <Insignia tipo="ejemplo" /> Las respuestas las inventa la demo.
          </p>

          <div className="space-y-3">
            <Lista icono={Reply} titulo="Te contestaron" cuenta={contestaron.length} tono="verde">
              {contestaron.map((e) => (
                <Fila
                  key={e.contacto.id}
                  envio={e}
                  detalle={
                    pideBaja(e.respuesta!.texto) ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-rojo-700">
                        <Ban size={13} aria-hidden /> Pidió no recibir correos
                      </span>
                    ) : (
                      `«${e.respuesta!.texto}»`
                    )
                  }
                  cuando={cuandoCorto(e.respuesta!.fecha)}
                  onAbrir={() => setAbierto(e.contacto.id)}
                />
              ))}
            </Lista>
            <Lista icono={Clock} titulo="No te contestaron" cuenta={noContestaron.length} tono="gris">
              {noContestaron.map((e) => (
                <Fila
                  key={e.contacto.id}
                  envio={e}
                  detalle={e.correo.para}
                  cuando={cuandoCorto(e.correo.fecha)}
                  onAbrir={() => setAbierto(e.contacto.id)}
                />
              ))}
            </Lista>
          </div>

          {contestaron.length ? (
            <BarraAccion>
              <BotonEnlace href="/chat" className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />}>
                Siguiente: el chat
              </BotonEnlace>
            </BarraAccion>
          ) : null}
        </>
      )}

      <Hoja
        abierta={!!viendo}
        onCerrar={() => setAbierto(null)}
        titulo={viendo?.respuesta ? "Te contestó" : "Correo enviado"}
        pie={
          viendo?.respuesta ? (
            <Boton className="w-full" icono={<MessageCircle size={18} aria-hidden />} onClick={() => abrirChat(viendo.contacto.id)}>
              Abrir el chat
            </Boton>
          ) : undefined
        }
      >
        {viendo ? <VistaCorreo envio={viendo} ajustes={estado.ajustes} /> : null}
      </Hoja>
    </div>
  );
}

/** Una lista que se abre y se cierra, con cuántos hay a la vista. */
function Lista({
  icono: Icono,
  titulo,
  cuenta,
  tono,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  cuenta: number;
  tono: "verde" | "gris";
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  return (
    <Tarjeta className="entrada overflow-hidden">
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((a) => !a)}
        className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-superficie-2/60 sm:px-5"
      >
        <span
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            tono === "verde" ? "bg-verde-50 text-verde-700" : "bg-fondo text-suave",
          )}
        >
          <Icono size={22} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight font-bold text-tinta">{titulo}</span>
          <span className="block text-sm text-suave">{abierta ? "Toca para cerrar" : "Toca para ver la lista"}</span>
        </span>
        <span className="cifras text-3xl font-bold text-tinta">{cuenta}</span>
        <ChevronDown size={20} aria-hidden className={cx("shrink-0 text-tenue transition-transform", abierta && "rotate-180")} />
      </button>
      <div id={id} hidden={!abierta} className="border-t border-linea">
        {cuenta ? <ul className="divide-y divide-linea">{children}</ul> : <p className="px-5 py-4 text-sm text-suave">Nadie por ahora.</p>}
      </div>
    </Tarjeta>
  );
}

function Fila({ envio: e, detalle, cuando, onAbrir }: { envio: Envio; detalle: ReactNode; cuando: string; onAbrir: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-superficie-2/70 sm:px-5"
      >
        <Avatar nombre={e.contacto.nombre} tamano={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-tinta">{nombreVisible(e.contacto.nombre, e.contacto.esEjemplo)}</span>
          <span className="block truncate text-sm text-suave">{detalle}</span>
        </span>
        <span className="cifras shrink-0 text-sm text-suave">{cuando}</span>
        <ChevronRight size={18} aria-hidden className="shrink-0 text-tenue" />
      </button>
    </li>
  );
}

"use client";

import { ArrowLeft, ArrowUpDown, Ban, MessageCircle, Send, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { chatPedido, olvidarChatPedido } from "@/components/ventanas";
import { BotonEnlace, Cargando, Encabezado, EstadoVacio, Insignia, Selector, cx } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreVisible } from "@/lib/contactos";
import { enviosHechos, marcarLeida, ORDENES_CHAT, ordenarPlaticas, platicas, responderEnChat, type OrdenChat, type Platica } from "@/lib/envio";
import { cuandoCorto, cuandoLargo } from "@/lib/fechas";

const COMPUTADORA = "(min-width: 1024px)";

/** true en pantallas grandes, donde la lista y la plática se ven lado a lado. */
function useEsComputadora(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(COMPUTADORA);
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia(COMPUTADORA).matches,
    () => false,
  );
}

export function PantallaChat() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const esComputadora = useEsComputadora();
  const [orden, setOrden] = useState<OrdenChat>("recientes");
  const [abiertoId, setAbiertoId] = useState<string | null>(() => chatPedido());

  useEffect(() => olvidarChatPedido(), []);

  const lista = enNavegador ? ordenarPlaticas(platicas(estado), orden) : [];
  // En la computadora siempre se ve una plática (de entrada, la más nueva con la que se puede platicar);
  // en el celular, sólo la que tocas.
  const actual =
    lista.find((p) => p.contacto.id === abiertoId) ?? (esComputadora ? (lista.find((p) => !p.baja) ?? lista[0]) : undefined);
  const enPantallaCompleta = !!actual && !esComputadora;

  const idActual = actual?.contacto.id;
  const sinLeer = actual?.noLeida;
  useEffect(() => {
    if (idActual && sinLeer) actualizarEstado((e) => marcarLeida(e, idActual));
  }, [idActual, sinLeer]);

  // En el celular la plática tapa toda la pantalla: la página de atrás no se mueve.
  useEffect(() => {
    if (!enPantallaCompleta) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [enPantallaCompleta]);

  if (!enNavegador) return <Cargando />;
  const enviados = enviosHechos(estado).length;

  return (
    <div>
      <Encabezado
        paso={5}
        titulo="Chat"
        subtitulo="Platica con los negocios que te contestaron."
        ayuda={
          <>
            <p>Aquí aparecen los negocios que te contestaron. Tócalos para ver la plática y responderles.</p>
            <p>En la demo las respuestas son de ejemplo y lo que escribes no se envía.</p>
          </>
        }
      />

      {lista.length === 0 ? (
        enviados ? (
          <EstadoVacio
            icono={<MessageCircle size={30} aria-hidden />}
            titulo="Todavía nadie te contesta"
            texto="Cuando alguien te conteste, aparecerá aquí."
          />
        ) : (
          <EstadoVacio
            icono={<MessageCircle size={30} aria-hidden />}
            titulo="Todavía no envías ningún correo"
            texto="Cuando te contesten, aquí platicas con ellos."
          >
            <BotonEnlace href="/envio" icono={<Send size={18} aria-hidden />}>
              Ir a Envío
            </BotonEnlace>
          </EstadoVacio>
        )
      ) : (
        // Ojo: este contenedor no lleva la animación «entrada». Con ella, la plática del celular (fija a toda la pantalla)
        // quedaría encerrada dentro de la lista.
        <div className="lg:grid lg:h-[calc(100dvh-14rem)] lg:min-h-[30rem] lg:grid-cols-[21rem_minmax(0,1fr)] lg:overflow-hidden lg:rounded-tarjeta lg:border lg:border-linea/80 lg:bg-superficie lg:shadow-tarjeta">
          <section
            aria-label="Negocios que te contestaron"
            className="entrada overflow-hidden rounded-tarjeta border border-linea/80 bg-superficie shadow-tarjeta lg:flex lg:min-h-0 lg:flex-col lg:rounded-none lg:border-0 lg:border-r lg:shadow-none"
          >
            <div className="flex items-center gap-2.5 border-b border-linea px-3 py-2.5">
              <Selector
                etiqueta="Ordenar"
                icono={<ArrowUpDown size={16} aria-hidden />}
                valor={orden}
                onChange={(v) => setOrden(v as OrdenChat)}
                className="flex-1"
              >
                {ORDENES_CHAT.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </Selector>
              <Insignia tipo="ejemplo" />
            </div>
            <ul className="divide-y divide-linea lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {lista.map((p) => (
                <li key={p.contacto.id}>
                  <FilaPlatica platica={p} activa={esComputadora && p.contacto.id === actual?.contacto.id} onAbrir={() => setAbiertoId(p.contacto.id)} />
                </li>
              ))}
            </ul>
          </section>

          {actual ? (
            <div
              role={enPantallaCompleta ? "dialog" : undefined}
              aria-modal={enPantallaCompleta || undefined}
              aria-label={`Plática con ${nombreVisible(actual.contacto.nombre, actual.contacto.esEjemplo)}`}
              className="fixed inset-0 z-50 flex flex-col bg-fondo pt-[env(safe-area-inset-top,0px)] lg:static lg:z-auto lg:min-h-0 lg:pt-0"
            >
              <Conversacion key={actual.contacto.id} platica={actual} onVolver={() => setAbiertoId(null)} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilaPlatica({ platica: p, activa, onAbrir }: { platica: Platica; activa: boolean; onAbrir: () => void }) {
  const nombre = nombreVisible(p.contacto.nombre, p.contacto.esEjemplo);
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-current={activa || undefined}
      aria-label={`${nombre}${p.noLeida ? ", mensaje nuevo" : ""}`}
      className={cx("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", activa ? "bg-marca-50" : "hover:bg-fondo")}
    >
      <span className="relative shrink-0">
        <Avatar nombre={p.contacto.nombre} tamano={44} apagado={p.baja} />
        {p.noLeida ? <span aria-hidden className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-marca-600 ring-2 ring-white" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cx("min-w-0 flex-1 truncate text-tinta", p.noLeida ? "font-bold" : "font-semibold")}>{nombre}</span>
          <span className={cx("cifras shrink-0 text-xs", p.noLeida ? "font-bold text-marca-700" : "text-tenue")}>{cuandoCorto(p.ultimo.fecha)}</span>
        </span>
        <span className={cx("block truncate text-sm", p.noLeida ? "font-semibold text-tinta-2" : "text-suave")}>
          {p.baja && p.ultimo.de === "ellos" ? (
            <span className="inline-flex items-center gap-1 font-semibold text-rojo-700">
              <Ban size={13} aria-hidden /> Pidió no recibir correos
            </span>
          ) : (
            `${p.ultimo.de === "yo" ? "Tú: " : ""}${p.ultimo.texto}`
          )}
        </span>
      </span>
    </button>
  );
}

function Conversacion({ platica: p, onVolver }: { platica: Platica; onVolver: () => void }) {
  const [texto, setTexto] = useState("");
  const [correoCompleto, setCorreoCompleto] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const nombre = nombreVisible(p.contacto.nombre, p.contacto.esEjemplo);
  const cuantos = p.mensajes.length;

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [cuantos]);

  function mandar(ev?: FormEvent) {
    ev?.preventDefault();
    if (!texto.trim()) return;
    // Simulación: se queda en este navegador, no se envía a nadie.
    actualizarEstado((e) => responderEnChat(e, p.contacto.id, texto));
    setTexto("");
  }

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-linea bg-superficie py-2.5 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] lg:px-5 lg:py-3">
        <button type="button" onClick={onVolver} aria-label="Volver a la lista" className="rounded-full p-2 text-tinta-2 hover:bg-fondo lg:hidden">
          <ArrowLeft size={22} aria-hidden />
        </button>
        <Avatar nombre={p.contacto.nombre} tamano={40} apagado={p.baja} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-tinta">{nombre}</p>
          <p className="truncate text-xs text-suave">{p.correo.para}</p>
        </div>
        <Insignia tipo="ejemplo" />
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
        <Burbuja de="yo" fecha={p.correo.fecha}>
          <p className="font-semibold">{p.correo.asunto}</p>
          <p className={cx("mt-1.5 whitespace-pre-wrap", !correoCompleto && "line-clamp-5")}>{p.correo.texto}</p>
          <button
            type="button"
            onClick={() => setCorreoCompleto((v) => !v)}
            className="mt-1.5 text-sm font-bold text-white/90 underline underline-offset-2"
          >
            {correoCompleto ? "Ver menos" : "Ver el correo completo"}
          </button>
        </Burbuja>
        {p.mensajes.map((m) => (
          <Burbuja key={m.id} de={m.de} fecha={m.fecha}>
            <p className="whitespace-pre-wrap">{m.texto}</p>
          </Burbuja>
        ))}
        {p.baja ? (
          <p className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-2xl bg-rojo-50 px-3 py-2 text-xs font-semibold text-rojo-700">
            <Ban size={13} aria-hidden className="shrink-0" /> Pidió no recibir más correos. Quedó en «No contactar».
          </p>
        ) : null}
        <div ref={finRef} />
      </div>

      {p.baja ? (
        <p className="shrink-0 border-t border-linea bg-superficie px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] text-center text-sm font-semibold text-suave">
          Ya no le puedes escribir.
        </p>
      ) : (
        <form
          onSubmit={mandar}
          className="flex shrink-0 items-end gap-2 border-t border-linea bg-superficie pt-2.5 pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] lg:px-4 lg:pb-3"
        >
          <label htmlFor={`respuesta-${p.contacto.id}`} className="sr-only">
            Tu respuesta
          </label>
          <textarea
            id={`respuesta-${p.contacto.id}`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) mandar(e);
            }}
            rows={Math.min(5, texto.split("\n").length)}
            placeholder="Escribe tu respuesta (simulación)"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-[22px] border border-linea bg-fondo px-4 py-2.5 text-[15px] leading-snug text-tinta outline-none placeholder:text-tenue focus:border-marca-500 focus:bg-white focus:ring-4 focus:ring-marca-100"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            aria-label="Enviar respuesta"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marca-600 text-white shadow-sm shadow-marca-600/30 transition-colors hover:bg-marca-700 disabled:opacity-40"
          >
            <SendHorizontal size={20} aria-hidden />
          </button>
        </form>
      )}
    </>
  );
}

function Burbuja({ de, fecha, children }: { de: "yo" | "ellos"; fecha: string; children: ReactNode }) {
  const mio = de === "yo";
  return (
    <div className={cx("flex flex-col", mio ? "items-end" : "items-start")}>
      <div
        className={cx(
          "max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[75%]",
          mio ? "rounded-br-lg bg-marca-600 text-white" : "rounded-bl-lg border border-linea bg-superficie text-tinta",
        )}
      >
        {children}
      </div>
      <span className="mt-1 px-1 text-[11px] text-tenue">
        {mio ? "Tú" : "Te contestó"} · {cuandoLargo(fecha)}
      </span>
    </div>
  );
}

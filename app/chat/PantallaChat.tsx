"use client";

import { ArrowUpDown, Ban, CheckCheck, ChevronDown, FlaskConical, MessageCircle, Send, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  CargandoPanel,
  ContenidoClaro,
  EnlacePie,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  VacioClaro,
  useEsComputadora,
} from "@/components/PanelNexora";
import { olvidarPedido, useLoPedido } from "@/components/ventanas";
import { cx } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreVisible } from "@/lib/contactos";
import {
  enviosHechos,
  marcarLeida,
  ORDENES_CHAT,
  ordenarPlaticas,
  platicas,
  responderEnChat,
  type OrdenChat,
  type Platica,
} from "@/lib/envio";
import { hora } from "@/lib/fechas";

export function PantallaChat() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const esComputadora = useEsComputadora();
  const [orden, setOrden] = useState<OrdenChat>("recientes");
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  // Si otra pantalla pide abrir una plática (el buscador de arriba o la campana), se abre aunque ya
  // estuvieras aquí. El número de la petición evita abrirlo dos veces.
  const pedido = useLoPedido("/chat");
  const [pedidoVisto, setPedidoVisto] = useState(0);
  if (pedido && pedido.numero !== pedidoVisto) {
    setPedidoVisto(pedido.numero);
    setAbiertoId(pedido.id);
  }
  useEffect(() => {
    if (pedido) olvidarPedido("/chat");
  }, [pedido]);

  const lista = enNavegador ? ordenarPlaticas(platicas(estado), orden) : [];
  // En la computadora siempre se ve una plática (de entrada, la más nueva con la que se puede platicar);
  // en el celular, sólo la que tocas.
  const actual =
    lista.find((p) => p.contacto.id === abiertoId) ?? (esComputadora ? (lista.find((p) => !p.baja) ?? lista[0]) : undefined);

  const idActual = actual?.contacto.id;
  const sinLeer = actual?.noLeida;
  useEffect(() => {
    if (idActual && sinLeer) actualizarEstado((e) => marcarLeida(e, idActual));
  }, [idActual, sinLeer]);

  if (!enNavegador) return <CargandoPanel />;
  const enviados = enviosHechos(estado).length;
  const nombreActual = actual ? nombreVisible(actual.contacto.nombre, actual.contacto.esEjemplo) : "";

  return (
    <PanelNexora
      titulo="Chat"
      ayuda={
        <>
          <p>Aquí aparecen los negocios que te contestaron. Toca uno para ver la plática y responderle.</p>
          <p>Es de ejemplo: las respuestas las inventa la demo y lo que escribes no se envía.</p>
        </>
      }
      pastilla={
        actual ? (
          <PastillaCliente texto={actual.correo.para} />
        ) : lista.length ? (
          <PastillaCliente texto={lista.length === 1 ? "1 te contestó" : `${lista.length} te contestaron`} />
        ) : undefined
      }
      etiquetaLista="Negocios que te contestaron"
      lista={
        lista.length ? (
          <>
            <label className="relative mb-2.5 block">
              <span className="sr-only">Ordenar</span>
              <ArrowUpDown size={15} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-marca-400" />
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as OrdenChat)}
                className="h-9 w-full appearance-none rounded-full bg-pildora pr-9 pl-9 text-[13px] font-semibold text-tinta-2 outline-none focus:ring-2 focus:ring-marca-400"
              >
                {ORDENES_CHAT.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-suave" />
            </label>
            <ul className="space-y-[11px]">
              {lista.map((p) => (
                <li key={p.contacto.id}>
                  <FilaPlatica platica={p} activa={p.contacto.id === actual?.contacto.id} onAbrir={() => setAbiertoId(p.contacto.id)} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="px-2 py-3 text-sm text-tinta-2">{enviados ? "Todavía nadie te contesta." : "Todavía no envías ningún correo."}</p>
        )
      }
      etiquetaPrincipal={actual ? `Plática con ${nombreActual}` : "Plática"}
      modo="detalle"
      detalleAbierto={!!actual}
      onCerrarDetalle={() => setAbiertoId(null)}
      encabezadoDetalle={actual ? <PastillaCliente texto={actual.correo.para} /> : undefined}
      principalConScroll={false}
      principal={actual ? <Conversacion key={actual.contacto.id} platica={actual} /> : <SinPlaticas enviados={enviados} />}
    />
  );
}

function SinPlaticas({ enviados }: { enviados: number }) {
  return (
    <ContenidoClaro className="flex-1">
      <VacioClaro
        icono={<MessageCircle size={28} aria-hidden />}
        titulo={enviados ? "Todavía nadie te contesta" : "Todavía no envías ningún correo"}
        texto={enviados ? "Cuando alguien te conteste, aparecerá aquí." : "Cuando te contesten, aquí platicas con ellos."}
      >
        {enviados ? null : (
          <EnlacePie href="/envio" icono={<Send size={18} aria-hidden />}>
            Ir a Envío
          </EnlacePie>
        )}
      </VacioClaro>
    </ContenidoClaro>
  );
}

function FilaPlatica({ platica: p, activa, onAbrir }: { platica: Platica; activa: boolean; onAbrir: () => void }) {
  const nombre = nombreVisible(p.contacto.nombre, p.contacto.esEjemplo);
  return (
    <PildoraLista
      activa={activa}
      titulo={nombre}
      detalle={p.baja && p.ultimo.de === "ellos" ? "Pidió no recibir correos" : p.correo.para}
      etiqueta={`${nombre}${p.noLeida ? ", mensaje nuevo" : ""}${p.baja ? ", pidió no recibir correos" : ""}`}
      apagada={p.baja}
      onClick={onAbrir}
      extra={
        p.baja ? (
          <Ban size={16} aria-hidden className={activa ? "text-[#8e1b1b]" : "text-rojo-700"} />
        ) : p.noLeida ? (
          <span aria-hidden className="block h-3 w-3 rounded-full bg-marca-500 ring-2 ring-pildora" />
        ) : null
      }
    />
  );
}

function Conversacion({ platica: p }: { platica: Platica }) {
  const [texto, setTexto] = useState("");
  const [correoCompleto, setCorreoCompleto] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
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
      <div className="fondo-platica barra-fina min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-4 sm:px-6">
        <p className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-[#fff5c4] px-3 py-1.5 text-center text-xs font-semibold text-[#5c4b00] shadow-sm">
          <FlaskConical size={13} aria-hidden className="shrink-0" /> Ejemplo: esta plática la inventa la demo. Lo que escribes no se envía.
        </p>
        <Burbuja de="yo" fecha={p.correo.fecha}>
          <p className="font-semibold">{p.correo.asunto}</p>
          <p className={cx("mt-1 whitespace-pre-wrap", !correoCompleto && "line-clamp-5")}>{p.correo.texto}</p>
          <button
            type="button"
            onClick={() => setCorreoCompleto((v) => !v)}
            className="mt-1 text-sm font-bold text-[#1c6b3f] underline underline-offset-2"
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
          <p className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-[#fde2e2] px-3 py-2 text-xs font-semibold text-[#8e1b1b] shadow-sm">
            <Ban size={13} aria-hidden className="shrink-0" /> Pidió no recibir más correos. Quedó en «No contactar».
          </p>
        ) : null}
        <div ref={finRef} />
      </div>

      {p.baja ? (
        <p className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] text-center text-sm font-semibold text-suave lg:pb-3">
          Ya no le puedes escribir.
        </p>
      ) : (
        <form
          onSubmit={mandar}
          className="flex shrink-0 items-end gap-2 pt-2 pr-[max(0.5rem,env(safe-area-inset-right,0px))] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] lg:px-0 lg:pt-2 lg:pb-2"
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
            className="max-h-36 min-h-11 flex-1 resize-none rounded-[22px] bg-pildora px-4 py-2.5 text-[15px] leading-snug text-tinta outline-none placeholder:text-suave focus:ring-2 focus:ring-marca-400"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            aria-label="Enviar respuesta"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marca-600 text-white transition-colors hover:bg-marca-700 disabled:opacity-40"
          >
            <SendHorizontal size={20} aria-hidden />
          </button>
        </form>
      )}
    </>
  );
}

/** Una burbuja de la plática: las tuyas a la derecha en verde, las suyas a la izquierda en blanco. */
function Burbuja({ de, fecha, children }: { de: "yo" | "ellos"; fecha: string; children: ReactNode }) {
  const mio = de === "yo";
  return (
    <div className={cx("flex", mio ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[85%] rounded-lg px-3 py-2 text-[15px] leading-relaxed text-chat-tinta shadow-sm sm:max-w-[70%] lg:text-[16px]",
          mio ? "rounded-tr-none bg-chat-mio" : "rounded-tl-none bg-chat-suyo",
        )}
      >
        <span className="sr-only">{mio ? "Tú escribiste:" : "Te contestó:"}</span>
        {children}
        <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-chat-tenue">
          {hora(fecha)}
          {mio ? <CheckCheck size={14} aria-label="Entregado" className="text-[#3f9fe0]" /> : null}
        </span>
      </div>
    </div>
  );
}

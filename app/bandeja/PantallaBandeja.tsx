"use client";

import { CheckCheck, Clock, FlaskConical, Inbox, SendHorizontal, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  BotonPildora,
  CargandoPanel,
  ContenidoClaro,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  VacioClaro,
  useEsComputadora,
} from "@/components/PanelNexora";
import { CirculoRed, IconoRed } from "@/components/IconoRed";
import { cx } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import {
  anclajeDeSesion,
  conversaciones,
  ficha,
  marcarLeidaRed,
  plazo,
  responderEnRed,
  sePuedeContestar,
  sinLeer,
  sinLeerPorRed,
  type Conversacion,
} from "@/lib/bandeja";
import { cuandoCorto, hora } from "@/lib/fechas";
import { nombreRed, ORDEN_REDES, REDES } from "@/lib/redes";
import type { Red } from "@/lib/tipos";

/** Cada minuto se vuelve a dibujar, para que el reloj del plazo vaya bajando. */
function useMinuto(): number {
  const [tic, setTic] = useState(0);
  useEffect(() => {
    const reloj = setInterval(() => setTic((n) => n + 1), 60_000);
    return () => clearInterval(reloj);
  }, []);
  return tic;
}

export function PantallaBandeja() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const esComputadora = useEsComputadora();
  const [filtro, setFiltro] = useState<Red | "todas">("todas");
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  useMinuto();

  const todas = enNavegador ? conversaciones(estado, anclajeDeSesion()) : [];
  const lista = filtro === "todas" ? todas : todas.filter((c) => c.red === filtro);

  // En la computadora siempre se ve una plática; en el celular, sólo la que tocas.
  const actual = todas.find((c) => c.id === abiertaId) ?? (esComputadora ? lista[0] : undefined);

  const idActual = actual?.id;
  const actualSinLeer = actual?.noLeida;
  useEffect(() => {
    if (idActual && actualSinLeer) actualizarEstado((e) => marcarLeidaRed(e, idActual));
  }, [idActual, actualSinLeer]);

  if (!enNavegador) return <CargandoPanel />;

  // La hora se lee aquí, ya en el navegador: si se leyera antes, la página armada en el
  // servidor se quedaría con la hora de cuando se armó y el reloj del plazo no serviría.
  const ahora = new Date();
  const nuevos = sinLeer(todas);
  const porRed = sinLeerPorRed(todas);

  return (
    <PanelNexora
      titulo="Bandeja"
      ayuda={
        <>
          <p>Aquí llegan juntos los mensajes de Instagram, WhatsApp, Facebook, TikTok y correo. Contestas desde aquí y Nexora lo entrega por donde te escribieron.</p>
          <p>Cada plática avisa cuánto te queda para contestar: las redes dan 24 horas, TikTok 48.</p>
          <p>Es de ejemplo: estas pláticas son inventadas y nada se manda de verdad.</p>
        </>
      }
      pastilla={
        actual ? (
          <PastillaCliente texto={`${actual.persona} · ${nombreRed(actual.red)}`} icono={<IconoRed red={actual.red} tamano={18} />} />
        ) : (
          <PastillaCliente
            texto={nuevos ? (nuevos === 1 ? "1 mensaje nuevo" : `${nuevos} mensajes nuevos`) : "Bandeja al día"}
            icono={<Inbox size={18} aria-hidden className="text-marca-400" />}
          />
        )
      }
      etiquetaLista="Mensajes de todas las redes"
      lista={
        <>
          {/* En el celular los filtros se deslizan de lado, como en las apps; en computadora caben en dos renglones. */}
          <div className="barra-fina mb-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
            <BotonPildora className="shrink-0" activo={filtro === "todas"} onClick={() => setFiltro("todas")}>
              Todas
            </BotonPildora>
            {ORDEN_REDES.map((r) => (
              <BotonPildora
                key={r}
                className="shrink-0"
                activo={filtro === r}
                onClick={() => setFiltro(r)}
                icono={<IconoRed red={r} tamano={14} />}
                aria-label={porRed[r] ? `${nombreRed(r)} (${porRed[r]} sin leer)` : nombreRed(r)}
              >
                {nombreRed(r)}
                {porRed[r] ? <span className="cifras ml-1 font-bold text-marca-400">{porRed[r]}</span> : null}
              </BotonPildora>
            ))}
          </div>
          {lista.length ? (
            <ul className="space-y-[11px]">
              {lista.map((c) => (
                <li key={c.id}>
                  <Fila conversacion={c} ahora={ahora} activa={c.id === actual?.id} onAbrir={() => setAbiertaId(c.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-3 text-sm text-tinta-2">No hay mensajes de {nombreRed(filtro as Red)}.</p>
          )}
        </>
      }
      etiquetaPrincipal={actual ? `Plática con ${actual.persona}` : "Plática"}
      modo="detalle"
      detalleAbierto={!!actual}
      onCerrarDetalle={() => setAbiertaId(null)}
      encabezadoDetalle={
        actual ? (
          <PastillaCliente texto={`${actual.persona} · ${nombreRed(actual.red)}`} icono={<IconoRed red={actual.red} tamano={18} />} />
        ) : undefined
      }
      principalConScroll={false}
      principal={
        actual ? (
          <Platica key={actual.id} conversacion={actual} todas={todas} ahora={ahora} onIr={setAbiertaId} />
        ) : (
          <ContenidoClaro className="flex-1">
            <VacioClaro
              icono={<Inbox size={28} aria-hidden />}
              titulo="Toca un mensaje"
              texto="Aquí se abre la plática y le contestas sin salir de Nexora."
            />
          </ContenidoClaro>
        )
      }
    />
  );
}

function Fila({
  conversacion: c,
  ahora,
  activa,
  onAbrir,
}: {
  conversacion: Conversacion;
  ahora: Date;
  activa: boolean;
  onAbrir: () => void;
}) {
  const p = plazo(c, ahora);
  const adelanto = c.ultimo.de === "yo" ? `Tú: ${c.ultimo.texto}` : c.ultimo.texto;
  return (
    <PildoraLista
      activa={activa}
      titulo={c.persona}
      detalle={adelanto}
      icono={<CirculoRed red={c.red} activa={activa} />}
      etiqueta={`${c.persona}, ${nombreRed(c.red)}${c.noLeida ? ", mensaje nuevo" : ""}${p?.vencido ? ", se pasó el plazo" : ""}`}
      apagada={!!p?.vencido}
      onClick={onAbrir}
      extra={
        <span className="flex flex-col items-end gap-1">
          <span className={cx("cifras text-[11px] leading-none", activa ? "text-black/70" : "text-suave")}>{cuandoCorto(c.ultimo.fecha, ahora)}</span>
          {c.noLeida ? (
            <span aria-hidden className="block h-3 w-3 rounded-full bg-marca-500 ring-2 ring-pildora" />
          ) : p?.urgente ? (
            <Clock size={14} aria-hidden className={activa ? "text-[#8a5a00]" : "text-ambar-700"} />
          ) : null}
        </span>
      }
    />
  );
}

function Platica({
  conversacion: c,
  todas,
  ahora,
  onIr,
}: {
  conversacion: Conversacion;
  todas: Conversacion[];
  ahora: Date;
  onIr: (id: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const finRef = useRef<HTMLDivElement>(null);
  const cuantos = c.mensajes.length;
  const p = plazo(c, ahora);
  const sePuede = sePuedeContestar(c, ahora);
  const f = ficha(todas, c.personaId);
  const otros = f?.canales.filter((x) => x.conversacionId !== c.id) ?? [];

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [cuantos]);

  function mandar(ev?: FormEvent) {
    ev?.preventDefault();
    if (!texto.trim() || !sePuede) return;
    // Simulación: se queda en este navegador, no se manda a ninguna red.
    actualizarEstado((e) => responderEnRed(e, c.id, texto, anclajeDeSesion()));
    setTexto("");
  }

  return (
    <>
      <div className="fondo-platica barra-fina min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-4 sm:px-6">
        <p className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-[#fff5c4] px-3 py-1.5 text-center text-xs font-semibold text-[#5c4b00] shadow-sm">
          <FlaskConical size={13} aria-hidden className="shrink-0" /> Ejemplo: esta plática la inventa la demo. Nada se manda de verdad.
        </p>

        <Tarjeta>
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-chat-tinta">
            <IconoRed red={c.red} tamano={15} /> {c.usuario}
          </p>
          {otros.length ? (
            <p className="mt-1 text-[12.5px] text-chat-tenue">
              También te escribió por{" "}
              {otros.map((o, i) => (
                <span key={o.conversacionId}>
                  {i ? " y " : ""}
                  <button type="button" onClick={() => onIr(o.conversacionId)} className="font-bold text-[#1c6b3f] underline underline-offset-2">
                    {nombreRed(o.red)}
                  </button>
                </span>
              ))}
              . Es la misma persona.
            </p>
          ) : null}
        </Tarjeta>

        {c.mensajes.map((m) => (
          <Burbuja key={m.id} de={m.de} fecha={m.fecha} red={c.red}>
            <p className="whitespace-pre-wrap">{m.texto}</p>
          </Burbuja>
        ))}

        {p ? (
          <p
            className={cx(
              "mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm",
              p.vencido ? "bg-[#fde2e2] text-[#8e1b1b]" : p.urgente ? "bg-[#ffe7bd] text-[#7a4b00]" : "bg-[#dff0e4] text-[#1c6b3f]",
            )}
          >
            {p.vencido ? <TriangleAlert size={13} aria-hidden className="shrink-0" /> : <Clock size={13} aria-hidden className="shrink-0" />}
            {p.vencido ? `${nombreRed(c.red)} ya no entrega tu respuesta. Márcale o escríbele por correo.` : `${p.texto}, según las reglas de ${nombreRed(c.red)}.`}
          </p>
        ) : null}

        <div ref={finRef} />
      </div>

      {sePuede ? (
        <form
          onSubmit={mandar}
          className="flex shrink-0 items-end gap-2 pt-2 pr-[max(0.5rem,env(safe-area-inset-right,0px))] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] lg:px-0 lg:pt-2 lg:pb-2"
        >
          <label htmlFor={`respuesta-red-${c.id}`} className="sr-only">
            Tu respuesta para {c.persona}
          </label>
          <textarea
            id={`respuesta-red-${c.id}`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) mandar(e);
            }}
            rows={Math.min(5, texto.split("\n").length)}
            placeholder={`Contéstale por ${nombreRed(c.red)} (simulación)`}
            className="max-h-36 min-h-11 flex-1 resize-none rounded-[22px] bg-pildora px-4 py-2.5 text-[15px] leading-snug text-tinta outline-none placeholder:text-suave focus:ring-2 focus:ring-marca-400"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            aria-label={`Enviar por ${nombreRed(c.red)}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marca-600 text-white transition-colors hover:bg-marca-700 disabled:opacity-40"
          >
            <SendHorizontal size={20} aria-hidden />
          </button>
        </form>
      ) : (
        <p className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] text-center text-sm font-semibold text-suave lg:pb-3">
          Se pasó el plazo de {nombreRed(c.red)}: ya no le puedes escribir por aquí.
        </p>
      )}
    </>
  );
}

/** Tarjeta blanca chica, para la ficha de la persona arriba de la plática. */
function Tarjeta({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-fit max-w-full rounded-lg bg-white/90 px-3 py-2 text-center shadow-sm">{children}</div>;
}

/** Una burbuja: las tuyas a la derecha en verde, las suyas a la izquierda en blanco. */
function Burbuja({ de, fecha, red, children }: { de: "yo" | "ellos"; fecha: string; red: Red; children: ReactNode }) {
  const mio = de === "yo";
  return (
    <div className={cx("flex", mio ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[85%] rounded-lg px-3 py-2 text-[15px] leading-relaxed text-chat-tinta shadow-sm sm:max-w-[70%] lg:text-[16px]",
          mio ? "rounded-tr-none bg-chat-mio" : "rounded-tl-none bg-chat-suyo",
        )}
      >
        <span className="sr-only">{mio ? "Tú escribiste:" : "Te escribió:"}</span>
        {children}
        <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-chat-tenue">
          {mio ? `Entregado en ${REDES[red].nombre} · ${hora(fecha)}` : hora(fecha)}
          {mio ? <CheckCheck size={14} aria-hidden className="text-[#3f9fe0]" /> : null}
        </span>
      </div>
    </div>
  );
}

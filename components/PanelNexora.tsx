"use client";

import Link from "next/link";
import { ArrowLeft, Building2, ChevronDown, CircleHelp, FlaskConical, Tag, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { EMPRESAS, empresaPorId } from "@/lib/bandeja";
import { nombreRed } from "@/lib/redes";

/*
 * El marco de cada pantalla, copiado del diseño NEXORA (1440×810):
 *
 *   ┌──────────────┬──────────────────────────────────────────────┐
 *   │ tarjeta roja │ barra azul: [pastilla]   [?][Compartir][Editar]│  125 px
 *   ├──────────────┼──────────────────────────────────────────────┤
 *   │ lista        │ contenido                                    │
 *   │ (232 px)     │                                              │
 *   └──────────────┴──────────────────────────────────────────────┘
 *
 * En la computadora todo cabe en una pantalla, como una app de mensajes: la lista y el contenido
 * se desplazan por dentro. En el celular las piezas van una debajo de otra y, en las pantallas
 * de «lista y detalle», el detalle se abre encima a pantalla completa (como una plática).
 */

const COMPUTADORA = "(min-width: 1024px)";

/** true en pantallas grandes, donde la lista y el contenido se ven lado a lado. */
export function useEsComputadora(): boolean {
  return useSyncExternalStore(
    (avisarCambio) => {
      const m = window.matchMedia(COMPUTADORA);
      m.addEventListener("change", avisarCambio);
      return () => m.removeEventListener("change", avisarCambio);
    },
    () => window.matchMedia(COMPUTADORA).matches,
    () => false,
  );
}

/** El avatar del diseño: un círculo con la silueta de una persona. */
export function AvatarPersona({ tamano = 40, className }: { tamano?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={tamano} height={tamano} aria-hidden className={cx("shrink-0", className)}>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="24" cy="18.5" r="8.4" fill="currentColor" />
      <path d="M8.13 38.5C10.5 32.5 16.8 29 24 29s13.5 3.5 15.87 9.5A21.5 21.5 0 0 1 8.13 38.5Z" fill="currentColor" />
    </svg>
  );
}

/** La pastilla verde de la barra azul: a quién estás viendo (o de qué trata la pantalla). */
export function PastillaCliente({ texto, icono }: { texto: string; icono?: ReactNode }) {
  const tamano =
    texto.length <= 26
      ? "lg:text-[20px] lg:tracking-[0.18em]"
      : texto.length <= 36
        ? "lg:text-[18px] lg:tracking-[0.14em]"
        : "lg:text-[16px] lg:tracking-[0.1em]";
  return (
    <p className="inline-flex h-12 max-w-full min-w-0 items-center gap-2 rounded-full bg-logo pr-5 pl-1 text-black lg:h-[58px] lg:gap-1.5 lg:pr-7 lg:pl-1.5">
      {icono ?? <AvatarPersona tamano={40} className="lg:h-[50px] lg:w-[50px]" />}
      <span className={cx("min-w-0 truncate text-[14.5px] italic tracking-[0.06em]", tamano)}>{texto}</span>
    </p>
  );
}

/** Un renglón de la lista de la izquierda, como las pastillas del diseño. La elegida va en azul claro. */
export function PildoraLista({
  activa = false,
  titulo,
  detalle,
  extra,
  etiqueta,
  onClick,
  apagada = false,
  icono,
}: {
  activa?: boolean;
  titulo: string;
  detalle?: ReactNode;
  /** Algo a la derecha: la hora, una palomita o un aviso. */
  extra?: ReactNode;
  etiqueta?: string;
  onClick?: () => void;
  apagada?: boolean;
  /** En lugar de la silueta de persona. */
  icono?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={activa || undefined}
      aria-label={etiqueta}
      className={cx(
        "flex min-h-[46px] w-full items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-left transition-colors",
        activa ? "bg-pildora-activa text-black" : "bg-pildora text-tinta-2 hover:bg-[#24466f]",
        apagada && !activa && "opacity-60",
      )}
    >
      {icono ?? <AvatarPersona tamano={38} className="text-black" />}
      <span className="min-w-0 flex-1 italic">
        <span className={cx("block truncate text-[15px] leading-[1.25] tracking-[0.08em]", activa ? "font-medium" : "")}>{titulo}</span>
        {detalle ? (
          <span className={cx("block truncate text-[12.5px] leading-[1.3] tracking-[0.06em]", activa ? "text-black/75" : "text-suave")}>
            {detalle}
          </span>
        ) : null}
      </span>
      {extra ? <span className="shrink-0 not-italic">{extra}</span> : null}
    </button>
  );
}

/** Título chico de una sección de la lista de la izquierda. */
export function TituloLista({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("px-1.5 text-[11px] font-bold tracking-[0.08em] text-marca-200/80 uppercase", className)}>{children}</p>;
}

/** La tarjeta roja de arriba a la izquierda: la empresa que estás viendo, o todas. */
function TarjetaRoja() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const empresa = enNavegador ? empresaPorId(estado.empresaActiva) : null;
  const cuentas = empresa ? empresa.cuentas : EMPRESAS.flatMap((e) => e.cuentas);
  const redes = [...new Set(cuentas.map((k) => k.red))];
  return (
    <div className="flex flex-col bg-proyecto px-4 pt-3 pb-3 text-white lg:h-full lg:overflow-hidden lg:px-[9px] lg:pt-[11px] lg:pb-[7px]">
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-[2px] bg-marca-600 px-1.5 text-[9px] leading-[13px] font-bold text-white uppercase">Ejemplo</span>
        <span className="rounded-[2px] bg-pildora px-1.5 text-[9px] leading-[13px] font-bold text-marca-200 uppercase">
          {empresa ? empresa.giro : "Equipo"}
        </span>
      </span>
      <span className="mt-2 flex items-center gap-1 text-[10px] leading-3 text-white/50 lg:mt-[4px]">
        <Building2 size={11} aria-hidden /> {empresa ? "Empresa" : "Todas las empresas"}
      </span>
      <span className="mt-0.5 line-clamp-2 text-[20px] leading-[1.25] font-bold lg:mt-0 lg:pl-[3px] lg:text-[23px] lg:leading-[33px]">
        {empresa ? empresa.nombre : `${EMPRESAS.length} empresas`}
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-0.5 text-[10px] leading-3 font-bold lg:mt-auto">
        {empresa ? (
          <span className="inline-flex items-center gap-1">
            <Tag size={11} aria-hidden className="text-[#9fb0c2]" /> {empresa.producto}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-cifra" /> {cuentas.length} cuentas:{" "}
          {redes.map(nombreRed).join(", ")}
        </span>
      </span>
    </div>
  );
}

const BOTON_BARRA_AZUL =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[3px] text-[12.5px] font-bold whitespace-nowrap transition-colors lg:h-[27px] lg:text-[11px] [&>svg]:shrink-0 [&>svg]:lg:h-[12px] [&>svg]:lg:w-[12px]";

/** La barra azul, arriba a la derecha: la pastilla y el botón de ayuda. */
function BarraAzul({ pastilla, ayuda }: { pastilla?: ReactNode; ayuda: ReactNode }) {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const idAyuda = useId();

  return (
    <div className="relative flex items-center gap-3 bg-panel px-3 py-3 lg:h-full lg:items-start lg:py-0 lg:pr-[34px] lg:pl-[25px]">
      <div className="flex min-w-0 flex-1 lg:h-full lg:items-center">{pastilla}</div>
      <div className="flex shrink-0 gap-2 lg:mt-[25px] lg:gap-[9px]">
        <button
          type="button"
          aria-label="¿Qué hace esto?"
          title="¿Qué hace esto?"
          aria-expanded={ayudaAbierta}
          aria-controls={idAyuda}
          onClick={() => setAyudaAbierta((v) => !v)}
          className={cx(BOTON_BARRA_AZUL, "w-9 lg:w-[27px] [&>svg]:lg:h-[14px] [&>svg]:lg:w-[14px]", ayudaAbierta ? "bg-marca-600 text-white" : "bg-pildora text-marca-400 hover:bg-[#24466f]")}
        >
          <CircleHelp size={16} aria-hidden />
        </button>
      </div>

      {ayudaAbierta ? (
        <div
          id={idAyuda}
          role="region"
          aria-label="¿Qué hace esto?"
          className="entrada absolute top-full right-3 left-3 z-30 mt-1.5 rounded-[3px] border border-linea bg-superficie p-4 text-[15px] leading-relaxed text-tinta-2 shadow-flotante sm:left-auto sm:w-[22rem] lg:top-[3.6rem] lg:right-[34px] lg:mt-0"
        >
          <div className="flex items-start gap-2">
            <p className="flex-1 font-bold text-tinta">¿Qué hace esto?</p>
            <button
              type="button"
              aria-label="Cerrar la ayuda"
              onClick={() => setAyudaAbierta(false)}
              className="-mt-1 -mr-1 rounded-full p-1 text-suave hover:bg-white/10 hover:text-tinta"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="mt-1.5 space-y-2">{ayuda}</div>
        </div>
      ) : null}
    </div>
  );
}

/** El botón grande del paso que sigue, con una nota opcional a su izquierda. */
function Pie({ nota, children, fijo }: { nota?: ReactNode; children: ReactNode; fijo: boolean }) {
  const contenido = (
    <div className="mx-auto flex max-w-xl flex-col gap-1.5 lg:max-w-none lg:flex-row lg:items-center lg:justify-end lg:gap-4">
      {nota ? <div className="text-center text-sm font-semibold text-tinta-2 lg:mr-auto lg:text-left">{nota}</div> : null}
      {children}
    </div>
  );
  if (!fijo) {
    return (
      <div className="shrink-0 border-t border-white/5 bg-marco-2 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] lg:px-4 lg:py-3">
        {contenido}
      </div>
    );
  }
  // En el celular queda fijo abajo. El hueco evita que tape lo último de la página.
  return (
    <>
      <div aria-hidden className={nota ? "h-24" : "h-[4.5rem]"} />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-superficie/95 pt-2.5 pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] backdrop-blur-md">
        {contenido}
      </div>
    </>
  );
}

/** Un círculo negro con un ícono adentro, del tamaño del avatar (para las pastillas que no son de una persona). */
export function IconoCirculo({ children, className = "h-10 w-10 lg:h-[50px] lg:w-[50px]" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={cx("flex shrink-0 items-center justify-center rounded-full border-[2.6px] border-current", className)}>
      {children}
    </span>
  );
}

/** El área clara de la derecha, como la de la plática del diseño. */
export function ContenidoClaro({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("fondo-platica min-h-full px-3 py-4 text-chat-tinta sm:px-5 lg:px-6 lg:py-5", className)}>{children}</div>;
}

/** Una hoja blanca sobre el área clara (un correo, el editor, un renglón). */
export function HojaBlanca({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-lg bg-white shadow-[0_1px_2px_rgb(0_0_0/0.14)]", className)}>{children}</div>;
}

/** La marca azul «Ejemplo» (la misma de la tarjeta roja), para lo que va sobre el área clara. */
export function MarcaEjemplo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center rounded-[2px] bg-marca-600 px-1.5 text-[10px] leading-[15px] font-bold text-white uppercase", className)}>
      Ejemplo
    </span>
  );
}

/** El aviso amarillo de «Ejemplo», como el de la plática. */
export function AvisoEjemplo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-[#fff5c4] px-3 py-1.5 text-center text-xs font-semibold text-[#5c4b00] shadow-sm",
        className,
      )}
    >
      <FlaskConical size={13} aria-hidden className="shrink-0" /> {children}
    </p>
  );
}

/** Lo que se ve en el área clara cuando todavía no hay nada que mostrar. */
export function VacioClaro({ icono, titulo, texto, children }: { icono: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center px-4 py-10 text-center lg:min-h-[calc(100dvh-20rem)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-marca-600 shadow-sm">{icono}</span>
      <p className="mt-4 text-lg font-bold text-chat-tinta">{titulo}</p>
      <p className="mt-1 max-w-sm text-chat-tenue">{texto}</p>
      {children ? <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Lista desplegable en forma de pastilla, para la columna de la izquierda. */
export function SelectorPildora({
  etiqueta,
  icono,
  valor,
  onChange,
  children,
  className,
}: {
  etiqueta: string;
  icono: ReactNode;
  valor: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("relative block min-w-0", className)}>
      <span className="sr-only">{etiqueta}</span>
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-marca-400">{icono}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none truncate rounded-full bg-pildora pr-9 pl-9 text-[14px] font-semibold text-tinta-2 outline-none focus:ring-2 focus:ring-marca-400 lg:h-9 lg:text-[13px]"
      >
        {children}
      </select>
      <ChevronDown size={15} aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-suave" />
    </label>
  );
}

/** Un botón en forma de pastilla para la columna de la izquierda. */
export function BotonPildora({
  icono,
  children,
  className,
  activo = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icono?: ReactNode; activo?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45 lg:h-9 lg:text-[13px]",
        activo ? "bg-pildora-activa text-black" : "bg-pildora text-tinta-2 hover:bg-[#24466f]",
        className,
      )}
    >
      {icono}
      {children}
    </button>
  );
}

const CLASE_BOTON_PIE =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] px-5 text-[15px] font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45 lg:h-10 lg:w-auto lg:min-w-[13rem] lg:text-[14px]";
const TONOS_PIE = {
  azul: "bg-marca-600 text-white hover:bg-marca-700",
  verde: "bg-verde-600 text-white hover:bg-[#15803d]",
} as const;

/** El botón grande azul del diseño. */
export function BotonPie({
  tono = "azul",
  icono,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tono?: keyof typeof TONOS_PIE; icono?: ReactNode }) {
  return (
    <button type="button" {...props} className={cx(CLASE_BOTON_PIE, TONOS_PIE[tono], className)}>
      {icono}
      {children}
    </button>
  );
}

/** Un enlace con la forma del botón grande. */
export function EnlacePie({
  href,
  tono = "azul",
  icono,
  children,
  className,
  onClick,
}: {
  href: string;
  tono?: keyof typeof TONOS_PIE;
  icono?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={cx(CLASE_BOTON_PIE, TONOS_PIE[tono], className)}>
      {icono}
      {children}
    </Link>
  );
}

export function PanelNexora({
  titulo,
  ayuda,
  pastilla,
  lista,
  etiquetaLista,
  principal,
  etiquetaPrincipal,
  modo = "apilado",
  detalleAbierto = false,
  onCerrarDetalle,
  encabezadoDetalle,
  pie,
  notaPie,
  pieLista,
  notaPieLista,
  principalConScroll = true,
  claseLista,
}: {
  /** Nombre de la pantalla (para lectores de pantalla: el diseño no lleva título visible). */
  titulo: string;
  /** Lo que dice «¿Qué hace esto?»: 2 o 3 frases. */
  ayuda: ReactNode;
  pastilla?: ReactNode;
  lista: ReactNode;
  etiquetaLista: string;
  principal: ReactNode;
  etiquetaPrincipal: string;
  /**
   * «detalle»: en el celular el contenido se abre encima de la lista, a pantalla completa.
   * «apilado»: en el celular el contenido va debajo de la lista.
   */
  modo?: "detalle" | "apilado";
  detalleAbierto?: boolean;
  onCerrarDetalle?: () => void;
  /** Lo que se ve arriba del detalle abierto en el celular (por ejemplo, con quién platicas). */
  encabezadoDetalle?: ReactNode;
  /** El botón del paso que sigue: abajo del contenido (y del detalle abierto en el celular). */
  pie?: ReactNode;
  notaPie?: ReactNode;
  /** En el celular, con el detalle cerrado: lo que va abajo de la lista. Si no se da, se usa `pie`. */
  pieLista?: ReactNode;
  notaPieLista?: ReactNode;
  /** false si el contenido maneja su propio desplazamiento (la plática). */
  principalConScroll?: boolean;
  claseLista?: string;
}) {
  const esComputadora = useEsComputadora();
  const detalleEncima = modo === "detalle" && !esComputadora && detalleAbierto;
  const principalVisible = esComputadora || modo === "apilado" || detalleEncima;

  // Con el detalle encima, la página de atrás no se mueve, el foco pasa al botón de regresar
  // y la tecla Escape cierra el detalle.
  const regresar = useRef<HTMLButtonElement>(null);
  const cerrar = useRef(onCerrarDetalle);
  useEffect(() => {
    cerrar.current = onCerrarDetalle;
  });
  useEffect(() => {
    if (!detalleEncima) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    regresar.current?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar.current?.();
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", tecla);
    };
  }, [detalleEncima]);

  // El pie fijo del celular: el de la lista mientras no hay detalle encima.
  const pieCelular = esComputadora || detalleEncima ? null : modo === "detalle" ? (pieLista ?? pie) : pie;
  const notaCelular = modo === "detalle" ? (pieLista !== undefined ? notaPieLista : notaPie) : notaPie;

  return (
    <div className="lg:grid lg:h-[calc(100dvh-6.0625rem)] lg:min-h-[34rem] lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:grid-rows-[7.8125rem_minmax(0,1fr)] lg:gap-x-1 lg:gap-y-[5px] lg:bg-marco">
      <h1 className="sr-only">{titulo}</h1>
      <TarjetaRoja />
      <BarraAzul pastilla={pastilla} ayuda={ayuda} />

      <section
        aria-label={etiquetaLista}
        className={cx("barra-fina bg-panel px-[5px] pt-2.5 pb-3 lg:min-h-0 lg:overflow-y-auto lg:pr-[5px] lg:pl-[7px]", claseLista)}
      >
        {lista}
      </section>

      {principalVisible ? (
        <section
          role={detalleEncima ? "dialog" : undefined}
          aria-modal={detalleEncima || undefined}
          aria-label={etiquetaPrincipal}
          className={cx(
            "flex flex-col bg-marco-2",
            detalleEncima
              ? "fixed inset-0 z-50 pt-[env(safe-area-inset-top,0px)]"
              : "lg:min-h-0 lg:border-b lg:border-marca-600 lg:pr-[6px] lg:pl-[8px]",
          )}
        >
          {detalleEncima ? (
            <header className="flex shrink-0 items-center gap-1.5 bg-superficie py-2 pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.25rem,env(safe-area-inset-left,0px))]">
              <button
                ref={regresar}
                type="button"
                onClick={onCerrarDetalle}
                aria-label="Volver a la lista"
                className="rounded-full p-2 text-tinta-2 hover:bg-white/10"
              >
                <ArrowLeft size={22} aria-hidden />
              </button>
              <div className="flex min-w-0 flex-1">{encabezadoDetalle}</div>
            </header>
          ) : null}
          <div
            className={cx(
              "min-h-0 flex-1",
              !principalConScroll
                ? "flex flex-col"
                : // En el celular, apilado, el contenido crece con la página; si no, se desplaza por dentro.
                  esComputadora || detalleEncima
                  ? "barra-fina overflow-y-auto"
                  : "",
            )}
          >
            {principal}
          </div>
          {pie && (esComputadora || detalleEncima) ? (
            <Pie nota={notaPie} fijo={false}>
              {pie}
            </Pie>
          ) : null}
        </section>
      ) : null}

      {pieCelular ? (
        <Pie nota={notaCelular} fijo>
          {pieCelular}
        </Pie>
      ) : null}
    </div>
  );
}

/** Lo que se ve mientras la página carga lo guardado en el navegador. */
export function CargandoPanel() {
  return (
    <div
      aria-label="Cargando"
      className="animate-pulse lg:grid lg:h-[calc(100dvh-6.0625rem)] lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:grid-rows-[7.8125rem_minmax(0,1fr)] lg:gap-x-1 lg:gap-y-[5px] lg:bg-marco"
    >
      <div className="h-28 bg-proyecto/70 lg:h-auto" />
      <div className="h-16 bg-panel/70 lg:h-auto" />
      <div className="h-64 bg-panel/50 lg:h-auto" />
      <div className="hidden bg-marco-2 lg:block" />
    </div>
  );
}

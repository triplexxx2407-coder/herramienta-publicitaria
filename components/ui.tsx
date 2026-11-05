"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Building2, ChevronDown, CircleHelp, MapPin, Share2, SquarePen, Tag } from "lucide-react";
import { avisar } from "./avisos";
import { abrirMiDesarrollo } from "./ventanas";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { AJUSTES_EJEMPLO } from "@/lib/estado";
import type { AjustesProyecto } from "@/lib/tipos";

/** Une clases, ignorando las vacías. */
export function cx(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

export function Tarjeta({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-tarjeta border border-linea bg-superficie shadow-tarjeta", className)}>{children}</div>;
}

type Variante = "primario" | "secundario" | "fantasma" | "exito" | "peligro";
type Tamano = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-marca-600 text-white shadow-sm shadow-marca-900/50 hover:bg-marca-700",
  secundario: "bg-panel text-white hover:bg-panel/75",
  fantasma: "text-tinta-2 hover:bg-white/10 hover:text-tinta",
  exito: "bg-verde-600 text-white hover:bg-verde-600/85",
  peligro: "border border-rojo-500/40 bg-rojo-50 text-rojo-700 hover:bg-rojo-50/70",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "h-9 gap-1.5 rounded-xl px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-4 text-[15px]",
  lg: "h-13 gap-2 rounded-2xl px-6 text-base",
};

const BASE_BOTON =
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function Boton({
  variante = "primario",
  tamano = "md",
  icono,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamano?: Tamano; icono?: ReactNode }) {
  return (
    <button type="button" {...props} className={cx(BASE_BOTON, VARIANTES[variante], TAMANOS[tamano], className)}>
      {icono}
      {children}
    </button>
  );
}

/** Un enlace que se ve como botón. */
export function BotonEnlace({
  href,
  variante = "primario",
  tamano = "md",
  icono,
  className,
  children,
}: {
  href: string;
  variante?: Variante;
  tamano?: Tamano;
  icono?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(BASE_BOTON, VARIANTES[variante], TAMANOS[tamano], className)}>
      {icono}
      {children}
    </Link>
  );
}

const INSIGNIAS = {
  ejemplo: "bg-marca-600/25 text-marca-400 ring-1 ring-marca-400/35",
  simulado: "bg-violeta-50 text-violeta-700",
  tusdatos: "bg-logo/35 text-[#a6dedc]",
} as const;
const TEXTO_INSIGNIA = { ejemplo: "Ejemplo", simulado: "Simulado", tusdatos: "Tus datos" } as const;

export function Insignia({
  tipo,
  children,
  claro = false,
}: {
  tipo: keyof typeof INSIGNIAS;
  children?: ReactNode;
  claro?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] leading-4 font-bold tracking-wide uppercase",
        claro ? "bg-white/20 text-white ring-1 ring-white/35 backdrop-blur" : INSIGNIAS[tipo],
      )}
    >
      {children ?? TEXTO_INSIGNIA[tipo]}
    </span>
  );
}

export function EstadoVacio({
  icono,
  titulo,
  texto,
  children,
}: {
  icono: ReactNode;
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <Tarjeta className="entrada flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-marca-600/20 text-marca-400">{icono}</span>
      <h2 className="mt-4 font-display text-xl font-bold text-tinta">{titulo}</h2>
      <p className="mt-1 max-w-sm text-suave">{texto}</p>
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </Tarjeta>
  );
}

/** Recuadro plegable "¿Qué hace esto?". */
export function AyudaPlegable({ children }: { children: ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/85 select-none hover:bg-white/20 hover:text-white">
        <CircleHelp size={16} aria-hidden />
        ¿Qué hace esto?
        <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="entrada mt-3 max-w-3xl space-y-2 rounded-2xl bg-fondo/45 px-4 py-3.5 text-[15px] leading-relaxed text-white/85">
        {children}
      </div>
    </details>
  );
}

/** Copia los datos del desarrollo para pegarlos donde quieras (en la demo no se comparte con nadie). */
async function compartirProyecto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    avisar("Datos del proyecto copiados");
  } catch {
    avisar("Aquí no se pudo copiar");
  }
}

/**
 * Lo de arriba de cada pantalla: la tarjeta del proyecto activo y, a su lado, el panel con
 * el paso en el que vas, qué hace la pantalla y los botones del proyecto.
 */
export function Encabezado({
  paso,
  titulo,
  subtitulo,
  ayuda,
  extra,
}: {
  paso?: number;
  titulo: string;
  subtitulo?: string;
  ayuda: ReactNode;
  /** Se ve dentro del panel azul (por ejemplo, con quién estás platicando). */
  extra?: ReactNode;
}) {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const ajustes = enNavegador ? estado.ajustes : AJUSTES_EJEMPLO;

  return (
    <header className="entrada mb-4 grid grid-cols-1 gap-3 lg:mb-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <TarjetaProyecto ajustes={ajustes} />

      <div className="rounded-tarjeta bg-panel px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-x-3 gap-y-3 sm:flex-wrap sm:gap-x-4">
          <div className="min-w-0">
            {paso ? <p className="text-xs font-bold tracking-[0.16em] text-marca-200 uppercase">Paso {paso} de 5</p> : null}
            <h1 className="mt-0.5 font-display text-[1.6rem] leading-tight font-bold tracking-tight text-white sm:text-[1.9rem]">
              {titulo}
            </h1>
            {subtitulo ? <p className="mt-1 max-w-2xl text-[15px] text-white/75">{subtitulo}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Boton
              variante="secundario"
              tamano="sm"
              className="bg-white/15 px-2.5 hover:bg-white/25 sm:px-3.5"
              icono={<Share2 size={15} aria-hidden />}
              onClick={() => compartirProyecto(`${ajustes.nombreDesarrollo} · ${ajustes.ciudad} · Desde ${ajustes.precioDesde}`)}
              aria-label="Compartir el proyecto"
            >
              <span className="hidden sm:inline">Compartir</span>
            </Boton>
            <Boton
              tamano="sm"
              className="px-2.5 sm:px-3.5"
              icono={<SquarePen size={15} aria-hidden />}
              onClick={abrirMiDesarrollo}
              aria-label="Editar el proyecto"
            >
              <span className="hidden sm:inline">Editar proyecto</span>
            </Boton>
          </div>
        </div>
        {extra ? <div className="mt-3.5">{extra}</div> : null}
        <div className="mt-3.5">
          <AyudaPlegable>{ayuda}</AyudaPlegable>
        </div>
      </div>
    </header>
  );
}

/** La tarjeta roja del proyecto activo. Lleva al detalle del proyecto. */
function TarjetaProyecto({ ajustes }: { ajustes: AjustesProyecto }) {
  return (
    <Link
      href="/"
      aria-label={`Ver el proyecto ${ajustes.nombreDesarrollo}`}
      className="relative flex flex-col overflow-hidden rounded-tarjeta bg-linear-to-br from-proyecto-claro to-proyecto-oscuro px-4 py-3.5 text-white shadow-tarjeta transition-shadow hover:shadow-flotante sm:px-5"
    >
      <div aria-hidden className="absolute -top-20 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <span className="relative flex flex-wrap items-center gap-1.5">
        <Insignia tipo="ejemplo" claro />
        <Insignia tipo="ejemplo" claro>
          Preventa exclusiva
        </Insignia>
      </span>
      <span className="relative mt-2 hidden items-center gap-1.5 text-[11px] font-bold tracking-wide text-white/75 uppercase sm:flex">
        <Building2 size={13} aria-hidden /> Mi desarrollo inmobiliario
      </span>
      <span className="relative mt-1.5 font-display text-[1.25rem] leading-[1.15] font-bold tracking-tight sm:mt-0.5 sm:text-[1.45rem] lg:text-[1.55rem]">
        {ajustes.nombreDesarrollo}
      </span>
      <span className="relative mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-white/85 sm:mt-2.5">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} aria-hidden /> {ajustes.ciudad}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Tag size={14} aria-hidden /> Desde {ajustes.precioDesde}
        </span>
      </span>
    </Link>
  );
}

const CLASE_CAMPO =
  "w-full rounded-xl border border-linea bg-fondo px-3.5 text-[15px] text-tinta outline-none transition placeholder:text-tenue focus:border-marca-500 focus:ring-4 focus:ring-marca-600/25";

export function Campo({
  etiqueta,
  ayuda,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: string }) {
  return (
    <label className={cx("block space-y-1.5", className)}>
      <span className="text-sm font-semibold text-tinta-2">{etiqueta}</span>
      <input {...props} className={cx(CLASE_CAMPO, "h-11")} />
      {ayuda ? <span className="block text-xs text-tenue">{ayuda}</span> : null}
    </label>
  );
}

/**
 * El paso que sigue, siempre a la vista: en el celular queda fijo abajo (arriba de las pestañas)
 * y en la computadora flota al pie de la pantalla. Lleva un solo botón grande.
 * `nota` se ve siempre; `notaComputadora` sólo en pantallas grandes (en el celular estorbaría).
 */
export function BarraAccion({
  nota,
  notaComputadora,
  children,
}: {
  nota?: ReactNode;
  notaComputadora?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div aria-hidden className={cx("lg:hidden", nota ? "h-20" : "h-14")} />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-linea bg-superficie/95 pt-2.5 pr-[max(1rem,env(safe-area-inset-right,0px))] pb-2.5 pl-[max(1rem,env(safe-area-inset-left,0px))] backdrop-blur-md sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] lg:sticky lg:bottom-5 lg:mt-7 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-xl flex-col gap-1.5 lg:max-w-none lg:flex-row lg:items-center lg:justify-end lg:gap-4 lg:rounded-2xl lg:border lg:border-linea lg:bg-superficie/95 lg:py-3 lg:pr-3 lg:pl-5 lg:shadow-flotante lg:backdrop-blur">
          {nota ? <div className="text-center text-sm font-semibold text-tinta-2 lg:mr-auto lg:text-left">{nota}</div> : null}
          {!nota && notaComputadora ? (
            <div className="mr-auto hidden text-sm font-semibold text-tinta-2 lg:block">{notaComputadora}</div>
          ) : null}
          {children}
        </div>
      </div>
    </>
  );
}

/** Clases del botón grande de la barra de abajo. */
export const BOTON_BARRA = "h-12 w-full rounded-2xl text-base lg:w-auto lg:min-w-[16rem]";

/** Lo que se ve mientras la página carga lo guardado en el navegador. */
export function Cargando() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Cargando">
      <div className="h-32 rounded-tarjeta bg-superficie" />
      <div className="h-40 rounded-tarjeta bg-superficie/70" />
      <div className="h-24 rounded-tarjeta bg-superficie/50" />
    </div>
  );
}

/** Lista desplegable con ícono a la izquierda. La etiqueta es para lectores de pantalla: el valor ya se explica solo. */
export function Selector({
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
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-marca-400">{icono}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none truncate rounded-xl border border-linea bg-superficie-2 pr-9 pl-9 text-[15px] font-semibold text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-600/25"
      >
        {children}
      </select>
      <ChevronDown size={17} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-suave" />
    </label>
  );
}

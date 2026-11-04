import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { ChevronDown, CircleHelp, Lock } from "lucide-react";

/** Une clases, ignorando las vacías. */
export function cx(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

export function Tarjeta({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-tarjeta border border-linea/80 bg-superficie shadow-tarjeta", className)}>{children}</div>;
}

type Variante = "primario" | "secundario" | "fantasma" | "exito" | "peligro" | "claro";
type Tamano = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-marca-600 text-white shadow-sm shadow-marca-600/30 hover:bg-marca-700",
  secundario: "border border-linea bg-white text-tinta hover:border-tenue/60 hover:bg-fondo",
  fantasma: "text-tinta-2 hover:bg-tinta/5",
  exito: "bg-verde-500 text-white shadow-sm shadow-verde-500/30 hover:bg-verde-700",
  peligro: "border border-rojo-500/25 bg-white text-rojo-700 hover:bg-rojo-50",
  claro: "border border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25",
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
  ejemplo: "border border-dashed border-tenue/70 bg-white/80 text-suave",
  simulado: "border border-violeta-200 bg-violeta-50 text-violeta-700",
  proximamente: "border border-linea bg-fondo text-suave",
  tusdatos: "bg-marca-50 text-marca-700",
} as const;
const TEXTO_INSIGNIA = { ejemplo: "Ejemplo", simulado: "Simulado", proximamente: "Próximamente", tusdatos: "Tus datos" } as const;

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
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold tracking-wide uppercase",
        claro ? "border border-dashed border-white/70 bg-white/15 text-white backdrop-blur" : INSIGNIAS[tipo],
      )}
    >
      {tipo === "proximamente" ? <Lock size={11} aria-hidden /> : null}
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
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-marca-50 text-marca-600">{icono}</span>
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
      <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-marca-100 bg-white px-3 py-1.5 text-sm font-semibold text-marca-700 select-none hover:border-marca-200">
        <CircleHelp size={16} aria-hidden />
        ¿Qué hace esto?
        <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="entrada mt-3 max-w-3xl space-y-2 rounded-2xl border border-marca-100 bg-marca-50/80 px-4 py-3.5 text-[15px] leading-relaxed text-tinta-2">
        {children}
      </div>
    </details>
  );
}

export function Encabezado({
  paso,
  titulo,
  subtitulo,
  ayuda,
  acciones,
}: {
  paso?: number;
  titulo: string;
  subtitulo?: string;
  ayuda: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="entrada mb-5 space-y-3 lg:mb-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {paso ? (
            <p className="text-xs font-bold tracking-[0.14em] text-marca-600 uppercase">Paso {paso} de 5</p>
          ) : null}
          <h1 className="mt-0.5 font-display text-[1.7rem] leading-tight font-bold tracking-tight text-tinta sm:text-[2.1rem]">
            {titulo}
          </h1>
          {subtitulo ? <p className="mt-1 max-w-2xl text-[15px] text-suave sm:text-base">{subtitulo}</p> : null}
        </div>
        {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
      </div>
      <AyudaPlegable>{ayuda}</AyudaPlegable>
    </header>
  );
}

const CLASE_CAMPO =
  "w-full rounded-xl border border-linea bg-white px-3.5 text-[15px] text-tinta outline-none transition placeholder:text-tenue focus:border-marca-500 focus:ring-4 focus:ring-marca-100";

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
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-linea/80 bg-white/95 pt-2.5 pr-[max(1rem,env(safe-area-inset-right,0px))] pb-2.5 pl-[max(1rem,env(safe-area-inset-left,0px))] backdrop-blur-md sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] lg:sticky lg:bottom-5 lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-xl flex-col gap-1.5 lg:max-w-none lg:flex-row lg:items-center lg:justify-end lg:gap-4 lg:rounded-2xl lg:border lg:border-linea lg:bg-white/90 lg:py-3 lg:pr-3 lg:pl-5 lg:shadow-flotante lg:backdrop-blur">
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
    <div className="animate-pulse space-y-4" aria-label="Cargando">
      <div className="h-4 w-24 rounded-full bg-linea" />
      <div className="h-9 w-64 rounded-xl bg-linea" />
      <div className="h-40 rounded-tarjeta bg-linea/70" />
      <div className="h-24 rounded-tarjeta bg-linea/60" />
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
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-marca-600">{icono}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none truncate rounded-xl border border-linea bg-white pr-9 pl-9 text-[15px] font-semibold text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-100"
      >
        {children}
      </select>
      <ChevronDown size={17} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-tenue" />
    </label>
  );
}

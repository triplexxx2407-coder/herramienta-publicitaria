"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** Une clases, ignorando las vacías. */
export function cx(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
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
  sm: "h-9 gap-1.5 rounded-[4px] px-3 text-sm",
  md: "h-11 gap-2 rounded-[4px] px-4 text-[15px]",
  lg: "h-13 gap-2 rounded-[4px] px-6 text-base",
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

const CLASE_CAMPO =
  "w-full rounded-[4px] border border-linea bg-fondo px-3.5 text-[15px] text-tinta outline-none transition placeholder:text-tenue focus:border-marca-500 focus:ring-4 focus:ring-marca-600/25";

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

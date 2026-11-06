"use client";

import { Copy, LoaderCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { avisar } from "./avisos";

/** Une clases, ignorando las vacías. */
export function cx(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

export const CAMPO =
  "mt-1 h-11 w-full rounded-lg border border-linea bg-white px-3 text-[16px] text-tinta outline-none placeholder:text-tenue focus:border-marca-500 focus:ring-2 focus:ring-marca-500/25 disabled:bg-relleno";
export const AREA = `${CAMPO} h-auto min-h-[6rem] py-2.5 leading-snug`;
export const BOTON =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-marca-600 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-45";
export const BOTON_CLARO =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-linea bg-white px-4 text-[15px] font-semibold text-tinta-2 transition-colors hover:bg-relleno disabled:opacity-45";
export const BOTON_PELIGRO =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-semibold text-[#b42318] hover:bg-[#fdecea] disabled:opacity-45";

/** Una tarjeta blanca. */
export function Tarjeta({ titulo, detalle, derecha, className, children }: { titulo?: string; detalle?: string; derecha?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cx("rounded-2xl border border-linea bg-tarjeta p-4 shadow-tarjeta sm:p-5", className)}>
      {titulo ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-tinta">{titulo}</h2>
            {detalle ? <p className="mt-0.5 text-[13.5px] text-suave">{detalle}</p> : null}
          </div>
          {derecha}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Un campo con su nombre arriba. */
export function Etiqueta({ texto, opcional = false, children }: { texto: string; opcional?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-tinta-2">
      {texto} {opcional ? <span className="font-normal text-suave">(opcional)</span> : null}
      {children}
    </label>
  );
}

/** Título de la pantalla con una frase que explica para qué sirve. */
export function Encabezado({ titulo, frase, derecha }: { titulo: string; frase: string; derecha?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[24px] leading-tight font-extrabold text-tinta sm:text-[28px]">{titulo}</h1>
        <p className="mt-1 max-w-2xl text-[14.5px] text-suave">{frase}</p>
      </div>
      {derecha}
    </div>
  );
}

export function Vacio({ icono, titulo, texto, children }: { icono: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-linea bg-tarjeta px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-marca-50 text-marca-600">{icono}</span>
      <h2 className="mt-4 text-[18px] font-bold text-tinta">{titulo}</h2>
      <p className="mt-1.5 max-w-md text-[14.5px] text-suave">{texto}</p>
      {children ? <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="flex items-center justify-center py-24 text-suave">
      <LoaderCircle className="animate-spin" size={26} aria-hidden />
    </div>
  );
}

/** Copia un texto al portapapeles y avisa. */
export async function copiar(texto: string, aviso = "Copiado"): Promise<void> {
  try {
    await navigator.clipboard.writeText(texto);
    avisar(aviso);
  } catch {
    avisar("No se pudo copiar. Selecciónalo y cópialo a mano.");
  }
}

/** Un texto largo (una dirección) con su botón de copiar. */
export function Copiable({ texto, aviso }: { texto: string; aviso: string }) {
  const [visto, setVisto] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-relleno p-2">
      <code className="min-w-0 flex-1 text-[13.5px] break-all text-tinta">{texto}</code>
      <button
        type="button"
        onClick={() => {
          void copiar(texto, aviso);
          setVisto(true);
        }}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-marca-600 px-3 text-[13px] font-semibold text-white hover:bg-marca-700"
      >
        <Copy size={14} aria-hidden /> {visto ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

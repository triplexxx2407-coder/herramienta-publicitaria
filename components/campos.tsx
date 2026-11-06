"use client";

import { Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { avisar } from "./avisos";
import { HojaBlanca } from "./PanelNexora";

export const CAMPO =
  "mt-1 h-11 w-full rounded-[6px] border border-[#cfd6e0] bg-white px-3 text-[16px] text-chat-tinta outline-none placeholder:text-[#9aa5b4] focus:border-marca-600 focus:ring-2 focus:ring-marca-600/25 disabled:bg-[#f2f4f7]";
export const AREA = `${CAMPO} h-auto min-h-[7rem] py-2.5 leading-snug`;
export const BOTON_AZUL =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-marca-600 px-5 text-[15px] font-bold text-white transition-colors hover:bg-marca-700 disabled:opacity-45";
export const BOTON_CLARO =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-[#cfd6e0] bg-white px-4 text-[15px] font-bold text-chat-tinta transition-colors hover:bg-[#f2f6fc] disabled:opacity-45";

/** Una hoja blanca con título, para agrupar un formulario o unos datos. */
export function Seccion({ titulo, children, detalle }: { titulo: string; detalle?: string; children: ReactNode }) {
  return (
    <HojaBlanca className="p-4 sm:p-5">
      <h2 className="text-[17px] font-bold text-chat-tinta">{titulo}</h2>
      {detalle ? <p className="mt-0.5 text-sm text-chat-tenue">{detalle}</p> : null}
      <div className="mt-3">{children}</div>
    </HojaBlanca>
  );
}

/** Un campo con su nombre arriba. */
export function Etiqueta({ texto, opcional = false, children }: { texto: string; opcional?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-chat-tinta">
      {texto} {opcional ? <span className="font-normal text-chat-tenue">(opcional)</span> : null}
      {children}
    </label>
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
    <div className="flex items-center gap-2 rounded-[6px] bg-[#f2f6fc] p-2">
      <code className="min-w-0 flex-1 text-[13.5px] break-all text-chat-tinta">{texto}</code>
      <button
        type="button"
        onClick={() => {
          void copiar(texto, aviso);
          setVisto(true);
        }}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-marca-600 px-3 text-[13px] font-bold text-white hover:bg-marca-700"
      >
        <Copy size={14} aria-hidden /> {visto ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/** El día de «2026-11-06» en palabras: «6 nov». */
export function diaCorto(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

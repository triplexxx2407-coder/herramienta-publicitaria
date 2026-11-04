"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

/** Ventana que sube desde abajo en el celular y aparece al centro en la computadora. */
export function Hoja({
  abierta,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
}: {
  abierta: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const id = useId();

  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [abierta, onCerrar]);

  if (!abierta) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
    >
      <div aria-hidden className="velo-entrada absolute inset-0 bg-tinta/55 backdrop-blur-[2px]" onClick={onCerrar} />
      <div className="hoja-entrada relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-superficie shadow-flotante sm:max-w-xl sm:rounded-[28px]">
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-linea sm:hidden" />
        <header className="flex shrink-0 items-start justify-between gap-4 px-5 pt-3 pb-3 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 id={id} className="font-display text-xl font-bold text-tinta">
              {titulo}
            </h2>
            {descripcion ? <p className="mt-0.5 text-sm text-suave">{descripcion}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mt-1 -mr-2 rounded-full p-2 text-suave hover:bg-fondo hover:text-tinta"
          >
            <X size={22} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        {pie ? (
          <footer className="shrink-0 border-t border-linea px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-5">
            {pie}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

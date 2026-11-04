import type { ReactNode } from "react";

/** Recuadro plegable "¿Qué hace esto?" con 2 o 3 frases. */
export function QueHaceEsto({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-950">
      <summary className="cursor-pointer list-none font-semibold select-none marker:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block transition-transform group-open:rotate-90">▸</span>
          ¿Qué hace esto?
        </span>
      </summary>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </details>
  );
}

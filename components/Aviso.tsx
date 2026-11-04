import type { ReactNode } from "react";

const ESTILOS = {
  ejemplo: "border-amber-300 bg-amber-50 text-amber-950",
  simulado: "border-violet-300 bg-violet-50 text-violet-950",
  error: "border-red-300 bg-red-50 text-red-900",
  info: "border-slate-200 bg-white text-slate-700",
} as const;

export function Aviso({ tipo, children }: { tipo: keyof typeof ESTILOS; children: ReactNode }) {
  return (
    <div role={tipo === "error" ? "alert" : "note"} className={`rounded-xl border-2 px-4 py-3 font-medium ${ESTILOS[tipo]}`}>
      {children}
    </div>
  );
}

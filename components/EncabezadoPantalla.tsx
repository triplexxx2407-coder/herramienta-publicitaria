import type { ReactNode } from "react";
import { QueHaceEsto } from "./QueHaceEsto";

export function EncabezadoPantalla({
  paso,
  titulo,
  children,
  ayuda,
}: {
  paso: number;
  titulo: string;
  children?: ReactNode;
  ayuda: ReactNode;
}) {
  return (
    <header className="mb-6 space-y-3">
      <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase">Paso {paso} de 6</p>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{titulo}</h1>
      {children ? <div className="text-lg text-slate-600">{children}</div> : null}
      <QueHaceEsto>{ayuda}</QueHaceEsto>
    </header>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { Navegacion } from "./Navegacion";

/** Encabezado, navegación y pie comunes a todas las pantallas. */
export function Marco({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white">
        DEMO · No se envía ningún correo · Los datos son de ejemplo
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl space-y-3 px-4 pt-4 pb-2">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              ✉
            </span>
            Prospección por correo
          </Link>
          <Navegacion />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-sm text-slate-500">
        Versión de demostración. Ningún botón de esta página envía correos.
      </footer>
    </>
  );
}

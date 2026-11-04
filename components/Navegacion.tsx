"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PANTALLAS } from "@/lib/pantallas";


export function Navegacion() {
  const ruta = usePathname();
  return (
    <nav aria-label="Pasos" className="-mx-4 overflow-x-auto px-4">
      <ol className="flex min-w-max gap-1 pb-1">
        {PANTALLAS.map((p, i) => {
          const activa = ruta === p.ruta;
          return (
            <li key={p.ruta}>
              <Link
                href={p.ruta}
                aria-current={activa ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activa ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    activa ? "bg-white text-teal-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {i + 1}
                </span>
                {p.nombre}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import { type ReactNode } from "react";
import { Building2, Inbox } from "lucide-react";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { EMPRESAS, anclajeDeSesion, conversaciones, elegirEmpresa, sinLeer, sinLeerPorEmpresa } from "@/lib/bandeja";
import { ContenedorAvisos } from "./avisos";
import { BarraSuperior } from "./BarraSuperior";
import { cx } from "./ui";

/**
 * Marco de la app: barra de arriba y, en la computadora, el menú de la izquierda con las
 * empresas que atiende el equipo. En el celular las empresas se eligen arriba de la bandeja.
 */
export function Marco({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior />

      <div className="flex flex-1">
        <aside className="hidden w-[230px] shrink-0 lg:sticky lg:top-[68px] lg:flex lg:h-[calc(100dvh-68px)] lg:flex-col lg:overflow-y-auto lg:pt-[43px] lg:pr-[14px] lg:pl-[18px]">
          <MenuEmpresas />
        </aside>

        <main className="w-full min-w-0 flex-1 pb-[env(safe-area-inset-bottom,0px)] lg:pt-[5px] lg:pr-[31px] lg:pb-6 lg:pl-px">{children}</main>
      </div>

      <ContenedorAvisos />
    </div>
  );
}

/** Las empresas que atiende el equipo, con sus mensajes sin leer. Elegir una filtra la bandeja. */
function MenuEmpresas() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const todas = enNavegador ? conversaciones(estado, anclajeDeSesion()) : [];
  const porEmpresa = sinLeerPorEmpresa(todas);
  const activa = enNavegador ? estado.empresaActiva : null;

  const opciones: { id: string | null; nombre: string; detalle: string; nuevos: number }[] = [
    { id: null, nombre: "Todas las empresas", detalle: `${EMPRESAS.length} empresas`, nuevos: sinLeer(todas) },
    ...EMPRESAS.map((e) => ({ id: e.id, nombre: e.nombre, detalle: e.giro, nuevos: porEmpresa[e.id] ?? 0 })),
  ];

  return (
    <nav aria-label="Empresas">
      <p className="mb-[7px] flex items-center gap-1.5 text-[11px] leading-4 font-bold text-menu uppercase">
        Empresas
        <span className="rounded-[2px] bg-marca-600 px-1 text-[9px] leading-[13px] text-white">Ejemplo</span>
      </p>
      <ul className="space-y-[6px]">
        {opciones.map((o) => {
          const elegida = activa === o.id;
          const Icono = o.id ? Building2 : Inbox;
          return (
            <li key={o.id ?? "todas"}>
              <button
                type="button"
                aria-current={elegida ? "page" : undefined}
                onClick={() => actualizarEstado((e) => elegirEmpresa(e, o.id))}
                className={cx(
                  "flex min-h-[38px] w-full items-center gap-2 rounded-[3px] py-1 pr-2.5 pl-2 text-left text-[13px] transition-colors",
                  elegida ? "bg-pildora font-bold text-marca-400" : "text-menu hover:bg-white/5 hover:text-tinta-2",
                )}
              >
                <Icono size={14} aria-hidden strokeWidth={2.4} className={elegida ? "text-marca-400" : "text-menu-icono"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.nombre}</span>
                  <span className="block truncate text-[11px] font-normal text-menu">{o.detalle}</span>
                </span>
                {o.nuevos ? (
                  <span className="cifras flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-marca-600 px-1 text-[9.5px] leading-none font-bold text-white">
                    {o.nuevos}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

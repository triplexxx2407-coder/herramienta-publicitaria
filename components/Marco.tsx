"use client";

import { BarChart3, Building2, CalendarDays, Link2, Settings2, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { elegirEmpresa, iniciarFuente, useEmpresaActiva, useFuente } from "@/lib/fuente";
import { ContenedorAvisos } from "./avisos";
import { BarraSuperior } from "./BarraSuperior";
import { CargandoPanel } from "./PanelNexora";
import { PantallaEntrar } from "./PantallaEntrar";
import { cx } from "./ui";

const SECCIONES: { ruta: string; nombre: string; Icono: LucideIcon }[] = [
  { ruta: "/", nombre: "Interesados", Icono: Users },
  { ruta: "/calendario", nombre: "Calendario", Icono: CalendarDays },
  { ruta: "/enlaces", nombre: "Enlaces", Icono: Link2 },
  { ruta: "/resultados", nombre: "Resultados", Icono: BarChart3 },
  { ruta: "/empresas", nombre: "Perfiles", Icono: Settings2 },
];

/**
 * Marco de la app: barra de arriba y, en la computadora, el menú de la izquierda con las
 * secciones y los perfiles. En el celular las secciones y el perfil se eligen en una franja arriba.
 */
export function Marco({ children }: { children: ReactNode }) {
  const { modo } = useFuente();
  useEffect(() => {
    void iniciarFuente();
  }, []);

  if (modo === "entrar") {
    return (
      <div className="flex min-h-dvh flex-col">
        <PantallaEntrar />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior />
      {modo === "real" ? <FranjaCelular /> : null}

      <div className="flex flex-1">
        <aside className="hidden w-[230px] shrink-0 lg:sticky lg:top-[68px] lg:flex lg:h-[calc(100dvh-68px)] lg:flex-col lg:overflow-y-auto lg:pt-[43px] lg:pr-[14px] lg:pl-[18px]">
          {modo === "real" ? <MenuLateral /> : null}
        </aside>

        <main className="w-full min-w-0 flex-1 pb-[env(safe-area-inset-bottom,0px)] lg:pt-[5px] lg:pr-[31px] lg:pb-6 lg:pl-px">
          {modo === "revisando" ? <CargandoPanel /> : children}
        </main>
      </div>

      <ContenedorAvisos />
    </div>
  );
}

function enRuta(actual: string, ruta: string): boolean {
  return ruta === "/" ? actual === "/" : actual === ruta;
}

/** Celular: el perfil y las secciones en una franja que se desliza. */
function FranjaCelular() {
  const { empresas } = useFuente();
  const activa = useEmpresaActiva();
  const ruta = usePathname();
  return (
    <div className="space-y-2 bg-superficie px-3 pb-2.5 lg:hidden">
      {empresas.length > 0 ? (
        <label className="block">
          <span className="sr-only">Perfil</span>
          <select
            value={activa?.id ?? ""}
            onChange={(e) => elegirEmpresa(e.target.value)}
            className="h-10 w-full rounded-full bg-pildora px-4 text-[14px] font-semibold text-tinta-2 outline-none focus:ring-2 focus:ring-marca-400"
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <nav aria-label="Secciones" className="barra-fina -mx-3 flex gap-1.5 overflow-x-auto px-3">
        {SECCIONES.map(({ ruta: r, nombre, Icono }) => (
          <Link
            key={r}
            href={r}
            aria-current={enRuta(ruta, r) ? "page" : undefined}
            className={cx(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold",
              enRuta(ruta, r) ? "bg-pildora-activa text-black" : "bg-pildora text-tinta-2",
            )}
          >
            <Icono size={14} aria-hidden /> {nombre}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Computadora: las secciones y debajo los perfiles. Elegir un perfil cambia lo que ves en todas las secciones. */
function MenuLateral() {
  const { empresas } = useFuente();
  const activa = useEmpresaActiva();
  const ruta = usePathname();
  return (
    <>
      <nav aria-label="Secciones">
        <p className="mb-[7px] text-[11px] leading-4 font-bold text-menu uppercase">Secciones</p>
        <ul className="space-y-[6px]">
          {SECCIONES.map(({ ruta: r, nombre, Icono }) => {
            const elegida = enRuta(ruta, r);
            return (
              <li key={r}>
                <Link
                  href={r}
                  aria-current={elegida ? "page" : undefined}
                  className={cx(
                    "flex min-h-[38px] w-full items-center gap-2 rounded-[3px] py-1 pr-2.5 pl-2 text-left text-[13px] transition-colors",
                    elegida ? "bg-pildora font-bold text-marca-400" : "text-menu hover:bg-white/5 hover:text-tinta-2",
                  )}
                >
                  <Icono size={14} aria-hidden strokeWidth={2.4} className={elegida ? "text-marca-400" : "text-menu-icono"} />
                  {nombre}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Perfiles" className="mt-6">
        <p className="mb-[7px] text-[11px] leading-4 font-bold text-menu uppercase">Perfil</p>
        {empresas.length === 0 ? (
          <p className="text-[12.5px] text-menu">Todavía no hay perfiles.</p>
        ) : (
          <ul className="space-y-[6px]">
            {empresas.map((e) => {
              const elegida = activa?.id === e.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-current={elegida ? "true" : undefined}
                    onClick={() => elegirEmpresa(e.id)}
                    className={cx(
                      "flex min-h-[38px] w-full items-center gap-2 rounded-[3px] py-1 pr-2.5 pl-2 text-left text-[13px] transition-colors",
                      elegida ? "bg-pildora font-bold text-marca-400" : "text-menu hover:bg-white/5 hover:text-tinta-2",
                    )}
                  >
                    <Building2 size={14} aria-hidden strokeWidth={2.4} className={elegida ? "text-marca-400" : "text-menu-icono"} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{e.nombre}</span>
                      <span className="block truncate text-[11px] font-normal text-menu">{e.giro}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </>
  );
}

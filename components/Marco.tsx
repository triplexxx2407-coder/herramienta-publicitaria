"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChartColumn,
  House,
  Lock,
  PenLine,
  Search,
  Send,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar } from "@/lib/contactos";
import { AJUSTES_EJEMPLO } from "@/lib/estado";
import { PANTALLAS } from "@/lib/pantallas";
import { ContenedorAvisos } from "./avisos";
import { FormularioAjustes } from "./FormularioAjustes";
import { Hoja } from "./Hoja";
import { Boton, cx } from "./ui";
import { abrirMiDesarrollo, cerrarMiDesarrollo, useMiDesarrolloAbierto } from "./ventanas";

const ICONOS: Record<string, LucideIcon> = {
  "/": House,
  "/buscar": Search,
  "/contactos": Users,
  "/redactar": PenLine,
  "/envio": Send,
  "/seguimiento": ChartColumn,
  "/expediente": ShieldCheck,
};

const MENU = [{ ruta: "/", nombre: "Inicio", corto: "Inicio" }, ...PANTALLAS];

function Logo({ tamano = 36 }: { tamano?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-marca-400 to-marca-700 text-white shadow-sm shadow-marca-700/40"
      style={{ width: tamano, height: tamano }}
    >
      <Send size={tamano * 0.5} strokeWidth={2.2} className="-translate-x-px translate-y-px" />
    </span>
  );
}

/** Marco de la app: barra lateral en computadora y pestañas abajo en celular. */
export function Marco({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const miDesarrolloAbierto = useMiDesarrolloAbierto();

  const elegidos = enNavegador ? contactosParaRedactar(estado) : [];
  const aprobados = elegidos.filter((c) => estado.borradores[c.id]?.estado === "aprobado").length;
  const cuentas: Record<string, string | undefined> = enNavegador
    ? {
        "/buscar": estado.contactos.length ? String(estado.contactos.length) : undefined,
        "/contactos": elegidos.length ? String(elegidos.length) : undefined,
        "/redactar": elegidos.length ? `${aprobados}/${elegidos.length}` : undefined,
      }
    : {};
  const portada = (enNavegador ? estado.ajustes.fotos[0]?.url : undefined) ?? AJUSTES_EJEMPLO.fotos[0]?.url;
  const nombreDesarrollo = enNavegador ? estado.ajustes.nombreDesarrollo : AJUSTES_EJEMPLO.nombreDesarrollo;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Barra lateral (computadora) */}
      <aside className="hidden bg-tinta text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-7 lg:px-4 lg:py-6">
        <Link href="/" className="flex items-center gap-3 px-2">
          <Logo />
          <span className="min-w-0">
            <span className="block font-display text-lg leading-tight font-bold">Prospección</span>
            <span className="block text-xs font-semibold text-white/55">Condominios en preventa</span>
          </span>
        </Link>

        <nav aria-label="Secciones">
          <ul className="space-y-1">
            {MENU.map((p) => {
              const Icono = ICONOS[p.ruta];
              const activa = ruta === p.ruta;
              const cuenta = cuentas[p.ruta];
              return (
                <li key={p.ruta}>
                  <Link
                    href={p.ruta}
                    aria-current={activa ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                      activa ? "bg-white text-tinta" : "text-white/70 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icono size={19} aria-hidden className={activa ? "text-marca-600" : undefined} />
                    <span className="flex-1">{p.nombre}</span>
                    {cuenta ? (
                      <span
                        className={cx(
                          "cifras rounded-full px-2 py-0.5 text-xs font-bold",
                          activa ? "bg-marca-50 text-marca-700" : "bg-white/12 text-white/85",
                        )}
                      >
                        {cuenta}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={abrirMiDesarrollo}
            className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 text-left transition-colors hover:bg-white/10"
          >
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portada} alt="" className="h-12 w-16 shrink-0 rounded-xl object-cover" />
            ) : null}
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-white/55">Mi desarrollo</span>
              <span className="block truncate text-sm font-semibold">{nombreDesarrollo}</span>
            </span>
          </button>
          <p className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs leading-snug text-white/65">
            <Lock size={14} aria-hidden className="shrink-0" />
            Demo: ningún correo sale de aquí y los negocios son inventados.
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Barra superior (celular y tableta) */}
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-linea/80 bg-fondo/90 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))]">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Logo tamano={32} />
              <span className="truncate font-display text-[17px] font-bold">Prospección</span>
            </Link>
            <span className="rounded-full bg-tinta px-2.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase">
              Demo
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 pt-5 pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pt-7 sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] lg:pr-[max(2.5rem,env(safe-area-inset-right,0px))] lg:pl-[max(2.5rem,env(safe-area-inset-left,0px))] lg:pt-9 lg:pb-14">
          {children}
        </main>
      </div>

      {/* Pestañas abajo (celular y tableta) */}
      <nav
        aria-label="Pasos"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-2xl pr-[max(0.25rem,env(safe-area-inset-right,0px))] pl-[max(0.25rem,env(safe-area-inset-left,0px))]">
          {PANTALLAS.map((p) => {
            const Icono = ICONOS[p.ruta];
            const activa = ruta === p.ruta;
            return (
              <li key={p.ruta} className="min-w-0 flex-auto">
                <Link
                  href={p.ruta}
                  aria-current={activa ? "page" : undefined}
                  aria-label={p.nombre}
                  className="flex flex-col items-center gap-1 pt-2 pb-1.5"
                >
                  <span
                    className={cx(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      activa ? "bg-marca-100 text-marca-700" : "text-suave",
                    )}
                  >
                    <Icono size={21} aria-hidden strokeWidth={activa ? 2.4 : 2} />
                  </span>
                  <span
                    className={cx(
                      "max-w-full truncate text-[10.5px] leading-tight font-semibold",
                      activa ? "text-marca-700" : "text-suave",
                    )}
                  >
                    {p.corto}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Hoja
        abierta={miDesarrolloAbierto}
        onCerrar={cerrarMiDesarrollo}
        titulo="Mi desarrollo"
        descripcion="Estos datos se usan en todos los correos."
        pie={
          <Boton className="w-full" onClick={cerrarMiDesarrollo}>
            Listo
          </Boton>
        }
      >
        <FormularioAjustes />
      </Hoja>

      <ContenedorAvisos />
    </div>
  );
}

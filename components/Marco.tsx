"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, ChartColumn, ChevronDown, Lock, MessageCircle, PenLine, Search, Send, SquarePen, type LucideIcon } from "lucide-react";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { listosParaEnviar, porEscribir } from "@/lib/contactos";
import { enviosHechos, platicas } from "@/lib/envio";
import { AJUSTES_EJEMPLO } from "@/lib/estado";
import { PANTALLAS } from "@/lib/pantallas";
import { ContenedorAvisos } from "./avisos";
import { BarraSuperior } from "./BarraSuperior";
import { FormularioAjustes } from "./FormularioAjustes";
import { Hoja } from "./Hoja";
import { Boton, cx } from "./ui";
import { abrirMiDesarrollo, cerrarMiDesarrollo, useMiDesarrolloAbierto } from "./ventanas";

const ICONOS: Record<string, LucideIcon> = {
  "/buscar": Search,
  "/redactar": PenLine,
  "/envio": Send,
  "/seguimiento": ChartColumn,
  "/chat": MessageCircle,
};

/** Marco de la app: barra de arriba, barra lateral en computadora y pestañas abajo en celular. */
export function Marco({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const miDesarrolloAbierto = useMiDesarrolloAbierto();

  // Números junto a cada paso: correos por aprobar, listos para enviar y pláticas sin leer.
  const porAprobar = enNavegador ? porEscribir(estado).length - listosParaEnviar(estado).length : 0;
  const listos = enNavegador ? listosParaEnviar(estado).length : 0;
  const conversaciones = enNavegador ? platicas(estado) : [];
  const sinLeer = conversaciones.filter((p) => p.noLeida).length;
  const cuentas: Record<string, number> = { "/redactar": porAprobar, "/envio": listos, "/chat": sinLeer };

  const enviados = enNavegador ? enviosHechos(estado).length : 0;
  const tasa = enviados ? (conversaciones.length / enviados) * 100 : null;
  const nombreDesarrollo = enNavegador ? estado.ajustes.nombreDesarrollo : AJUSTES_EJEMPLO.nombreDesarrollo;

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior />

      <div className="flex flex-1">
        {/* Barra lateral (computadora) */}
        <aside className="hidden w-[16.5rem] shrink-0 border-r border-linea lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:gap-5 lg:px-3.5 lg:py-5">
          <ProyectoActivo nombre={nombreDesarrollo} />

          <nav aria-label="Flujo de trabajo">
            <p className="mb-2 px-2 text-[11px] font-bold tracking-[0.16em] text-tenue uppercase">Flujo de trabajo</p>
            <ul className="space-y-1">
              {PANTALLAS.map((p) => {
                const Icono = ICONOS[p.ruta];
                const activa = ruta === p.ruta;
                const cuenta = cuentas[p.ruta] || null;
                return (
                  <li key={p.ruta}>
                    <Link
                      href={p.ruta}
                      aria-current={activa ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                        activa ? "bg-superficie-2 text-white" : "text-tinta-2 hover:bg-superficie/70 hover:text-tinta",
                      )}
                    >
                      <Icono size={18} aria-hidden className={activa ? "text-marca-400" : "text-suave"} />
                      <span className="flex-1 truncate">
                        {p.numero}. {p.nombre}
                      </span>
                      {cuenta ? (
                        <span
                          className={cx(
                            "cifras rounded-full px-2 py-0.5 text-xs font-bold text-white",
                            p.ruta === "/chat" ? "bg-rojo-500" : "bg-marca-600",
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

          <section aria-labelledby="titulo-resumen">
            <p id="titulo-resumen" className="mb-2.5 px-2 text-[11px] font-bold tracking-[0.16em] text-tenue uppercase">
              Resumen de campaña
            </p>
            <div className="px-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-tinta-2">Tasa de respuesta</span>
                <span data-testid="tasa-respuesta" className="cifras text-sm font-bold text-verde-400">
                  {tasa === null ? "—" : `${tasa.toFixed(1)}%`}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-superficie-2"
                role="progressbar"
                aria-label="Tasa de respuesta"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(tasa ?? 0)}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-marca-600 to-verde-500 transition-all"
                  style={{ width: `${tasa ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-tenue">
                {enviados === 0 ? "Todavía no envías correos." : `${conversaciones.length} de ${enviados} contestaron (ejemplo).`}
              </p>
            </div>
          </section>

          <p className="mt-auto flex items-start gap-2 rounded-xl bg-superficie/60 px-3 py-2.5 text-xs leading-snug text-suave">
            <Lock size={14} aria-hidden className="mt-0.5 shrink-0" />
            Demo: ningún correo sale de aquí y los negocios son inventados.
          </p>
        </aside>

        <main className="mx-auto w-full max-w-[90rem] min-w-0 flex-1 pt-4 pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pt-5 sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] lg:px-6 lg:pt-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Pestañas abajo (celular y tableta) */}
      <nav
        aria-label="Pasos"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-superficie/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-2xl pr-[max(0.25rem,env(safe-area-inset-right,0px))] pl-[max(0.25rem,env(safe-area-inset-left,0px))]">
          {PANTALLAS.map((p) => {
            const Icono = ICONOS[p.ruta];
            const activa = ruta === p.ruta;
            const cuenta = cuentas[p.ruta] || null;
            return (
              <li key={p.ruta} className="min-w-0 flex-1">
                <Link
                  href={p.ruta}
                  aria-current={activa ? "page" : undefined}
                  aria-label={cuenta ? `${p.numero}. ${p.nombre} (${cuenta})` : `${p.numero}. ${p.nombre}`}
                  className="flex flex-col items-center gap-1 pt-2 pb-1.5"
                >
                  <span
                    className={cx(
                      "relative flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      activa ? "bg-marca-600/25 text-marca-400" : "text-suave",
                    )}
                  >
                    <Icono size={21} aria-hidden strokeWidth={activa ? 2.4 : 2} />
                    {cuenta ? (
                      <span
                        aria-hidden
                        className={cx(
                          "cifras absolute -top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] leading-none font-bold text-white ring-2 ring-superficie",
                          p.ruta === "/chat" ? "bg-rojo-500" : "bg-marca-600",
                        )}
                      >
                        {cuenta}
                      </span>
                    ) : null}
                  </span>
                  <span className={cx("max-w-full truncate text-[11px] leading-tight font-semibold", activa ? "text-marca-400" : "text-suave")}>
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
        titulo="Editar proyecto"
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

/** El proyecto en el que estás trabajando, arriba de la barra lateral. */
function ProyectoActivo({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-bold tracking-[0.16em] text-tenue uppercase">Proyecto activo</p>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-superficie/70"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-proyecto text-white">
          <Building2 size={18} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 font-display text-[14.5px] leading-snug font-bold text-balance text-tinta">{nombre}</span>
        <ChevronDown size={17} aria-hidden className={cx("shrink-0 text-suave transition-transform", abierto && "rotate-180")} />
      </button>
      {abierto ? (
        <div className="entrada mt-1 space-y-0.5 pl-2">
          <Link
            href="/"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-tinta-2 transition-colors hover:bg-superficie/70 hover:text-tinta"
          >
            <Building2 size={15} aria-hidden className="text-suave" /> Ver el proyecto
          </Link>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              abrirMiDesarrollo();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-tinta-2 transition-colors hover:bg-superficie/70 hover:text-tinta"
          >
            <SquarePen size={15} aria-hidden className="text-suave" /> Editar el proyecto
          </button>
        </div>
      ) : null}
    </div>
  );
}

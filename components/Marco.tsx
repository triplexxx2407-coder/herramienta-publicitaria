"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, ChartLine, ChevronDown, MessageCircle, Search, Send, SquarePen, Tag, type LucideIcon } from "lucide-react";
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

// Los mismos íconos del diseño: lupa, etiqueta, avión de papel, gráfica y globo de plática.
const ICONOS: Record<string, LucideIcon> = {
  "/buscar": Search,
  "/redactar": Tag,
  "/envio": Send,
  "/seguimiento": ChartLine,
  "/chat": MessageCircle,
};

/** Marco de la app: barra de arriba, menú a la izquierda en computadora y pestañas abajo en celular. */
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
        {/* Menú de la izquierda (computadora), como en el diseño */}
        <aside className="hidden w-[230px] shrink-0 lg:sticky lg:top-[68px] lg:flex lg:h-[calc(100dvh-68px)] lg:flex-col lg:overflow-y-auto lg:pt-[43px] lg:pr-[57px] lg:pl-[18px]">
          <ProyectoActivo nombre={nombreDesarrollo} />

          <nav aria-label="Flujo de trabajo" className="mt-[33px]">
            <p className="mb-[7px] text-[11px] leading-4 font-bold text-menu uppercase">Flujo de trabajo</p>
            <ul className="space-y-[6px]">
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
                        "flex h-[33px] items-center gap-2 rounded-[3px] pr-2.5 pl-2 text-[13px] transition-colors",
                        activa ? "bg-pildora font-bold text-marca-400" : "text-menu hover:bg-white/5 hover:text-tinta-2",
                      )}
                    >
                      <Icono size={14} aria-hidden strokeWidth={2.4} className={activa ? "text-marca-400" : "text-menu-icono"} />
                      <span className="flex-1 truncate">
                        {p.numero}. {p.nombre}
                      </span>
                      {cuenta ? (
                        <span className="cifras flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-marca-600 px-1 text-[9.5px] leading-none font-bold text-white">
                          {cuenta}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section aria-labelledby="titulo-resumen" className="mt-[36px]">
            <p id="titulo-resumen" className="text-[11px] leading-4 font-bold text-menu uppercase">
              Resumen de campaña
            </p>
            <p className="mt-[7px] text-[12px] leading-4 text-menu">Tasa de respuesta</p>
            <div className="mt-2 flex items-center gap-2.5">
              <div
                className="h-[7px] w-[117px] shrink-0 overflow-hidden rounded-full bg-pildora"
                role="progressbar"
                aria-label="Tasa de respuesta"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(tasa ?? 0)}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#2076d4] to-[#12ae8e] transition-all"
                  style={{ width: `${tasa ?? 0}%` }}
                />
              </div>
              <span data-testid="tasa-respuesta" className="cifras text-[12px] leading-4 font-bold whitespace-nowrap text-cifra">
                {tasa === null ? "—" : `${tasa.toFixed(1)}%`}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-menu">
              {enviados === 0 ? "Todavía no envías correos." : `${conversaciones.length} de ${enviados} contestaron (ejemplo).`}
            </p>
          </section>
        </aside>

        <main className="w-full min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pt-[5px] lg:pr-[31px] lg:pb-6 lg:pl-px">
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
                      activa ? "bg-pildora text-marca-400" : "text-suave",
                    )}
                  >
                    <Icono size={21} aria-hidden strokeWidth={activa ? 2.4 : 2} />
                    {cuenta ? (
                      <span
                        aria-hidden
                        className="cifras absolute -top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-marca-600 px-1 text-[10.5px] leading-none font-bold text-white ring-2 ring-superficie"
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

/** El proyecto en el que estás trabajando, arriba del menú. */
function ProyectoActivo({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)} className="group w-full text-left">
        <span className="flex items-center text-[12px] leading-4 font-medium text-menu">
          <span className="flex-1">Proyecto activo</span>
          <ChevronDown size={17} aria-hidden className={cx("-mr-px shrink-0 transition-transform", abierto && "rotate-180")} />
        </span>
        <span className="mt-[6px] flex items-center gap-[9px]">
          <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[2px] bg-pildora text-[#3b6fb0]">
            <Building2 size={13} aria-hidden strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1 text-[12.5px] leading-[15px] font-bold text-white group-hover:underline">{nombre}</span>
        </span>
      </button>
      {abierto ? (
        <div className="entrada mt-2 space-y-0.5">
          <Link
            href="/"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 rounded-[3px] px-2 py-2 text-[13px] font-semibold text-menu transition-colors hover:bg-white/5 hover:text-tinta-2"
          >
            <Building2 size={14} aria-hidden className="text-menu-icono" /> Ver el proyecto
          </Link>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              abrirMiDesarrollo();
            }}
            className="flex w-full items-center gap-2 rounded-[3px] px-2 py-2 text-[13px] font-semibold text-menu transition-colors hover:bg-white/5 hover:text-tinta-2"
          >
            <SquarePen size={14} aria-hidden className="text-menu-icono" /> Editar el proyecto
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CirculoRed } from "./IconoRed";
import { pedirAbrir } from "./ventanas";
import { actualizarEstado } from "@/lib/almacen";
import { elegirEmpresa } from "@/lib/bandeja";
import { salir, useFuente } from "@/lib/fuente";
import { useBandeja } from "@/lib/usar-bandeja";
import { cuandoCorto } from "@/lib/fechas";

/** El sobre blanco del logo, con las líneas del color de la pastilla (como en el diseño). */
function Sobre({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 26" aria-hidden className={className}>
      <rect width="36" height="26" rx="1.6" fill="#fff" />
      <path d="M0.6 2.3 18 16 35.4 2.3M0.6 23.6 13.6 14M35.4 23.6 22.4 14" fill="none" stroke="var(--color-logo)" strokeWidth="1.6" />
    </svg>
  );
}

/** El logo: sobre y «NEXORA» en una pastilla verde, con la marca «Demo» debajo (al lado en el celular). */
export function Logo() {
  const { modo } = useFuente();
  return (
    <Link href="/" aria-label="NEXORA, ir a la bandeja" className="flex shrink-0 items-center gap-2 lg:block">
      <span className="flex h-[30px] items-center gap-[6px] rounded-full bg-logo pr-3.5 pl-[7px] lg:h-[32px] lg:w-[163px] lg:gap-[7px] lg:pr-0 lg:pl-[9px]">
        <Sobre className="h-[20px] w-[28px] shrink-0 lg:h-[26px] lg:w-[36px]" />
        <span className="font-logo text-[20px] leading-none font-extrabold text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.35)] lg:text-[25px]">
          NEXORA
        </span>
      </span>
      {modo === "ejemplo" ? (
        <span className="flex h-[18px] w-[38px] items-center justify-center rounded-[3px] bg-pildora text-[9.5px] leading-none font-bold text-marca-400 uppercase lg:mt-[6px] lg:ml-[10px]">
          Demo
        </span>
      ) : null}
    </Link>
  );
}

/** Barra de arriba, como en el diseño: logo y campana de mensajes nuevos. */
export function BarraSuperior() {
  const { modo, usuario } = useFuente();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 bg-superficie">
      <div className="flex h-14 items-center gap-1 pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] lg:h-[68px] lg:items-start lg:gap-0 lg:pt-[5px] lg:pr-[17px] lg:pl-[15px]">
        <Logo />
        <div className="ml-auto" />
        {modo === "real" || modo === "ejemplo" ? <Avisos /> : null}
        {modo === "real" ? (
          <button
            type="button"
            onClick={() => void salir()}
            aria-label={usuario ? `Salir (${usuario.nombre})` : "Salir"}
            title="Salir"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-marca-400 hover:bg-white/10 lg:mt-[9px] lg:ml-[6px] lg:h-[28px] lg:w-[28px]"
          >
            <LogOut size={21} aria-hidden />
          </button>
        ) : null}
      </div>
    </header>
  );
}

/** Campana: las pláticas que todavía no abres, de todas las empresas. */
function Avisos() {
  const { todas } = useBandeja();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const nuevas = todas.filter((c) => c.noLeida);

  return (
    <div ref={caja} className="relative shrink-0 lg:mt-[9px]">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={nuevas.length ? `Avisos (${nuevas.length} sin leer)` : "Avisos"}
        aria-expanded={abierto}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-marca-400 hover:bg-white/10 lg:h-[28px] lg:w-[28px]"
      >
        <Bell size={23} aria-hidden fill="currentColor" />
        {nuevas.length ? (
          <span
            aria-hidden
            className="cifras absolute top-0.5 right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-proyecto px-1 text-[10px] leading-none font-bold text-white ring-2 ring-superficie lg:-top-1.5 lg:-right-1.5"
          >
            {nuevas.length}
          </span>
        ) : null}
      </button>
      {abierto ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-[3px] border border-linea bg-superficie shadow-flotante">
          <p className="border-b border-linea px-4 py-2.5 text-[11px] font-bold tracking-[0.02em] text-suave uppercase">Mensajes nuevos</p>
          {nuevas.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-suave">No hay nada nuevo.</p>
          ) : (
            <ul>
              {nuevas.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setAbierto(false);
                      // Se abre en la bandeja, mostrando todas las empresas para que no quede oculta.
                      actualizarEstado((e) => elegirEmpresa(e, null));
                      pedirAbrir("/", c.id);
                    }}
                    className="flex w-full items-center gap-3 border-t border-linea px-3 py-2.5 text-left transition-colors first:border-t-0 hover:bg-pildora"
                  >
                    <CirculoRed red={c.red} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-tinta">{c.persona}</span>
                      <span className="block truncate text-xs text-suave">
                        {c.empresa} · {c.ultimo.texto}
                      </span>
                    </span>
                    <span className="cifras shrink-0 text-[11px] font-semibold text-marca-400">{cuandoCorto(c.ultimo.fecha)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

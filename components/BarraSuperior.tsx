"use client";

import { Bell, Building2, Search, Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AvatarPersona } from "./PanelNexora";
import { abrirMiDesarrollo, pedirAbrir } from "./ventanas";
import { cx } from "./ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { buscaLaPropiedad, buscarClientes } from "@/lib/buscador-global";
import { nombreVisible } from "@/lib/contactos";
import { platicas } from "@/lib/envio";
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
  return (
    <Link href="/" aria-label="NEXORA, ir al proyecto" className="flex shrink-0 items-center gap-2 lg:block">
      <span className="flex h-[30px] items-center gap-[6px] rounded-full bg-logo pr-3.5 pl-[7px] lg:h-[32px] lg:w-[163px] lg:gap-[7px] lg:pr-0 lg:pl-[9px]">
        <Sobre className="h-[20px] w-[28px] shrink-0 lg:h-[26px] lg:w-[36px]" />
        <span className="font-logo text-[20px] leading-none font-extrabold text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.35)] lg:text-[25px]">
          NEXORA
        </span>
      </span>
      <span className="flex h-[18px] w-[38px] items-center justify-center rounded-[3px] bg-pildora text-[9.5px] leading-none font-bold text-marca-400 uppercase lg:mt-[6px] lg:ml-[10px]">
        Demo
      </span>
    </Link>
  );
}

/** Barra de arriba, como en el diseño: logo, buscador de clientes, campana de avisos y engrane del proyecto. */
export function BarraSuperior() {
  const [buscadorMovil, setBuscadorMovil] = useState(false);

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 bg-superficie">
      <div className="flex h-14 items-center gap-1 pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] lg:h-[68px] lg:items-start lg:gap-0 lg:pt-[5px] lg:pr-[17px] lg:pl-[15px]">
        <Logo />
        <div className="ml-auto hidden md:block lg:mt-[7px] lg:mr-[71px]">
          <Buscador className="w-[240px]" />
        </div>
        <button
          type="button"
          aria-label={buscadorMovil ? "Cerrar el buscador" : "Abrir el buscador"}
          aria-expanded={buscadorMovil}
          onClick={() => setBuscadorMovil((v) => !v)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-marca-400 hover:bg-white/10 md:hidden"
        >
          {buscadorMovil ? <X size={22} aria-hidden /> : <Search size={21} aria-hidden strokeWidth={2.6} />}
        </button>
        <Avisos />
        <button
          type="button"
          onClick={abrirMiDesarrollo}
          aria-label="Editar proyecto"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-marca-400 hover:bg-white/10 lg:mt-[9px] lg:ml-[3px] lg:h-[28px] lg:w-[28px]"
        >
          <Settings size={23} aria-hidden fill="currentColor" className="icono-solido-hueco" />
        </button>
      </div>
      {buscadorMovil ? (
        <div className="px-3 pb-2.5 md:hidden">
          <Buscador autoEnfoque alCerrar={() => setBuscadorMovil(false)} />
        </div>
      ) : null}
    </header>
  );
}

function Buscador({
  className,
  autoEnfoque = false,
  alCerrar,
}: {
  className?: string;
  autoEnfoque?: boolean;
  alCerrar?: () => void;
}) {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const clientes = enNavegador ? buscarClientes(estado, texto) : [];
  const propiedad = enNavegador && buscaLaPropiedad(estado, texto);
  const mostrar = abierto && texto.trim().length >= 2;

  function ir(ruta: string, idContacto: string) {
    pedirAbrir(ruta, idContacto);
    setTexto("");
    setAbierto(false);
    alCerrar?.();
    router.push(ruta);
  }

  return (
    <div ref={caja} className={cx("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Buscar cliente o propiedad
      </label>
      <Search
        size={15}
        aria-hidden
        strokeWidth={2.8}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8095aa]"
      />
      <input
        id={id}
        type="search"
        autoFocus={autoEnfoque}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
        placeholder="Buscar cliente o propiedad..."
        className="h-10 w-full rounded-[3px] bg-pildora pr-3 pl-9 text-[15px] text-tinta outline-none placeholder:text-center placeholder:text-[#e8edf5] focus:ring-2 focus:ring-marca-400 lg:h-[28px] lg:text-[11.5px]"
      />
      {mostrar ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-[3px] border border-linea bg-superficie shadow-flotante lg:w-[340px] lg:left-auto">
          {propiedad ? (
            <button
              type="button"
              onClick={() => {
                setTexto("");
                setAbierto(false);
                alCerrar?.();
                abrirMiDesarrollo();
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-pildora"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-proyecto text-white">
                <Building2 size={17} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-tinta">{estado.ajustes.nombreDesarrollo}</span>
                <span className="block truncate text-xs text-suave">Mi desarrollo · {estado.ajustes.ciudad}</span>
              </span>
            </button>
          ) : null}
          {clientes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => ir(r.ruta, r.id)}
              className="flex w-full items-center gap-3 border-t border-linea px-3 py-2.5 text-left transition-colors first:border-t-0 hover:bg-pildora"
            >
              <span className="shrink-0 rounded-full bg-logo text-black">
                <AvatarPersona tamano={34} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-tinta">{r.nombre}</span>
                <span className="block truncate text-xs text-suave">{r.detalle}</span>
              </span>
              <span className="shrink-0 rounded-[3px] bg-pildora px-2 py-1 text-[11px] font-bold text-marca-400">{r.etiqueta}</span>
            </button>
          ))}
          {!propiedad && clientes.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-suave">No encontré nada con ese nombre o correo.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Campana: las pláticas que todavía no abres. */
function Avisos() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const nuevas = enNavegador ? platicas(estado).filter((p) => p.noLeida) : [];

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
          <p className="border-b border-linea px-4 py-2.5 text-[11px] font-bold tracking-[0.02em] text-suave uppercase">Avisos</p>
          {nuevas.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-suave">No hay nada nuevo.</p>
          ) : (
            <ul>
              {nuevas.map((p) => (
                <li key={p.contacto.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setAbierto(false);
                      pedirAbrir("/chat", p.contacto.id);
                      router.push("/chat");
                    }}
                    className="flex w-full items-center gap-3 border-t border-linea px-3 py-2.5 text-left transition-colors first:border-t-0 hover:bg-pildora"
                  >
                    <span className="shrink-0 rounded-full bg-logo text-black">
                      <AvatarPersona tamano={34} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-tinta">
                        {nombreVisible(p.contacto.nombre, p.contacto.esEjemplo)}
                      </span>
                      <span className="block truncate text-xs text-suave">{p.ultimo.texto}</span>
                    </span>
                    <span className="cifras shrink-0 text-[11px] font-semibold text-marca-400">{cuandoCorto(p.ultimo.fecha)}</span>
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

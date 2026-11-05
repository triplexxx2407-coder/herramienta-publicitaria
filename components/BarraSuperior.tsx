"use client";

import { Bell, Building2, Mail, Search, Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { abrirMiDesarrollo, pedirAbrir } from "./ventanas";
import { cx } from "./ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { buscaLaPropiedad, buscarClientes } from "@/lib/buscador-global";
import { nombreVisible } from "@/lib/contactos";
import { platicas } from "@/lib/envio";
import { cuandoCorto } from "@/lib/fechas";

/** El logo de la app: sobre dentro de una pastilla verde. */
export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="NEXORA, ir al proyecto">
      <span className="flex items-center gap-2 rounded-2xl bg-logo px-2.5 py-1.5 shadow-sm">
        <Mail size={compacto ? 18 : 20} aria-hidden className="text-white" strokeWidth={2.2} />
        <span className="font-display text-[17px] leading-none font-extrabold tracking-wide text-white">NEXORA</span>
      </span>
      <span className="rounded-md bg-marca-600/25 px-1.5 py-0.5 text-[10px] leading-4 font-bold tracking-widest text-marca-400 uppercase ring-1 ring-marca-400/35">
        Demo
      </span>
    </Link>
  );
}

/** Barra de arriba: logo, buscador de clientes, campana de avisos y ajustes del proyecto. */
export function BarraSuperior() {
  const [buscadorMovil, setBuscadorMovil] = useState(false);

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-linea bg-superficie">
      <div className="flex h-14 items-center gap-3 pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] lg:h-16 lg:gap-4 lg:pr-5 lg:pl-4">
        <Logo />
        <div className="ml-auto hidden min-w-0 flex-1 justify-end md:flex">
          <Buscador className="w-full max-w-sm" />
        </div>
        <button
          type="button"
          aria-label={buscadorMovil ? "Cerrar el buscador" : "Abrir el buscador"}
          aria-expanded={buscadorMovil}
          onClick={() => setBuscadorMovil((v) => !v)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-tinta-2 hover:bg-white/10 hover:text-tinta md:hidden"
        >
          {buscadorMovil ? <X size={21} aria-hidden /> : <Search size={21} aria-hidden />}
        </button>
        <Avisos />
        <button
          type="button"
          onClick={abrirMiDesarrollo}
          aria-label="Editar proyecto"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-tinta-2 hover:bg-white/10 hover:text-tinta"
        >
          <Settings size={21} aria-hidden />
        </button>
      </div>
      {buscadorMovil ? (
        <div className="border-t border-linea px-3 py-2.5 md:hidden">
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
      <Search size={17} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
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
        placeholder="Buscar cliente o propiedad…"
        className="h-10 w-full rounded-xl border border-linea bg-superficie-2 pr-3 pl-10 text-[15px] text-tinta outline-none placeholder:text-tenue focus:border-marca-500 focus:ring-4 focus:ring-marca-600/25"
      />
      {mostrar ? (
        <div className="absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-2xl border border-linea bg-superficie shadow-flotante">
          {propiedad ? (
            <button
              type="button"
              onClick={() => {
                setTexto("");
                setAbierto(false);
                alCerrar?.();
                abrirMiDesarrollo();
              }}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-superficie-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-proyecto text-white">
                <Building2 size={17} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-tinta">{estado.ajustes.nombreDesarrollo}</span>
                <span className="block truncate text-xs text-suave">Mi desarrollo · {estado.ajustes.ciudad}</span>
              </span>
            </button>
          ) : null}
          {clientes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => ir(r.ruta, r.id)}
              className="flex w-full items-center gap-3 border-t border-linea px-3.5 py-2.5 text-left transition-colors first:border-t-0 hover:bg-superficie-2"
            >
              <Avatar nombre={r.nombre} tamano={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-tinta">{r.nombre}</span>
                <span className="block truncate text-xs text-suave">{r.detalle}</span>
              </span>
              <span className="shrink-0 rounded-md bg-superficie-2 px-2 py-1 text-[11px] font-bold text-tinta-2">{r.etiqueta}</span>
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
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={nuevas.length ? `Avisos (${nuevas.length} sin leer)` : "Avisos"}
        aria-expanded={abierto}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-tinta-2 hover:bg-white/10 hover:text-tinta"
      >
        <Bell size={21} aria-hidden />
        {nuevas.length ? (
          <span
            aria-hidden
            className="cifras absolute top-1 right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rojo-500 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-superficie"
          >
            {nuevas.length}
          </span>
        ) : null}
      </button>
      {abierto ? (
        <div className="absolute top-12 right-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-linea bg-superficie shadow-flotante">
          <p className="border-b border-linea px-4 py-2.5 text-xs font-bold tracking-[0.14em] text-suave uppercase">Avisos</p>
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
                    className="flex w-full items-center gap-3 border-t border-linea px-3.5 py-2.5 text-left transition-colors first:border-t-0 hover:bg-superficie-2"
                  >
                    <Avatar nombre={p.contacto.nombre} tamano={36} />
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

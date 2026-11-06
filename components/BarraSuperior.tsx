"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { salir, useFuente } from "@/lib/fuente";

/** El sobre blanco del logo. */
function Sobre({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 26" aria-hidden className={className}>
      <rect width="36" height="26" rx="1.6" fill="#fff" />
      <path d="M0.6 2.3 18 16 35.4 2.3M0.6 23.6 13.6 14M35.4 23.6 22.4 14" fill="none" stroke="var(--color-logo)" strokeWidth="1.6" />
    </svg>
  );
}

/** El logo: sobre y «NEXORA» en una pastilla verde. */
export function Logo() {
  return (
    <Link href="/" aria-label="NEXORA, ir al inicio" className="flex shrink-0 items-center">
      <span className="flex h-[32px] items-center gap-[7px] rounded-full bg-logo pr-3.5 pl-[8px]">
        <Sobre className="h-[20px] w-[28px] shrink-0" />
        <span className="font-logo text-[21px] leading-none font-extrabold text-white">NEXORA</span>
      </span>
    </Link>
  );
}

/** Botón de salir (sólo con sesión). */
export function BotonSalir() {
  const { modo, usuario } = useFuente();
  if (modo !== "real") return null;
  return (
    <button
      type="button"
      onClick={() => void salir()}
      aria-label={usuario ? `Salir (${usuario.nombre})` : "Salir"}
      title="Salir"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-suave hover:bg-relleno hover:text-tinta"
    >
      <LogOut size={20} aria-hidden />
    </button>
  );
}

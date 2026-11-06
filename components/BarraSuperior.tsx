"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { salir, useFuente } from "@/lib/fuente";

/** El sobre blanco del logo, con las líneas del color de la pastilla (como en el diseño). */
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
    <Link href="/" aria-label="NEXORA, ir al inicio" className="flex shrink-0 items-center gap-2 lg:block">
      <span className="flex h-[30px] items-center gap-[6px] rounded-full bg-logo pr-3.5 pl-[7px] lg:h-[32px] lg:w-[163px] lg:gap-[7px] lg:pr-0 lg:pl-[9px]">
        <Sobre className="h-[20px] w-[28px] shrink-0 lg:h-[26px] lg:w-[36px]" />
        <span className="font-logo text-[20px] leading-none font-extrabold text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.35)] lg:text-[25px]">
          NEXORA
        </span>
      </span>
    </Link>
  );
}

/** Barra de arriba, como en el diseño: logo y botón de salir. */
export function BarraSuperior() {
  const { modo, usuario } = useFuente();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 bg-superficie">
      <div className="flex h-14 items-center gap-1 pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] lg:h-[68px] lg:items-start lg:gap-0 lg:pt-[5px] lg:pr-[17px] lg:pl-[15px]">
        <Logo />
        <div className="ml-auto" />
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

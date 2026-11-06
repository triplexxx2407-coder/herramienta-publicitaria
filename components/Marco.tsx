"use client";

import { BarChart3, Building2, Link2, MessageCircle, Settings2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { elegirEmpresa, iniciarFuente, useEmpresaActiva, useFuente } from "@/lib/fuente";
import { ContenedorAvisos } from "./avisos";
import { BotonSalir, Logo } from "./BarraSuperior";
import { PantallaEntrar } from "./PantallaEntrar";
import { Cargando, cx } from "./ui";

const PESTANAS: { ruta: string; nombre: string; Icono: LucideIcon }[] = [
  { ruta: "/", nombre: "Resultados", Icono: BarChart3 },
  { ruta: "/enlaces", nombre: "Enlaces", Icono: Link2 },
  { ruta: "/whatsapp", nombre: "WhatsApp de prueba", Icono: MessageCircle },
  { ruta: "/empresas", nombre: "Perfiles", Icono: Settings2 },
];

/** Marco de la app: arriba el logo, la empresa que estás viendo y las pestañas. */
export function Marco({ children }: { children: ReactNode }) {
  const { modo } = useFuente();
  useEffect(() => {
    void iniciarFuente();
  }, []);

  if (modo === "entrar") return <PantallaEntrar />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-linea bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Logo />
          <div className="ml-auto flex min-w-0 items-center gap-1">
            {modo === "real" ? <SelectorPerfil /> : null}
            <BotonSalir />
          </div>
        </div>
        {modo === "real" ? <Pestanas /> : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16">{modo === "revisando" ? <Cargando /> : children}</main>
      <ContenedorAvisos />
    </div>
  );
}

function SelectorPerfil() {
  const { empresas } = useFuente();
  const activa = useEmpresaActiva();
  if (empresas.length === 0) return null;
  return (
    <label className="relative flex min-w-0 items-center">
      <span className="sr-only">Empresa que estás viendo</span>
      <Building2 size={16} aria-hidden className="pointer-events-none absolute left-3 text-suave" />
      <select
        value={activa?.id ?? ""}
        onChange={(e) => elegirEmpresa(e.target.value)}
        className="h-10 max-w-[48vw] min-w-0 rounded-full border border-linea bg-relleno pr-3 pl-9 text-[14px] font-semibold text-tinta outline-none focus:ring-2 focus:ring-marca-500/30 sm:max-w-xs"
      >
        {empresas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pestanas() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className="sin-barra mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3">
      {PESTANAS.map(({ ruta: r, nombre, Icono }) => {
        const activa = ruta === r;
        return (
          <Link
            key={r}
            href={r}
            aria-current={activa ? "page" : undefined}
            className={cx(
              "inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[14px] font-semibold whitespace-nowrap transition-colors",
              activa ? "border-marca-600 text-marca-600" : "border-transparent text-suave hover:text-tinta",
            )}
          >
            <Icono size={16} aria-hidden /> {nombre}
          </Link>
        );
      })}
    </nav>
  );
}

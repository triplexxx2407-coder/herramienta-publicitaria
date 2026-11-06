"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEmpresaActiva, useFuente } from "@/lib/fuente";
import type { EmpresaCliente } from "@/lib/tipos";
import { BOTON, Cargando, Vacio } from "./ui";

/** Revisa que haya servidor, sesión y un perfil elegido antes de enseñar una pantalla. */
export function Guardia({ children }: { children: (empresa: EmpresaCliente) => ReactNode }) {
  const { modo } = useFuente();
  const empresa = useEmpresaActiva();

  if (modo === "revisando") return <Cargando />;
  if (modo !== "real") {
    return (
      <Vacio
        icono={<Building2 size={26} aria-hidden />}
        titulo="Abre NEXORA desde su dirección"
        texto="Esta pantalla sólo funciona entrando a NEXORA en su dirección de Cloudflare."
      />
    );
  }
  if (!empresa) {
    return (
      <Vacio
        icono={<Building2 size={26} aria-hidden />}
        titulo="Primero crea un perfil"
        texto="Un perfil es una empresa que promocionas. Créala y aquí verás qué publicaciones le traen clientes."
      >
        <Link href="/empresas" className={BOTON}>
          Crear un perfil
        </Link>
      </Vacio>
    );
  }
  return <>{children(empresa)}</>;
}

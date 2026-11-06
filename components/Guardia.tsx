"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEmpresaActiva, useFuente } from "@/lib/fuente";
import type { EmpresaCliente } from "@/lib/tipos";
import { CargandoPanel, ContenidoClaro, IconoCirculo, PanelNexora, PastillaCliente, VacioClaro } from "./PanelNexora";

/**
 * Revisa que haya servidor, sesión y un perfil elegido antes de enseñar una pantalla.
 * Mientras no se cumpla, muestra el aviso que toca en el mismo marco de NEXORA.
 */
export function Guardia({ titulo, children }: { titulo: string; children: (empresa: EmpresaCliente) => ReactNode }) {
  const { modo } = useFuente();
  const empresa = useEmpresaActiva();

  if (modo === "revisando") return <CargandoPanel />;
  if (modo !== "real" || !empresa) {
    const sinServidor = modo !== "real";
    return (
      <PanelNexora
        titulo={titulo}
        ayuda={<p>{titulo} funciona con el servidor de NEXORA.</p>}
        pastilla={<PastillaCliente texto={titulo} icono={<IconoCirculo><Building2 size={18} aria-hidden /></IconoCirculo>} />}
        etiquetaLista={titulo}
        lista={<p className="px-2 py-3 text-sm text-tinta-2">{sinServidor ? "Sin servidor." : "Todavía no hay perfiles."}</p>}
        etiquetaPrincipal={titulo}
        principal={
          <ContenidoClaro>
            <VacioClaro
              icono={<Building2 size={28} aria-hidden />}
              titulo={sinServidor ? "Abre NEXORA desde su dirección" : "Primero crea un perfil"}
              texto={
                sinServidor
                  ? "Esta pantalla sólo funciona entrando a NEXORA en su dirección de Cloudflare."
                  : "Un perfil es una empresa que atiendes. Créala y aquí aparecerán sus interesados, publicaciones y enlaces."
              }
            >
              {sinServidor ? null : (
                <Link href="/empresas" className="font-bold text-marca-600 underline underline-offset-2">
                  Crear un perfil
                </Link>
              )}
            </VacioClaro>
          </ContenidoClaro>
        }
      />
    );
  }
  return <>{children(empresa)}</>;
}

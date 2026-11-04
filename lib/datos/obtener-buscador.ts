import type { Empresa } from "@/lib/tipos";
import type { BuscadorDeEmpresas, FiltrosBusqueda } from "./buscador";
import { DatosDeEjemplo } from "./datos-de-ejemplo";
import { DenueInegi } from "./denue-inegi";

export interface Entorno {
  INEGI_TOKEN?: string;
  DENUE_ACTIVADO?: string;
}

/**
 * Elige la fuente de datos. El DENUE sólo se usa si hay token Y el interruptor
 * DENUE_ACTIVADO dice "si". En cualquier otro caso: datos de ejemplo.
 */
export function obtenerBuscador(entorno: Entorno): BuscadorDeEmpresas {
  const token = entorno.INEGI_TOKEN?.trim();
  const activado = entorno.DENUE_ACTIVADO?.trim().toLowerCase() === "si";
  if (token && activado) return new DenueInegi(token);
  return new DatosDeEjemplo();
}

export interface ResultadoBusqueda {
  empresas: Empresa[];
  fuente: { nombre: string; esEjemplo: boolean };
  /** Mensaje para el usuario si hubo que usar el respaldo. */
  aviso?: string;
}

/** Busca con la fuente elegida; si falla, usa los datos de ejemplo sin romper la app. */
export async function buscarConRespaldo(
  buscador: BuscadorDeEmpresas,
  filtros: FiltrosBusqueda,
  respaldo: BuscadorDeEmpresas = new DatosDeEjemplo(),
): Promise<ResultadoBusqueda> {
  try {
    const empresas = await buscador.buscar(filtros);
    return { empresas, fuente: { nombre: buscador.nombre, esEjemplo: buscador.esEjemplo } };
  } catch {
    const empresas = await respaldo.buscar(filtros);
    return {
      empresas,
      fuente: { nombre: respaldo.nombre, esEjemplo: respaldo.esEjemplo },
      aviso: "No se pudo consultar el directorio del INEGI. Se muestran datos de ejemplo.",
    };
  }
}

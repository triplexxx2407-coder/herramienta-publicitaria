import type { Empresa } from "@/lib/tipos";
import type { IdTamano } from "@/lib/catalogos";

export interface FiltrosBusqueda {
  /** Id del giro (datos/giros.json). Vacío = todos. */
  giro?: string;
  /** Id de la ciudad (datos/ciudades.json). Vacío = todas. */
  ciudad?: string;
  /** Tamaño aproximado. Vacío = todos. */
  tamano?: IdTamano | "";
}

/**
 * Lo único que la pantalla "Buscar empresas" necesita saber de una fuente de datos.
 * Hoy se usa DatosDeEjemplo; cuando haya token del INEGI se podrá usar DenueInegi
 * sin cambiar las pantallas.
 */
export interface BuscadorDeEmpresas {
  /** Nombre que se muestra en pantalla como "fuente". */
  readonly nombre: string;
  /** true si los datos son inventados. La pantalla muestra el banner de ejemplo. */
  readonly esEjemplo: boolean;
  buscar(filtros: FiltrosBusqueda): Promise<Empresa[]>;
}

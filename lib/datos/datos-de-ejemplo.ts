import empresasJson from "@/datos/empresas-ejemplo.json";
import { TAMANOS } from "@/lib/catalogos";
import type { Empresa } from "@/lib/tipos";
import type { BuscadorDeEmpresas, FiltrosBusqueda } from "./buscador";

const EMPRESAS: Empresa[] = empresasJson;

/** Buscador con empresas 100% inventadas (correos @example.com). */
export class DatosDeEjemplo implements BuscadorDeEmpresas {
  readonly nombre = "Datos de ejemplo (simula el DENUE de INEGI)";
  readonly esEjemplo = true;

  constructor(private readonly empresas: Empresa[] = EMPRESAS) {}

  async buscar(filtros: FiltrosBusqueda): Promise<Empresa[]> {
    const tamano = TAMANOS.find((t) => t.id === filtros.tamano);
    return this.empresas.filter(
      (e) =>
        (!filtros.giro || e.giro === filtros.giro) &&
        (!filtros.ciudad || e.ciudad === filtros.ciudad) &&
        (!tamano || (e.estrato !== null && (tamano.estratos as readonly number[]).includes(e.estrato))),
    );
  }
}

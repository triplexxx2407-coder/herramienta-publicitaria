// En la versión de un solo archivo no hay servidor: se consulta directo a los datos de ejemplo.
import { DatosDeEjemplo } from "@/lib/datos/datos-de-ejemplo";
import { buscarConRespaldo, type ResultadoBusqueda } from "@/lib/datos/obtener-buscador";
import type { IdTamano } from "@/lib/catalogos";

export interface FiltrosPantalla {
  giro: string;
  ciudad: string;
  tamano: string;
}

export function consultarEmpresas(f: FiltrosPantalla): Promise<ResultadoBusqueda> {
  return buscarConRespaldo(new DatosDeEjemplo(), { ...f, tamano: f.tamano as IdTamano | "" });
}

/**
 * Conexión con la API del DENUE de INEGI. ESQUELETO SIN ACTIVAR.
 *
 * Basado en la documentación oficial: https://www.inegi.org.mx/servicios/api_denue.html
 * (leída el 4 de noviembre de 2026). Lo que ahí dice y se usa aquí:
 *  - Dirección base: https://www.inegi.org.mx/app/api/denue/v1/consulta/
 *  - Todos los métodos piden un token gratuito que se obtiene registrándose.
 *  - Los parámetros van dentro de la dirección, separados por "/", en orden fijo.
 *  - Método BuscarAreaActEstr: entidad / municipio / localidad / AGEB / manzana /
 *    sector / subsector / rama / clase / nombre / registro inicial / registro final /
 *    id / estrato / token. "0" significa "todos" (entidad usa "00").
 *  - Estrato (personal ocupado): 1 = 0 a 5, 2 = 6 a 10, 3 = 11 a 30, 4 = 31 a 50,
 *    5 = 51 a 100, 6 = 101 a 250, 7 = 251 o más.
 *  - Campos de respuesta incluyen teléfono, correo electrónico y página de internet.
 *
 * Lo que NO se pudo verificar (hay que confirmarlo con una respuesta real):
 *  - Los nombres exactos de los campos del JSON. La documentación los lista sólo
 *    como "Campo 1, Campo 2…"; los nombres usados abajo (Id, Nombre, Telefono,
 *    Correo_e, Sitio_internet, Estrato…) salen del código de ejemplo de INEGI.
 *  - Qué devuelve la API cuando no hay resultados o el token es inválido.
 *  - Límites de uso: la página no menciona ninguno (sólo un radio máximo de 5 km
 *    para el método Buscar, que aquí no se usa).
 *  - Cuántos registros traen correo: la página no lo dice.
 *  - Las claves de municipio en datos/ciudades.json (revisar el catálogo del INEGI).
 *  - El giro se busca por palabra en el nombre del negocio, no por código SCIAN;
 *    es lo más simple y puede dejar fuera negocios. Mejorar después con la "clase".
 */
import { CIUDADES, GIROS, TAMANOS } from "@/lib/catalogos";
import type { Empresa } from "@/lib/tipos";
import type { BuscadorDeEmpresas, FiltrosBusqueda } from "./buscador";

export const URL_BASE_DENUE = "https://www.inegi.org.mx/app/api/denue/v1/consulta";

/** Cuántos registros pedir por consulta. Número prudente; la documentación no fija un máximo. */
const REGISTROS_POR_CONSULTA = 50;

type Fetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** Registro tal como (creemos) lo devuelve el DENUE. Ver nota arriba. */
interface RegistroDenue {
  Id?: string | number;
  Nombre?: string;
  Razon_social?: string;
  Clase_actividad?: string;
  Estrato?: string;
  Ubicacion?: string;
  Telefono?: string;
  Correo_e?: string;
  Sitio_internet?: string;
}

export class DenueInegi implements BuscadorDeEmpresas {
  readonly nombre = "Directorio DENUE de INEGI";
  readonly esEjemplo = false;

  constructor(
    private readonly token: string,
    private readonly fetchFn: Fetch = (url) => fetch(url, { cache: "no-store" }),
  ) {
    if (!token) throw new Error("Falta INEGI_TOKEN");
  }

  /** Arma la dirección del método BuscarAreaActEstr para un estrato. */
  construirUrl(filtros: FiltrosBusqueda, estrato: number): string {
    const ciudad = CIUDADES.find((c) => c.id === filtros.ciudad);
    const giro = GIROS.find((g) => g.id === filtros.giro);
    const partes = [
      "BuscarAreaActEstr",
      ciudad?.claveEntidad ?? "00",
      ciudad?.claveMunicipio ?? "0",
      "0", // localidad
      "0", // AGEB
      "0", // manzana
      "0", // sector
      "0", // subsector
      "0", // rama
      "0", // clase
      giro ? encodeURIComponent(giro.palabraClave) : "0", // nombre
      "1",
      String(REGISTROS_POR_CONSULTA),
      "0", // id
      String(estrato),
      encodeURIComponent(this.token),
    ];
    return `${URL_BASE_DENUE}/${partes.join("/")}`;
  }

  async buscar(filtros: FiltrosBusqueda): Promise<Empresa[]> {
    const tamano = TAMANOS.find((t) => t.id === filtros.tamano);
    // Sin tamaño: estrato 0 (todos). Con tamaño: una consulta por cada estrato del grupo.
    const estratos: number[] = tamano ? [...tamano.estratos] : [0];
    const resultados: Empresa[] = [];
    for (const estrato of estratos) {
      const respuesta = await this.fetchFn(this.construirUrl(filtros, estrato));
      if (!respuesta.ok) throw new Error(`El DENUE respondió con error ${respuesta.status}`);
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) continue; // Sin resultados u otro formato: por verificar.
      for (const r of datos as RegistroDenue[]) resultados.push(convertir(r, filtros, estrato));
    }
    return resultados;
  }
}

function texto(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

function convertir(r: RegistroDenue, filtros: FiltrosBusqueda, estrato: number): Empresa {
  return {
    id: `denue-${r.Id ?? Math.random().toString(36).slice(2)}`,
    nombre: texto(r.Nombre) ?? texto(r.Razon_social) ?? "(sin nombre)",
    giro: texto(r.Clase_actividad) ?? filtros.giro ?? "",
    ciudad: filtros.ciudad || (texto(r.Ubicacion) ?? ""),
    estrato: estrato || null,
    telefono: texto(r.Telefono),
    correo: texto(r.Correo_e)?.toLowerCase() ?? null,
    sitioWeb: texto(r.Sitio_internet),
  };
}

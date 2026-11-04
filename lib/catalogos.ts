import girosJson from "@/datos/giros.json";
import ciudadesJson from "@/datos/ciudades.json";

export interface Giro {
  id: string;
  nombre: string;
  /** Palabra que se busca en el DENUE para este giro. */
  palabraClave: string;
}

export interface Ciudad {
  id: string;
  nombre: string;
  estado: string;
  /** Clave de entidad del INEGI (2 dígitos). Por verificar en el catálogo oficial. */
  claveEntidad: string;
  /** Clave de municipio del INEGI (3 dígitos). Por verificar en el catálogo oficial. */
  claveMunicipio: string;
  lada: string;
}

export const GIROS: Giro[] = girosJson;
export const CIUDADES: Ciudad[] = ciudadesJson;

/** Tamaños agrupados en palabras simples, con los estratos del DENUE que abarcan. */
export const TAMANOS = [
  { id: "pequeno", nombre: "Pequeño (hasta 10 personas)", estratos: [1, 2] },
  { id: "mediano", nombre: "Mediano (11 a 50 personas)", estratos: [3, 4] },
  { id: "grande", nombre: "Grande (51 personas o más)", estratos: [5, 6, 7] },
] as const;

export type IdTamano = (typeof TAMANOS)[number]["id"];

export const NOMBRE_ESTRATO: Record<number, string> = {
  1: "0 a 5 personas",
  2: "6 a 10 personas",
  3: "11 a 30 personas",
  4: "31 a 50 personas",
  5: "51 a 100 personas",
  6: "101 a 250 personas",
  7: "251 personas o más",
};

export function nombreGiro(id: string): string {
  return GIROS.find((g) => g.id === id)?.nombre ?? id;
}

export function nombreCiudad(id: string): string {
  return CIUDADES.find((c) => c.id === id)?.nombre ?? id;
}

import type { ResultadoBusqueda } from "./obtener-buscador";

export interface FiltrosPantalla {
  giro: string;
  ciudad: string;
  tamano: string;
}

/** La pantalla Buscar pide empresas al servidor (ahí se lee el token del INEGI). */
export async function consultarEmpresas(f: FiltrosPantalla): Promise<ResultadoBusqueda> {
  const p = new URLSearchParams({ giro: f.giro, ciudad: f.ciudad, tamano: f.tamano });
  const r = await fetch(`/api/empresas?${p.toString()}`);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

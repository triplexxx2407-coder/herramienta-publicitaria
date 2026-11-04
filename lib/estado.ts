import proyectoJson from "@/datos/proyecto-ejemplo.json";
import empresasJson from "@/datos/empresas-ejemplo.json";
import { aprobar, generarBorrador } from "@/lib/redaccion";
import { agregarContactos, contactoDesdeEmpresa, FUENTE_EJEMPLO, puedeRedactar } from "@/lib/contactos";
import type { AjustesProyecto, Borrador, Empresa, EstadoDemo } from "@/lib/tipos";

export const AJUSTES_EJEMPLO: AjustesProyecto = {
  ...proyectoJson,
  puntosFuertes: proyectoJson.puntosFuertes as [string, string, string],
};

export function estadoInicial(): EstadoDemo {
  return {
    version: 1,
    contactos: [],
    seleccionados: [],
    supresion: [],
    ajustes: structuredClone(AJUSTES_EJEMPLO),
    borradores: {},
  };
}

/** Revisa que lo leído del navegador tenga la forma esperada; si no, empieza de cero. */
export function leerEstadoGuardado(texto: string | null): EstadoDemo {
  if (!texto) return estadoInicial();
  try {
    const e = JSON.parse(texto) as Partial<EstadoDemo>;
    if (e?.version !== 1 || !Array.isArray(e.contactos)) return estadoInicial();
    const base = estadoInicial();
    return {
      version: 1,
      contactos: e.contactos,
      seleccionados: Array.isArray(e.seleccionados) ? e.seleccionados : [],
      supresion: Array.isArray(e.supresion) ? e.supresion : [],
      ajustes: { ...base.ajustes, ...(e.ajustes ?? {}) },
      borradores: e.borradores && typeof e.borradores === "object" ? e.borradores : {},
    };
  } catch {
    return estadoInicial();
  }
}

/**
 * "Recorrido de ejemplo": llena la demo de un solo clic para presentarla.
 * Agrega las empresas de ejemplo de Tijuana, elige las que tienen correo
 * y aprueba sus borradores con la plantilla.
 */
export function estadoDeRecorrido(ahora = new Date()): EstadoDemo {
  const empresas = (empresasJson as Empresa[]).filter((e) => e.ciudad === "tijuana");
  let estado = agregarContactos(
    estadoInicial(),
    empresas.map((e) => contactoDesdeEmpresa(e, FUENTE_EJEMPLO, true, ahora)),
  );
  const elegibles = estado.contactos.filter((c) => puedeRedactar(c, estado));
  const borradores: Record<string, Borrador> = {};
  for (const c of elegibles) {
    const r = aprobar(generarBorrador(c, estado.ajustes), estado.ajustes, ahora);
    if ("estado" in r) borradores[c.id] = r;
  }
  estado = { ...estado, seleccionados: elegibles.map((c) => c.id), borradores };
  return estado;
}

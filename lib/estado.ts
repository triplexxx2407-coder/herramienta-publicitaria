import type { EstadoDemo } from "@/lib/tipos";

export function estadoInicial(): EstadoDemo {
  return { version: 2, respuestasRed: {}, leidosRed: [], empresaActiva: null };
}

function esObjeto(v: unknown): v is object {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Revisa que lo leído del navegador tenga la forma esperada; si no, empieza de cero.
 * Lo guardado por la versión anterior (con el flujo de correos) se aprovecha: se quedan
 * tus respuestas de la bandeja y lo demás se tira.
 */
export function leerEstadoGuardado(texto: string | null): EstadoDemo {
  if (!texto) return estadoInicial();
  try {
    const e = JSON.parse(texto) as Partial<Omit<EstadoDemo, "version">> & { version?: number };
    if (e?.version !== 1 && e?.version !== 2) return estadoInicial();
    return {
      version: 2,
      respuestasRed: esObjeto(e.respuestasRed) ? (e.respuestasRed as EstadoDemo["respuestasRed"]) : {},
      leidosRed: Array.isArray(e.leidosRed) ? e.leidosRed : [],
      empresaActiva: typeof e.empresaActiva === "string" ? e.empresaActiva : null,
    };
  } catch {
    return estadoInicial();
  }
}

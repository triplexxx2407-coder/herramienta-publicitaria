import { hashTexto } from "@/lib/azar";
import type { Contacto } from "@/lib/tipos";

/**
 * SEGUIMIENTO SIMULADO. En la demo no se envía nada, así que estos estados son
 * inventados a partir del id del contacto, sólo para mostrar cómo se vería el tablero.
 * No representan ni predicen resultados reales.
 */
export interface EstadoSimulado {
  contacto: Contacto;
  enviado: boolean;
  abrio: boolean;
  respondio: boolean;
  diasDesdeEnvio: number;
  necesitaSegundoMensaje: boolean;
}

export const DIAS_PARA_SEGUNDO_MENSAJE = 4;

export function simularSeguimiento(aprobados: Contacto[]): EstadoSimulado[] {
  return aprobados.map((contacto) => {
    const h = hashTexto(contacto.id);
    const enviado = true;
    const abrio = h % 10 < 4;
    const respondio = abrio && (h >>> 4) % 4 === 0;
    const diasDesdeEnvio = 1 + ((h >>> 8) % 7);
    return {
      contacto,
      enviado,
      abrio,
      respondio,
      diasDesdeEnvio,
      necesitaSegundoMensaje: enviado && !respondio && diasDesdeEnvio >= DIAS_PARA_SEGUNDO_MENSAJE,
    };
  });
}

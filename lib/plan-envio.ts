import { crearAzar, enteroEntre } from "@/lib/azar";

/**
 * SIMULACIÓN del plan de envío. No envía nada: sólo calcula cómo se repartirían
 * los correos para cuidar la reputación de la cuenta (calentamiento).
 */
export interface OpcionesPlan {
  semilla: number;
  /** Primer día del plan. */
  inicio: Date;
  horaInicio: number;
  horaFin: number;
  /** Máximo de correos dentro de una misma hora. */
  maximoPorHora: number;
  /** Correos el primer día. */
  cupoInicial: number;
  /** Cuántos más se permiten cada día siguiente. */
  aumentoDiario: number;
  /** Tope diario aunque la cuenta ya esté "caliente". */
  cupoMaximo: number;
  /** Espera mínima y máxima entre un correo y el siguiente, en minutos. */
  minutosMin: number;
  minutosMax: number;
}

export const OPCIONES_PLAN: OpcionesPlan = {
  semilla: 7,
  inicio: new Date(2026, 0, 5),
  horaInicio: 9,
  horaFin: 18,
  maximoPorHora: 8,
  cupoInicial: 20,
  aumentoDiario: 5,
  cupoMaximo: 50,
  minutosMin: 2,
  minutosMax: 8,
};

export interface EnvioPlaneado {
  /** Posición en la fila (0 = primero). */
  indice: number;
  /** Minutos desde la medianoche. */
  minuto: number;
}

export interface DiaDelPlan {
  numero: number;
  fecha: Date;
  cupo: number;
  envios: EnvioPlaneado[];
}

export function cupoDelDia(numero: number, o: OpcionesPlan = OPCIONES_PLAN): number {
  return Math.min(o.cupoInicial + o.aumentoDiario * (numero - 1), o.cupoMaximo);
}

export function generarPlan(cantidad: number, opciones: Partial<OpcionesPlan> = {}): DiaDelPlan[] {
  const o = { ...OPCIONES_PLAN, ...opciones };
  const azar = crearAzar(o.semilla);
  const dias: DiaDelPlan[] = [];
  let indice = 0;
  let numero = 0;
  const finDelDia = o.horaFin * 60;

  while (indice < cantidad && numero < 365) {
    numero++;
    const fecha = new Date(o.inicio);
    fecha.setDate(fecha.getDate() + numero - 1);
    const cupo = cupoDelDia(numero, o);
    const envios: EnvioPlaneado[] = [];
    let minuto = o.horaInicio * 60 + enteroEntre(azar, 0, 10);
    const porHora = new Map<number, number>();

    while (envios.length < cupo && indice < cantidad) {
      if (envios.length > 0) minuto += enteroEntre(azar, o.minutosMin, o.minutosMax);
      const hora = Math.floor(minuto / 60);
      if ((porHora.get(hora) ?? 0) >= o.maximoPorHora) {
        // Ya van muchos en esta hora: esperar a la siguiente.
        minuto = (hora + 1) * 60 + enteroEntre(azar, o.minutosMin, o.minutosMax);
      }
      if (minuto >= finDelDia) break;
      const h = Math.floor(minuto / 60);
      porHora.set(h, (porHora.get(h) ?? 0) + 1);
      envios.push({ indice, minuto });
      indice++;
    }
    dias.push({ numero, fecha, cupo, envios });
  }
  return dias;
}

export function formatoHora(minuto: number): string {
  const h = Math.floor(minuto / 60);
  const m = minuto % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

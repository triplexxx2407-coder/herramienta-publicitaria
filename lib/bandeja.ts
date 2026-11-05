/**
 * La bandeja única: los mensajes que les llegan a las cuentas de cada empresa que atiende el
 * equipo (Instagram, WhatsApp, Facebook, TikTok y correo), todos en un mismo lugar. Cada plática
 * sabe de qué empresa es y qué cuenta recibió el mensaje.
 *
 * TODO ES SIMULACIÓN. Las empresas y las pláticas son inventadas (datos/empresas-clientes.json y
 * datos/bandeja-ejemplo.json) y lo que escribes se queda en este navegador: no hay ninguna
 * conexión con las redes, ni se manda nada a nadie.
 *
 * Las horas de los mensajes de ejemplo se cuentan desde que se abrió la bandeja ("el anclaje"),
 * para que se vean recién llegados y para que no se muevan de orden mientras contestas.
 */

import bandejaJson from "@/datos/bandeja-ejemplo.json";
import empresasJson from "@/datos/empresas-clientes.json";
import { REDES } from "@/lib/redes";
import type { ConversacionEjemplo, CuentaCanal, EmpresaCliente, EstadoDemo, MensajeRed, Red, RespuestaRed } from "@/lib/tipos";

const EJEMPLOS = bandejaJson as ConversacionEjemplo[];

/** Las empresas que atiende el equipo (de ejemplo). */
export const EMPRESAS = empresasJson as EmpresaCliente[];

/** De qué empresa es una cuenta, y la cuenta misma. */
export function cuentaYEmpresa(cuentaId: string): { empresa: EmpresaCliente; cuenta: CuentaCanal } | null {
  for (const empresa of EMPRESAS) {
    const cuenta = empresa.cuentas.find((k) => k.id === cuentaId);
    if (cuenta) return { empresa, cuenta };
  }
  return null;
}

export function empresaPorId(id: string | null): EmpresaCliente | null {
  return EMPRESAS.find((e) => e.id === id) ?? null;
}
const MINUTO = 60_000;

let anclajeSesion: number | null = null;

/**
 * El momento al que se amarran las horas de ejemplo. Se fija una vez por carga de la página:
 * así los mensajes siempre se ven recientes y tus respuestas quedan después de ellos.
 */
export function anclajeDeSesion(ahora: number = Date.now()): number {
  if (anclajeSesion === null) anclajeSesion = ahora;
  return anclajeSesion;
}

export interface Conversacion {
  id: string;
  empresaId: string;
  empresa: string;
  cuentaId: string;
  /** La cuenta de la empresa que recibió el mensaje: @usuario, número o correo. */
  cuenta: string;
  red: Red;
  personaId: string;
  persona: string;
  usuario: string;
  mensajes: MensajeRed[];
  ultimo: MensajeRed;
  /** El último mensaje de la persona, del que corre el plazo. */
  ultimoDeEllos: MensajeRed | null;
  noLeida: boolean;
}

function fechaDesde(anclaje: number, minutosAntes: number): string {
  return new Date(anclaje - minutosAntes * MINUTO).toISOString();
}

/**
 * Las pláticas de la bandeja, de la más reciente a la más vieja.
 * Con `empresaId` sólo las de esa empresa; sin él, las de todas.
 */
export function conversaciones(estado: EstadoDemo, anclaje: number, empresaId: string | null = null): Conversacion[] {
  const leidas = new Set(estado.leidosRed);
  const lista = EJEMPLOS.flatMap((e) => {
    const origen = cuentaYEmpresa(e.cuentaId);
    if (!origen) return [];
    if (empresaId && origen.empresa.id !== empresaId) return [];
    const deEjemplo: MensajeRed[] = e.mensajes.map((m, i) => ({
      id: `${e.id}-${i}`,
      de: m.de,
      texto: m.texto,
      fecha: fechaDesde(anclaje, m.haceMinutos),
    }));
    const mias: MensajeRed[] = (estado.respuestasRed[e.id] ?? []).map((r) => ({
      id: r.id,
      de: "yo" as const,
      texto: r.texto,
      fecha: new Date(anclaje + r.minutos * MINUTO).toISOString(),
    }));
    const mensajes = [...deEjemplo, ...mias].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const deEllos = mensajes.filter((m) => m.de === "ellos");
    const ultimo = mensajes[mensajes.length - 1];
    return [{
      id: e.id,
      empresaId: origen.empresa.id,
      empresa: origen.empresa.nombre,
      cuentaId: origen.cuenta.id,
      cuenta: origen.cuenta.identificador,
      red: e.red,
      personaId: e.personaId,
      persona: e.persona,
      usuario: e.usuario,
      mensajes,
      ultimo,
      ultimoDeEllos: deEllos[deEllos.length - 1] ?? null,
      noLeida: ultimo.de === "ellos" && !leidas.has(e.id),
    }];
  });
  return lista.sort((a, b) => b.ultimo.fecha.localeCompare(a.ultimo.fecha));
}

export interface Plazo {
  /** Minutos que faltan para que cierre el plazo (negativo si ya se pasó). */
  minutosRestantes: number;
  vencido: boolean;
  /** Quedan menos de 3 horas. */
  urgente: boolean;
  texto: string;
}

function enPalabras(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return horas === 1 ? "1 hora" : `${horas} horas`;
}

/**
 * Cuánto te queda para contestar, según las reglas de la red.
 * Devuelve null si esa red no tiene plazo (el correo) o si nadie te ha escrito.
 */
export function plazo(c: Conversacion, ahora: Date): Plazo | null {
  const horas = REDES[c.red].plazoHoras;
  if (horas === null || !c.ultimoDeEllos) return null;
  const cierre = new Date(c.ultimoDeEllos.fecha).getTime() + horas * 60 * MINUTO;
  const minutosRestantes = Math.floor((cierre - ahora.getTime()) / MINUTO);
  if (minutosRestantes <= 0) {
    return { minutosRestantes, vencido: true, urgente: false, texto: "Se pasó el plazo para contestar" };
  }
  const falta = enPalabras(minutosRestantes);
  return {
    minutosRestantes,
    vencido: false,
    urgente: minutosRestantes < 180,
    texto: `Te queda${falta === "1 hora" ? "" : "n"} ${falta} para contestar`,
  };
}

/** Si ya se pasó el plazo, la red no entrega el mensaje: el cuadro de escribir se bloquea. */
export function sePuedeContestar(c: Conversacion, ahora: Date): boolean {
  const p = plazo(c, ahora);
  return !p || !p.vencido;
}

/** Cuántas pláticas sin leer hay en cada red. */
export function sinLeerPorRed(lista: Conversacion[]): Record<string, number> {
  const cuenta: Record<string, number> = {};
  for (const c of lista) if (c.noLeida) cuenta[c.red] = (cuenta[c.red] ?? 0) + 1;
  return cuenta;
}

/** Cuántas pláticas sin leer tiene cada empresa. */
export function sinLeerPorEmpresa(lista: Conversacion[]): Record<string, number> {
  const cuenta: Record<string, number> = {};
  for (const c of lista) if (c.noLeida) cuenta[c.empresaId] = (cuenta[c.empresaId] ?? 0) + 1;
  return cuenta;
}

export function sinLeer(lista: Conversacion[]): number {
  return lista.filter((c) => c.noLeida).length;
}

/**
 * La ficha de una persona: todos sus canales juntos, aunque te escriba por dos redes.
 * Nunca mezcla empresas: el mismo interesado de dos empresas son dos fichas.
 */
export interface Ficha {
  persona: string;
  canales: { red: Red; usuario: string; conversacionId: string }[];
  mensajes: number;
}

export function ficha(lista: Conversacion[], personaId: string, empresaId: string): Ficha | null {
  const suyas = lista.filter((c) => c.personaId === personaId && c.empresaId === empresaId);
  if (!suyas.length) return null;
  return {
    persona: suyas[0].persona,
    canales: suyas.map((c) => ({ red: c.red, usuario: c.usuario, conversacionId: c.id })),
    mensajes: suyas.reduce((n, c) => n + c.mensajes.length, 0),
  };
}

/** Guarda tu respuesta (simulación: no sale de este navegador). */
export function responderEnRed(estado: EstadoDemo, id: string, texto: string, anclaje: number, ahora = new Date()): EstadoDemo {
  const limpio = texto.trim();
  if (!limpio) return estado;
  const previas = estado.respuestasRed[id] ?? [];
  const nueva: RespuestaRed = {
    id: `${id}-mia-${previas.length}`,
    texto: limpio,
    minutos: Math.max(0, Math.round((ahora.getTime() - anclaje) / MINUTO)),
  };
  return {
    ...estado,
    respuestasRed: { ...estado.respuestasRed, [id]: [...previas, nueva] },
    leidosRed: estado.leidosRed.includes(id) ? estado.leidosRed : [...estado.leidosRed, id],
  };
}

/** Cambia la empresa que estás viendo (null = todas). */
export function elegirEmpresa(estado: EstadoDemo, empresaId: string | null): EstadoDemo {
  if (estado.empresaActiva === empresaId) return estado;
  return { ...estado, empresaActiva: empresaId };
}

export function marcarLeidaRed(estado: EstadoDemo, id: string): EstadoDemo {
  if (estado.leidosRed.includes(id)) return estado;
  return { ...estado, leidosRed: [...estado.leidosRed, id] };
}

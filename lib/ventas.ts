/** Lo que comparten la pantalla y el servidor para llevar las ventas de cada perfil. */

export const ETAPAS = ["nuevo", "platicando", "cita", "apartado", "vendido", "perdido"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const NOMBRE_ETAPA: Record<Etapa, string> = {
  nuevo: "Nuevo",
  platicando: "Platicando",
  cita: "Con cita",
  apartado: "Apartó",
  vendido: "Vendido",
  perdido: "Perdido",
};

export function esEtapa(valor: unknown): valor is Etapa {
  return typeof valor === "string" && (ETAPAS as readonly string[]).includes(valor);
}

/** Sólo los dígitos de un teléfono. «+52 664 123 4567» → «526641234567». */
export function soloDigitos(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

/** Un teléfono sirve para WhatsApp si tiene entre 10 y 15 dígitos. */
export function telefonoValido(telefono: string): boolean {
  const n = soloDigitos(telefono).length;
  return n >= 10 && n <= 15;
}

/**
 * La dirección de WhatsApp con el mensaje ya escrito. Un teléfono de 10 dígitos se toma como
 * mexicano y se le pone el 52 adelante.
 */
export function direccionWhatsApp(telefono: string, mensaje: string): string {
  let d = soloDigitos(telefono);
  if (d.length === 10) d = `52${d}`;
  const base = `https://wa.me/${d}`;
  return mensaje.trim() ? `${base}?text=${encodeURIComponent(mensaje.trim())}` : base;
}

/** Fecha «2026-11-06» de hoy, en la hora de México (Tijuana). */
export function hoyISO(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana" }).format(ahora);
}

export function fechaValida(texto: unknown): texto is string {
  return typeof texto === "string" && /^\d{4}-\d{2}-\d{2}$/.test(texto) && !Number.isNaN(Date.parse(texto));
}

export interface Interesado {
  id: string;
  empresaId: string;
  nombre: string;
  telefono: string;
  red: string;
  enlaceId: string | null;
  enlace: string | null;
  etapa: Etapa;
  notas: string;
  /** Día del próximo seguimiento («2026-11-06») o null. */
  siguiente: string | null;
  creadaEn: string;
}

export interface Publicacion {
  id: string;
  empresaId: string;
  red: string;
  titulo: string;
  texto: string;
  fecha: string;
  hecha: boolean;
  enlaceId: string | null;
}

export interface Enlace {
  id: string;
  empresaId: string;
  nombre: string;
  telefono: string;
  mensaje: string;
  clics: number;
  interesados: number;
}

export interface Resultados {
  porEtapa: Record<Etapa, number>;
  enlaces: { id: string; nombre: string; clics: number; interesados: number; citas: number; vendidos: number }[];
  sinEnlace: { interesados: number; citas: number; vendidos: number };
}

/** Qué tan seguido se vuelve cliente alguien que escribió, en porcentaje entero. */
export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

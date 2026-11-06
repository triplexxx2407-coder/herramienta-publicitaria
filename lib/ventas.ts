/** Lo que comparten la pantalla y el servidor para las estadísticas de cada perfil. */

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

/** Porcentaje entero. Sin dividir entre cero. */
export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

/** Un número entero de cero para arriba, o 0 si no lo es. */
export function enteroPositivo(valor: unknown, maximo = 1_000_000_000): number {
  const n = typeof valor === "number" ? valor : typeof valor === "string" ? Number(valor.replace(/[,\s]/g, "")) : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), maximo);
}

/** 12500 → «12.5 mil», 1200000 → «1.2 M». */
export function cifraCorta(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")} M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")} mil`;
  return n.toLocaleString("es-MX");
}

export const ETAPAS = ["escribio", "cita", "venta"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const NOMBRE_ETAPA: Record<Etapa, string> = {
  escribio: "Escribió",
  cita: "Tiene cita",
  venta: "Compró",
};

export function esEtapa(valor: unknown): valor is Etapa {
  return typeof valor === "string" && (ETAPAS as readonly string[]).includes(valor);
}

/** El código corto que sale escrito en el mensaje, para saber de qué enlace vino. */
export function codigoRef(enlaceId: string): string {
  return enlaceId.slice(0, 5).toUpperCase();
}

/** Un enlace de WhatsApp con medición. */
export interface Enlace {
  id: string;
  empresaId: string;
  nombre: string;
  telefono: string;
  mensaje: string;
  /** Código que se agrega al mensaje («ref K7M2P»). */
  ref: string;
  /** Veces que tocaron el enlace. */
  visitas: number;
  /** Personas que escribieron (las que se marcaron). */
  escribieron: number;
  /** De ésas, las que llegaron a cita o compra. */
  citas: number;
  ventas: number;
}

/** Una persona que escribió desde un enlace. */
export interface Contacto {
  id: string;
  enlaceId: string;
  enlace: string;
  nota: string;
  etapa: Etapa;
  fecha: string;
}

export interface Totales {
  visitas: number;
  escribieron: number;
  citas: number;
  ventas: number;
}

export interface Estadisticas {
  totales: Totales;
  enlaces: Enlace[];
}

export interface MensajeChat {
  id: string;
  de: "yo" | "ellos";
  texto: string;
  fecha: string;
}

/** Una conversación del WhatsApp de prueba. */
export interface Chat {
  persona: string;
  telefono: string;
  enlace: string | null;
  mensajes: MensajeChat[];
}

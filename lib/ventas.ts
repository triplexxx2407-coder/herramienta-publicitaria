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

export const TIPOS = ["video", "publicacion", "anuncio"] as const;
export type Tipo = (typeof TIPOS)[number];

export const NOMBRE_TIPO: Record<Tipo, string> = {
  video: "Video",
  publicacion: "Publicación",
  anuncio: "Anuncio",
};

export function esTipo(valor: unknown): valor is Tipo {
  return typeof valor === "string" && (TIPOS as readonly string[]).includes(valor);
}

/** Un video, publicación o anuncio con los números que da la red. */
export interface Contenido {
  id: string;
  empresaId: string;
  tipo: Tipo;
  red: string;
  titulo: string;
  enlaceId: string | null;
  enlace: string | null;
  vistas: number;
  /** Clics en el anuncio o la publicación (los que da la red). */
  clics: number;
  likes: number;
  /** Lo que mide NEXORA: personas que tocaron el enlace de WhatsApp de este contenido y las que escribieron. */
  visitas: number;
  escribieron: number;
}

/** Un enlace de WhatsApp con medición. */
export interface Enlace {
  id: string;
  empresaId: string;
  nombre: string;
  telefono: string;
  mensaje: string;
  /** Veces que tocaron el enlace. */
  visitas: number;
  /** Personas distintas que escribieron por WhatsApp desde él. */
  escribieron: number;
  mensajes: number;
}

export interface Totales {
  vistas: number;
  clics: number;
  likes: number;
  visitas: number;
  escribieron: number;
  mensajes: number;
}

export interface PorRed extends Totales {
  red: string;
}

export interface Estadisticas {
  totales: Totales;
  porRed: PorRed[];
  contenidos: Contenido[];
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

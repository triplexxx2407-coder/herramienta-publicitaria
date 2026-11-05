/**
 * Las redes por las que llegan mensajes a la bandeja.
 *
 * `plazoHoras` es el tiempo que cada red da para contestar, contado desde el último mensaje
 * de la persona. Son las reglas reales de Meta y de TikTok (revisadas el 5 de noviembre de 2026):
 * Instagram, Facebook y WhatsApp dan 24 horas; TikTok, 48. El correo no tiene plazo.
 *
 * `puedeIniciar` dice si TÚ puedes escribir primero. En Instagram, Facebook y TikTok no: sólo
 * contestas a quien te escribió. En WhatsApp, pasado el plazo, hace falta un mensaje aprobado
 * por Meta, así que aquí tampoco se puede iniciar. Por correo sí.
 */

import type { Red } from "@/lib/tipos";

export interface DatosRed {
  nombre: string;
  plazoHoras: number | null;
  puedeIniciar: boolean;
  /** Color de la red, para el ícono de cada plática. */
  color: string;
}

export const REDES: Record<Red, DatosRed> = {
  instagram: { nombre: "Instagram", plazoHoras: 24, puedeIniciar: false, color: "#e1306c" },
  whatsapp: { nombre: "WhatsApp", plazoHoras: 24, puedeIniciar: false, color: "#25d366" },
  facebook: { nombre: "Facebook", plazoHoras: 24, puedeIniciar: false, color: "#1877f2" },
  tiktok: { nombre: "TikTok", plazoHoras: 48, puedeIniciar: false, color: "#22d3ee" },
  correo: { nombre: "Correo", plazoHoras: null, puedeIniciar: true, color: "#93a9c9" },
};

/** Las redes en el orden en que se muestran los filtros. */
export const ORDEN_REDES: Red[] = ["instagram", "whatsapp", "facebook", "tiktok", "correo"];

export function nombreRed(red: Red): string {
  return REDES[red].nombre;
}

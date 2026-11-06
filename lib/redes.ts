/** Las redes que puede tener un perfil, con su color para los íconos. */

import type { Red } from "@/lib/tipos";

export interface DatosRed {
  nombre: string;
  color: string;
}

export const REDES: Record<Red, DatosRed> = {
  instagram: { nombre: "Instagram", color: "#e1306c" },
  whatsapp: { nombre: "WhatsApp", color: "#25d366" },
  facebook: { nombre: "Facebook", color: "#1877f2" },
  tiktok: { nombre: "TikTok", color: "#22d3ee" },
  correo: { nombre: "Correo", color: "#93a9c9" },
};

/** Las redes en el orden en que se muestran. */
export const ORDEN_REDES: Red[] = ["instagram", "whatsapp", "facebook", "tiktok", "correo"];

export function nombreRed(red: Red): string {
  return REDES[red].nombre;
}

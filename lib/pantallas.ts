/**
 * La bandeja no es un paso del flujo de correos: es donde llegan juntos los mensajes
 * de Instagram, WhatsApp, Facebook, TikTok y correo. Va aparte, arriba del flujo.
 */
export const BANDEJA = { ruta: "/bandeja", nombre: "Bandeja", corto: "Bandeja" } as const;

export const PANTALLAS = [
  { ruta: "/buscar", numero: 1, nombre: "Buscar", corto: "Buscar" },
  { ruta: "/redactar", numero: 2, nombre: "Redactar", corto: "Redactar" },
  { ruta: "/envio", numero: 3, nombre: "Envío", corto: "Envío" },
  { ruta: "/seguimiento", numero: 4, nombre: "Seguimiento", corto: "Seguimiento" },
  { ruta: "/chat", numero: 5, nombre: "Chat", corto: "Chat" },
] as const;

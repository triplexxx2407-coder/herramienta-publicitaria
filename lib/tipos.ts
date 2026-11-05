// Tipos compartidos por NEXORA (pantalla y servidor).

/** Las redes por las que llegan mensajes a la bandeja (ver lib/redes.ts). */
export type Red = "instagram" | "whatsapp" | "facebook" | "tiktok" | "correo";

/** Un canal de una empresa que administra el equipo: su Instagram, su WhatsApp, su correo… */
export interface CuentaCanal {
  id: string;
  red: Red;
  /** Cómo se llama la cuenta en esa red: @usuario, número o correo. */
  identificador: string;
}

/** Una empresa que el equipo atiende. Cada una es una operación aparte. */
export interface EmpresaCliente {
  id: string;
  nombre: string;
  giro: string;
  /** Qué vende. */
  producto: string;
  cuentas: CuentaCanal[];
}

/** Un mensaje de la bandeja, ya con su fecha calculada. */
export interface MensajeRed {
  id: string;
  de: "yo" | "ellos";
  texto: string;
  fecha: string;
  /** Sólo con el servidor de verdad: cómo le fue a tu respuesta. */
  entrega?: "recibido" | "pendiente" | "entregado" | "falló";
  error?: string | null;
}

/** Una plática de ejemplo de la bandeja, tal como viene en datos/bandeja-ejemplo.json. */
export interface ConversacionEjemplo {
  id: string;
  /** La cuenta de la empresa que recibió el mensaje (ver datos/empresas-clientes.json). */
  cuentaId: string;
  red: Red;
  /** Dos pláticas con el mismo personaId son la misma persona por dos redes. */
  personaId: string;
  persona: string;
  /** Cómo se le ve en esa red: @usuario, teléfono o correo. */
  usuario: string;
  mensajes: { de: "yo" | "ellos"; texto: string; haceMinutos: number }[];
}

/**
 * Una respuesta tuya en la bandeja (simulación).
 * La hora se guarda como minutos desde que se abrió la bandeja, no como fecha,
 * para que al recargar no se desordene con los mensajes de ejemplo.
 */
export interface RespuestaRed {
  id: string;
  texto: string;
  minutos: number;
}

/** Todo lo que la demo guarda en el navegador. */
export interface EstadoDemo {
  version: 2;
  /** Tus respuestas en la bandeja, por id de plática (simulación). */
  respuestasRed: Record<string, RespuestaRed[]>;
  /** Ids de las pláticas de la bandeja que ya abriste. */
  leidosRed: string[];
  /** La empresa que estás viendo; null es «todas». */
  empresaActiva: string | null;
}

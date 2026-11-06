// Tipos compartidos por NEXORA (pantalla y servidor).

/** Las redes de un perfil (ver lib/redes.ts). */
export type Red = "instagram" | "whatsapp" | "facebook" | "tiktok" | "correo";

/** Una red de un perfil: su Instagram, su WhatsApp, su TikTok… Sólo se apunta, NEXORA no se conecta a ella. */
export interface CuentaCanal {
  id: string;
  red: Red;
  /** Cómo se llama la cuenta en esa red: @usuario, número o correo. */
  identificador: string;
}

/** Un perfil: una empresa que el equipo atiende. Cada una es una operación aparte. */
export interface EmpresaCliente {
  id: string;
  nombre: string;
  giro: string;
  cuentas: CuentaCanal[];
}

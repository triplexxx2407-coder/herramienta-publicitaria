// Tipos compartidos por toda la demo.

/** Una empresa tal como la devuelve un buscador (ejemplo o DENUE). */
export interface Empresa {
  id: string;
  nombre: string;
  /** Id del giro (ver datos/giros.json) o texto libre si viene del DENUE. */
  giro: string;
  /** Id de la ciudad (ver datos/ciudades.json) o texto libre si viene del DENUE. */
  ciudad: string;
  /** Estrato de personal ocupado según el DENUE: 1 (0 a 5) … 7 (251 o más). */
  estrato: number | null;
  telefono: string | null;
  correo: string | null;
  sitioWeb: string | null;
}

/** De dónde salió un contacto. */
export type TipoOrigen =
  | "directorio_publico"
  | "formulario_propio"
  | "cliente_actual"
  | "declarado"
  | "desconocido";

export interface Origen {
  tipo: TipoOrigen;
  /** Nombre de la fuente, por ejemplo "Datos de ejemplo (simula el DENUE de INEGI)". */
  fuente: string;
  /** Nota del usuario: de dónde lo sacó. Obligatoria para el semáforo ámbar. */
  nota?: string;
  /** Fecha en que se agregó (ISO 8601). */
  fecha: string;
}

export type Semaforo = "verde" | "ambar" | "rojo";

export interface Contacto {
  id: string;
  nombre: string;
  giro: string;
  ciudad: string;
  telefono: string | null;
  correo: string | null;
  sitioWeb: string | null;
  origen: Origen;
  /** true si es un dato inventado de la demo. */
  esEjemplo: boolean;
}

export interface Foto {
  nombre: string;
  url: string;
}

export interface AjustesProyecto {
  nombreDesarrollo: string;
  ciudad: string;
  precioDesde: string;
  puntosFuertes: [string, string, string];
  fotos: Foto[];
  /** Datos del pie legal. */
  asesorNombre: string;
  empresa: string;
  telefono: string;
}

export type EstadoBorrador = "pendiente" | "aprobado";

/**
 * Borrador de un correo. Ojo: aquí NO se guarda el pie legal.
 * El pie se agrega siempre al armar el correo (ver lib/redaccion.ts),
 * así no hay forma de borrarlo editando el borrador.
 */
export interface Borrador {
  contactoId: string;
  asunto: string;
  cuerpo: string;
  estado: EstadoBorrador;
  fechaAprobado?: string;
}

/** Todo lo que la demo guarda en el navegador. */
export interface EstadoDemo {
  version: 1;
  contactos: Contacto[];
  /** Ids de contactos elegidos para redactar. */
  seleccionados: string[];
  /** Correos marcados "No contactar" (en minúsculas). */
  supresion: { correo: string; fecha: string }[];
  ajustes: AjustesProyecto;
  borradores: Record<string, Borrador>;
}

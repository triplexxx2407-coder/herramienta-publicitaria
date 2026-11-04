import type { Contacto, Empresa, EstadoDemo, Origen, Semaforo } from "@/lib/tipos";

export const FUENTE_EJEMPLO = "Datos de ejemplo (simula el DENUE de INEGI)";

/** Verde: directorio público, formulario propio o cliente actual. Ámbar: declarado con nota. Rojo: lo demás. */
export function semaforoDe(origen: Origen): Semaforo {
  switch (origen.tipo) {
    case "directorio_publico":
    case "formulario_propio":
    case "cliente_actual":
      return "verde";
    case "declarado":
      return origen.nota?.trim() ? "ambar" : "rojo";
    default:
      return "rojo";
  }
}

export function normalizarCorreo(correo: string | null | undefined): string {
  return (correo ?? "").trim().toLowerCase();
}

export function correoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export function estaSuprimido(contacto: Contacto, estado: Pick<EstadoDemo, "supresion">): boolean {
  const c = normalizarCorreo(contacto.correo);
  return !!c && estado.supresion.some((s) => s.correo === c);
}

export type MotivoBloqueo = "sin_correo" | "rojo" | "no_contactar";

/** Por qué un contacto no puede usarse para redactar, o null si sí puede. */
export function motivoBloqueo(contacto: Contacto, estado: Pick<EstadoDemo, "supresion">): MotivoBloqueo | null {
  if (!normalizarCorreo(contacto.correo)) return "sin_correo";
  if (estaSuprimido(contacto, estado)) return "no_contactar";
  if (semaforoDe(contacto.origen) === "rojo") return "rojo";
  return null;
}

export const TEXTO_BLOQUEO: Record<MotivoBloqueo, string> = {
  sin_correo: "No tiene correo",
  rojo: "Sin origen conocido (rojo)",
  no_contactar: "Marcado «No contactar»",
};

export function puedeRedactar(contacto: Contacto, estado: Pick<EstadoDemo, "supresion">): boolean {
  return motivoBloqueo(contacto, estado) === null;
}

/**
 * Los contactos que pasan a "Redactar": elegidos Y permitidos.
 * Un contacto en rojo, sin correo o en "No contactar" nunca pasa, aunque esté elegido.
 */
export function contactosParaRedactar(estado: EstadoDemo): Contacto[] {
  const elegidos = new Set(estado.seleccionados);
  return estado.contactos.filter((c) => elegidos.has(c.id) && puedeRedactar(c, estado));
}

/** Elige o quita un contacto. Si no está permitido, no se elige. */
export function alternarSeleccion(estado: EstadoDemo, id: string): EstadoDemo {
  const contacto = estado.contactos.find((c) => c.id === id);
  if (!contacto) return estado;
  if (estado.seleccionados.includes(id)) {
    return { ...estado, seleccionados: estado.seleccionados.filter((s) => s !== id) };
  }
  if (!puedeRedactar(contacto, estado)) return estado;
  return { ...estado, seleccionados: [...estado.seleccionados, id] };
}

/** Marca "No contactar": entra a la lista de supresión y sale de la selección y de los borradores. */
export function marcarNoContactar(estado: EstadoDemo, id: string, ahora = new Date()): EstadoDemo {
  const contacto = estado.contactos.find((c) => c.id === id);
  const correo = normalizarCorreo(contacto?.correo);
  if (!contacto || !correo || estado.supresion.some((s) => s.correo === correo)) return estado;
  const borradores = { ...estado.borradores };
  delete borradores[id];
  return {
    ...estado,
    supresion: [...estado.supresion, { correo, fecha: ahora.toISOString() }],
    seleccionados: estado.seleccionados.filter((s) => s !== id),
    borradores,
  };
}

/** Convierte una empresa del buscador en contacto con origen verde (directorio público). */
export function contactoDesdeEmpresa(empresa: Empresa, fuente: string, esEjemplo: boolean, ahora = new Date()): Contacto {
  return {
    id: empresa.id,
    nombre: empresa.nombre,
    giro: empresa.giro,
    ciudad: empresa.ciudad,
    telefono: empresa.telefono,
    correo: empresa.correo ? normalizarCorreo(empresa.correo) : null,
    sitioWeb: empresa.sitioWeb,
    origen: { tipo: "directorio_publico", fuente, fecha: ahora.toISOString() },
    esEjemplo,
  };
}

/** Agrega contactos a la lista sin duplicar (por id). */
export function agregarContactos(estado: EstadoDemo, nuevos: Contacto[]): EstadoDemo {
  const ids = new Set(estado.contactos.map((c) => c.id));
  const aAgregar = nuevos.filter((c) => !ids.has(c.id));
  if (!aAgregar.length) return estado;
  return { ...estado, contactos: [...estado.contactos, ...aAgregar] };
}

export interface DatosContactoManual {
  nombre: string;
  correo: string;
  giro: string;
  ciudad: string;
  telefono?: string;
  /** De dónde lo sacó el usuario. Si viene vacío, el contacto queda en rojo. */
  nota?: string;
}

/** Contacto agregado a mano: ámbar si dice de dónde salió, rojo si no. */
export function contactoManual(d: DatosContactoManual, ahora = new Date()): Contacto {
  const nota = d.nota?.trim() ?? "";
  return {
    id: `manual-${ahora.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: d.nombre.trim(),
    giro: d.giro.trim(),
    ciudad: d.ciudad.trim(),
    telefono: d.telefono?.trim() || null,
    correo: normalizarCorreo(d.correo) || null,
    sitioWeb: null,
    origen: nota
      ? { tipo: "declarado", fuente: "Agregado a mano", nota, fecha: ahora.toISOString() }
      : { tipo: "desconocido", fuente: "Agregado a mano", fecha: ahora.toISOString() },
    esEjemplo: false,
  };
}

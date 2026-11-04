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

/** Los elegidos a los que todavía no se les envía: son los que aparecen en «Redactar». */
export function porEscribir(estado: EstadoDemo): Contacto[] {
  return contactosParaRedactar(estado).filter((c) => !estado.enviados[c.id]);
}

/** Aprobados y sin enviar: los que salen al tocar «Enviar». */
export function listosParaEnviar(estado: EstadoDemo): Contacto[] {
  return porEscribir(estado).filter((c) => estado.borradores[c.id]?.estado === "aprobado");
}

/**
 * Elige empresas de la lista de «Buscar»: las guarda como contactos si hace falta y las deja elegidas.
 * Nunca elige a las que no se pueden usar (sin correo, rojo o «No contactar») ni a las que ya les escribiste.
 */
export function elegirEmpresas(
  estado: EstadoDemo,
  empresas: Empresa[],
  fuente: string,
  esEjemplo: boolean,
  ahora = new Date(),
): EstadoDemo {
  const conTodas = agregarContactos(
    estado,
    empresas.map((e) => contactoDesdeEmpresa(e, fuente, esEjemplo, ahora)),
  );
  const ids = new Set(empresas.map((e) => e.id));
  const yaElegidos = new Set(conTodas.seleccionados);
  const nuevos = conTodas.contactos
    .filter((c) => ids.has(c.id) && !yaElegidos.has(c.id) && !conTodas.enviados[c.id] && puedeRedactar(c, conTodas))
    .map((c) => c.id);
  if (!nuevos.length) return conTodas;
  return { ...conTodas, seleccionados: [...conTodas.seleccionados, ...nuevos] };
}

/** Quita de la selección (el contacto y su borrador se quedan guardados por si lo vuelves a elegir). */
export function quitarDeSeleccion(estado: EstadoDemo, ids: string[]): EstadoDemo {
  const quitar = new Set(ids);
  if (!estado.seleccionados.some((s) => quitar.has(s))) return estado;
  return { ...estado, seleccionados: estado.seleccionados.filter((s) => !quitar.has(s)) };
}

/**
 * Alguien contestó «BAJA»: su correo entra a «No contactar» y sale de la selección.
 * A diferencia de marcarNoContactar, no borra nada: el correo enviado y la plática se quedan como prueba.
 */
export function registrarBaja(estado: EstadoDemo, id: string, ahora = new Date()): EstadoDemo {
  const correo = normalizarCorreo(estado.contactos.find((c) => c.id === id)?.correo);
  if (!correo || estado.supresion.some((s) => s.correo === correo)) return estado;
  return {
    ...estado,
    supresion: [...estado.supresion, { correo, fecha: ahora.toISOString() }],
    seleccionados: estado.seleccionados.filter((s) => s !== id),
  };
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

/**
 * Deshace «No contactar» si se tocó por error (el aviso ofrece «Deshacer» unos segundos).
 * Lo deja como estaba en `antes`: elegido o no, y con su borrador. Si ya estaba en «No contactar» antes, no cambia nada.
 */
export function deshacerNoContactar(estado: EstadoDemo, antes: EstadoDemo, id: string): EstadoDemo {
  const correo = normalizarCorreo(antes.contactos.find((c) => c.id === id)?.correo);
  if (!correo || antes.supresion.some((s) => s.correo === correo)) return estado;
  if (!estado.supresion.some((s) => s.correo === correo)) return estado;
  const borradores = { ...estado.borradores };
  if (antes.borradores[id] && !borradores[id]) borradores[id] = antes.borradores[id];
  const volverAElegir = antes.seleccionados.includes(id) && !estado.seleccionados.includes(id);
  return {
    ...estado,
    supresion: estado.supresion.filter((s) => s.correo !== correo),
    seleccionados: volverAElegir ? [...estado.seleccionados, id] : estado.seleccionados,
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

/**
 * Agrega contactos y deja elegidos a los nuevos que sí se pueden usar, para no pedir lo mismo dos veces
 * (agregar en «Buscar» y otra vez elegir). Los que no se pueden usar (sin correo, rojo o «No contactar»)
 * se agregan pero no se eligen.
 */
export function agregarYElegir(estado: EstadoDemo, nuevos: Contacto[]): EstadoDemo {
  const conNuevos = agregarContactos(estado, nuevos);
  const antes = new Set(estado.contactos.map((c) => c.id));
  const elegir = conNuevos.contactos.filter((c) => !antes.has(c.id) && puedeRedactar(c, conNuevos)).map((c) => c.id);
  if (!elegir.length) return conNuevos;
  return { ...conNuevos, seleccionados: Array.from(new Set([...conNuevos.seleccionados, ...elegir])) };
}

/**
 * Nombre sin el «(ejemplo)» del final, para mostrarlo junto a la etiqueta «Ejemplo» sin repetir.
 * Si el contacto no es de ejemplo (lo escribió el usuario), se deja tal cual.
 */
export function nombreVisible(nombre: string, esEjemplo = true): string {
  return esEjemplo ? nombre.replace(/\s*\(ejemplo\)\s*$/i, "") : nombre;
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

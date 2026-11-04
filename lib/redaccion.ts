import { nombreCiudad, nombreGiro } from "@/lib/catalogos";
import type { AjustesProyecto, Borrador, Contacto } from "@/lib/tipos";

/** Plantilla con variables entre llaves. */
export const PLANTILLA_ASUNTO = "{desarrollo}: condominios en {ciudadProyecto} desde {precio}";

export const PLANTILLA_CUERPO = `Hola, equipo de {negocio}:

Les escribo porque vi que {suNegocio} está en {ciudad}, y quizá les interese una opción de inversión o de vivienda cerca.

Estamos en preventa de {desarrollo}, en {ciudadProyecto}, con precios desde {precio}:

• {punto1}
• {punto2}
• {punto3}

Si les interesa, con gusto les mando fotos, planos y la lista de precios, o agendamos una llamada corta.

Saludos,
{asesor}`;

export function variablesDe(contacto: Contacto, ajustes: AjustesProyecto): Record<string, string> {
  const giro = contacto.giro ? nombreGiro(contacto.giro).toLowerCase() : "";
  return {
    negocio: contacto.nombre,
    giro,
    // Si no se sabe el giro (contacto agregado a mano), la frase queda «su negocio» y no «su negocio de ».
    suNegocio: giro ? `su negocio de ${giro}` : "su negocio",
    ciudad: nombreCiudad(contacto.ciudad),
    desarrollo: ajustes.nombreDesarrollo,
    ciudadProyecto: ajustes.ciudad,
    precio: ajustes.precioDesde,
    punto1: ajustes.puntosFuertes[0],
    punto2: ajustes.puntosFuertes[1],
    punto3: ajustes.puntosFuertes[2],
    asesor: ajustes.asesorNombre,
  };
}

export function rellenar(plantilla: string, variables: Record<string, string>): string {
  return plantilla.replace(/\{(\w+)\}/g, (todo, clave: string) => variables[clave] ?? todo);
}

export function generarBorrador(contacto: Contacto, ajustes: AjustesProyecto): Borrador {
  const v = variablesDe(contacto, ajustes);
  return {
    contactoId: contacto.id,
    asunto: rellenar(PLANTILLA_ASUNTO, v),
    cuerpo: rellenar(PLANTILLA_CUERPO, v),
    estado: "pendiente",
  };
}

/**
 * Pie legal de ejemplo. Se arma a partir de los ajustes y del origen del contacto.
 * No se guarda en el borrador: se agrega siempre en armarCorreo().
 */
export function generarPieLegal(ajustes: AjustesProyecto, contacto: Contacto): string {
  const quien = ajustes.asesorNombre.trim() || "[falta el nombre de quien escribe]";
  const empresa = ajustes.empresa.trim() || "[falta la empresa]";
  const telefono = ajustes.telefono.trim() || "[falta el teléfono]";
  return [
    "——————————",
    `Te escribe ${quien}, de ${empresa}. Teléfono: ${telefono}.`,
    `Tomamos este correo de: ${contacto.origen.fuente}.`,
    "Si prefieres que no te escriba más, responde con la palabra BAJA y no volverás a recibir mensajes míos.",
    "(Pie legal de ejemplo)",
  ].join("\n");
}

export interface CorreoArmado {
  asunto: string;
  /** Cuerpo + pie legal. El pie siempre va al final. */
  texto: string;
  pie: string;
}

/** Arma el correo final. El pie legal se agrega siempre; no hay forma de quitarlo. */
export function armarCorreo(borrador: Borrador, contacto: Contacto, ajustes: AjustesProyecto): CorreoArmado {
  const pie = generarPieLegal(ajustes, contacto);
  const cuerpo = borrador.cuerpo.trimEnd();
  return { asunto: borrador.asunto.trim(), texto: cuerpo ? `${cuerpo}\n\n${pie}` : pie, pie };
}

/** Problemas de los ajustes que impiden aprobar (el pie legal necesita estos datos). */
export function validarAjustes(ajustes: AjustesProyecto): string[] {
  const errores: string[] = [];
  if (!ajustes.asesorNombre.trim()) errores.push("Falta el nombre de quien escribe (para el pie legal).");
  if (!ajustes.empresa.trim()) errores.push("Falta el nombre de la empresa (para el pie legal).");
  if (!ajustes.telefono.trim()) errores.push("Falta el teléfono (para el pie legal).");
  return errores;
}

const PREFIJOS_RESPUESTA = /^\s*(re|res|rv|fw|fwd|reenviado|respuesta)\s*[:：\]]/i;
const PALABRAS_ENGANOSAS = [
  { patron: /factura/i, texto: "factura" },
  { patron: /\bcfdi\b/i, texto: "CFDI" },
  { patron: /recibo/i, texto: "recibo" },
  { patron: /comprobante/i, texto: "comprobante" },
  { patron: /pago pendiente|adeudo|estado de cuenta/i, texto: "cobro o adeudo" },
];

/** Revisa que el asunto sea veraz. Devuelve los problemas en español (vacío = todo bien). */
export function validarAsunto(asunto: string): string[] {
  const errores: string[] = [];
  const a = asunto.trim();
  if (!a) {
    errores.push("El asunto no puede quedar vacío.");
    return errores;
  }
  if (PREFIJOS_RESPUESTA.test(a)) {
    errores.push("El asunto no puede empezar con «Re:», «RV:» o «Fwd:». Haría creer que es una respuesta a una plática que no existe.");
  }
  for (const p of PALABRAS_ENGANOSAS) {
    if (p.patron.test(a)) {
      errores.push(`El asunto no puede mencionar «${p.texto}». Haría creer que es un cobro o un trámite.`);
    }
  }
  if (a.length > 120) errores.push("El asunto es muy largo. Procura que tenga menos de 120 letras.");
  return errores;
}

/** Aprueba un borrador sólo si el asunto y los ajustes están bien. */
export function aprobar(borrador: Borrador, ajustes: AjustesProyecto, ahora = new Date()): Borrador | { errores: string[] } {
  const errores = [...validarAsunto(borrador.asunto), ...validarAjustes(ajustes)];
  if (!borrador.cuerpo.trim()) errores.push("El mensaje no puede quedar vacío.");
  if (errores.length) return { errores };
  return { ...borrador, estado: "aprobado", fechaAprobado: ahora.toISOString() };
}

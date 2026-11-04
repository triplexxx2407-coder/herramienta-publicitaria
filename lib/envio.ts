import { hashTexto } from "@/lib/azar";
import { listosParaEnviar, nombreVisible, registrarBaja } from "@/lib/contactos";
import { armarCorreo } from "@/lib/redaccion";
import type { Contacto, CorreoEnviado, EstadoDemo, MensajeChat } from "@/lib/tipos";

/*
 * ENVÍO SIMULADO. Aquí no hay ninguna conexión: no se llama a ningún servicio de correo
 * y nada sale del navegador. Sólo se anota como «enviado» para ver cómo se vería la app.
 * Las respuestas también son inventadas (de ejemplo): no representan ni predicen resultados reales.
 */

/** Respuestas de ejemplo. Se elige una por negocio, siempre la misma para el mismo negocio. */
export const RESPUESTAS_DE_EJEMPLO = [
  "Hola, gracias por escribir. Sí nos interesa. ¿Nos puede mandar la lista de precios y los planos?",
  "Buenas tardes. ¿Tienen departamentos de dos recámaras? ¿De cuánto es el enganche?",
  "Hola. Me interesa como inversión. ¿Podemos hablar el jueves por la mañana?",
  "Gracias por la información. Por ahora no, pero téngame en cuenta para más adelante.",
];

/** Lo que contesta quien ya no quiere correos (lo pide el pie legal). */
export const TEXTO_BAJA = "BAJA";

export function pideBaja(texto: string): boolean {
  return /^\s*baja\b/i.test(texto);
}

/**
 * Quiénes contestan en un envío (de ejemplo): 4 de cada 10, para que en la demo se vea el chat.
 * En la vida real contestan muchos menos. Si contestan 3 o más, uno pide «BAJA».
 * Sale del id de cada negocio (no del azar), así la demo se ve igual cada vez.
 */
export function respuestasDeEjemplo(contactos: Contacto[]): Map<string, string> {
  const orden = [...contactos].sort((a, b) => hashTexto(`respuesta:${a.id}`) - hashTexto(`respuesta:${b.id}`));
  const cuantos = Math.ceil(contactos.length * 0.4);
  const respuestas = new Map<string, string>();
  orden.slice(0, cuantos).forEach((c, i) => {
    const baja = cuantos >= 3 && i === cuantos - 1;
    respuestas.set(c.id, baja ? TEXTO_BAJA : RESPUESTAS_DE_EJEMPLO[i % RESPUESTAS_DE_EJEMPLO.length]);
  });
  return respuestas;
}

function masTarde(iso: string, segundos: number): string {
  return new Date(new Date(iso).getTime() + segundos * 1000).toISOString();
}

/**
 * «Envía» los correos aprobados (simulación): guarda cada uno tal como saldría, con el pie legal,
 * y anota las respuestas de ejemplo. Sólo salen los que pasaron todos los filtros (listosParaEnviar):
 * nunca uno en rojo, sin correo, en «No contactar» o sin aprobar.
 */
export function enviarSimulado(estado: EstadoDemo, ahora = new Date()): EstadoDemo {
  const listos = listosParaEnviar(estado);
  if (!listos.length) return estado;

  const respuestas = respuestasDeEjemplo(listos);
  const enviados = { ...estado.enviados };
  const chats = { ...estado.chats };
  const bajas: { id: string; fecha: string }[] = [];

  listos.forEach((c, i) => {
    const correo = armarCorreo(estado.borradores[c.id], c, estado.ajustes);
    // Salen uno tras otro, dos segundos aparte, hasta el momento en que tocaste «Enviar».
    const fecha = masTarde(ahora.toISOString(), -2 * (listos.length - i));
    enviados[c.id] = { contactoId: c.id, para: c.correo ?? "", asunto: correo.asunto, texto: correo.texto, fecha };

    const texto = respuestas.get(c.id);
    if (texto) {
      // La demo adelanta el tiempo: la respuesta llega al momento (en la vida real tardaría horas o días).
      const llega = masTarde(fecha, 1);
      const previos = chats[c.id] ?? [];
      chats[c.id] = [...previos, { id: `${c.id}-${previos.length + 1}`, de: "ellos", texto, fecha: llega }];
      if (pideBaja(texto)) bajas.push({ id: c.id, fecha: llega });
    }
  });

  const enviadosAhora = new Set(listos.map((c) => c.id));
  let nuevo: EstadoDemo = {
    ...estado,
    enviados,
    chats,
    seleccionados: estado.seleccionados.filter((id) => !enviadosAhora.has(id)),
  };
  // Quien contestó «BAJA» queda en «No contactar» al momento.
  for (const b of bajas) nuevo = registrarBaja(nuevo, b.id, new Date(b.fecha));
  return nuevo;
}

export interface Envio {
  contacto: Contacto;
  correo: CorreoEnviado;
  /** Lo que contestaron (el primer mensaje suyo), si contestaron. */
  respuesta: MensajeChat | null;
}

/** Todos los correos enviados, del más nuevo al más viejo. */
export function enviosHechos(estado: EstadoDemo): Envio[] {
  return estado.contactos
    .filter((c) => estado.enviados[c.id])
    .map((c) => ({
      contacto: c,
      correo: estado.enviados[c.id],
      respuesta: (estado.chats[c.id] ?? []).find((m) => m.de === "ellos") ?? null,
    }))
    .sort((a, b) => b.correo.fecha.localeCompare(a.correo.fecha));
}

export interface Platica extends Envio {
  respuesta: MensajeChat;
  mensajes: MensajeChat[];
  ultimo: MensajeChat;
  noLeida: boolean;
  /** Pidió no recibir más correos. */
  baja: boolean;
}

/** Las pláticas con los negocios que contestaron. */
export function platicas(estado: EstadoDemo): Platica[] {
  return enviosHechos(estado).flatMap((e) => {
    if (!e.respuesta) return [];
    const mensajes = estado.chats[e.contacto.id] ?? [];
    const leidoHasta = estado.leidos[e.contacto.id] ?? "";
    return [
      {
        ...e,
        respuesta: e.respuesta,
        mensajes,
        ultimo: mensajes[mensajes.length - 1],
        noLeida: mensajes.some((m) => m.de === "ellos" && m.fecha > leidoHasta),
        baja: mensajes.some((m) => m.de === "ellos" && pideBaja(m.texto)),
      },
    ];
  });
}

export type OrdenChat = "recientes" | "antiguos" | "az" | "za";

export const ORDENES_CHAT: { valor: OrdenChat; texto: string }[] = [
  { valor: "recientes", texto: "Más recientes" },
  { valor: "antiguos", texto: "Más antiguos" },
  { valor: "az", texto: "Nombre de la A a la Z" },
  { valor: "za", texto: "Nombre de la Z a la A" },
];

/** Ordena por la fecha del último mensaje o por nombre. */
export function ordenarPlaticas(lista: Platica[], orden: OrdenChat): Platica[] {
  const nombre = (p: Platica) => nombreVisible(p.contacto.nombre, p.contacto.esEjemplo);
  const porNombre = (a: Platica, b: Platica) => nombre(a).localeCompare(nombre(b), "es", { sensitivity: "base" });
  return [...lista].sort((a, b) => {
    if (orden === "az") return porNombre(a, b);
    if (orden === "za") return porNombre(b, a);
    const fecha = a.ultimo.fecha.localeCompare(b.ultimo.fecha);
    return (orden === "antiguos" ? fecha : -fecha) || porNombre(a, b);
  });
}

/** Marca la plática como leída hasta su último mensaje. */
export function marcarLeida(estado: EstadoDemo, id: string): EstadoDemo {
  const mensajes = estado.chats[id] ?? [];
  const ultimo = mensajes[mensajes.length - 1]?.fecha;
  if (!ultimo || (estado.leidos[id] ?? "") >= ultimo) return estado;
  return { ...estado, leidos: { ...estado.leidos, [id]: ultimo } };
}

/**
 * Tu respuesta en el chat (simulación: no se envía). Si el negocio pidió «BAJA», ya no se le puede escribir.
 */
export function responderEnChat(estado: EstadoDemo, id: string, texto: string, ahora = new Date()): EstadoDemo {
  const limpio = texto.trim();
  const mensajes = estado.chats[id] ?? [];
  if (!limpio || !estado.enviados[id] || mensajes.some((m) => m.de === "ellos" && pideBaja(m.texto))) return estado;
  // Siempre queda después del último mensaje, aunque el reloj del teléfono vaya atrasado.
  const ultimo = mensajes[mensajes.length - 1]?.fecha ?? "";
  const fecha = ahora.toISOString() > ultimo ? ahora.toISOString() : masTarde(ultimo, 1);
  const mensaje: MensajeChat = { id: `${id}-${mensajes.length + 1}`, de: "yo", texto: limpio, fecha };
  return marcarLeida({ ...estado, chats: { ...estado.chats, [id]: [...mensajes, mensaje] } }, id);
}

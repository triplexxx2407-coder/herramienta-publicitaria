import { nombreVisible } from "@/lib/contactos";
import type { EstadoDemo } from "@/lib/tipos";

/** Sin acentos ni mayúsculas, para que «Odontologia» encuentre «Odontología». */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export interface Resultado {
  id: string;
  nombre: string;
  detalle: string;
  /** Dónde está ese contacto ahora mismo, en dos o tres palabras. */
  etiqueta: string;
  /** A qué pantalla lleva y qué abrir ahí. */
  ruta: string;
}

/** Dónde está cada contacto, para llevarte a la pantalla donde te sirve. */
function dondeEsta(estado: EstadoDemo, id: string): { etiqueta: string; ruta: string } {
  if ((estado.chats[id] ?? []).some((m) => m.de === "ellos")) return { etiqueta: "Te contestó", ruta: "/chat" };
  if (estado.enviados[id]) return { etiqueta: "Correo enviado", ruta: "/envio" };
  if (estado.seleccionados.includes(id)) {
    return estado.borradores[id]?.estado === "aprobado"
      ? { etiqueta: "Listo para enviar", ruta: "/envio" }
      : { etiqueta: "Por redactar", ruta: "/redactar" };
  }
  return { etiqueta: "En la lista", ruta: "/buscar" };
}

/** Busca entre tus contactos por nombre o por correo. Devuelve pocos, los más útiles primero. */
export function buscarClientes(estado: EstadoDemo, texto: string, maximo = 6): Resultado[] {
  const q = normalizar(texto);
  if (q.length < 2) return [];
  return estado.contactos
    .filter((c) => normalizar(c.nombre).includes(q) || normalizar(c.correo ?? "").includes(q))
    .map((c) => {
      const { etiqueta, ruta } = dondeEsta(estado, c.id);
      return { id: c.id, nombre: nombreVisible(c.nombre, c.esEjemplo), detalle: c.correo ?? "Sin correo", etiqueta, ruta };
    })
    .slice(0, maximo);
}

/** ¿El texto se parece al nombre o a la ciudad de tu desarrollo? */
export function buscaLaPropiedad(estado: EstadoDemo, texto: string): boolean {
  const q = normalizar(texto);
  if (q.length < 2) return false;
  const { nombreDesarrollo, ciudad } = estado.ajustes;
  return normalizar(nombreDesarrollo).includes(q) || normalizar(ciudad).includes(q);
}

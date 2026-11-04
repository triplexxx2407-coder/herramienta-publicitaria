import { estaSuprimido, semaforoDe } from "@/lib/contactos";
import { nombreCiudad, nombreGiro } from "@/lib/catalogos";
import { armarCorreo } from "@/lib/redaccion";
import type { EstadoDemo, Semaforo, TipoOrigen } from "@/lib/tipos";

export const NOMBRE_SEMAFORO: Record<Semaforo, string> = { verde: "Verde", ambar: "Ámbar", rojo: "Rojo" };

export const NOMBRE_TIPO_ORIGEN: Record<TipoOrigen, string> = {
  directorio_publico: "Directorio público",
  formulario_propio: "Formulario propio",
  cliente_actual: "Cliente actual",
  declarado: "Declarado por el usuario",
  desconocido: "Sin origen conocido",
};

export interface FilaExpediente {
  contacto: string;
  correo: string;
  giro: string;
  ciudad: string;
  fuente: string;
  tipoOrigen: string;
  nota: string;
  fechaAlta: string;
  semaforo: Semaforo;
  noContactar: boolean;
  esEjemplo: boolean;
  estadoMensaje: string;
  fechaAprobado: string;
  asuntoAprobado: string;
  mensajeAprobado: string;
}

export function filasExpediente(estado: EstadoDemo): FilaExpediente[] {
  return estado.contactos.map((c) => {
    const b = estado.borradores[c.id];
    const aprobado = b?.estado === "aprobado";
    const correo = aprobado ? armarCorreo(b, c, estado.ajustes) : null;
    return {
      contacto: c.nombre,
      correo: c.correo ?? "",
      giro: nombreGiro(c.giro),
      ciudad: nombreCiudad(c.ciudad),
      fuente: c.origen.fuente,
      tipoOrigen: NOMBRE_TIPO_ORIGEN[c.origen.tipo],
      nota: c.origen.nota ?? "",
      fechaAlta: c.origen.fecha,
      semaforo: semaforoDe(c.origen),
      noContactar: estaSuprimido(c, estado),
      esEjemplo: c.esEjemplo,
      estadoMensaje: aprobado ? "Aprobado" : b ? "Borrador sin aprobar" : "Sin mensaje",
      fechaAprobado: aprobado ? (b.fechaAprobado ?? "") : "",
      asuntoAprobado: correo?.asunto ?? "",
      mensajeAprobado: correo?.texto ?? "",
    };
  });
}

function celda(valor: string): string {
  return /[",\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

/** CSV con marca UTF-8 para que Excel muestre bien los acentos. */
export function expedienteCsv(estado: EstadoDemo): string {
  const encabezados = [
    "Contacto", "Correo", "Giro", "Ciudad", "De dónde salió", "Tipo de origen", "Nota del usuario",
    "Fecha de alta", "Semáforo", "No contactar", "Dato de ejemplo", "Estado del mensaje",
    "Fecha de aprobación", "Asunto aprobado", "Mensaje aprobado (con pie legal)",
  ];
  const filas = filasExpediente(estado).map((f) => [
    f.contacto, f.correo, f.giro, f.ciudad, f.fuente, f.tipoOrigen, f.nota, f.fechaAlta,
    NOMBRE_SEMAFORO[f.semaforo], f.noContactar ? "Sí" : "No", f.esEjemplo ? "Sí" : "No",
    f.estadoMensaje, f.fechaAprobado, f.asuntoAprobado, f.mensajeAprobado,
  ]);
  return "﻿" + [encabezados, ...filas].map((fila) => fila.map(celda).join(",")).join("\r\n") + "\r\n";
}

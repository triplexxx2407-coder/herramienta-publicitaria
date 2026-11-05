"use client";

import { useEnNavegador, useEstado } from "@/lib/almacen";
import { EMPRESAS, anclajeDeSesion, conversaciones as conversacionesDeEjemplo, type Conversacion } from "@/lib/bandeja";
import { useFuente, type Modo } from "@/lib/fuente";
import type { EmpresaCliente } from "@/lib/tipos";

/**
 * Lo que ve la bandeja, venga del servidor o de los ejemplos: las empresas, todas las
 * pláticas y las de la empresa elegida.
 */
export function useBandeja(): {
  modo: Modo;
  /** true sólo con datos de ejemplo: ahí se ponen las marcas «Ejemplo». */
  esEjemplo: boolean;
  empresas: EmpresaCliente[];
  empresaActiva: string | null;
  todas: Conversacion[];
  deLaEmpresa: Conversacion[];
  /** Las archivadas (de la empresa activa). Se borran solas a los 7 días. */
  archivadas: Conversacion[];
} {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const fuente = useFuente();
  const real = fuente.modo === "real";
  // Mientras se revisa si hay servidor no se enseña nada: así no se asoman los ejemplos.
  const empresas = real ? fuente.empresas : fuente.modo === "ejemplo" ? EMPRESAS : [];
  // Si la empresa guardada ya no existe (otra fuente, o la borraron), se ven todas.
  const guardada = enNavegador ? estado.empresaActiva : null;
  const empresaActiva = empresas.some((e) => e.id === guardada) ? guardada : null;
  const completas = !enNavegador
    ? []
    : real
      ? [...fuente.conversaciones].sort((a, b) => b.ultimo.fecha.localeCompare(a.ultimo.fecha))
      : fuente.modo === "ejemplo"
        ? conversacionesDeEjemplo(estado, anclajeDeSesion())
        : [];
  // Lo archivado no cuenta ni como nuevo ni se mezcla con lo demás.
  const todas = completas.filter((c) => !c.archivadaEn);
  const archivadasTodas = completas.filter((c) => !!c.archivadaEn);
  return {
    modo: fuente.modo,
    esEjemplo: fuente.modo === "ejemplo",
    empresas,
    empresaActiva,
    todas,
    deLaEmpresa: empresaActiva ? todas.filter((c) => c.empresaId === empresaActiva) : todas,
    archivadas: empresaActiva ? archivadasTodas.filter((c) => c.empresaId === empresaActiva) : archivadasTodas,
  };
}

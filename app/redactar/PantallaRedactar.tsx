"use client";

import Link from "next/link";
import { Aviso } from "@/components/Aviso";
import { Cargando } from "@/components/Cargando";
import { EncabezadoPantalla } from "@/components/EncabezadoPantalla";
import { SiguientePaso } from "@/components/SiguientePaso";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar } from "@/lib/contactos";
import { generarBorrador, validarAjustes } from "@/lib/redaccion";
import { AjustesDelProyecto } from "./AjustesDelProyecto";
import { TarjetaBorrador } from "./TarjetaBorrador";

export function PantallaRedactar() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  if (!enNavegador) return <Cargando />;

  const contactos = contactosParaRedactar(estado);
  const aprobados = contactos.filter((c) => estado.borradores[c.id]?.estado === "aprobado").length;
  const erroresAjustes = validarAjustes(estado.ajustes);

  return (
    <div>
      <EncabezadoPantalla
        paso={3}
        titulo="Redactar"
        ayuda={
          <>
            <p>
              Primero llenas los datos de tu desarrollo. Con ellos se arma un borrador para cada negocio, con su nombre,
              giro y ciudad.
            </p>
            <p>
              Lee y corrige cada borrador y apruébalo. Sólo los aprobados pasan a «Envío». El pie legal se agrega solo
              y no se puede borrar.
            </p>
          </>
        }
      />

      <AjustesDelProyecto />

      {erroresAjustes.length ? (
        <div className="mb-6">
          <Aviso tipo="error">
            Para aprobar correos faltan datos del pie legal: {erroresAjustes.join(" ")}
          </Aviso>
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">Borradores ({contactos.length})</h2>
          <p className="font-medium text-slate-700" role="status">
            {aprobados} de {contactos.length} aprobados
          </p>
        </div>
        {contactos.length === 0 ? (
          <Aviso tipo="info">
            No hay contactos elegidos. Ve a{" "}
            <Link href="/contactos" className="font-semibold text-teal-800 underline">
              Elegir contactos
            </Link>{" "}
            y marca a quién quieres escribirle.
          </Aviso>
        ) : (
          <ul className="space-y-6">
            {contactos.map((c) => (
              <li key={c.id}>
                <TarjetaBorrador
                  contacto={c}
                  borrador={estado.borradores[c.id] ?? generarBorrador(c, estado.ajustes)}
                  guardado={!!estado.borradores[c.id]}
                  ajustes={estado.ajustes}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiguientePaso ruta="/envio" texto="Ver el plan de envío" />
    </div>
  );
}

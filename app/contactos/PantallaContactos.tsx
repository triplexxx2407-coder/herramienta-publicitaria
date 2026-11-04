"use client";

import Link from "next/link";
import { Aviso } from "@/components/Aviso";
import { Cargando } from "@/components/Cargando";
import { EncabezadoPantalla } from "@/components/EncabezadoPantalla";
import { Etiqueta } from "@/components/Etiqueta";
import { Semaforo } from "@/components/Semaforo";
import { SiguientePaso } from "@/components/SiguientePaso";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreCiudad, nombreGiro } from "@/lib/catalogos";
import {
  alternarSeleccion,
  contactosParaRedactar,
  estaSuprimido,
  marcarNoContactar,
  motivoBloqueo,
  normalizarCorreo,
  semaforoDe,
  TEXTO_BLOQUEO,
} from "@/lib/contactos";
import { NOMBRE_TIPO_ORIGEN } from "@/lib/expediente";
import type { Contacto, EstadoDemo } from "@/lib/tipos";
import { FormularioManual } from "./FormularioManual";

export function PantallaContactos() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  if (!enNavegador) return <Cargando />;

  const conCorreo = estado.contactos.filter((c) => normalizarCorreo(c.correo) && !estaSuprimido(c, estado));
  const sinCorreo = estado.contactos.filter((c) => !normalizarCorreo(c.correo));
  const suprimidos = estado.contactos.filter((c) => estaSuprimido(c, estado));
  const elegidos = contactosParaRedactar(estado).length;
  const elegibles = conCorreo.filter((c) => !motivoBloqueo(c, estado));

  return (
    <div>
      <EncabezadoPantalla
        paso={2}
        titulo="Elegir contactos"
        ayuda={
          <>
            <p>Aquí escoges a mano a quién escribirle. Sólo los que marques pasan a «Redactar».</p>
            <p>
              El semáforo dice de dónde salió cada contacto. Verde: de un directorio público, de tu propio formulario o
              de tus clientes. Ámbar: lo agregaste tú y dijiste de dónde salió. Rojo: no se sabe de dónde salió, y
              por eso no se puede usar.
            </p>
            <p>
              Existe porque la ley de datos personales pide poder demostrar de dónde sacaste cada correo, y porque
              escribirle a gente de listas dudosas te cierra la cuenta de correo.
            </p>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <span className="font-semibold">Semáforo:</span>
        <span className="flex items-center gap-2"><Semaforo valor="verde" /> directorio público, formulario propio o cliente</span>
        <span className="flex items-center gap-2"><Semaforo valor="ambar" /> lo agregaste tú, con nota</span>
        <span className="flex items-center gap-2"><Semaforo valor="rojo" /> sin origen: no se puede usar</span>
      </div>

      {estado.contactos.length === 0 ? (
        <Aviso tipo="info">
          Tu lista está vacía. Ve a{" "}
          <Link href="/buscar" className="font-semibold text-teal-800 underline">
            Buscar empresas
          </Link>{" "}
          y agrega algunas, o agrega un contacto a mano aquí abajo.
        </Aviso>
      ) : null}

      {conCorreo.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Con correo ({conCorreo.length})</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-700" role="status">
                {elegidos} {elegidos === 1 ? "elegido" : "elegidos"}
              </span>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                onClick={() =>
                  actualizarEstado((e) => ({
                    ...e,
                    seleccionados: Array.from(new Set([...e.seleccionados, ...elegibles.map((c) => c.id)])),
                  }))
                }
              >
                Elegir todos los permitidos
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                onClick={() => actualizarEstado((e) => ({ ...e, seleccionados: [] }))}
              >
                Quitar todos
              </button>
            </div>
          </div>
          <TablaContactos contactos={conCorreo} estado={estado} />
        </section>
      ) : null}

      {sinCorreo.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold">Sin correo ({sinCorreo.length})</h2>
          <p className="mb-3 text-slate-600">Estos negocios no tienen correo, así que no se pueden elegir. Puedes llamarles por teléfono.</p>
          <ListaSimple contactos={sinCorreo} detalle={(c) => c.telefono ?? "Sin teléfono"} />
        </section>
      ) : null}

      {suprimidos.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold">No contactar ({suprimidos.length})</h2>
          <p className="mb-3 text-slate-600">
            Pidieron no recibir más correos o tú los marcaste. No se pueden volver a elegir, aunque los vuelvas a
            agregar.
          </p>
          <ListaSimple contactos={suprimidos} detalle={(c) => c.correo ?? ""} />
        </section>
      ) : null}

      <FormularioManual />

      <SiguientePaso ruta="/redactar" texto="Redactar" />
    </div>
  );
}

function TablaContactos({ contactos, estado }: { contactos: Contacto[]; estado: EstadoDemo }) {
  const elegidos = new Set(estado.seleccionados);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[3rem_6rem_1fr_1fr_8rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 md:grid">
        <span>Elegir</span>
        <span>Semáforo</span>
        <span>Negocio</span>
        <span>De dónde salió</span>
        <span />
      </div>
      <ul className="divide-y divide-slate-200">
        {contactos.map((c) => {
          const bloqueo = motivoBloqueo(c, estado);
          const marcado = elegidos.has(c.id) && !bloqueo;
          return (
            <li
              key={c.id}
              className={`grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-[3rem_6rem_1fr_1fr_8rem] md:items-center ${
                bloqueo ? "bg-red-50/50" : ""
              }`}
            >
              <div className="row-span-3 md:row-span-1">
                <input
                  type="checkbox"
                  aria-label={`Elegir ${c.nombre}`}
                  checked={marcado}
                  disabled={!!bloqueo}
                  onChange={() => actualizarEstado((e) => alternarSeleccion(e, c.id))}
                  className="h-5 w-5 accent-teal-700 disabled:cursor-not-allowed"
                />
              </div>
              <div className="md:order-none">
                <Semaforo valor={semaforoDe(c.origen)} />
              </div>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {c.nombre} {c.esEjemplo ? <Etiqueta tipo="ejemplo" /> : null}
                </p>
                <p className="text-sm break-all text-slate-600">{c.correo}</p>
                <p className="text-sm text-slate-500">
                  {[nombreGiro(c.giro), nombreCiudad(c.ciudad)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="col-start-2 text-sm md:col-start-auto">
                <p className="font-medium">{NOMBRE_TIPO_ORIGEN[c.origen.tipo]}</p>
                <p className="text-slate-600">{c.origen.fuente}</p>
                {c.origen.nota ? <p className="text-slate-600">Nota: «{c.origen.nota}»</p> : null}
                {bloqueo ? <p className="font-semibold text-red-700">No se puede usar: {TEXTO_BLOQUEO[bloqueo]}</p> : null}
              </div>
              <div className="col-start-2 md:col-start-auto md:text-right">
                <button
                  type="button"
                  onClick={() => actualizarEstado((e) => marcarNoContactar(e, c.id))}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  No contactar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ListaSimple({ contactos, detalle }: { contactos: Contacto[]; detalle: (c: Contacto) => string }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {contactos.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-slate-600">
          <span className="flex flex-wrap items-center gap-2">
            <input type="checkbox" disabled aria-label={`${c.nombre} no se puede elegir`} className="h-5 w-5" />
            <span className="font-medium text-slate-800">{c.nombre}</span>
            {c.esEjemplo ? <Etiqueta tipo="ejemplo" /> : null}
          </span>
          <span className="text-sm break-all">{detalle(c)}</span>
        </li>
      ))}
    </ul>
  );
}

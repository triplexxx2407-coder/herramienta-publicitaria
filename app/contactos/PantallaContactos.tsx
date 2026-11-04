"use client";

import { Ban, Check, CheckCheck, Lock, Phone, Search, Sparkles, UserPlus, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { avisar } from "@/components/avisos";
import { Boton, BotonEnlace, Cargando, Encabezado, EstadoVacio, Insignia, PildoraSemaforo, Segmentado, Tarjeta, cx } from "@/components/ui";
import { actualizarEstado, reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
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
import { estadoDeRecorrido } from "@/lib/estado";
import { NOMBRE_TIPO_ORIGEN } from "@/lib/expediente";
import type { Contacto, EstadoDemo } from "@/lib/tipos";
import { HojaContactoManual } from "./HojaContactoManual";

type Pestana = "con" | "sin" | "no";

export function PantallaContactos() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [pestana, setPestana] = useState<Pestana>("con");
  const [agregando, setAgregando] = useState(false);
  if (!enNavegador) return <Cargando />;

  const conCorreo = estado.contactos.filter((c) => normalizarCorreo(c.correo) && !estaSuprimido(c, estado));
  const sinCorreo = estado.contactos.filter((c) => !normalizarCorreo(c.correo));
  const suprimidos = estado.contactos.filter((c) => estaSuprimido(c, estado));
  const permitidos = conCorreo.filter((c) => !motivoBloqueo(c, estado));
  const elegidos = contactosParaRedactar(estado).length;

  const botonAgregar = (
    <Boton variante="secundario" icono={<UserPlus size={18} aria-hidden />} onClick={() => setAgregando(true)}>
      Agregar a mano
    </Boton>
  );

  return (
    <div>
      <Encabezado
        paso={2}
        titulo="Elegir contactos"
        subtitulo="Marca a quién escribirle. Solo los permitidos pasan a Redactar."
        acciones={<div className="hidden sm:block">{botonAgregar}</div>}
        ayuda={
          <>
            <p>Escoges a mano a quién escribirle; solo los marcados pasan a «Redactar».</p>
            <p>
              El semáforo dice de dónde salió cada contacto: verde, de un directorio público, de tu formulario o de tus
              clientes; ámbar, si lo agregaste tú y dijiste de dónde; rojo, si no se sabe, y ese no se puede usar.
            </p>
            <p>
              Existe porque la ley de datos personales pide poder demostrar de dónde sacaste cada correo, y porque escribirle
              a listas dudosas hace que te bloqueen la cuenta.
            </p>
          </>
        }
      />

      {estado.contactos.length === 0 ? (
        <EstadoVacio
          icono={<Users size={30} aria-hidden />}
          titulo="Tu lista está vacía"
          texto="Agrega negocios desde «Buscar empresas» o carga el recorrido de ejemplo."
        >
          <BotonEnlace href="/buscar" icono={<Search size={18} aria-hidden />}>
            Buscar empresas
          </BotonEnlace>
          <Boton
            variante="secundario"
            icono={<Sparkles size={18} aria-hidden />}
            onClick={() => {
              reiniciarEstado(estadoDeRecorrido());
              avisar("Recorrido de ejemplo cargado");
            }}
          >
            Cargar ejemplo
          </Boton>
          {botonAgregar}
        </EstadoVacio>
      ) : (
        <>
          {/* Resumen */}
          <Tarjeta className="entrada mb-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Anillo valor={elegidos} max={permitidos.length} />
                <div>
                  <p className="text-2xl leading-tight font-bold" role="status">
                    <span>{elegidos}</span>{" "}
                    <span className="text-lg font-semibold">{elegidos === 1 ? "elegido" : "elegidos"}</span>
                  </p>
                  <p className="text-sm text-suave">de {permitidos.length} que se pueden usar</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Boton
                  variante="secundario"
                  tamano="sm"
                  icono={<CheckCheck size={16} aria-hidden />}
                  disabled={elegidos === permitidos.length}
                  onClick={() =>
                    actualizarEstado((e) => ({
                      ...e,
                      seleccionados: Array.from(new Set([...e.seleccionados, ...permitidos.map((c) => c.id)])),
                    }))
                  }
                >
                  Elegir todos
                </Boton>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  disabled={elegidos === 0}
                  onClick={() => actualizarEstado((e) => ({ ...e, seleccionados: [] }))}
                >
                  Quitar todos
                </Boton>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-linea pt-4">
              <PildoraSemaforo valor="verde" texto="Verde · directorio público" />
              <PildoraSemaforo valor="ambar" texto="Ámbar · lo agregaste tú" />
              <PildoraSemaforo valor="rojo" texto="Rojo · sin origen, no se usa" />
            </div>
          </Tarjeta>

          <Segmentado
            etiqueta="Qué contactos ver"
            className="mb-3 w-full sm:w-fit"
            valor={pestana}
            onChange={setPestana}
            opciones={[
              { valor: "con", texto: "Con correo", cuenta: conCorreo.length },
              { valor: "sin", texto: "Sin correo", cuenta: sinCorreo.length },
              { valor: "no", texto: "No contactar", cuenta: suprimidos.length },
            ]}
          />

          {pestana === "con" ? <ListaConCorreo contactos={conCorreo} estado={estado} /> : null}
          {pestana === "sin" ? (
            <ListaBloqueada
              contactos={sinCorreo}
              vacio="Todos tus contactos tienen correo."
              explicacion="Estos negocios no tienen correo, así que no se pueden elegir. Puedes llamarles por teléfono."
              detalle={(c) => (
                <span className="cifras inline-flex items-center gap-1.5">
                  <Phone size={14} aria-hidden /> {c.telefono ?? "Sin teléfono"}
                </span>
              )}
            />
          ) : null}
          {pestana === "no" ? (
            <ListaBloqueada
              contactos={suprimidos}
              vacio="Nadie ha pedido que no le escribas."
              explicacion="Pidieron no recibir más correos o tú los marcaste. No se pueden volver a elegir, aunque los vuelvas a agregar."
              detalle={(c) => <span className="truncate">{c.correo}</span>}
              suprimido
            />
          ) : null}
        </>
      )}

      {/* Botón flotante en celular */}
      {estado.contactos.length > 0 ? (
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className="fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-30 inline-flex h-14 items-center gap-2 rounded-full bg-marca-600 pr-5 pl-4 font-semibold text-white shadow-flotante sm:hidden"
        >
          <UserPlus size={20} aria-hidden /> Agregar
        </button>
      ) : null}

      <HojaContactoManual abierta={agregando} onCerrar={() => setAgregando(false)} />
    </div>
  );
}

function Anillo({ valor, max }: { valor: number; max: number }) {
  const r = 24;
  const largo = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, valor / max) : 0;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden className="shrink-0 -rotate-90">
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--color-marca-50)" strokeWidth="7" />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="var(--color-marca-600)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${largo * pct} ${largo}`}
      />
    </svg>
  );
}

function ListaConCorreo({ contactos, estado }: { contactos: Contacto[]; estado: EstadoDemo }) {
  const elegidos = new Set(estado.seleccionados);
  if (!contactos.length) {
    return <p className="rounded-tarjeta bg-white px-5 py-8 text-center text-suave">No hay contactos con correo.</p>;
  }
  return (
    <Tarjeta className="entrada overflow-hidden">
      <ul className="divide-y divide-linea">
        {contactos.map((c) => {
          const bloqueo = motivoBloqueo(c, estado);
          const marcado = elegidos.has(c.id) && !bloqueo;
          return (
            <li key={c.id} className={cx("flex items-start gap-2 px-3 py-3 sm:px-5 sm:py-3.5", bloqueo && "bg-rojo-50/40")}>
              <label className={cx("flex min-w-0 flex-1 items-start gap-3 rounded-xl p-1", bloqueo ? "cursor-not-allowed" : "cursor-pointer")}>
                <span className="relative mt-2 flex h-6 w-6 shrink-0">
                  <input
                    type="checkbox"
                    aria-label={`Elegir ${c.nombre}`}
                    checked={marcado}
                    disabled={!!bloqueo}
                    onChange={() => actualizarEstado((e) => alternarSeleccion(e, c.id))}
                    className="h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-tenue/60 bg-white transition-colors checked:border-marca-600 checked:bg-marca-600 disabled:cursor-not-allowed disabled:border-linea disabled:bg-fondo"
                  />
                  {marcado ? (
                    <Check size={15} strokeWidth={3.2} aria-hidden className="pointer-events-none absolute inset-0 m-auto text-white" />
                  ) : null}
                  {bloqueo ? <Lock size={12} aria-hidden className="pointer-events-none absolute inset-0 m-auto text-tenue" /> : null}
                </span>
                <Avatar nombre={c.nombre} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-tinta">{c.nombre}</span>
                    {c.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
                  </span>
                  <span className="block truncate text-sm text-suave">{c.correo}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <PildoraSemaforo valor={semaforoDe(c.origen)} />
                    <span className="text-xs text-tenue">
                      {NOMBRE_TIPO_ORIGEN[c.origen.tipo]}
                      {[nombreGiro(c.giro), nombreCiudad(c.ciudad)].filter(Boolean).length
                        ? ` · ${[nombreGiro(c.giro), nombreCiudad(c.ciudad)].filter(Boolean).join(" · ")}`
                        : ""}
                    </span>
                  </span>
                  {c.origen.nota ? <span className="mt-1 block text-xs text-suave">Nota: «{c.origen.nota}»</span> : null}
                  {bloqueo ? (
                    <span className="mt-1 flex items-center gap-1 text-xs font-bold text-rojo-700">
                      <Ban size={13} aria-hidden /> No se puede usar: {TEXTO_BLOQUEO[bloqueo]}
                    </span>
                  ) : null}
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  actualizarEstado((e) => marcarNoContactar(e, c.id));
                  avisar("Marcado como «No contactar»");
                }}
                aria-label={`No contactar a ${c.nombre}`}
                title="No contactar"
                className="mt-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-suave hover:bg-rojo-50 hover:text-rojo-700"
              >
                <Ban size={16} aria-hidden />
                <span className="hidden md:inline">No contactar</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Tarjeta>
  );
}

function ListaBloqueada({
  contactos,
  vacio,
  explicacion,
  detalle,
  suprimido = false,
}: {
  contactos: Contacto[];
  vacio: string;
  explicacion: string;
  detalle: (c: Contacto) => ReactNode;
  suprimido?: boolean;
}) {
  if (!contactos.length) {
    return <p className="rounded-tarjeta bg-white px-5 py-8 text-center text-suave">{vacio}</p>;
  }
  return (
    <div className="entrada space-y-3">
      <p className="text-sm text-suave">{explicacion}</p>
      <Tarjeta className="overflow-hidden">
        <ul className="divide-y divide-linea">
          {contactos.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <input
                type="checkbox"
                disabled
                aria-label={`${c.nombre} no se puede elegir`}
                className="h-6 w-6 shrink-0 appearance-none rounded-full border-2 border-linea bg-fondo"
              />
              <Avatar nombre={c.nombre} apagado={suprimido} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cx("font-semibold", suprimido ? "text-suave line-through decoration-tenue/60" : "text-tinta")}>
                    {c.nombre}
                  </span>
                  {c.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
                </span>
                <span className="flex min-w-0 text-sm text-suave">{detalle(c)}</span>
              </span>
              {suprimido ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rojo-50 px-2.5 py-1 text-xs font-bold text-rojo-700">
                  <Ban size={13} aria-hidden /> No contactar
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}

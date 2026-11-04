"use client";

import { ArrowRight, Check, CircleAlert, Lock, Paperclip, Pencil, PenLine, RotateCcw, Sparkles, Undo2, Users } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { Avatar } from "@/components/Avatar";
import { avisar } from "@/components/avisos";
import {
  BOTON_BARRA,
  BarraAccion,
  BarraProgreso,
  Boton,
  BotonEnlace,
  BotonProximamente,
  Cargando,
  Encabezado,
  EstadoVacio,
  Insignia,
  Tarjeta,
  cx,
} from "@/components/ui";
import { abrirMiDesarrollo } from "@/components/ventanas";
import { actualizarEstado, reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar, nombreVisible } from "@/lib/contactos";
import { AJUSTES_EJEMPLO, estadoDeRecorrido } from "@/lib/estado";
import { obtenerAsistente } from "@/lib/ia";
import { aprobar, armarCorreo, generarBorrador, validarAjustes, validarAsunto } from "@/lib/redaccion";
import type { AjustesProyecto, Borrador, Contacto } from "@/lib/tipos";

function guardar(b: Borrador) {
  actualizarEstado((e) => ({ ...e, borradores: { ...e.borradores, [b.contactoId]: b } }));
}

export function PantallaRedactar() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [actualId, setActualId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const erroresRef = useRef<HTMLDivElement>(null);
  if (!enNavegador) return <Cargando />;

  const contactos = contactosParaRedactar(estado);
  const esAprobado = (c: Contacto) => estado.borradores[c.id]?.estado === "aprobado";
  const aprobados = contactos.filter(esAprobado).length;
  const todos = contactos.length > 0 && aprobados === contactos.length;
  const actual = contactos.find((c) => c.id === actualId) ?? contactos.find((c) => !esAprobado(c)) ?? contactos[0];
  const faltanDatos = validarAjustes(estado.ajustes).length > 0;

  function irA(id: string) {
    setActualId(id);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function limpiarErrores(id: string) {
    setErrores((e) => {
      if (!e[id]) return e;
      const resto = { ...e };
      delete resto[id];
      return resto;
    });
  }

  /** El que sigue sin aprobar, empezando después del actual. */
  function siguientePendiente(id: string, aprobadoAhora = false) {
    const i = contactos.findIndex((c) => c.id === id);
    return [...contactos.slice(i + 1), ...contactos.slice(0, i)].find((c) => !esAprobado(c) && !(aprobadoAhora && c.id === id));
  }

  function aprobarActual() {
    if (!actual) return;
    const r = aprobar(estado.borradores[actual.id] ?? generarBorrador(actual, estado.ajustes), estado.ajustes);
    if ("errores" in r) {
      setErrores((e) => ({ ...e, [actual.id]: r.errores }));
      requestAnimationFrame(() => erroresRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    limpiarErrores(actual.id);
    guardar(r);
    const siguiente = siguientePendiente(actual.id, true);
    if (siguiente) {
      avisar("Aprobado. Va el siguiente");
      irA(siguiente.id);
    } else {
      avisar("¡Listo! Todos tus correos están aprobados");
      setActualId(actual.id);
    }
  }

  const pendienteSiguiente = actual ? siguientePendiente(actual.id) : undefined;

  return (
    <div>
      <Encabezado
        paso={3}
        titulo="Redactar"
        subtitulo="Lee cada correo, cámbiale lo que quieras y apruébalo."
        ayuda={
          <>
            <p>Cada negocio que elegiste ya tiene un correo armado con su nombre y los datos de tu desarrollo.</p>
            <p>Sólo los que apruebes pasan a «Envío». El pie legal se agrega solo y no se puede borrar.</p>
          </>
        }
      />

      {!actual ? (
        <EstadoVacio
          icono={<PenLine size={30} aria-hidden />}
          titulo="Aún no eliges a quién escribirle"
          texto="Elige contactos y aquí aparecerá un correo listo para cada uno."
        >
          <BotonEnlace href="/contactos" icono={<Users size={18} aria-hidden />}>
            Elegir contactos
          </BotonEnlace>
          <Boton
            variante="secundario"
            icono={<Sparkles size={18} aria-hidden />}
            onClick={() => {
              const nuevo = estadoDeRecorrido();
              reiniciarEstado(nuevo);
              avisar(`Listo: ${nuevo.contactos.length} negocios de ejemplo`);
            }}
          >
            Llenar con un ejemplo
          </Boton>
        </EstadoVacio>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
            <TarjetaResumen ajustes={estado.ajustes} aprobados={aprobados} total={contactos.length} />

            <Tarjeta className="entrada overflow-hidden">
              <p className="px-4 pt-3.5 pb-2 text-xs font-bold tracking-[0.12em] text-tenue uppercase">
                Correos ({contactos.length})
              </p>
              <ul className="max-h-[26rem] overflow-y-auto pb-2">
                {contactos.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => irA(c.id)}
                      aria-pressed={c.id === actual.id}
                      className={cx(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        c.id === actual.id ? "bg-marca-50" : "hover:bg-fondo",
                      )}
                    >
                      <Avatar nombre={c.nombre} tamano={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-tinta">{nombreVisible(c.nombre, c.esEjemplo)}</span>
                        <span className={cx("block text-xs font-semibold", esAprobado(c) ? "text-verde-700" : "text-tenue")}>
                          {esAprobado(c) ? "Aprobado" : "Falta aprobar"}
                        </span>
                      </span>
                      {esAprobado(c) ? <MarcaAprobado /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          </aside>

          <div ref={editorRef} className="min-w-0 scroll-mt-20 space-y-4 lg:scroll-mt-6">
            {/* Lista de correos (celular) */}
            <div
              role="group"
              aria-label="Correos"
              className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden"
            >
              {contactos.map((c) => {
                const activo = c.id === actual.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActualId(c.id)}
                    aria-pressed={activo}
                    className={cx(
                      "inline-flex h-11 max-w-[12rem] shrink-0 items-center gap-2 rounded-full border pr-3.5 pl-1.5 text-sm font-semibold transition-colors",
                      activo ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-tinta-2",
                    )}
                  >
                    <Avatar nombre={c.nombre} tamano={30} />
                    <span className="truncate">{nombreVisible(c.nombre, c.esEjemplo)}</span>
                    {esAprobado(c) ? (
                      <Check size={16} aria-label="Aprobado" strokeWidth={3} className={activo ? "text-verde-50" : "text-verde-500"} />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {faltanDatos ? (
              <div className="entrada flex items-start gap-3 rounded-2xl bg-rojo-50 px-4 py-3 text-sm text-rojo-700">
                <CircleAlert size={18} aria-hidden className="mt-0.5 shrink-0" />
                <p className="min-w-0 flex-1">
                  <span className="font-semibold">Antes de aprobar, faltan tus datos para el pie legal.</span>{" "}
                  <button type="button" onClick={abrirMiDesarrollo} className="font-bold underline">
                    Completar
                  </button>
                </p>
              </div>
            ) : null}

            <Redactor
              key={actual.id}
              contacto={actual}
              borrador={estado.borradores[actual.id] ?? generarBorrador(actual, estado.ajustes)}
              guardado={!!estado.borradores[actual.id]}
              ajustes={estado.ajustes}
              errores={errores[actual.id] ?? []}
              erroresRef={erroresRef}
              onCambio={() => limpiarErrores(actual.id)}
            />

            <BarraAccion
              nota={
                <span role="status">
                  {todos
                    ? contactos.length === 1
                      ? "¡Tu correo está listo!"
                      : `¡Los ${contactos.length} correos están listos!`
                    : `${aprobados} de ${contactos.length} aprobados`}
                </span>
              }
            >
              {todos ? (
                <BotonEnlace href="/envio" className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />}>
                  Siguiente: ver el envío
                </BotonEnlace>
              ) : esAprobado(actual) && pendienteSiguiente ? (
                <Boton className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />} onClick={() => irA(pendienteSiguiente.id)}>
                  Siguiente correo
                </Boton>
              ) : (
                <Boton
                  variante="exito"
                  className={BOTON_BARRA}
                  icono={<Check size={19} strokeWidth={2.8} aria-hidden />}
                  onClick={aprobarActual}
                >
                  Aprobar este correo
                </Boton>
              )}
            </BarraAccion>
          </div>
        </div>
      )}
    </div>
  );
}

function MarcaAprobado() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-500 text-white">
      <Check size={14} strokeWidth={3.2} aria-hidden />
    </span>
  );
}

function TarjetaResumen({ ajustes, aprobados, total }: { ajustes: AjustesProyecto; aprobados: number; total: number }) {
  const portada = ajustes.fotos[0]?.url ?? AJUSTES_EJEMPLO.fotos[0]?.url;
  return (
    <Tarjeta className="entrada overflow-hidden">
      <button
        type="button"
        onClick={abrirMiDesarrollo}
        aria-label={`Editar mi desarrollo: ${ajustes.nombreDesarrollo}`}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-fondo"
      >
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-suave">Mi desarrollo</span>
          <span className="block truncate font-semibold text-tinta">{ajustes.nombreDesarrollo}</span>
          <span className="block truncate text-sm text-suave">Desde {ajustes.precioDesde}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fondo text-tinta-2">
          <Pencil size={16} aria-hidden />
        </span>
      </button>
      <div className="border-t border-linea px-4 py-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-tinta-2">Aprobados</span>
          <span className="text-sm font-bold text-tinta">
            {aprobados} de {total}
          </span>
        </div>
        <BarraProgreso valor={aprobados} max={total} color="bg-verde-500" />
      </div>
    </Tarjeta>
  );
}

const ETIQUETA = "text-xs font-bold tracking-[0.12em] text-tenue uppercase";

function Redactor({
  contacto,
  borrador,
  guardado,
  ajustes,
  errores,
  erroresRef,
  onCambio,
}: {
  contacto: Contacto;
  borrador: Borrador;
  guardado: boolean;
  ajustes: AjustesProyecto;
  errores: string[];
  erroresRef: RefObject<HTMLDivElement | null>;
  onCambio: () => void;
}) {
  const erroresAsunto = validarAsunto(borrador.asunto);
  const { pie } = armarCorreo(borrador, contacto, ajustes);
  const aprobado = borrador.estado === "aprobado";
  const asistente = obtenerAsistente();

  // Cualquier cambio regresa el borrador a "pendiente": hay que volver a aprobarlo.
  function editar(cambios: Partial<Borrador>) {
    onCambio();
    guardar({ ...borrador, ...cambios, estado: "pendiente", fechaAprobado: undefined });
  }

  return (
    <Tarjeta className={cx("entrada overflow-hidden", aprobado && "ring-2 ring-verde-500/50")}>
      <div className="flex items-center gap-3 border-b border-linea px-4 py-3.5 sm:px-5">
        <Avatar nombre={contacto.nombre} tamano={44} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-tinta">{nombreVisible(contacto.nombre, contacto.esEjemplo)}</span>
            {contacto.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
          </p>
          <p className="truncate text-sm text-suave">Para: {contacto.correo}</p>
        </div>
        {aprobado ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-verde-50 px-2.5 py-1 text-xs font-bold text-verde-700">
            <Check size={14} strokeWidth={3} aria-hidden /> Aprobado
          </span>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <label htmlFor={`asunto-${contacto.id}`} className={ETIQUETA}>
            Asunto
          </label>
          <input
            id={`asunto-${contacto.id}`}
            value={borrador.asunto}
            onChange={(e) => editar({ asunto: e.target.value })}
            aria-invalid={erroresAsunto.length > 0}
            className={cx(
              "mt-1.5 h-12 w-full rounded-xl border px-3.5 text-[15px] font-semibold text-tinta outline-none focus:ring-4",
              erroresAsunto.length
                ? "border-rojo-500/60 bg-rojo-50 focus:ring-rojo-50"
                : "border-linea bg-white focus:border-marca-500 focus:ring-marca-100",
            )}
          />
          {erroresAsunto.map((e) => (
            <p key={e} role="alert" className="mt-1.5 text-sm font-semibold text-rojo-700">
              {e}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor={`cuerpo-${contacto.id}`} className={ETIQUETA}>
            Mensaje
          </label>
          <textarea
            id={`cuerpo-${contacto.id}`}
            value={borrador.cuerpo}
            onChange={(e) => editar({ cuerpo: e.target.value })}
            rows={14}
            className="mt-1.5 w-full rounded-xl border border-linea bg-white px-3.5 py-3 text-[15px] leading-relaxed text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-100"
          />
        </div>

        {ajustes.fotos.length ? (
          <div>
            <p className={cx(ETIQUETA, "flex items-center gap-1.5")}>
              <Paperclip size={14} aria-hidden /> Fotos adjuntas ({ajustes.fotos.length})
            </p>
            <ul className="sin-barra mt-2 flex gap-2 overflow-x-auto">
              {ajustes.fotos.map((f, i) => (
                <li key={`${f.url.slice(-24)}-${i}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.nombre} className="h-20 w-28 rounded-xl border border-linea object-cover" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-2xl border border-dashed border-tenue/50 bg-fondo px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-suave uppercase">
            <Lock size={13} aria-hidden /> Pie legal: se agrega siempre y no se puede borrar
          </p>
          <pre className="mt-2 font-sans text-sm leading-relaxed whitespace-pre-wrap text-suave">{pie}</pre>
        </div>

        {errores.length ? (
          <div ref={erroresRef} role="alert" className="rounded-2xl bg-rojo-50 px-4 py-3 text-sm font-semibold text-rojo-700">
            No se pudo aprobar: {errores.join(" ")}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-linea bg-fondo/60 px-4 py-3 sm:px-5">
        {aprobado ? (
          <Boton variante="secundario" tamano="sm" icono={<Undo2 size={16} aria-hidden />} onClick={() => editar({})}>
            Quitar aprobación
          </Boton>
        ) : null}
        {guardado ? (
          <Boton
            variante="fantasma"
            tamano="sm"
            icono={<RotateCcw size={16} aria-hidden />}
            onClick={() => {
              onCambio();
              guardar(generarBorrador(contacto, ajustes));
            }}
          >
            Volver a la plantilla
          </Boton>
        ) : null}
        {asistente.disponible ? null : (
          <BotonProximamente texto="Mejorar con IA" icono={<Sparkles size={17} aria-hidden />} className="sm:ml-auto" />
        )}
      </div>
    </Tarjeta>
  );
}

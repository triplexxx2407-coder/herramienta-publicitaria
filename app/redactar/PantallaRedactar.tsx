"use client";

import { Check, CircleAlert, Lock, Paperclip, PenLine, RotateCcw, Search, Send } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { avisar } from "@/components/avisos";
import {
  BotonPie,
  CargandoPanel,
  ContenidoClaro,
  EnlacePie,
  HojaBlanca,
  IconoCirculo,
  MarcaEjemplo,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  VacioClaro,
  useEsComputadora,
} from "@/components/PanelNexora";
import { cx } from "@/components/ui";
import { abrirMiDesarrollo, olvidarPedido, useLoPedido } from "@/components/ventanas";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreVisible, porEscribir } from "@/lib/contactos";
import { aprobar, armarCorreo, generarBorrador, validarAjustes, validarAsunto } from "@/lib/redaccion";
import type { AjustesProyecto, Borrador, Contacto } from "@/lib/tipos";

function guardar(b: Borrador) {
  actualizarEstado((e) => ({ ...e, borradores: { ...e.borradores, [b.contactoId]: b } }));
}

export function PantallaRedactar() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const esComputadora = useEsComputadora();
  // El correo abierto. En el celular, null es «viendo la lista»; en la computadora siempre hay uno a la vista.
  const [actualId, setActualId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string[]>>({});

  // Si otra pantalla pide abrir un correo (el buscador de arriba o la campana), se abre aunque ya
  // estuvieras aquí. El número de la petición evita abrirlo dos veces.
  const pedido = useLoPedido("/redactar");
  const [pedidoVisto, setPedidoVisto] = useState(0);
  if (pedido && pedido.numero !== pedidoVisto) {
    setPedidoVisto(pedido.numero);
    setActualId(pedido.id);
  }
  useEffect(() => {
    if (pedido) olvidarPedido("/redactar");
  }, [pedido]);
  const editorRef = useRef<HTMLDivElement>(null);
  const erroresRef = useRef<HTMLDivElement>(null);
  if (!enNavegador) return <CargandoPanel />;

  const contactos = porEscribir(estado);
  const yaEnviaste = Object.keys(estado.enviados).length > 0;
  const esAprobado = (c: Contacto) => estado.borradores[c.id]?.estado === "aprobado";
  const aprobados = contactos.filter(esAprobado).length;
  const todos = contactos.length > 0 && aprobados === contactos.length;
  const elegido = contactos.find((c) => c.id === actualId);
  const actual = elegido ?? (esComputadora ? (contactos.find((c) => !esAprobado(c)) ?? contactos[0]) : undefined);
  const faltanDatos = validarAjustes(estado.ajustes).length > 0;

  function irA(id: string) {
    setActualId(id);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: "start" }));
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
      // En el celular regresa a la lista, donde está el botón para enviar.
      setActualId(esComputadora ? actual.id : null);
    }
  }

  const pendienteSiguiente = actual ? siguientePendiente(actual.id) : undefined;
  const primeroPendiente = contactos.find((c) => !esAprobado(c));
  const cuenta = (
    <span role="status">
      {todos
        ? contactos.length === 1
          ? "¡Tu correo está listo!"
          : `¡Los ${contactos.length} correos están listos!`
        : `${aprobados} de ${contactos.length} aprobados`}
    </span>
  );

  return (
    <PanelNexora
      titulo="Redactar"
      ayuda={
        <>
          <p>Cada negocio que elegiste ya tiene un correo armado con su nombre y los datos de tu desarrollo. Léelo, cámbiale lo que quieras y apruébalo.</p>
          <p>Sólo los que apruebes se pueden enviar. El pie legal se agrega solo y no se puede borrar.</p>
        </>
      }
      pastilla={
        actual ? (
          <PastillaCliente texto={actual.correo ?? nombreVisible(actual.nombre, actual.esEjemplo)} />
        ) : contactos.length ? (
          <PastillaCliente
            icono={
              <IconoCirculo>
                <PenLine size={20} strokeWidth={2.4} />
              </IconoCirculo>
            }
            texto={`${aprobados} de ${contactos.length} aprobados`}
          />
        ) : undefined
      }
      etiquetaLista="Correos"
      lista={
        contactos.length ? (
          <ul className="space-y-[11px]">
            {contactos.map((c) => {
              const nombre = nombreVisible(c.nombre, c.esEjemplo);
              const ok = esAprobado(c);
              return (
                <li key={c.id}>
                  <PildoraLista
                    activa={c.id === actual?.id}
                    titulo={nombre}
                    detalle={ok ? "Aprobado" : "Falta aprobar"}
                    etiqueta={`${nombre}, ${ok ? "aprobado" : "falta aprobar"}`}
                    onClick={() => irA(c.id)}
                    extra={ok ? <MarcaAprobado /> : null}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-tinta-2">{yaEnviaste ? "No tienes correos pendientes." : "Aún no eliges a quién escribirle."}</p>
        )
      }
      etiquetaPrincipal={actual ? `Correo para ${nombreVisible(actual.nombre, actual.esEjemplo)}` : "Correo"}
      modo="detalle"
      detalleAbierto={!!elegido}
      onCerrarDetalle={() => setActualId(null)}
      encabezadoDetalle={actual ? <PastillaCliente texto={actual.correo ?? nombreVisible(actual.nombre, actual.esEjemplo)} /> : undefined}
      principal={
        <ContenidoClaro>
          {!actual ? (
            <VacioClaro
              icono={<PenLine size={30} aria-hidden />}
              titulo={yaEnviaste ? "No tienes correos pendientes" : "Aún no eliges a quién escribirle"}
              texto={yaEnviaste ? "Marca más negocios en «Buscar» para escribirles." : "Marca negocios en «Buscar» y aquí aparece un correo listo para cada uno."}
            >
              <EnlacePie href="/buscar" icono={<Search size={18} aria-hidden />}>
                Ir a Buscar
              </EnlacePie>
            </VacioClaro>
          ) : (
            <div ref={editorRef} className="mx-auto max-w-3xl scroll-mt-4 space-y-3">
              {faltanDatos ? (
                <div className="flex items-start gap-3 rounded-lg bg-[#fde2e2] px-4 py-3 text-sm text-[#8e1b1b]">
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
                ajustes={estado.ajustes}
                errores={errores[actual.id] ?? []}
                erroresRef={erroresRef}
                onCambio={() => limpiarErrores(actual.id)}
              />
            </div>
          )}
        </ContenidoClaro>
      }
      notaPie={actual ? cuenta : undefined}
      pie={
        !actual ? undefined : todos ? (
          <EnlacePie href="/envio" icono={<Send size={18} aria-hidden />}>
            Siguiente: enviar
          </EnlacePie>
        ) : esAprobado(actual) && pendienteSiguiente ? (
          <BotonPie icono={<PenLine size={18} aria-hidden />} onClick={() => irA(pendienteSiguiente.id)}>
            Siguiente correo
          </BotonPie>
        ) : (
          <BotonPie tono="verde" icono={<Check size={18} strokeWidth={2.8} aria-hidden />} onClick={aprobarActual}>
            Aprobar este correo
          </BotonPie>
        )
      }
      notaPieLista={contactos.length ? cuenta : undefined}
      pieLista={
        !contactos.length ? null : todos ? (
          <EnlacePie href="/envio" icono={<Send size={18} aria-hidden />}>
            Siguiente: enviar
          </EnlacePie>
        ) : primeroPendiente ? (
          <BotonPie icono={<PenLine size={18} aria-hidden />} onClick={() => irA(primeroPendiente.id)}>
            Revisar y aprobar
          </BotonPie>
        ) : null
      }
    />
  );
}

function MarcaAprobado() {
  return (
    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-500 text-white">
      <Check size={14} strokeWidth={3.2} />
    </span>
  );
}

const ETIQUETA = "text-[11px] font-bold tracking-[0.06em] text-chat-tenue uppercase";
const CAMPO =
  "w-full rounded-[4px] border bg-white px-3.5 text-[15px] text-chat-tinta outline-none focus:ring-2";

function Redactor({
  contacto,
  borrador,
  ajustes,
  errores,
  erroresRef,
  onCambio,
}: {
  contacto: Contacto;
  borrador: Borrador;
  ajustes: AjustesProyecto;
  errores: string[];
  erroresRef: RefObject<HTMLDivElement | null>;
  onCambio: () => void;
}) {
  const erroresAsunto = validarAsunto(borrador.asunto);
  const { pie } = armarCorreo(borrador, contacto, ajustes);
  const aprobado = borrador.estado === "aprobado";
  const plantilla = generarBorrador(contacto, ajustes);
  const cambiado = borrador.asunto !== plantilla.asunto || borrador.cuerpo !== plantilla.cuerpo;

  // Cualquier cambio regresa el borrador a "pendiente": hay que volver a aprobarlo.
  function editar(cambios: Partial<Borrador>) {
    onCambio();
    guardar({ ...borrador, ...cambios, estado: "pendiente", fechaAprobado: undefined });
  }

  return (
    <HojaBlanca className={cx("overflow-hidden", aprobado && "ring-2 ring-verde-500/70")}>
      <div className="flex items-center gap-3 border-b border-black/[0.07] px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm text-chat-tenue">Para</span>
            <span className="font-semibold text-chat-tinta">{nombreVisible(contacto.nombre, contacto.esEjemplo)}</span>
            {contacto.esEjemplo ? <MarcaEjemplo /> : null}
          </p>
          <p className="truncate text-sm text-chat-tenue">{contacto.correo}</p>
        </div>
        {aprobado ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#dcf5e3] px-2.5 py-1 text-xs font-bold text-[#17603a]">
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
              CAMPO,
              "mt-1.5 h-11 font-semibold",
              erroresAsunto.length ? "border-[#e25555] bg-[#fff5f5] focus:ring-[#e25555]/30" : "border-black/15 focus:border-marca-600 focus:ring-marca-600/25",
            )}
          />
          {erroresAsunto.map((e) => (
            <p key={e} role="alert" className="mt-1.5 text-sm font-semibold text-[#b42318]">
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
            className={cx(CAMPO, "mt-1.5 border-black/15 py-3 leading-relaxed focus:border-marca-600 focus:ring-marca-600/25")}
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
                  <img src={f.url} alt={f.nombre} className="h-20 w-28 rounded-[4px] border border-black/10 object-cover" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-[4px] border border-dashed border-black/20 bg-[#f4f6f9] px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.04em] text-chat-tenue uppercase">
            <Lock size={13} aria-hidden /> Pie legal: se agrega siempre y no se puede borrar
          </p>
          <pre className="mt-2 font-sans text-sm leading-relaxed whitespace-pre-wrap text-chat-tenue">{pie}</pre>
        </div>

        {errores.length ? (
          <div ref={erroresRef} role="alert" className="rounded-[4px] bg-[#fde2e2] px-4 py-3 text-sm font-semibold text-[#8e1b1b]">
            No se pudo aprobar: {errores.join(" ")}
          </div>
        ) : null}
      </div>

      {cambiado ? (
        <div className="border-t border-black/[0.07] bg-[#f7f8fa] px-4 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => {
              onCambio();
              guardar(plantilla);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-[4px] px-2 text-sm font-semibold text-marca-700 hover:bg-marca-600/10"
          >
            <RotateCcw size={16} aria-hidden /> Volver a la plantilla
          </button>
        </div>
      ) : null}
    </HojaBlanca>
  );
}

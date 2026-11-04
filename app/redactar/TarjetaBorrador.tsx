"use client";

import { useState } from "react";
import { BotonProximamente } from "@/components/BotonProximamente";
import { Etiqueta } from "@/components/Etiqueta";
import { actualizarEstado } from "@/lib/almacen";
import { obtenerAsistente } from "@/lib/ia";
import { aprobar, armarCorreo, generarBorrador, validarAsunto } from "@/lib/redaccion";
import type { AjustesProyecto, Borrador, Contacto } from "@/lib/tipos";

function guardar(b: Borrador) {
  actualizarEstado((e) => ({ ...e, borradores: { ...e.borradores, [b.contactoId]: b } }));
}

export function TarjetaBorrador({
  contacto,
  borrador,
  guardado,
  ajustes,
}: {
  contacto: Contacto;
  borrador: Borrador;
  guardado: boolean;
  ajustes: AjustesProyecto;
}) {
  const [errores, setErrores] = useState<string[]>([]);
  const erroresAsunto = validarAsunto(borrador.asunto);
  const { pie } = armarCorreo(borrador, contacto, ajustes);
  const aprobado = borrador.estado === "aprobado";
  const asistente = obtenerAsistente();

  // Cualquier cambio regresa el borrador a "pendiente": hay que volver a aprobarlo.
  function editar(cambios: Partial<Borrador>) {
    setErrores([]);
    guardar({ ...borrador, ...cambios, estado: "pendiente", fechaAprobado: undefined });
  }

  return (
    <article
      className={`rounded-xl border-2 bg-white p-4 shadow-sm ${aprobado ? "border-emerald-400" : "border-slate-200"}`}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {contacto.nombre} {contacto.esEjemplo ? <Etiqueta tipo="ejemplo" /> : null}
          </h3>
          <p className="text-sm break-all text-slate-600">Para: {contacto.correo}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            aprobado ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
          }`}
        >
          {aprobado ? "✓ Aprobado" : "Pendiente de aprobar"}
        </span>
      </header>

      <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor={`asunto-${contacto.id}`}>
        Asunto
      </label>
      <input
        id={`asunto-${contacto.id}`}
        value={borrador.asunto}
        onChange={(e) => editar({ asunto: e.target.value })}
        aria-invalid={erroresAsunto.length > 0}
        className={`mb-1 w-full rounded-lg border px-3 py-2 ${erroresAsunto.length ? "border-red-400 bg-red-50" : "border-slate-300"}`}
      />
      {erroresAsunto.map((e) => (
        <p key={e} role="alert" className="text-sm font-medium text-red-700">
          {e}
        </p>
      ))}

      <label className="mt-3 mb-1 block text-sm font-semibold text-slate-700" htmlFor={`cuerpo-${contacto.id}`}>
        Mensaje
      </label>
      <textarea
        id={`cuerpo-${contacto.id}`}
        value={borrador.cuerpo}
        onChange={(e) => editar({ cuerpo: e.target.value })}
        rows={12}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 leading-relaxed"
      />

      <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
          <span aria-hidden>🔒</span> Pie legal: se agrega siempre y no se puede borrar
        </p>
        <pre className="font-sans text-sm whitespace-pre-wrap text-slate-600">{pie}</pre>
      </div>

      {ajustes.fotos.length ? (
        <div className="mt-3">
          <p className="mb-1 text-sm font-semibold text-slate-700">Fotos que acompañarían el correo</p>
          <div className="flex flex-wrap gap-2">
            {ajustes.fotos.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f.url} src={f.url} alt={f.nombre} className="h-16 w-24 rounded-md border border-slate-200 object-cover" />
            ))}
          </div>
        </div>
      ) : null}

      {errores.length ? (
        <div role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          No se pudo aprobar: {errores.join(" ")}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-start gap-3">
        {aprobado ? (
          <button
            type="button"
            onClick={() => editar({})}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50"
          >
            Quitar aprobación
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const r = aprobar(borrador, ajustes);
              if ("errores" in r) setErrores(r.errores);
              else {
                setErrores([]);
                guardar(r);
              }
            }}
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
          >
            Aprobar
          </button>
        )}
        {guardado ? (
          <button
            type="button"
            onClick={() => {
              setErrores([]);
              guardar(generarBorrador(contacto, ajustes));
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50"
          >
            Volver a la plantilla
          </button>
        ) : null}
        {asistente.disponible ? null : <BotonProximamente texto="✨ Mejorar con IA" />}
      </div>
    </article>
  );
}

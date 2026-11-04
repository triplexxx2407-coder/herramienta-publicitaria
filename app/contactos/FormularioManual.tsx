"use client";

import { useState } from "react";
import { Semaforo } from "@/components/Semaforo";
import { actualizarEstado } from "@/lib/almacen";
import { agregarContactos, contactoManual, correoValido } from "@/lib/contactos";

const VACIO = { nombre: "", correo: "", giro: "", ciudad: "", telefono: "", nota: "" };

export function FormularioManual() {
  const [d, setD] = useState(VACIO);
  const [error, setError] = useState("");
  const [listo, setListo] = useState("");
  const quedaEnRojo = !d.nota.trim();

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-xl font-bold">Agregar un contacto a mano</h2>
      <p className="mb-4 text-slate-600">
        Por ejemplo, alguien que conociste en persona. Di de dónde salió: si no lo dices, queda en rojo y no se puede
        usar para redactar.
      </p>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          setListo("");
          if (!d.nombre.trim()) return setError("Escribe el nombre del negocio o de la persona.");
          if (!correoValido(d.correo)) return setError("Escribe un correo válido, por ejemplo nombre@example.com.");
          setError("");
          const c = contactoManual(d);
          actualizarEstado((e) => agregarContactos(e, [c]));
          setListo(quedaEnRojo ? "Agregado en rojo: no podrás usarlo hasta saber de dónde salió." : "Agregado en ámbar.");
          setD(VACIO);
        }}
      >
        <Campo etiqueta="Nombre del negocio o persona" valor={d.nombre} onChange={(v) => setD({ ...d, nombre: v })} />
        <Campo etiqueta="Correo" tipo="email" valor={d.correo} onChange={(v) => setD({ ...d, correo: v })} />
        <Campo etiqueta="Giro (opcional)" valor={d.giro} onChange={(v) => setD({ ...d, giro: v })} />
        <Campo etiqueta="Ciudad (opcional)" valor={d.ciudad} onChange={(v) => setD({ ...d, ciudad: v })} />
        <Campo etiqueta="Teléfono (opcional)" valor={d.telefono} onChange={(v) => setD({ ...d, telefono: v })} />
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">¿De dónde sacaste este contacto?</span>
          <textarea
            value={d.nota}
            onChange={(e) => setD({ ...d, nota: e.target.value })}
            rows={2}
            placeholder="Ej.: me dio su tarjeta en la expo del 3 de noviembre"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">
            Agregar contacto
          </button>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            Quedará en: <Semaforo valor={quedaEnRojo ? "rojo" : "ambar"} />
          </span>
        </div>
        {error ? <p role="alert" className="font-medium text-red-700 sm:col-span-2">{error}</p> : null}
        {listo ? <p role="status" className="font-medium text-teal-800 sm:col-span-2">{listo}</p> : null}
      </form>
    </section>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = "text",
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-slate-700">{etiqueta}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

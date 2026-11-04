"use client";

import { useState } from "react";
import { Etiqueta } from "@/components/Etiqueta";
import { actualizarEstado, useEstado } from "@/lib/almacen";
import { AJUSTES_EJEMPLO } from "@/lib/estado";
import type { AjustesProyecto } from "@/lib/tipos";

const TAMANO_MAXIMO_FOTO = 400 * 1024;

function cambiar(cambios: Partial<AjustesProyecto>) {
  actualizarEstado((e) => ({ ...e, ajustes: { ...e.ajustes, ...cambios } }));
}

export function AjustesDelProyecto() {
  const { ajustes } = useEstado();
  const [avisoFoto, setAvisoFoto] = useState("");

  return (
    <details className="group mb-6 rounded-xl border border-slate-200 bg-white shadow-sm" open>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden className="transition-transform group-open:rotate-90">▸</span>
          Ajustes del proyecto
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <Etiqueta tipo="ejemplo">Texto de ejemplo, editable</Etiqueta>
        </span>
      </summary>
      <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-3">
        <Campo etiqueta="Nombre del desarrollo" valor={ajustes.nombreDesarrollo} onChange={(v) => cambiar({ nombreDesarrollo: v })} />
        <Campo etiqueta="Ciudad" valor={ajustes.ciudad} onChange={(v) => cambiar({ ciudad: v })} />
        <Campo etiqueta="Precio desde" valor={ajustes.precioDesde} onChange={(v) => cambiar({ precioDesde: v })} />
        {ajustes.puntosFuertes.map((p, i) => (
          <div key={i} className="sm:col-span-3">
            <Campo
              etiqueta={`Punto fuerte ${i + 1}`}
              valor={p}
              onChange={(v) => {
                const puntos = [...ajustes.puntosFuertes] as AjustesProyecto["puntosFuertes"];
                puntos[i] = v;
                cambiar({ puntosFuertes: puntos });
              }}
            />
          </div>
        ))}

        <div className="sm:col-span-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Fotos</p>
          <ul className="flex flex-wrap gap-3">
            {ajustes.fotos.map((f, i) => (
              <li key={`${f.url.slice(0, 40)}-${i}`} className="w-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.nombre} className="h-20 w-32 rounded-md border border-slate-200 object-cover" />
                <p className="truncate text-xs text-slate-600">{f.nombre}</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-700 hover:underline"
                  onClick={() => cambiar({ fotos: ajustes.fotos.filter((_, j) => j !== i) })}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <label className="mt-3 inline-block cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
            Agregar foto
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(ev) => {
                const archivo = ev.target.files?.[0];
                ev.target.value = "";
                if (!archivo) return;
                if (archivo.size > TAMANO_MAXIMO_FOTO) {
                  setAvisoFoto("La foto pesa mucho para la demo (máximo 400 KB). Prueba con una más ligera.");
                  return;
                }
                const lector = new FileReader();
                lector.onload = () => {
                  setAvisoFoto("");
                  cambiar({ fotos: [...ajustes.fotos, { nombre: archivo.name, url: String(lector.result) }] });
                };
                lector.readAsDataURL(archivo);
              }}
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">En la demo las fotos se quedan sólo en este navegador.</p>
          {avisoFoto ? <p role="alert" className="text-sm font-medium text-red-700">{avisoFoto}</p> : null}
        </div>

        <div className="sm:col-span-3">
          <p className="text-sm font-semibold text-slate-700">Datos para el pie legal</p>
          <p className="text-sm text-slate-500">Van al final de cada correo: quién escribe y cómo contactarlo.</p>
        </div>
        <Campo etiqueta="Quién escribe" valor={ajustes.asesorNombre} onChange={(v) => cambiar({ asesorNombre: v })} />
        <Campo etiqueta="Empresa" valor={ajustes.empresa} onChange={(v) => cambiar({ empresa: v })} />
        <Campo etiqueta="Teléfono" valor={ajustes.telefono} onChange={(v) => cambiar({ telefono: v })} />

        <div className="sm:col-span-3">
          <button
            type="button"
            className="text-sm font-semibold text-slate-600 underline hover:text-slate-900"
            onClick={() => cambiar(structuredClone(AJUSTES_EJEMPLO))}
          >
            Regresar al texto de ejemplo
          </button>
        </div>
      </div>
    </details>
  );
}

function Campo({ etiqueta, valor, onChange }: { etiqueta: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-slate-700">{etiqueta}</span>
      <input value={valor} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
    </label>
  );
}

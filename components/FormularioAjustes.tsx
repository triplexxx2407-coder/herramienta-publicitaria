"use client";

import { ImagePlus, Lock, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { actualizarEstado, useEstado } from "@/lib/almacen";
import { copiaAjustesEjemplo } from "@/lib/estado";
import { validarAjustes } from "@/lib/redaccion";
import type { AjustesProyecto } from "@/lib/tipos";
import { Campo, Insignia } from "./ui";

const TAMANO_MAXIMO_FOTO = 400 * 1024;

function cambiar(cambios: Partial<AjustesProyecto>) {
  actualizarEstado((e) => ({ ...e, ajustes: { ...e.ajustes, ...cambios } }));
}

/** Ajustes del proyecto: datos del desarrollo, fotos y datos del pie legal. */
export function FormularioAjustes() {
  const { ajustes } = useEstado();
  const [avisoFoto, setAvisoFoto] = useState("");
  const errores = validarAjustes(ajustes);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-suave">
        <Insignia tipo="ejemplo" /> Textos inventados. Cámbialos por los de tu desarrollo.
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-[0.12em] text-tenue uppercase">El desarrollo</h3>
        <Campo id="aj-nombre" etiqueta="Nombre del desarrollo" value={ajustes.nombreDesarrollo} onChange={(e) => cambiar({ nombreDesarrollo: e.target.value })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo id="aj-ciudad" etiqueta="Ciudad" value={ajustes.ciudad} onChange={(e) => cambiar({ ciudad: e.target.value })} />
          <Campo id="aj-precio" etiqueta="Precio desde" value={ajustes.precioDesde} onChange={(e) => cambiar({ precioDesde: e.target.value })} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-[0.12em] text-tenue uppercase">3 puntos fuertes</h3>
        {ajustes.puntosFuertes.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marca-600/20 font-display text-sm font-bold text-marca-400">
              {i + 1}
            </span>
            <input
              id={`aj-punto-${i}`}
              aria-label={`Punto fuerte ${i + 1}`}
              value={p}
              onChange={(e) => {
                const puntos = [...ajustes.puntosFuertes] as AjustesProyecto["puntosFuertes"];
                puntos[i] = e.target.value;
                cambiar({ puntosFuertes: puntos });
              }}
              className="h-11 w-full rounded-xl border border-linea bg-fondo px-3.5 text-[15px] text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-600/25"
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-[0.12em] text-tenue uppercase">Fotos</h3>
        <ul className="grid grid-cols-3 gap-2.5">
          {ajustes.fotos.map((f, i) => (
            <li key={`${f.url.slice(-24)}-${i}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.nombre} className="aspect-[4/3] w-full rounded-xl border border-linea object-cover" />
              <button
                type="button"
                aria-label={`Quitar ${f.nombre}`}
                onClick={() => cambiar({ fotos: ajustes.fotos.filter((_, j) => j !== i) })}
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-fondo/80 text-tinta hover:bg-fondo"
              >
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <label className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-linea text-sm font-semibold text-suave hover:border-marca-500 hover:bg-marca-600/15 hover:text-marca-400">
              <ImagePlus size={22} aria-hidden />
              Agregar
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(ev) => {
                  const archivo = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!archivo) return;
                  if (archivo.size > TAMANO_MAXIMO_FOTO) {
                    setAvisoFoto("Esa foto pesa mucho para la demo (máximo 400 KB). Prueba con una más ligera.");
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
          </li>
        </ul>
        {avisoFoto ? (
          <p role="alert" className="text-sm font-medium text-rojo-700">
            {avisoFoto}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] text-tenue uppercase">
          <Lock size={13} aria-hidden /> Pie legal de cada correo
        </h3>
        <Campo id="aj-asesor" etiqueta="Quién escribe" value={ajustes.asesorNombre} onChange={(e) => cambiar({ asesorNombre: e.target.value })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo id="aj-empresa" etiqueta="Empresa" value={ajustes.empresa} onChange={(e) => cambiar({ empresa: e.target.value })} />
          <Campo id="aj-telefono" etiqueta="Teléfono" value={ajustes.telefono} onChange={(e) => cambiar({ telefono: e.target.value })} />
        </div>
        {errores.length ? (
          <p role="alert" className="rounded-xl bg-rojo-50 px-3 py-2 text-sm font-medium text-rojo-700">
            {errores.join(" ")}
          </p>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => cambiar(copiaAjustesEjemplo())}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-suave hover:text-tinta"
      >
        <RotateCcw size={15} aria-hidden /> Regresar al texto de ejemplo
      </button>
    </div>
  );
}

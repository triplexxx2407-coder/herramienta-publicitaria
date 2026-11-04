"use client";

import { Paperclip } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Insignia, cx } from "@/components/ui";
import { nombreVisible } from "@/lib/contactos";
import type { Envio } from "@/lib/envio";
import { cuandoLargo } from "@/lib/fechas";
import type { AjustesProyecto } from "@/lib/tipos";

const ETIQUETA = "text-xs font-bold tracking-[0.12em] text-tenue uppercase";

/** Un correo enviado (simulación) tal como salió, con el pie legal, y su respuesta si contestaron. */
export function VistaCorreo({ envio, ajustes }: { envio: Envio; ajustes: AjustesProyecto }) {
  const { contacto, correo, respuesta } = envio;
  const nombre = nombreVisible(contacto.nombre, contacto.esEjemplo);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-fondo px-3.5 py-3">
        <Avatar nombre={contacto.nombre} tamano={42} />
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-suave">Para</span>
            <span className="font-semibold text-tinta">{nombre}</span>
            {contacto.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
          </p>
          <p className="truncate text-suave">{correo.para}</p>
          <p className="mt-0.5 font-semibold text-tinta-2">Enviado: {cuandoLargo(correo.fecha)}</p>
        </div>
      </div>

      {respuesta ? (
        <section aria-label="Su respuesta" className="rounded-2xl border border-violeta-200 bg-violeta-50 px-4 py-3.5">
          <p className="flex items-center gap-2">
            <span className={cx(ETIQUETA, "text-violeta-700")}>Te contestó</span>
            <Insignia tipo="ejemplo" />
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-tinta">{respuesta.texto}</p>
          <p className="mt-1 text-xs font-semibold text-suave">{cuandoLargo(respuesta.fecha)}</p>
        </section>
      ) : null}

      <div>
        <p className={ETIQUETA}>Asunto</p>
        <p className="mt-1 font-semibold text-tinta">{correo.asunto}</p>
      </div>

      <div>
        <p className={ETIQUETA}>Lo que le escribiste</p>
        <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-wrap text-tinta-2">{correo.texto}</p>
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
                <img src={f.url} alt={f.nombre} className="h-16 w-24 rounded-xl border border-linea object-cover" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Paperclip } from "lucide-react";
import { HojaBlanca, MarcaEjemplo } from "@/components/PanelNexora";
import { cx } from "@/components/ui";
import { nombreVisible } from "@/lib/contactos";
import type { Envio } from "@/lib/envio";
import { cuandoLargo } from "@/lib/fechas";
import type { AjustesProyecto } from "@/lib/tipos";

const ETIQUETA = "text-[11px] font-bold tracking-[0.06em] text-chat-tenue uppercase";

/**
 * Un correo como hoja blanca sobre el área clara: tal como salió (simulación), con el pie legal,
 * y arriba lo que te contestaron, si contestaron. Con `pendiente`, es el que está por salir.
 */
export function VistaCorreo({ envio, ajustes, pendiente = false }: { envio: Envio; ajustes: AjustesProyecto; pendiente?: boolean }) {
  const { contacto, correo, respuesta } = envio;
  const nombre = nombreVisible(contacto.nombre, contacto.esEjemplo);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {respuesta ? (
        <section aria-label="Su respuesta" className="mr-auto max-w-[92%] rounded-lg rounded-tl-none bg-chat-suyo px-4 py-3 shadow-sm sm:max-w-[80%]">
          <p className="flex items-center gap-2">
            <span className={cx(ETIQUETA, "text-[#17603a]")}>Te contestó</span>
            <MarcaEjemplo />
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-chat-tinta">{respuesta.texto}</p>
          <p className="mt-0.5 text-right text-[11px] text-chat-tenue">{cuandoLargo(respuesta.fecha)}</p>
        </section>
      ) : null}

      <HojaBlanca className="overflow-hidden">
        <div className="border-b border-black/[0.07] px-4 py-3 text-sm sm:px-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-chat-tenue">Para</span>
            <span className="font-semibold text-chat-tinta">{nombre}</span>
            {contacto.esEjemplo ? <MarcaEjemplo /> : null}
          </p>
          <p className="truncate text-chat-tenue">{correo.para}</p>
          <p className="mt-0.5 font-semibold text-chat-tinta">{pendiente ? "Listo para enviar" : `Enviado: ${cuandoLargo(correo.fecha)}`}</p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div>
            <p className={ETIQUETA}>Asunto</p>
            <p className="mt-1 font-semibold text-chat-tinta">{correo.asunto}</p>
          </div>

          <div>
            <p className={ETIQUETA}>{pendiente ? "Lo que le vas a enviar" : "Lo que le escribiste"}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-wrap text-chat-tinta">{correo.texto}</p>
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
                    <img src={f.url} alt={f.nombre} className="h-16 w-24 rounded-[4px] border border-black/10 object-cover" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </HojaBlanca>
    </div>
  );
}

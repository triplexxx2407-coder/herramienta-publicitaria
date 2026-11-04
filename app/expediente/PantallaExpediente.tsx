"use client";

import { Ban, CalendarDays, ChevronDown, Database, Download, Mail, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { avisar } from "@/components/avisos";
import {
  BOTON_BARRA,
  BarraAccion,
  Boton,
  BotonEnlace,
  Cargando,
  Encabezado,
  EstadoVacio,
  Insignia,
  PildoraSemaforo,
  Tarjeta,
  cx,
} from "@/components/ui";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { nombreVisible, ORIGEN_CORTO } from "@/lib/contactos";
import { expedienteCsv, filasExpediente, type FilaExpediente } from "@/lib/expediente";
import type { EstadoDemo } from "@/lib/tipos";

function formatoFecha(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Descarga el expediente. Dentro de claude.ai pasa por el permiso "downloads" del visor. */
async function descargar(estado: EstadoDemo): Promise<string> {
  const csv = expedienteCsv(estado);
  const nombre = `expediente-contactos-${new Date().toISOString().slice(0, 10)}.csv`;
  const visor = (window as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude;
  if (visor) {
    const descargas = (await visor.use("downloads").catch(() => null)) as {
      save(r: { filename: string; data: string }): Promise<unknown>;
    } | null;
    if (descargas) {
      try {
        await descargas.save({ filename: nombre, data: csv });
      } catch (e) {
        const codigo = (e as { code?: string })?.code;
        if (codigo !== "declined") return "No se pudo descargar el archivo aquí. Intenta de nuevo en un momento.";
      }
      return "";
    }
  }
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  avisar("Archivo descargado");
  return "";
}

export function PantallaExpediente() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [avisoDescarga, setAvisoDescarga] = useState("");
  if (!enNavegador) return <Cargando />;

  const filas = filasExpediente(estado);

  return (
    <div>
      <Encabezado
        paso={6}
        titulo="Expediente"
        subtitulo="La prueba de dónde salió cada contacto, lista para abrir en Excel."
        ayuda={
          <>
            <p>Aquí queda la prueba de cada contacto: de dónde salió, cuándo lo agregaste y qué correo aprobaste.</p>
            <p>Si alguien pregunta «¿de dónde sacaste mi correo?», o si lo pide la autoridad, lo descargas para Excel.</p>
          </>
        }
      />

      {filas.length === 0 ? (
        <EstadoVacio
          icono={<ShieldCheck size={30} aria-hidden />}
          titulo="El expediente está vacío"
          texto="Cada negocio que agregues a tu lista queda aquí documentado."
        >
          <BotonEnlace href="/buscar" icono={<Search size={18} aria-hidden />}>
            Buscar empresas
          </BotonEnlace>
        </EstadoVacio>
      ) : (
        <>
          <section className="entrada relative mb-5 overflow-hidden rounded-[28px] bg-tinta p-5 text-white shadow-tarjeta sm:p-6">
            <div aria-hidden className="absolute -top-20 -right-12 h-56 w-56 rounded-full bg-verde-500/25 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck size={28} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-4xl leading-none font-bold">{filas.length}</p>
                <p className="mt-1 text-white/75">{filas.length === 1 ? "contacto documentado" : "contactos documentados"}</p>
              </div>
            </div>
          </section>

          {avisoDescarga ? (
            <p role="alert" className="mb-4 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
              {avisoDescarga}
            </p>
          ) : null}

          <ul className="space-y-3">
            {filas.map((f, i) => (
              <li key={`${f.correo}-${f.fechaAlta}-${i}`}>
                <TarjetaContacto f={f} />
              </li>
            ))}
          </ul>

          <BarraAccion notaComputadora={`Un archivo para Excel con los ${filas.length} contactos`}>
            <Boton
              className={BOTON_BARRA}
              icono={<Download size={19} aria-hidden />}
              onClick={async () => setAvisoDescarga(await descargar(estado))}
            >
              Descargar para Excel
            </Boton>
          </BarraAccion>
        </>
      )}
    </div>
  );
}

const TEXTO_MENSAJE: Record<string, string> = {
  Aprobado: "Aprobado",
  "Borrador sin aprobar": "Sin aprobar",
  "Sin mensaje": "Todavía no",
};

function TarjetaContacto({ f }: { f: FilaExpediente }) {
  return (
    <Tarjeta className="entrada p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar nombre={f.contacto} apagado={f.noContactar} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-tinta">{nombreVisible(f.contacto, f.esEjemplo)}</span>
            {f.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
          </p>
          <p className="truncate text-sm text-suave">{f.correo || "No tiene correo"}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <PildoraSemaforo valor={f.semaforo} texto={ORIGEN_CORTO[f.tipo]} />
            {f.noContactar ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rojo-50 px-2.5 py-1 text-xs font-bold text-rojo-700">
                <Ban size={12} aria-hidden /> No contactar
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 border-t border-linea pt-4 sm:grid-cols-3">
        <Dato icono={Database} titulo="De dónde salió">
          {f.fuente}
          {f.nota ? <span className="block text-suave">«{f.nota}»</span> : null}
        </Dato>
        <Dato icono={CalendarDays} titulo="Cuándo lo agregaste">
          {formatoFecha(f.fechaAlta)}
        </Dato>
        <Dato icono={Mail} titulo="Correo">
          <span className={cx(f.estadoMensaje === "Aprobado" && "font-semibold text-verde-700")}>
            {TEXTO_MENSAJE[f.estadoMensaje] ?? f.estadoMensaje}
          </span>
          {f.fechaAprobado ? <span className="block text-suave">{formatoFecha(f.fechaAprobado)}</span> : null}
        </Dato>
      </ul>

      {f.mensajeAprobado ? (
        <details className="group mt-4">
          <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-marca-700">
            Ver el correo aprobado <ChevronDown size={15} aria-hidden className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 rounded-2xl border border-linea bg-fondo p-4">
            <p className="text-xs font-bold tracking-[0.12em] text-tenue uppercase">Asunto</p>
            <p className="font-semibold text-tinta">{f.asuntoAprobado}</p>
            <pre className="mt-3 border-t border-linea pt-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-tinta-2">
              {f.mensajeAprobado}
            </pre>
          </div>
        </details>
      ) : null}
    </Tarjeta>
  );
}

function Dato({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fondo text-suave">
        <Icono size={16} aria-hidden />
      </span>
      <span className="min-w-0 text-sm text-tinta-2">
        <span className="block text-xs font-semibold text-tenue">{titulo}</span>
        {children}
      </span>
    </li>
  );
}

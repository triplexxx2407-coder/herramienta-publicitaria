"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/Aviso";
import { Cargando } from "@/components/Cargando";
import { EncabezadoPantalla } from "@/components/EncabezadoPantalla";
import { Etiqueta } from "@/components/Etiqueta";
import { Semaforo } from "@/components/Semaforo";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { expedienteCsv, filasExpediente } from "@/lib/expediente";

function formatoFecha(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PantallaExpediente() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [avisoDescarga, setAvisoDescarga] = useState("");
  if (!enNavegador) return <Cargando />;
  const filas = filasExpediente(estado);

  async function descargar() {
    const csv = expedienteCsv(estado);
    const nombre = `expediente-contactos-${new Date().toISOString().slice(0, 10)}.csv`;
    setAvisoDescarga("");
    // Dentro de claude.ai la descarga pasa por el permiso "downloads" del visor.
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
          if (codigo !== "declined") setAvisoDescarga("No se pudo descargar el archivo aquí. Intenta de nuevo en un momento.");
        }
        return;
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
  }

  return (
    <div>
      <EncabezadoPantalla
        paso={6}
        titulo="Expediente de cumplimiento"
        ayuda={
          <>
            <p>
              Aquí queda la prueba de cada contacto: de dónde salió, cuándo lo agregaste, qué semáforo tiene y qué
              mensaje aprobaste.
            </p>
            <p>
              Si alguien pregunta «¿de dónde sacaste mi correo?», o si lo pide la autoridad, lo descargas en un archivo
              que se abre en Excel.
            </p>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-slate-700">
          {filas.length} {filas.length === 1 ? "contacto" : "contactos"} en el expediente
        </p>
        <button
          type="button"
          onClick={descargar}
          disabled={filas.length === 0}
          className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
        >
          Descargar en CSV (Excel)
        </button>
      </div>
      {avisoDescarga ? (
        <div className="mb-4">
          <Aviso tipo="error">{avisoDescarga}</Aviso>
        </div>
      ) : null}

      {filas.some((f) => f.esEjemplo) ? (
        <div className="mb-4">
          <Aviso tipo="ejemplo">Los contactos marcados «Ejemplo» son inventados.</Aviso>
        </div>
      ) : null}

      {filas.length === 0 ? (
        <Aviso tipo="info">
          El expediente está vacío. Agrega contactos en{" "}
          <Link href="/buscar" className="font-semibold text-teal-800 underline">
            Buscar empresas
          </Link>
          .
        </Aviso>
      ) : (
        <ul className="space-y-3">
          {filas.map((f, i) => (
            <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {f.contacto} {f.esEjemplo ? <Etiqueta tipo="ejemplo" /> : null}
                  {f.noContactar ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">No contactar</span>
                  ) : null}
                </p>
                <Semaforo valor={f.semaforo} />
              </div>
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
                <dt className="text-slate-500">Correo</dt>
                <dd className="break-all">{f.correo || "No tiene"}</dd>
                <dt className="text-slate-500">De dónde salió</dt>
                <dd>
                  {f.tipoOrigen} · {f.fuente}
                  {f.nota ? ` · Nota: «${f.nota}»` : ""}
                </dd>
                <dt className="text-slate-500">Cuándo</dt>
                <dd>{formatoFecha(f.fechaAlta)}</dd>
                <dt className="text-slate-500">Mensaje</dt>
                <dd>
                  {f.estadoMensaje}
                  {f.fechaAprobado ? ` el ${formatoFecha(f.fechaAprobado)}` : ""}
                </dd>
              </dl>
              {f.mensajeAprobado ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-teal-800">
                    Ver mensaje aprobado: «{f.asuntoAprobado}»
                  </summary>
                  <pre className="mt-2 rounded-lg bg-slate-50 p-3 font-sans text-sm whitespace-pre-wrap text-slate-700">
                    {f.mensajeAprobado}
                  </pre>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

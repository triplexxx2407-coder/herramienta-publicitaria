"use client";

import Link from "next/link";
import { Aviso } from "@/components/Aviso";
import { BotonProximamente } from "@/components/BotonProximamente";
import { Cargando } from "@/components/Cargando";
import { EncabezadoPantalla } from "@/components/EncabezadoPantalla";
import { Etiqueta } from "@/components/Etiqueta";
import { SiguientePaso } from "@/components/SiguientePaso";
import { useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar } from "@/lib/contactos";
import { DIAS_PARA_SEGUNDO_MENSAJE, simularSeguimiento } from "@/lib/seguimiento";

export function PantallaSeguimiento() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  if (!enNavegador) return <Cargando />;

  const aprobados = contactosParaRedactar(estado).filter((c) => estado.borradores[c.id]?.estado === "aprobado");
  const filas = simularSeguimiento(aprobados);
  const cuenta = (f: (x: (typeof filas)[number]) => boolean) => filas.filter(f).length;
  const segundo = filas.filter((f) => f.necesitaSegundoMensaje);

  return (
    <div>
      <EncabezadoPantalla
        paso={5}
        titulo="Seguimiento"
        ayuda={
          <>
            <p>
              Aquí verías qué pasó con cada correo: si lo abrieron, si te respondieron y a quién conviene escribirle
              un segundo mensaje.
            </p>
            <p>
              Como la demo no envía nada, todo lo que dice «Simulado» es inventado sólo para mostrar cómo se vería. No
              es un resultado ni una predicción.
            </p>
          </>
        }
      />

      <div className="mb-6">
        <Aviso tipo="simulado">
          Tablero simulado. Ningún correo se envió; los estados «enviado», «abrió» y «respondió» son inventados.
        </Aviso>
      </div>

      {aprobados.length === 0 ? (
        <Aviso tipo="info">
          Aún no hay correos aprobados. Apruébalos en{" "}
          <Link href="/redactar" className="font-semibold text-teal-800 underline">
            Redactar
          </Link>{" "}
          o carga el recorrido de ejemplo desde el{" "}
          <Link href="/" className="font-semibold text-teal-800 underline">
            inicio
          </Link>
          .
        </Aviso>
      ) : (
        <>
          <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Cifra titulo="Aprobados" valor={aprobados.length} />
            <Cifra titulo="«Enviados»" valor={cuenta((f) => f.enviado)} simulado />
            <Cifra titulo="«Abrieron»" valor={cuenta((f) => f.abrio)} simulado />
            <Cifra titulo="«Respondieron»" valor={cuenta((f) => f.respondio)} simulado />
            <Cifra titulo="Segundo mensaje" valor={segundo.length} simulado />
          </dl>

          <section className="mb-8">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold">
              Necesitan segundo mensaje <Etiqueta tipo="simulado" />
            </h2>
            <p className="mb-3 text-slate-600">
              No respondieron después de {DIAS_PARA_SEGUNDO_MENSAJE} días o más. Un segundo mensaje corto y amable
              suele ser la regla en prospección.
            </p>
            {segundo.length ? (
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {segundo.map((f) => (
                  <li key={f.contacto.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span>
                      <span className="font-medium">{f.contacto.nombre}</span>
                      <span className="block text-sm text-slate-500">Hace {f.diasDesdeEnvio} días (simulado)</span>
                    </span>
                    <BotonProximamente texto="Preparar segundo mensaje" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">Nadie por ahora.</p>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              Por contacto <Etiqueta tipo="simulado" />
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[34rem] text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Contacto</th>
                    <th className="px-4 py-2">«Enviado»</th>
                    <th className="px-4 py-2">«Abrió»</th>
                    <th className="px-4 py-2">«Respondió»</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filas.map((f) => (
                    <tr key={f.contacto.id}>
                      <td className="px-4 py-2 font-medium">{f.contacto.nombre}</td>
                      <td className="px-4 py-2">{f.enviado ? `Hace ${f.diasDesdeEnvio} d` : "—"}</td>
                      <td className="px-4 py-2">{f.abrio ? "Sí" : "No"}</td>
                      <td className="px-4 py-2">{f.respondio ? "Sí" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-slate-500">Todos los valores de esta tabla son simulados.</p>
          </section>
        </>
      )}

      <SiguientePaso ruta="/expediente" texto="Ver el expediente" />
    </div>
  );
}

function Cifra({ titulo, valor, simulado = false }: { titulo: string; valor: number; simulado?: boolean }) {
  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        simulado ? "border-dashed border-violet-300 bg-violet-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <dt className="text-sm font-semibold text-slate-600">{titulo}</dt>
      <dd className="text-3xl font-bold">{valor}</dd>
      <dd className="mt-1">{simulado ? <Etiqueta tipo="simulado" /> : <span className="text-xs text-slate-500">Tus datos</span>}</dd>
    </div>
  );
}

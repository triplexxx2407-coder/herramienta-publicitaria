"use client";

import { BarChart3 } from "lucide-react";
import { Guardia } from "@/components/Guardia";
import { Seccion } from "@/components/campos";
import { ContenidoClaro, IconoCirculo, PanelNexora, PastillaCliente, PildoraLista } from "@/components/PanelNexora";
import { useDatos } from "@/lib/datos";
import type { EmpresaCliente } from "@/lib/tipos";
import { ETAPAS, NOMBRE_ETAPA, porcentaje, type Resultados } from "@/lib/ventas";

/** Qué enlace trae gente y cuál no, y cómo van las ventas del perfil. */
export function PantallaResultados() {
  return <Guardia titulo="Resultados">{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const r = useDatos<Resultados>("resultados", empresa.id);
  if (!r) return <div aria-label="Cargando" className="m-3 h-64 animate-pulse rounded-2xl bg-panel/60" />;

  const total = ETAPAS.reduce((suma, e) => suma + r.porEtapa[e], 0);
  const clics = r.enlaces.reduce((s, e) => s + e.clics, 0);
  const th = "px-2 py-2 text-left text-[12px] font-bold text-chat-tenue uppercase";
  const td = "px-2 py-2.5 text-[14.5px] text-chat-tinta";

  return (
    <PanelNexora
      titulo="Resultados"
      ayuda={
        <>
          <p>Aquí ves, por cada enlace de {empresa.nombre}, cuánta gente lo tocó, cuántos quedaron apuntados como interesados y cuántos llegaron a cita o compra.</p>
          <p>Con eso decides qué publicación o anuncio vale la pena repetir.</p>
        </>
      }
      pastilla={<PastillaCliente texto="Resultados" icono={<IconoCirculo><BarChart3 size={18} aria-hidden /></IconoCirculo>} />}
      etiquetaLista="Etapas"
      lista={
        <ul className="space-y-[11px]">
          {ETAPAS.map((e) => (
            <li key={e}>
              <PildoraLista titulo={NOMBRE_ETAPA[e]} detalle={`${r.porEtapa[e]} ${r.porEtapa[e] === 1 ? "persona" : "personas"}`} />
            </li>
          ))}
        </ul>
      }
      etiquetaPrincipal="Resultados"
      principal={
        <ContenidoClaro>
          <div className="mx-auto max-w-3xl space-y-4">
            <Seccion titulo="En total">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Cifra nombre="Clics en enlaces" valor={clics} />
                <Cifra nombre="Interesados" valor={total} />
                <Cifra nombre="Con cita o más" valor={r.porEtapa.cita + r.porEtapa.apartado + r.porEtapa.vendido} />
                <Cifra nombre="Vendidos" valor={r.porEtapa.vendido} />
              </dl>
            </Seccion>
            <Seccion titulo="Por enlace" detalle="Interesados = personas que apuntaste con ese enlace. Citas incluye apartados y vendidos.">
              {r.enlaces.length === 0 && r.sinEnlace.interesados === 0 ? (
                <p className="text-chat-tenue">Aún no hay datos. Crea un enlace en «Enlaces» y apunta quién llega con él.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[30rem] border-collapse">
                    <thead>
                      <tr className="border-b border-[#e6eaf0]">
                        <th className={th}>Enlace</th>
                        <th className={th}>Clics</th>
                        <th className={th}>Interesados</th>
                        <th className={th}>Citas</th>
                        <th className={th}>Vendidos</th>
                        <th className={th}>De clic a cita</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6eaf0]">
                      {r.enlaces.map((e) => (
                        <tr key={e.id}>
                          <td className={`${td} font-semibold`}>{e.nombre}</td>
                          <td className={td}>{e.clics}</td>
                          <td className={td}>{e.interesados}</td>
                          <td className={td}>{e.citas}</td>
                          <td className={td}>{e.vendidos}</td>
                          <td className={td}>{e.clics ? `${porcentaje(e.citas, e.clics)}%` : "—"}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className={`${td} text-chat-tenue`}>Sin enlace</td>
                        <td className={td}>—</td>
                        <td className={td}>{r.sinEnlace.interesados}</td>
                        <td className={td}>{r.sinEnlace.citas}</td>
                        <td className={td}>{r.sinEnlace.vendidos}</td>
                        <td className={td}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </Seccion>
          </div>
        </ContenidoClaro>
      }
    />
  );
}

function Cifra({ nombre, valor }: { nombre: string; valor: number }) {
  return (
    <div className="rounded-[8px] bg-[#f2f6fc] p-3">
      <dd className="text-[26px] leading-none font-bold text-chat-tinta">{valor}</dd>
      <dt className="mt-1 text-[12.5px] text-chat-tenue">{nombre}</dt>
    </div>
  );
}

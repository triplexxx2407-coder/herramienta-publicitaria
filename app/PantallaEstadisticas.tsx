"use client";

import { BarChart3, Eye, Heart, Link2, MessageCircle, MousePointerClick, Send, Sparkles, UserRoundCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { avisar } from "@/components/avisos";
import { Guardia } from "@/components/Guardia";
import { IconoRed } from "@/components/IconoRed";
import { BOTON, BOTON_CLARO, Cargando, Encabezado, Tarjeta, Vacio, cx } from "@/components/ui";
import { guardar, useDatos } from "@/lib/datos";
import { nombreRed } from "@/lib/redes";
import type { EmpresaCliente, Red } from "@/lib/tipos";
import { NOMBRE_TIPO, cifraCorta, porcentaje, type Estadisticas, type Totales } from "@/lib/ventas";

const RUTAS: [string, string][] = [];

const CIFRAS: { clave: keyof Totales; nombre: string; frase: string; Icono: LucideIcon; color: string }[] = [
  { clave: "vistas", nombre: "Vistas", frase: "Veces que se vieron tus videos y anuncios", Icono: Eye, color: "var(--color-vistas)" },
  { clave: "clics", nombre: "Clics", frase: "Toques en el anuncio, la publicación o el video", Icono: MousePointerClick, color: "var(--color-clics)" },
  { clave: "likes", nombre: "Likes", frase: "Me gusta recibidos", Icono: Heart, color: "var(--color-likes)" },
  { clave: "visitas", nombre: "Visitas al enlace", frase: "Personas que tocaron tu enlace de WhatsApp", Icono: Link2, color: "var(--color-visitas)" },
  { clave: "escribieron", nombre: "Escribieron", frase: "Personas que mandaron mensaje desde el enlace", Icono: UserRoundCheck, color: "var(--color-escriben)" },
  { clave: "mensajes", nombre: "Mensajes", frase: "Mensajes que llegaron en total", Icono: MessageCircle, color: "var(--color-mensajes)" },
];

export function PantallaEstadisticas() {
  return <Guardia>{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const datos = useDatos<Estadisticas>("estadisticas", empresa.id);
  const [llenando, setLlenando] = useState(false);

  async function llenar() {
    setLlenando(true);
    const r = await guardar("datos-de-prueba", { empresaId: empresa.id }, [
      ["estadisticas", empresa.id],
      ["enlaces", empresa.id],
      ["whatsapp", empresa.id],
      ...RUTAS,
    ]);
    setLlenando(false);
    avisar(r.error ?? "Listo: ya hay datos de prueba");
  }

  if (!datos) return <Cargando />;
  const t = datos.totales;
  const vacio = datos.contenidos.length === 0 && datos.enlaces.length === 0;

  return (
    <div className="entrada space-y-6">
      <Encabezado
        titulo={empresa.nombre}
        frase="Cómo van sus videos, publicaciones y anuncios en cada red, y cuánta gente llega a su WhatsApp."
        derecha={
          !vacio ? (
            <button type="button" onClick={() => void llenar()} disabled={llenando} className={BOTON_CLARO}>
              <Sparkles size={16} aria-hidden /> {llenando ? "Llenando…" : "Rehacer datos de prueba"}
            </button>
          ) : null
        }
      />

      {vacio ? (
        <Vacio
          icono={<BarChart3 size={26} aria-hidden />}
          titulo="Todavía no hay nada que medir"
          texto="Para ver cómo se vería, llena este perfil con datos de prueba. O empieza de verdad: crea un enlace de WhatsApp y agrega tus videos y anuncios."
        >
          <button type="button" onClick={() => void llenar()} disabled={llenando} className={BOTON}>
            <Sparkles size={17} aria-hidden /> {llenando ? "Llenando…" : "Llenar con datos de prueba"}
          </button>
          <Link href="/enlaces" className={BOTON_CLARO}>
            Crear un enlace
          </Link>
        </Vacio>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {CIFRAS.map(({ clave, nombre, frase, Icono, color }) => (
              <div key={clave} className="rounded-2xl border border-linea bg-tarjeta p-4 shadow-tarjeta">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-suave">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}>
                    <Icono size={16} aria-hidden />
                  </span>
                  {nombre}
                </div>
                <p className="cifras mt-2 text-[30px] leading-none font-extrabold text-tinta sm:text-[34px]">{cifraCorta(t[clave])}</p>
                <p className="mt-2 hidden text-[12.5px] leading-snug text-suave sm:block">{frase}</p>
              </div>
            ))}
          </div>

          <Embudo t={t} />

          <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            <PorRed datos={datos} />
            <Mejores datos={datos} />
          </div>
        </>
      )}
    </div>
  );
}

/** El camino de la gente: de ver el video a escribir por WhatsApp. */
function Embudo({ t }: { t: Totales }) {
  const pasos = [
    { nombre: "Vieron", n: t.vistas, color: "var(--color-vistas)" },
    { nombre: "Tocaron el anuncio", n: t.clics, color: "var(--color-clics)" },
    { nombre: "Visitaron el enlace", n: t.visitas, color: "var(--color-visitas)" },
    { nombre: "Escribieron", n: t.escribieron, color: "var(--color-escriben)" },
  ];
  const mayor = Math.max(1, ...pasos.map((p) => p.n));
  return (
    <Tarjeta titulo="Del video al mensaje" detalle="Cuánta gente se queda en cada paso del camino.">
      <ul className="space-y-3">
        {pasos.map((p, i) => (
          <li key={p.nombre}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-semibold text-tinta-2">{p.nombre}</span>
              <span className="cifras text-suave">
                <b className="text-tinta">{p.n.toLocaleString("es-MX")}</b>
                {i > 0 && pasos[i - 1].n > 0 ? ` · ${porcentaje(p.n, pasos[i - 1].n)}% del paso anterior` : ""}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-relleno">
              <div className="h-full rounded-full" style={{ width: `${Math.max(p.n ? 2 : 0, (p.n / mayor) * 100)}%`, background: p.color }} />
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

function PorRed({ datos }: { datos: Estadisticas }) {
  const mayor = Math.max(1, ...datos.porRed.map((r) => r.vistas));
  return (
    <Tarjeta titulo="Por red social" detalle="Vistas, clics y likes de cada una.">
      {datos.porRed.length === 0 ? (
        <p className="text-sm text-suave">Agrega videos o anuncios para ver cada red.</p>
      ) : (
        <ul className="space-y-4">
          {datos.porRed.map((r) => (
            <li key={r.red || "sin"}>
              <div className="flex items-center gap-2 text-[14.5px] font-bold text-tinta">
                {r.red ? <IconoRed red={r.red as Red} tamano={17} /> : null}
                {r.red ? nombreRed(r.red as Red) : "Sin red"}
                <span className="cifras ml-auto text-[13px] font-semibold text-suave">{cifraCorta(r.vistas)} vistas</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-relleno">
                <div className="h-full rounded-full bg-vistas" style={{ width: `${Math.max(r.vistas ? 2 : 0, (r.vistas / mayor) * 100)}%` }} />
              </div>
              <p className="cifras mt-1.5 text-[13px] text-suave">
                {cifraCorta(r.clics)} clics · {cifraCorta(r.likes)} likes · {cifraCorta(r.visitas)} visitas al enlace · {cifraCorta(r.escribieron)} escribieron
              </p>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function Mejores({ datos }: { datos: Estadisticas }) {
  const lista = datos.contenidos.slice(0, 6);
  return (
    <Tarjeta
      titulo="Lo que mejor funciona"
      detalle="Tus videos y anuncios con más vistas."
      derecha={
        <Link href="/contenidos" className="text-[13.5px] font-semibold text-marca-600 hover:underline">
          Ver todos
        </Link>
      }
    >
      {lista.length === 0 ? (
        <p className="text-sm text-suave">Todavía no hay videos ni anuncios.</p>
      ) : (
        <ol className="divide-y divide-linea">
          {lista.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold", i === 0 ? "bg-marca-600 text-white" : "bg-relleno text-suave")}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-tinta">{c.titulo}</p>
                <p className="flex items-center gap-1.5 text-[12.5px] text-suave">
                  {c.red ? <IconoRed red={c.red as Red} tamano={13} /> : null}
                  {NOMBRE_TIPO[c.tipo]}
                  {c.enlace ? ` · ${c.escribieron} escribieron` : ""}
                </p>
              </div>
              <div className="cifras text-right text-[13px] text-suave">
                <b className="block text-[15px] text-tinta">{cifraCorta(c.vistas)}</b>vistas
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-suave">
        <Send size={13} aria-hidden /> Las vistas, clics y likes se anotan a mano desde cada red.
      </p>
    </Tarjeta>
  );
}

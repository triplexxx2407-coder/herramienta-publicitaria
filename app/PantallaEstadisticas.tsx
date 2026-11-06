"use client";

import { BarChart3, CalendarCheck, Link2, Sparkles, Trophy, UserRoundCheck, UserRoundPlus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { Guardia } from "@/components/Guardia";
import { BOTON, BOTON_CLARO, CAMPO, Cargando, Encabezado, Tarjeta, Vacio, cx } from "@/components/ui";
import { guardar, useDatos } from "@/lib/datos";
import type { EmpresaCliente } from "@/lib/tipos";
import { porcentaje, type Estadisticas, type Totales } from "@/lib/ventas";

const CIFRAS: { clave: keyof Totales; nombre: string; frase: string; Icono: LucideIcon; color: string }[] = [
  { clave: "visitas", nombre: "Tocaron el enlace", frase: "Personas que abrieron tu enlace de WhatsApp", Icono: Link2, color: "var(--color-visitas)" },
  { clave: "escribieron", nombre: "Escribieron", frase: "Personas que te mandaron mensaje", Icono: UserRoundCheck, color: "var(--color-escriben)" },
  { clave: "citas", nombre: "Citas", frase: "Llegaron a una cita o más", Icono: CalendarCheck, color: "var(--color-clics)" },
  { clave: "ventas", nombre: "Ventas", frase: "Compraron", Icono: Trophy, color: "var(--color-vistas)" },
];

/** Qué publicación, anuncio o letrero está trayendo clientes. */
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
      ["contactos", empresa.id],
      ["whatsapp", empresa.id],
    ]);
    setLlenando(false);
    avisar(r.error ?? "Listo: ya hay datos de prueba");
  }

  if (!datos) return <Cargando />;
  const t = datos.totales;
  const vacio = datos.enlaces.length === 0;

  return (
    <div className="entrada space-y-6">
      <Encabezado
        titulo={empresa.nombre}
        frase="Qué video, anuncio o letrero trae gente a tu WhatsApp, y cuál termina en venta."
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
          texto="Crea un enlace de WhatsApp por cada video, anuncio o letrero. O llena este perfil con datos de prueba para ver cómo se vería."
        >
          <Link href="/enlaces" className={BOTON}>
            Crear un enlace
          </Link>
          <button type="button" onClick={() => void llenar()} disabled={llenando} className={BOTON_CLARO}>
            <Sparkles size={17} aria-hidden /> {llenando ? "Llenando…" : "Llenar con datos de prueba"}
          </button>
        </Vacio>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CIFRAS.map(({ clave, nombre, frase, Icono, color }) => (
              <div key={clave} className="rounded-2xl border border-linea bg-tarjeta p-4 shadow-tarjeta">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-suave">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}>
                    <Icono size={16} aria-hidden />
                  </span>
                  {nombre}
                </div>
                <p className="cifras mt-2 text-[32px] leading-none font-extrabold text-tinta">{t[clave].toLocaleString("es-MX")}</p>
                <p className="mt-2 hidden text-[12.5px] leading-snug text-suave sm:block">{frase}</p>
              </div>
            ))}
          </div>

          <ApuntarRapido empresaId={empresa.id} enlaces={datos.enlaces} />
          <Embudo t={t} />
          <Ranking datos={datos} />
        </>
      )}
    </div>
  );
}

function Embudo({ t }: { t: Totales }) {
  const pasos = [
    { nombre: "Tocaron el enlace", n: t.visitas, color: "var(--color-visitas)" },
    { nombre: "Escribieron", n: t.escribieron, color: "var(--color-escriben)" },
    { nombre: "Llegaron a cita", n: t.citas, color: "var(--color-clics)" },
    { nombre: "Compraron", n: t.ventas, color: "var(--color-vistas)" },
  ];
  const mayor = Math.max(1, ...pasos.map((p) => p.n));
  return (
    <Tarjeta titulo="Del enlace a la venta" detalle="Cuánta gente se queda en cada paso.">
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

function Ranking({ datos }: { datos: Estadisticas }) {
  return (
    <Tarjeta
      titulo="Qué publicación vende más"
      detalle="Cada enlace es un video, anuncio o letrero. Arriba, el que mejor resultado da."
      derecha={
        <Link href="/enlaces" className="text-[13.5px] font-semibold text-marca-600 hover:underline">
          Ver enlaces
        </Link>
      }
    >
      <ol className="divide-y divide-linea">
        {datos.enlaces.map((e, i) => (
          <li key={e.id} className="flex items-center gap-3 py-3">
            <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold", i === 0 ? "bg-marca-600 text-white" : "bg-relleno text-suave")}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] leading-snug font-semibold text-tinta">{e.nombre}</p>
              <p className="cifras text-[12.5px] text-suave">
                {e.visitas} visitas · {porcentaje(e.escribieron, e.visitas)}% escribió
              </p>
            </div>
            <div className="cifras grid shrink-0 grid-cols-3 gap-3 text-center text-[12px] text-suave">
              {[
                ["Escribió", e.escribieron],
                ["Citas", e.citas],
                ["Ventas", e.ventas],
              ].map(([nombre, n]) => (
                <div key={nombre}>
                  <b className="block text-[16px] text-tinta">{n}</b>
                  <span>{nombre}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Tarjeta>
  );
}

/** Apuntar rápido que alguien escribió: se elige el enlace por el código que viene en su mensaje. */
function ApuntarRapido({ empresaId, enlaces }: { empresaId: string; enlaces: Estadisticas["enlaces"] }) {
  const [elegido, setElegido] = useState("");
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const enlaceId = enlaces.some((e) => e.id === elegido) ? elegido : (enlaces[0]?.id ?? "");

  async function apuntar(ev: FormEvent) {
    ev.preventDefault();
    if (!enlaceId || ocupado) return;
    setOcupado(true);
    const r = await guardar("contactos", { empresaId, enlaceId, nota: nota.trim() }, [
      ["estadisticas", empresaId],
      ["enlaces", empresaId],
      ["contactos", empresaId],
    ]);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar("Apuntado: alguien escribió");
      setNota("");
    }
  }

  return (
    <Tarjeta titulo="Te escribieron" detalle="Mira el código «(ref …)» al final del mensaje, elige ese enlace y toca el botón.">
      <form onSubmit={apuntar} className="flex flex-wrap gap-2">
        <select value={enlaceId} onChange={(e) => setElegido(e.target.value)} aria-label="Enlace" className={`${CAMPO} mt-0 min-w-0 flex-1 basis-56`}>
          {enlaces.map((e) => (
            <option key={e.id} value={e.id}>
              {e.ref} · {e.nombre}
            </option>
          ))}
        </select>
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={120} placeholder="Nombre (opcional)" className={`${CAMPO} mt-0 min-w-0 flex-1 basis-40`} />
        <button type="submit" disabled={ocupado || !enlaceId} className={BOTON}>
          <UserRoundPlus size={17} aria-hidden /> Me escribió
        </button>
      </form>
    </Tarjeta>
  );
}

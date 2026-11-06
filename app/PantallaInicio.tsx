"use client";

import { ArrowRight, BarChart3, CalendarDays, Check, Link2, MessageCircle, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { diaCorto } from "@/components/campos";
import { Guardia } from "@/components/Guardia";
import { HojaBlanca } from "@/components/PanelNexora";
import { useDatos } from "@/lib/datos";
import type { EmpresaCliente } from "@/lib/tipos";
import { NOMBRE_ETAPA, direccionWhatsApp, hoyISO, telefonoValido, type Enlace, type Interesado, type Publicacion, type Resultados } from "@/lib/ventas";

/** La pantalla de inicio: qué hacer ahora con el perfil que estás viendo, paso por paso. */
export function PantallaInicio() {
  return <Guardia titulo="Inicio">{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const gente = useDatos<{ interesados: Interesado[] }>("interesados", empresa.id)?.interesados;
  const enlaces = useDatos<{ enlaces: Enlace[] }>("enlaces", empresa.id)?.enlaces;
  const publicaciones = useDatos<{ publicaciones: Publicacion[] }>("publicaciones", empresa.id)?.publicaciones;
  const resultados = useDatos<Resultados>("resultados", empresa.id);

  if (!gente || !enlaces || !publicaciones || !resultados) {
    return <div aria-label="Cargando" className="m-3 h-64 animate-pulse rounded-2xl bg-panel/60" />;
  }

  const hoy = hoyISO();
  const clics = enlaces.reduce((s, e) => s + e.clics, 0);
  const abiertos = gente.filter((i) => i.etapa !== "vendido" && i.etapa !== "perdido");
  const tocaHoy = abiertos.filter((i) => !!i.siguiente && i.siguiente <= hoy);
  const vendidos = resultados.porEtapa.vendido;

  const pasos: { Icono: LucideIcon; titulo: string; texto: string; hecho: boolean; ruta: string; boton: string }[] = [
    {
      Icono: Link2,
      titulo: "Crea un enlace de WhatsApp",
      texto: "Uno por cada video, foto o anuncio. Abre el WhatsApp de la empresa con el mensaje ya escrito y cuenta quién lo toca.",
      hecho: enlaces.length > 0,
      ruta: "/enlaces",
      boton: enlaces.length ? "Ver mis enlaces" : "Crear mi primer enlace",
    },
    {
      Icono: CalendarDays,
      titulo: "Planea qué vas a publicar",
      texto: "Apunta qué subes, en qué red y qué día, con el texto listo para copiar. Tú lo subes desde la app de la red.",
      hecho: publicaciones.length > 0,
      ruta: "/calendario",
      boton: publicaciones.length ? "Ver mis publicaciones" : "Planear mi primera publicación",
    },
    {
      Icono: Users,
      titulo: "Apunta a quien se interese",
      texto: "Cuando alguien te escriba, anótalo con su etapa y cuándo darle seguimiento. Así no se te enfría nadie.",
      hecho: gente.length > 0,
      ruta: "/interesados",
      boton: gente.length ? "Ver a mi gente" : "Apuntar a mi primer interesado",
    },
    {
      Icono: BarChart3,
      titulo: "Mira qué funciona",
      texto: "Verás qué enlace trae más gente y cuántos llegan a cita o compra, para repetir lo bueno.",
      hecho: clics > 0,
      ruta: "/resultados",
      boton: "Ver resultados",
    },
  ];
  const siguiente = pasos.findIndex((p) => !p.hecho);

  return (
    <div className="fondo-platica min-h-[calc(100dvh-8rem)] px-3 py-5 text-chat-tinta sm:px-5 lg:rounded-2xl lg:px-8 lg:py-7 lg:shadow-tarjeta">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <p className="text-sm font-semibold text-chat-tenue">Estás trabajando con</p>
          <h1 className="text-[26px] leading-tight font-bold text-chat-tinta">{empresa.nombre}</h1>
          <p className="mt-1 text-chat-tenue">
            {siguiente === -1 ? "Todo está en marcha. Esto es lo de hoy:" : "Sigue estos pasos en orden. Los que ya hiciste se marcan solos."}
          </p>
        </header>

        {tocaHoy.length > 0 ? (
          <HojaBlanca className="border-l-4 border-proyecto p-4">
            <h2 className="text-[17px] font-bold">Hoy te toca dar seguimiento ({tocaHoy.length})</h2>
            <ul className="mt-2 divide-y divide-[#e6eaf0]">
              {tocaHoy.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{i.nombre}</span>
                    <span className="block text-sm text-chat-tenue">
                      {NOMBRE_ETAPA[i.etapa]} · {i.siguiente && i.siguiente < hoy ? `era para el ${diaCorto(i.siguiente)}` : "para hoy"}
                    </span>
                  </span>
                  {telefonoValido(i.telefono) ? (
                    <a
                      href={direccionWhatsApp(i.telefono, "")}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#25d366] px-3.5 text-[14px] font-bold text-black"
                    >
                      <MessageCircle size={16} aria-hidden /> WhatsApp
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
            <Link href="/interesados" className="mt-3 inline-flex items-center gap-1 text-[14px] font-bold text-marca-600">
              Ir a mi gente <ArrowRight size={15} aria-hidden />
            </Link>
          </HojaBlanca>
        ) : null}

        <ol className="space-y-3">
          {pasos.map((p, n) => {
            const toca = n === siguiente;
            return (
              <li key={p.ruta}>
                <HojaBlanca className={`p-4 sm:p-5 ${toca ? "ring-2 ring-marca-600" : ""}`}>
                  <div className="flex items-start gap-3.5">
                    <span
                      aria-hidden
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${p.hecho ? "bg-[#dff0e4] text-[#1c6b3f]" : toca ? "bg-marca-600 text-white" : "bg-[#eef1f6] text-chat-tenue"}`}
                    >
                      {p.hecho ? <Check size={20} /> : n + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="flex items-center gap-2 text-[17px] font-bold">
                        <p.Icono size={17} aria-hidden className="text-marca-600" /> {p.titulo}
                        {p.hecho ? <span className="rounded-full bg-[#dff0e4] px-2 py-0.5 text-[11.5px] font-bold text-[#1c6b3f]">Hecho</span> : null}
                      </h2>
                      <p className="mt-1 text-[15px] leading-snug text-chat-tenue">{p.texto}</p>
                      <Link
                        href={p.ruta}
                        className={`mt-3 inline-flex h-11 items-center gap-2 rounded-[6px] px-5 text-[15px] font-bold ${toca ? "bg-marca-600 text-white hover:bg-marca-700" : "border border-[#cfd6e0] bg-white text-chat-tinta hover:bg-[#f2f6fc]"}`}
                      >
                        {p.boton} <ArrowRight size={16} aria-hidden />
                      </Link>
                    </div>
                  </div>
                </HojaBlanca>
              </li>
            );
          })}
        </ol>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Cifra nombre="Clics en tus enlaces" valor={clics} />
          <Cifra nombre="Personas apuntadas" valor={gente.length} />
          <Cifra nombre="Siguen en juego" valor={abiertos.length} />
          <Cifra nombre="Vendidos" valor={vendidos} />
        </dl>
      </div>
    </div>
  );
}

function Cifra({ nombre, valor }: { nombre: string; valor: number }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.14)]">
      <dd className="text-[26px] leading-none font-bold">{valor}</dd>
      <dt className="mt-1 text-[12.5px] text-chat-tenue">{nombre}</dt>
    </div>
  );
}

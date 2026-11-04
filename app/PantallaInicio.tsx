"use client";

import {
  ArrowRight,
  ChartColumn,
  Check,
  ChevronRight,
  Lock,
  MapPin,
  Pencil,
  PenLine,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { avisar } from "@/components/avisos";
import { AyudaPlegable, Boton, BotonEnlace, Cargando, Insignia, Tarjeta, cx } from "@/components/ui";
import { abrirMiDesarrollo } from "@/components/ventanas";
import { reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { contactosParaRedactar } from "@/lib/contactos";
import { AJUSTES_EJEMPLO, estadoDeRecorrido, estadoInicial } from "@/lib/estado";

interface Paso {
  ruta: string;
  icono: LucideIcon;
  titulo: string;
  detalle: string;
  hecho?: boolean;
  etiqueta?: string;
}

/** Lo que conviene hacer ahora, según lo que ya hiciste. */
function loQueSigue(elegidos: number, aprobados: number) {
  if (elegidos === 0) return { numero: 2, titulo: "Elegir contactos", texto: "Marca a quién quieres escribirle.", ruta: "/contactos" };
  if (aprobados < elegidos) {
    const faltan = elegidos - aprobados;
    return {
      numero: 3,
      titulo: "Redactar",
      texto: faltan === 1 ? "Te falta aprobar 1 correo." : `Te faltan ${faltan} correos por aprobar.`,
      ruta: "/redactar",
    };
  }
  return { numero: 4, titulo: "Envío", texto: "Tus correos están listos. Mira cómo saldrían.", ruta: "/envio" };
}

export function PantallaInicio() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [confirmar, setConfirmar] = useState(false);
  if (!enNavegador) return <Cargando />;

  const { ajustes } = estado;
  const elegidos = contactosParaRedactar(estado);
  const aprobados = elegidos.filter((c) => estado.borradores[c.id]?.estado === "aprobado").length;
  const enLista = estado.contactos.length;
  const portada = ajustes.fotos[0]?.url ?? AJUSTES_EJEMPLO.fotos[0]?.url;
  const sigue = loQueSigue(elegidos.length, aprobados);

  function llenarConEjemplo() {
    const nuevo = estadoDeRecorrido();
    reiniciarEstado(nuevo);
    setConfirmar(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    avisar(`Listo: ${nuevo.contactos.length} negocios de ejemplo`);
  }

  const pasos: Paso[] = [
    {
      ruta: "/buscar",
      icono: Search,
      titulo: "Buscar empresas",
      detalle: enLista ? `${enLista} en tu lista` : "Negocios por tipo y ciudad",
      hecho: enLista > 0,
    },
    {
      ruta: "/contactos",
      icono: Users,
      titulo: "Elegir contactos",
      detalle: elegidos.length ? `${elegidos.length} elegidos` : "A quién escribirle",
      hecho: elegidos.length > 0,
    },
    {
      ruta: "/redactar",
      icono: PenLine,
      titulo: "Redactar",
      detalle: elegidos.length ? `${aprobados} de ${elegidos.length} aprobados` : "Un correo para cada uno",
      hecho: elegidos.length > 0 && aprobados === elegidos.length,
    },
    { ruta: "/envio", icono: Send, titulo: "Envío", detalle: "Así saldrían, poco a poco", etiqueta: "Simulación" },
    { ruta: "/seguimiento", icono: ChartColumn, titulo: "Seguimiento", detalle: "Quién abrió y respondió", etiqueta: "Simulado" },
    {
      ruta: "/expediente",
      icono: ShieldCheck,
      titulo: "Expediente",
      detalle: enLista ? `${enLista} documentados` : "De dónde salió cada uno",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
      <div className="space-y-5">
        {/* Portada del desarrollo */}
        <section className="entrada relative overflow-hidden rounded-[28px] bg-tinta text-white shadow-tarjeta">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada} alt="Imagen de ejemplo del desarrollo" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-tinta from-15% via-tinta/60 via-50% to-tinta/0" />
          <div className="relative flex min-h-[20rem] flex-col p-5 sm:min-h-[24rem] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Insignia tipo="ejemplo" claro />
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] leading-4 font-bold tracking-wide uppercase backdrop-blur">
                  Preventa
                </span>
              </div>
              <Boton variante="claro" tamano="sm" icono={<Pencil size={15} aria-hidden />} onClick={abrirMiDesarrollo}>
                Editar
              </Boton>
            </div>
            <div className="mt-auto space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/70">Mi desarrollo</p>
                <h1 className="font-display text-[2rem] leading-[1.1] font-bold sm:text-[2.6rem]">{ajustes.nombreDesarrollo}</h1>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-white/85">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={16} aria-hidden /> {ajustes.ciudad}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={16} aria-hidden /> Desde {ajustes.precioDesde}
                  </span>
                </p>
              </div>
              {enLista > 0 ? (
                <dl className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      ["En tu lista", enLista],
                      ["Elegidos", elegidos.length],
                      ["Aprobados", aprobados],
                    ] as const
                  ).map(([titulo, valor]) => (
                    <div key={titulo} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md">
                      <dt className="text-xs font-semibold text-white/70">{titulo}</dt>
                      <dd className="text-2xl font-bold sm:text-[1.7rem]">{valor}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </section>

        {/* Qué hacer ahora: un solo botón grande */}
        <Tarjeta className="entrada p-5 sm:p-6">
          {enLista === 0 ? (
            <>
              <h2 className="font-display text-xl font-bold">¿Cómo empiezo?</h2>
              <p className="mt-1 text-suave">Busca negocios, elige a quién escribirle y revisa los correos. Nada se envía.</p>
              <BotonEnlace href="/buscar" tamano="lg" className="mt-5 w-full sm:w-auto" icono={<Search size={19} aria-hidden />}>
                Empezar
              </BotonEnlace>
              <button
                type="button"
                onClick={llenarConEjemplo}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 py-2 text-[15px] font-semibold text-marca-700 hover:underline sm:ml-4 sm:w-auto"
              >
                <Sparkles size={16} aria-hidden /> O mira un ejemplo ya lleno
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold tracking-[0.14em] text-marca-600 uppercase">Lo que sigue · Paso {sigue.numero}</p>
              <h2 className="mt-0.5 font-display text-xl font-bold">{sigue.titulo}</h2>
              <p className="mt-1 text-suave">{sigue.texto}</p>
              <BotonEnlace href={sigue.ruta} tamano="lg" className="mt-5 w-full sm:w-auto" icono={<ArrowRight size={19} aria-hidden />}>
                Continuar
              </BotonEnlace>
            </>
          )}
        </Tarjeta>

        {/* Los pasos */}
        <Tarjeta className="entrada overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 font-display text-lg font-bold sm:px-5">Los 6 pasos</h2>
          <ol className="divide-y divide-linea">
            {pasos.map((p, i) => {
              const Icono = p.hecho ? Check : p.icono;
              return (
                <li key={p.ruta}>
                  <Link href={p.ruta} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-fondo sm:px-5">
                    <span
                      className={cx(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        p.hecho ? "bg-verde-50 text-verde-700" : "bg-marca-50 text-marca-600",
                      )}
                    >
                      <Icono size={20} aria-hidden strokeWidth={p.hecho ? 2.6 : 2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-tinta">
                        {i + 1}. {p.titulo}
                      </span>
                      <span className="block truncate text-sm text-suave">{p.detalle}</span>
                    </span>
                    {p.etiqueta ? <Insignia tipo="simulado">{p.etiqueta}</Insignia> : null}
                    <ChevronRight size={18} aria-hidden className="shrink-0 text-tenue" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </Tarjeta>
      </div>

      <div className="space-y-5">
        <Tarjeta className="entrada p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-tinta text-white">
              <Lock size={18} aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-lg leading-tight font-bold">Es una demo</h2>
              <p className="text-sm text-suave">Nada se envía y los negocios son inventados.</p>
            </div>
          </div>
          {enLista > 0 ? (
            <div className="mt-4 flex flex-col gap-2">
              {confirmar ? (
                <div className="rounded-2xl bg-rojo-50 p-3">
                  <p className="text-sm font-semibold text-rojo-700">¿Borrar todo lo que hiciste?</p>
                  <div className="mt-2 flex gap-2">
                    <Boton
                      variante="peligro"
                      tamano="sm"
                      onClick={() => {
                        reiniciarEstado(estadoInicial());
                        setConfirmar(false);
                        avisar("Listo: la demo quedó vacía");
                      }}
                    >
                      Sí, borrar
                    </Boton>
                    <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmar(false)}>
                      Cancelar
                    </Boton>
                  </div>
                </div>
              ) : (
                <>
                  <Boton variante="secundario" onClick={llenarConEjemplo} icono={<Sparkles size={17} aria-hidden />}>
                    Volver a llenar con el ejemplo
                  </Boton>
                  <Boton variante="fantasma" onClick={() => setConfirmar(true)} icono={<RotateCcw size={17} aria-hidden />}>
                    Borrar todo
                  </Boton>
                </>
              )}
            </div>
          ) : null}
        </Tarjeta>

        <AyudaPlegable>
          <p>Esta app te ayuda a encontrar negocios, escribirle un correo personal a cada uno y ver quién responde.</p>
          <p>Es una demostración: ningún correo sale de aquí y lo que hagas se queda sólo en este navegador.</p>
        </AyudaPlegable>
      </div>
    </div>
  );
}

"use client";

import { Check, ChevronDown, Database, Globe, LayoutGrid, Mail, MailX, MapPin, Phone, Plus, SearchX, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { avisar } from "@/components/avisos";
import { IconoGiro, iconoDeGiro } from "@/components/IconoGiro";
import { Boton, BotonEnlace, Encabezado, Ficha, Insignia, Segmentado, Tarjeta, cx } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { CIUDADES, GIROS, NOMBRE_ESTRATO, TAMANOS, nombreCiudad, nombreGiro } from "@/lib/catalogos";
import { agregarContactos, contactoDesdeEmpresa } from "@/lib/contactos";
import { consultarEmpresas, type FiltrosPantalla } from "@/lib/datos/consultar-empresas";
import type { ResultadoBusqueda } from "@/lib/datos/obtener-buscador";
import type { Empresa } from "@/lib/tipos";

const FILTROS_INICIALES: FiltrosPantalla = { giro: "", ciudad: "tijuana", tamano: "" };

export function PantallaBuscar() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [filtros, setFiltros] = useState<FiltrosPantalla>(FILTROS_INICIALES);
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const [buscando, setBuscando] = useState(true);
  const [error, setError] = useState("");
  const turno = useRef(0);

  function buscar(f: FiltrosPantalla) {
    setFiltros(f);
    const mio = ++turno.current;
    setBuscando(true);
    setError("");
    consultarEmpresas(f)
      .then((r) => mio === turno.current && setResultado(r))
      .catch(() => mio === turno.current && setError("No se pudo hacer la búsqueda. Intenta de nuevo."))
      .finally(() => mio === turno.current && setBuscando(false));
  }

  useEffect(() => {
    let vigente = true;
    consultarEmpresas(FILTROS_INICIALES)
      .then((r) => vigente && setResultado(r))
      .catch(() => vigente && setError("No se pudo hacer la búsqueda. Intenta de nuevo."))
      .finally(() => vigente && setBuscando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const enLista = new Set(enNavegador ? estado.contactos.map((c) => c.id) : []);
  const esEjemplo = resultado?.fuente.esEjemplo ?? true;
  const empresas = resultado?.empresas ?? [];
  const nuevas = empresas.filter((e) => !enLista.has(e.id));
  const total = enNavegador ? estado.contactos.length : 0;

  function agregar(lista: Empresa[]) {
    if (!resultado || !lista.length) return;
    actualizarEstado((e) =>
      agregarContactos(
        e,
        lista.map((emp) => contactoDesdeEmpresa(emp, resultado.fuente.nombre, resultado.fuente.esEjemplo)),
      ),
    );
    avisar(lista.length === 1 ? "Agregado a tu lista" : `${lista.length} agregados a tu lista`);
  }

  return (
    <div>
      <Encabezado
        paso={1}
        titulo="Buscar empresas"
        subtitulo="Negocios de un directorio público, por giro, ciudad y tamaño."
        acciones={
          total > 0 ? (
            <BotonEnlace href="/contactos" icono={<Users size={18} aria-hidden />}>
              Ver mi lista ({total})
            </BotonEnlace>
          ) : null
        }
        ayuda={
          <>
            <p>Buscas negocios por giro, ciudad y tamaño, y agregas a tu lista los que te interesen.</p>
            <p>
              En la versión real vendrán del DENUE de INEGI, el directorio oficial de negocios de México. Hoy son negocios
              inventados.
            </p>
          </>
        }
      />

      {esEjemplo ? (
        <div className="entrada mb-4 flex items-start gap-3 rounded-2xl border border-dashed border-marca-200 bg-marca-50/70 px-4 py-3 text-[15px] text-marca-900">
          <Database size={19} aria-hidden className="mt-0.5 shrink-0 text-marca-600" />
          <p>Datos de ejemplo. Aquí se conectará el directorio DENUE de INEGI.</p>
        </div>
      ) : null}
      {resultado?.aviso ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
          {resultado.aviso}
        </p>
      ) : null}

      {/* Filtros */}
      <Tarjeta className="entrada mb-5 space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-tinta-2">Ciudad o municipio</span>
            <span className="relative block">
              <MapPin size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-marca-600" />
              <select
                value={filtros.ciudad}
                onChange={(e) => buscar({ ...filtros, ciudad: e.target.value })}
                className="h-12 w-full appearance-none rounded-xl border border-linea bg-white pr-10 pl-10 text-[15px] font-semibold text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-100"
              >
                <option value="">Todas las ciudades</option>
                {CIUDADES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}, {c.estado}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-tenue" />
            </span>
          </label>
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-tinta-2">Tamaño aproximado</span>
            <Segmentado
              etiqueta="Tamaño aproximado"
              valor={filtros.tamano}
              onChange={(v) => buscar({ ...filtros, tamano: v })}
              opciones={[
                { valor: "", texto: "Todos" },
                ...TAMANOS.map((t) => ({ valor: t.id as string, texto: t.nombre.split(" (")[0] })),
              ]}
            />
          </div>
        </div>
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-tinta-2">Giro</span>
          <div role="group" aria-label="Giro" className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 md:flex-wrap md:overflow-visible">
            {[{ id: "", nombre: "Todos" }, ...GIROS].map((g) => {
              const activo = filtros.giro === g.id;
              const Icono = g.id ? iconoDeGiro(g.id) : LayoutGrid;
              return (
                <button
                  key={g.id || "todos"}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => buscar({ ...filtros, giro: g.id })}
                  className={cx(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                    activo
                      ? "border-tinta bg-tinta text-white"
                      : "border-linea bg-white text-tinta-2 hover:border-tenue/60",
                  )}
                >
                  <Icono size={16} aria-hidden />
                  {g.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </Tarjeta>

      {error ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-suave">
          {buscando ? (
            "Buscando…"
          ) : (
            <>
              <span className="cifras font-display text-xl font-bold text-tinta">{empresas.length}</span>{" "}
              {empresas.length === 1 ? "negocio encontrado" : "negocios encontrados"}
            </>
          )}
        </p>
        {enNavegador && nuevas.length > 1 && !buscando ? (
          <Boton variante="secundario" tamano="sm" icono={<Plus size={16} aria-hidden />} onClick={() => agregar(nuevas)}>
            Agregar todos ({nuevas.length})
          </Boton>
        ) : null}
      </div>

      {!buscando && empresas.length === 0 && !error ? (
        <Tarjeta className="flex flex-col items-center px-6 py-10 text-center">
          <SearchX size={34} aria-hidden className="text-tenue" />
          <p className="mt-3 font-semibold">No hay negocios con esos filtros</p>
          <p className="text-sm text-suave">Prueba con otro giro o con «Todas las ciudades».</p>
        </Tarjeta>
      ) : null}

      <ul className={cx("grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3", buscando && "opacity-60")}>
        {empresas.map((e) => {
          const yaEsta = enLista.has(e.id);
          return (
            <li key={e.id} className="entrada">
              <Tarjeta className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <IconoGiro giro={e.giro} />
                  <div className="min-w-0 flex-1">
                    <h2 className="leading-snug font-semibold text-tinta">{e.nombre}</h2>
                    <p className="mt-0.5 text-sm text-suave">
                      {nombreGiro(e.giro)} · {nombreCiudad(e.ciudad)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!enNavegador || yaEsta}
                    onClick={() => agregar([e])}
                    aria-label={yaEsta ? `${e.nombre} ya está en tu lista` : `Agregar ${e.nombre} a mi lista`}
                    title={yaEsta ? "Ya está en tu lista" : "Agregar a mi lista"}
                    className={cx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                      yaEsta
                        ? "bg-verde-500 text-white"
                        : "border-2 border-marca-600 text-marca-600 hover:bg-marca-600 hover:text-white",
                    )}
                  >
                    {yaEsta ? <Check size={20} aria-hidden strokeWidth={2.8} /> : <Plus size={20} aria-hidden strokeWidth={2.6} />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {e.estrato ? <Ficha icono={<Users size={13} aria-hidden />}>{NOMBRE_ESTRATO[e.estrato]}</Ficha> : null}
                  {e.correo ? (
                    <Ficha tono="marca" icono={<Mail size={13} aria-hidden />}>
                      Con correo
                    </Ficha>
                  ) : (
                    <Ficha icono={<MailX size={13} aria-hidden />}>Sin correo</Ficha>
                  )}
                  {esEjemplo ? <Insignia tipo="ejemplo" /> : null}
                </div>
                <ul className="mt-auto space-y-1.5 border-t border-linea pt-3 text-sm text-tinta-2">
                  <li className="flex min-w-0 items-center gap-2">
                    <Mail size={15} aria-hidden className="shrink-0 text-tenue" />
                    <span className={cx("truncate", !e.correo && "text-tenue")}>{e.correo ?? "No tiene correo"}</span>
                  </li>
                  <li className="flex min-w-0 items-center gap-2">
                    <Phone size={15} aria-hidden className="shrink-0 text-tenue" />
                    <span className="cifras truncate">{e.telefono ?? "Sin teléfono"}</span>
                  </li>
                  <li className="flex min-w-0 items-center gap-2">
                    <Globe size={15} aria-hidden className="shrink-0 text-tenue" />
                    <span className={cx("truncate", !e.sitioWeb && "text-tenue")}>
                      {e.sitioWeb ? e.sitioWeb.replace(/^https?:\/\//, "") : "No tiene sitio web"}
                    </span>
                  </li>
                </ul>
              </Tarjeta>
            </li>
          );
        })}
      </ul>

      {total > 0 ? (
        <div className="mt-6 flex justify-end">
          <BotonEnlace href="/contactos" tamano="lg">
            Siguiente: elegir contactos
          </BotonEnlace>
        </div>
      ) : null}
    </div>
  );
}

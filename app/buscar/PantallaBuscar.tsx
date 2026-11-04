"use client";

import { ArrowRight, Check, ChevronDown, Database, LayoutGrid, Mail, MailX, MapPin, Plus, SearchX, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { avisar } from "@/components/avisos";
import { IconoGiro, iconoDeGiro } from "@/components/IconoGiro";
import { BOTON_BARRA, BarraAccion, Boton, BotonEnlace, Encabezado, Ficha, Insignia, Tarjeta, cx } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { CIUDADES, GIROS, TAMANOS, nombreCiudad, nombreGiro } from "@/lib/catalogos";
import { agregarYElegir, contactoDesdeEmpresa, nombreVisible } from "@/lib/contactos";
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
      agregarYElegir(
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
        subtitulo="Toca «Agregar» en los negocios a los que quieras escribirles."
        ayuda={
          <>
            <p>Aquí encuentras negocios por ciudad y tipo, y los agregas a tu lista para escribirles.</p>
            <p>En la versión real saldrán del directorio oficial de negocios del INEGI. Hoy son negocios inventados.</p>
          </>
        }
      />

      {esEjemplo ? (
        <p className="entrada mb-4 flex items-center gap-2.5 rounded-2xl border border-dashed border-marca-200 bg-marca-50/70 px-4 py-2.5 text-sm font-medium text-marca-900">
          <Database size={17} aria-hidden className="shrink-0 text-marca-600" />
          Negocios inventados para la demo. Después vendrán del INEGI.
        </p>
      ) : null}
      {resultado?.aviso ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
          {resultado.aviso}
        </p>
      ) : null}

      {/* Filtros */}
      <Tarjeta className="entrada mb-5 space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
          <SelectConIcono
            etiqueta="Ciudad"
            icono={<MapPin size={18} aria-hidden />}
            valor={filtros.ciudad}
            onChange={(v) => buscar({ ...filtros, ciudad: v })}
          >
            <option value="">Todas las ciudades</option>
            {CIUDADES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}, {c.estado}
              </option>
            ))}
          </SelectConIcono>
          <SelectConIcono
            etiqueta="Tamaño"
            icono={<Users size={18} aria-hidden />}
            valor={filtros.tamano}
            onChange={(v) => buscar({ ...filtros, tamano: v })}
          >
            <option value="">De cualquier tamaño</option>
            {TAMANOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </SelectConIcono>
        </div>
        <div
          role="group"
          aria-label="Tipo de negocio"
          className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 md:flex-wrap md:overflow-visible"
        >
          {[{ id: "", nombre: "Todos los tipos" }, ...GIROS].map((g) => {
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
                  activo ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-tinta-2 hover:border-tenue/60",
                )}
              >
                <Icono size={16} aria-hidden />
                {g.nombre}
              </button>
            );
          })}
        </div>
      </Tarjeta>

      {error ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-suave">
          {buscando ? (
            "Buscando…"
          ) : (
            <>
              <span className="font-display text-xl font-bold text-tinta">{empresas.length}</span>{" "}
              {empresas.length === 1 ? "negocio" : "negocios"}
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
          <p className="text-sm text-suave">Prueba con otro tipo de negocio o con «Todas las ciudades».</p>
        </Tarjeta>
      ) : null}

      <ul className={cx("grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3", buscando && "opacity-60")}>
        {empresas.map((e) => (
          <li key={e.id} className="entrada">
            <TarjetaEmpresa
              empresa={e}
              esEjemplo={esEjemplo}
              yaEsta={enLista.has(e.id)}
              listo={enNavegador}
              onAgregar={() => agregar([e])}
            />
          </li>
        ))}
      </ul>

      {total > 0 ? (
        <BarraAccion nota={total === 1 ? "1 negocio en tu lista" : `${total} negocios en tu lista`}>
          <BotonEnlace href="/contactos" className={BOTON_BARRA} icono={<ArrowRight size={19} aria-hidden />}>
            Siguiente: revisar mi lista
          </BotonEnlace>
        </BarraAccion>
      ) : null}
    </div>
  );
}

function TarjetaEmpresa({
  empresa: e,
  esEjemplo,
  yaEsta,
  listo,
  onAgregar,
}: {
  empresa: Empresa;
  esEjemplo: boolean;
  yaEsta: boolean;
  listo: boolean;
  onAgregar: () => void;
}) {
  const nombre = nombreVisible(e.nombre, esEjemplo);
  return (
    <Tarjeta className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <IconoGiro giro={e.giro} />
        <div className="min-w-0 flex-1">
          <h2 className="leading-snug font-semibold text-tinta">{nombre}</h2>
          <p className="mt-0.5 text-sm text-suave">
            {nombreGiro(e.giro)} · {nombreCiudad(e.ciudad)}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {esEjemplo ? <Insignia tipo="ejemplo" /> : null}
          {e.correo ? (
            <Ficha tono="marca" icono={<Mail size={13} aria-hidden />}>
              Tiene correo
            </Ficha>
          ) : (
            <Ficha icono={<MailX size={13} aria-hidden />}>Sin correo</Ficha>
          )}
        </p>
        <button
          type="button"
          disabled={!listo || yaEsta}
          onClick={onAgregar}
          aria-label={yaEsta ? `${nombre} ya está en tu lista` : `Agregar ${nombre} a mi lista`}
          className={cx(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors",
            yaEsta
              ? "bg-verde-50 text-verde-700"
              : "bg-marca-600 text-white shadow-sm shadow-marca-600/30 hover:bg-marca-700 disabled:opacity-45",
          )}
        >
          {yaEsta ? <Check size={17} aria-hidden strokeWidth={2.8} /> : <Plus size={17} aria-hidden strokeWidth={2.6} />}
          {yaEsta ? "Agregado" : "Agregar"}
        </button>
      </div>
    </Tarjeta>
  );
}

/** Lista desplegable con ícono a la izquierda. La etiqueta es para lectores de pantalla: el valor ya se explica solo. */
function SelectConIcono({
  etiqueta,
  icono,
  valor,
  onChange,
  children,
}: {
  etiqueta: string;
  icono: ReactNode;
  valor: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{etiqueta}</span>
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-marca-600">{icono}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none truncate rounded-xl border border-linea bg-white pr-10 pl-10 text-[15px] font-semibold text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-100"
      >
        {children}
      </select>
      <ChevronDown size={18} aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-tenue" />
    </label>
  );
}

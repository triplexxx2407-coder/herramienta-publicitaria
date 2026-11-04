"use client";

import { useEffect, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { EncabezadoPantalla } from "@/components/EncabezadoPantalla";
import { Etiqueta } from "@/components/Etiqueta";
import { SiguientePaso } from "@/components/SiguientePaso";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { CIUDADES, GIROS, NOMBRE_ESTRATO, TAMANOS, nombreCiudad, nombreGiro } from "@/lib/catalogos";
import { agregarContactos, contactoDesdeEmpresa } from "@/lib/contactos";
import { consultarEmpresas, type FiltrosPantalla } from "@/lib/datos/consultar-empresas";
import type { ResultadoBusqueda } from "@/lib/datos/obtener-buscador";
import type { Empresa } from "@/lib/tipos";

type Filtros = FiltrosPantalla;
const consultar = consultarEmpresas;

export function PantallaBuscar() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [filtros, setFiltros] = useState<Filtros>({ giro: "", ciudad: "tijuana", tamano: "" });
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const [buscando, setBuscando] = useState(true);
  const [error, setError] = useState("");

  function buscar(f: Filtros) {
    setBuscando(true);
    setError("");
    consultar(f)
      .then(setResultado)
      .catch(() => setError("No se pudo hacer la búsqueda. Intenta de nuevo."))
      .finally(() => setBuscando(false));
  }

  useEffect(() => {
    let vigente = true;
    consultar({ giro: "", ciudad: "tijuana", tamano: "" })
      .then((r) => vigente && setResultado(r))
      .catch(() => vigente && setError("No se pudo hacer la búsqueda. Intenta de nuevo."))
      .finally(() => vigente && setBuscando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const enLista = new Set(estado.contactos.map((c) => c.id));
  const esEjemplo = resultado?.fuente.esEjemplo ?? true;
  const empresas = resultado?.empresas ?? [];
  const nuevas = empresas.filter((e) => !enLista.has(e.id));

  function agregar(lista: Empresa[]) {
    if (!resultado) return;
    actualizarEstado((e) =>
      agregarContactos(
        e,
        lista.map((emp) => contactoDesdeEmpresa(emp, resultado.fuente.nombre, resultado.fuente.esEjemplo)),
      ),
    );
  }

  return (
    <div>
      <EncabezadoPantalla
        paso={1}
        titulo="Buscar empresas"
        ayuda={
          <>
            <p>
              Aquí buscas negocios por giro, ciudad y tamaño en un directorio público. Los que te interesen los
              agregas a tu lista para escribirles después.
            </p>
            <p>
              En la versión real los datos vendrán del DENUE de INEGI, el directorio oficial de negocios de México.
              Hoy son negocios inventados.
            </p>
          </>
        }
      />

      {esEjemplo ? (
        <div className="sticky top-0 z-10 mb-4">
          <Aviso tipo="ejemplo">Datos de ejemplo. Aquí se conectará el directorio DENUE de INEGI.</Aviso>
        </div>
      ) : null}
      {resultado?.aviso ? (
        <div className="mb-4">
          <Aviso tipo="error">{resultado.aviso}</Aviso>
        </div>
      ) : null}

      <form
        className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4 sm:items-end"
        onSubmit={(ev) => {
          ev.preventDefault();
          buscar(filtros);
        }}
      >
        <Campo etiqueta="Giro">
          <select
            value={filtros.giro}
            onChange={(e) => setFiltros({ ...filtros, giro: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Todos los giros</option>
            {GIROS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Ciudad o municipio">
          <select
            value={filtros.ciudad}
            onChange={(e) => setFiltros({ ...filtros, ciudad: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Todas</option>
            {CIUDADES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}, {c.estado}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Tamaño aproximado">
          <select
            value={filtros.tamano}
            onChange={(e) => setFiltros({ ...filtros, tamano: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Cualquier tamaño</option>
            {TAMANOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800">
          Buscar
        </button>
      </form>

      {error ? <Aviso tipo="error">{error}</Aviso> : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-slate-700" role="status">
          {buscando ? "Buscando…" : `${empresas.length} ${empresas.length === 1 ? "negocio encontrado" : "negocios encontrados"}`}
        </p>
        {enNavegador && nuevas.length > 0 && !buscando ? (
          <button
            type="button"
            onClick={() => agregar(nuevas)}
            className="rounded-lg border border-teal-700 px-4 py-2 font-semibold text-teal-800 hover:bg-teal-50"
          >
            Agregar los {nuevas.length} a mi lista
          </button>
        ) : null}
      </div>

      {!buscando && empresas.length === 0 && !error ? (
        <Aviso tipo="info">No hay negocios con esos filtros. Prueba con otro giro o con «Todas» las ciudades.</Aviso>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {empresas.map((e) => {
          const yaEsta = enNavegador && enLista.has(e.id);
          return (
            <li key={e.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{e.nombre}</h2>
                {esEjemplo ? <Etiqueta tipo="ejemplo" /> : null}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-slate-500">Giro</dt>
                <dd>{nombreGiro(e.giro)}</dd>
                <dt className="text-slate-500">Ciudad</dt>
                <dd>{nombreCiudad(e.ciudad)}</dd>
                <dt className="text-slate-500">Tamaño</dt>
                <dd>{e.estrato ? NOMBRE_ESTRATO[e.estrato] : "Sin dato"}</dd>
                <dt className="text-slate-500">Teléfono</dt>
                <dd>{e.telefono ?? "Sin dato"}</dd>
                <dt className="text-slate-500">Correo</dt>
                <dd className="break-all">{e.correo ?? <span className="text-slate-400">No tiene correo</span>}</dd>
                <dt className="text-slate-500">Sitio web</dt>
                <dd className="break-all">{e.sitioWeb ?? <span className="text-slate-400">No tiene</span>}</dd>
              </dl>
              <div>
                {yaEsta ? (
                  <span className="inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                    ✓ Ya está en tu lista
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => agregar([e])}
                    disabled={!enNavegador}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    Agregar a mi lista
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <SiguientePaso ruta="/contactos" texto="Elegir contactos" />
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-slate-700">{etiqueta}</span>
      {children}
    </label>
  );
}

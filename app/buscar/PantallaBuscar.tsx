"use client";

import { Ban, Check, LayoutGrid, MailCheck, MapPin, PenLine, RefreshCw, SearchX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { avisar } from "@/components/avisos";
import { IconoGiro } from "@/components/IconoGiro";
import { BOTON_BARRA, BarraAccion, Boton, BotonEnlace, Encabezado, Insignia, Selector, Tarjeta, cx } from "@/components/ui";
import { actualizarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import { CIUDADES, GIROS, nombreCiudad, nombreGiro } from "@/lib/catalogos";
import { elegirEmpresas, nombreVisible, normalizarCorreo, porEscribir, quitarDeSeleccion } from "@/lib/contactos";
import { consultarEmpresas, type FiltrosPantalla } from "@/lib/datos/consultar-empresas";
import type { ResultadoBusqueda } from "@/lib/datos/obtener-buscador";
import type { Empresa, EstadoDemo } from "@/lib/tipos";

const FILTROS_INICIALES: FiltrosPantalla = { giro: "", ciudad: "tijuana", tamano: "" };

type Fila = { empresa: Empresa; elegida: boolean; bloqueo: "enviado" | "no_contactar" | null };

/** Cómo va cada negocio de la lista: elegido, ya le escribiste o pidió no recibir correos. */
function filaDe(empresa: Empresa, estado: EstadoDemo): Fila {
  const correo = normalizarCorreo(empresa.correo);
  if (estado.supresion.some((s) => s.correo === correo)) return { empresa, elegida: false, bloqueo: "no_contactar" };
  if (estado.enviados[empresa.id]) return { empresa, elegida: false, bloqueo: "enviado" };
  return { empresa, elegida: estado.seleccionados.includes(empresa.id), bloqueo: null };
}

export function PantallaBuscar() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [filtros, setFiltros] = useState<FiltrosPantalla>(FILTROS_INICIALES);
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const [buscando, setBuscando] = useState(true);
  const [error, setError] = useState("");
  const turno = useRef(0);

  function buscar(f: FiltrosPantalla, alTerminar?: () => void) {
    setFiltros(f);
    const mio = ++turno.current;
    setBuscando(true);
    setError("");
    consultarEmpresas(f)
      .then((r) => {
        if (mio !== turno.current) return;
        setResultado(r);
        alTerminar?.();
      })
      .catch(() => mio === turno.current && setError("No se pudo cargar la lista. Toca «Actualizar» para intentar de nuevo."))
      .finally(() => mio === turno.current && setBuscando(false));
  }

  useEffect(() => {
    let vigente = true;
    consultarEmpresas(FILTROS_INICIALES)
      .then((r) => vigente && setResultado(r))
      .catch(() => vigente && setError("No se pudo cargar la lista. Toca «Actualizar» para intentar de nuevo."))
      .finally(() => vigente && setBuscando(false));
    return () => {
      vigente = false;
    };
  }, []);

  // Sólo se muestran los negocios con correo: a los demás no se les puede escribir.
  const empresas = (resultado?.empresas ?? []).filter((e) => e.correo);
  const filas = enNavegador ? empresas.map((e) => filaDe(e, estado)) : empresas.map((e) => ({ empresa: e, elegida: false, bloqueo: null }));
  const libres = filas.filter((f) => !f.bloqueo);
  const todasElegidas = libres.length > 0 && libres.every((f) => f.elegida);
  const elegidos = enNavegador ? porEscribir(estado).length : 0;

  function alternar(lista: Empresa[], elegir: boolean) {
    if (!resultado || !lista.length) return;
    actualizarEstado((e) =>
      elegir
        ? elegirEmpresas(e, lista, resultado.fuente.nombre, resultado.fuente.esEjemplo)
        : quitarDeSeleccion(
            e,
            lista.map((x) => x.id),
          ),
    );
  }

  return (
    <div>
      <Encabezado
        paso={1}
        titulo="Buscar empresas"
        subtitulo="Marca a quién quieres escribirle y toca «Redactar»."
        ayuda={
          <>
            <p>Es la lista de negocios de la ciudad y el tipo que elijas. «Actualizar» la vuelve a cargar.</p>
            <p>En la versión real saldrán del directorio oficial de negocios del INEGI. Hoy son negocios inventados.</p>
          </>
        }
      />

      {resultado?.aviso ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
          {resultado.aviso}
        </p>
      ) : null}

      <div className="entrada mb-3 grid grid-cols-2 gap-2 sm:gap-3 md:max-w-xl">
        <Selector
          etiqueta="Ciudad"
          icono={<MapPin size={17} aria-hidden />}
          valor={filtros.ciudad}
          onChange={(v) => buscar({ ...filtros, ciudad: v })}
        >
          <option value="">Todas las ciudades</option>
          {CIUDADES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
        <Selector
          etiqueta="Tipo de negocio"
          icono={<LayoutGrid size={17} aria-hidden />}
          valor={filtros.giro}
          onChange={(v) => buscar({ ...filtros, giro: v })}
        >
          <option value="">Todos los tipos</option>
          {GIROS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </Selector>
      </div>

      {error ? (
        <p role="alert" className="mb-3 rounded-2xl bg-rojo-50 px-4 py-3 font-medium text-rojo-700">
          {error}
        </p>
      ) : null}

      <div className="entrada mb-2 flex items-center gap-2 pl-1">
        <p role="status" className="flex items-center gap-2 text-[15px] text-suave">
          <span className="cifras font-semibold text-tinta">
            {buscando ? "Cargando…" : `${empresas.length} ${empresas.length === 1 ? "negocio" : "negocios"}`}
          </span>
          {resultado?.fuente.esEjemplo !== false ? <Insignia tipo="ejemplo" /> : null}
        </p>
        <Boton
          variante="fantasma"
          tamano="sm"
          className="ml-auto text-marca-700"
          onClick={() => buscar(filtros, () => avisar("Lista actualizada"))}
          disabled={buscando}
          icono={<RefreshCw size={16} aria-hidden className={buscando ? "animate-spin" : undefined} />}
        >
          Actualizar
        </Boton>
      </div>

      <Tarjeta className="entrada overflow-hidden">
        <div className="border-b border-linea px-4 py-1.5 sm:px-5">
          <button
            type="button"
            disabled={!enNavegador || buscando || libres.length === 0}
            onClick={() =>
              alternar(
                libres.map((f) => f.empresa),
                !todasElegidas,
              )
            }
            aria-pressed={todasElegidas}
            className="-ml-1 flex min-h-11 items-center gap-3 rounded-xl pr-3 pl-1 text-[15px] font-semibold text-tinta disabled:opacity-45"
          >
            <Casilla marcada={todasElegidas} />
            {todasElegidas ? "Quitar todos" : "Elegir todos"}
          </button>
        </div>

        {!buscando && empresas.length === 0 && !error ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <SearchX size={32} aria-hidden className="text-tenue" />
            <p className="mt-3 font-semibold">No hay negocios con esos filtros</p>
            <p className="text-sm text-suave">Prueba con otro tipo de negocio o con «Todas las ciudades».</p>
          </div>
        ) : null}

        <ul className={cx("divide-y divide-linea transition-opacity", buscando && "opacity-55")}>
          {filas.map((f) => (
            <li key={f.empresa.id}>
              <FilaEmpresa
                fila={f}
                esEjemplo={resultado?.fuente.esEjemplo ?? true}
                listo={enNavegador}
                onCambio={(elegir) => alternar([f.empresa], elegir)}
              />
            </li>
          ))}
        </ul>
      </Tarjeta>

      <BarraAccion>
        {elegidos ? (
          <BotonEnlace href="/redactar" className={BOTON_BARRA} icono={<PenLine size={19} aria-hidden />}>
            Redactar ({elegidos})
          </BotonEnlace>
        ) : (
          <Boton disabled className={BOTON_BARRA} icono={<PenLine size={19} aria-hidden />}>
            Redactar
          </Boton>
        )}
      </BarraAccion>
    </div>
  );
}

function Casilla({ marcada, apagada = false }: { marcada: boolean; apagada?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
        marcada ? "border-marca-600 bg-marca-600 text-white" : apagada ? "border-linea bg-fondo" : "border-tenue/70 bg-white",
      )}
    >
      {marcada ? <Check size={16} strokeWidth={3.2} /> : null}
    </span>
  );
}

function FilaEmpresa({
  fila: { empresa: e, elegida, bloqueo },
  esEjemplo,
  listo,
  onCambio,
}: {
  fila: Fila;
  esEjemplo: boolean;
  listo: boolean;
  onCambio: (elegir: boolean) => void;
}) {
  const nombre = nombreVisible(e.nombre, esEjemplo);
  const detalle = `${nombreGiro(e.giro)} · ${nombreCiudad(e.ciudad)}`;
  return (
    <label
      className={cx(
        "flex min-h-16 items-center gap-3 px-4 py-2.5 sm:px-5",
        bloqueo ? "cursor-default" : "cursor-pointer transition-colors hover:bg-fondo/70",
        elegida && "bg-marca-50/60",
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={elegida}
        disabled={!listo || !!bloqueo}
        onChange={(ev) => onCambio(ev.target.checked)}
        aria-label={nombre}
        aria-describedby={`detalle-${e.id}`}
      />
      <span className="rounded-lg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marca-400">
        <Casilla marcada={elegida} apagada={!!bloqueo} />
      </span>
      <span className={cx(bloqueo && "opacity-60")}>
        <IconoGiro giro={e.giro} />
      </span>
      <span className={cx("min-w-0 flex-1", bloqueo && "opacity-60")}>
        <span className="block truncate font-semibold text-tinta">{nombre}</span>
        <span id={`detalle-${e.id}`} className="block truncate text-sm text-suave">
          {bloqueo === "enviado" ? "Ya le escribiste" : bloqueo === "no_contactar" ? "Pidió no recibir correos" : detalle}
        </span>
      </span>
      {bloqueo === "enviado" ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-verde-50 px-2.5 py-1 text-xs font-bold text-verde-700">
          <MailCheck size={13} aria-hidden /> Enviado
        </span>
      ) : bloqueo === "no_contactar" ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rojo-50 px-2.5 py-1 text-xs font-bold text-rojo-700">
          <Ban size={13} aria-hidden /> No contactar
        </span>
      ) : null}
    </label>
  );
}

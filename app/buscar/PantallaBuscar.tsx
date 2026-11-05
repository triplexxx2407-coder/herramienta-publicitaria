"use client";

import { Ban, Check, LayoutGrid, MailCheck, MapPin, PenLine, RefreshCw, Search, SearchX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { avisar } from "@/components/avisos";
import { TrazoGiro } from "@/components/IconoGiro";
import {
  AvisoEjemplo,
  BotonPie,
  BotonPildora,
  ContenidoClaro,
  EnlacePie,
  HojaBlanca,
  IconoCirculo,
  PanelNexora,
  PastillaCliente,
  SelectorPildora,
  VacioClaro,
} from "@/components/PanelNexora";
import { olvidarPedido, useLoPedido } from "@/components/ventanas";
import { cx } from "@/components/ui";
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

  // Si el buscador de arriba pide ver un negocio, se resalta y la lista baja hasta él.
  const [resaltado, setResaltado] = useState<string | null>(null);

  // Si otra pantalla pide abrir un negocio de la lista (el buscador de arriba o la campana), se abre aunque ya
  // estuvieras aquí. El número de la petición evita abrirlo dos veces.
  const pedido = useLoPedido("/buscar");
  const [pedidoVisto, setPedidoVisto] = useState(0);
  if (pedido && pedido.numero !== pedidoVisto) {
    setPedidoVisto(pedido.numero);
    setResaltado(pedido.id);
  }
  useEffect(() => {
    if (pedido) olvidarPedido("/buscar");
  }, [pedido]);

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

  const cuantos = `${empresas.length} ${empresas.length === 1 ? "negocio" : "negocios"}`;
  const donde = filtros.ciudad ? ` en ${nombreCiudad(filtros.ciudad)}` : "";
  const esEjemplo = resultado?.fuente.esEjemplo !== false;

  return (
    <PanelNexora
      titulo="Buscar empresas"
      ayuda={
        <>
          <p>Es la lista de negocios de la ciudad y el tipo que elijas. Marca a quién quieres escribirle y toca «Redactar».</p>
          <p>«Actualizar» la vuelve a cargar. En la versión real saldrán del directorio oficial de negocios del INEGI; hoy son negocios inventados.</p>
        </>
      }
      pastilla={
        <PastillaCliente
          icono={
            <IconoCirculo>
              <Search size={22} strokeWidth={2.6} className="lg:h-[26px] lg:w-[26px]" />
            </IconoCirculo>
          }
          texto={buscando ? "Cargando…" : `${cuantos}${donde}`}
        />
      }
      etiquetaLista="Filtros de la lista"
      lista={
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-[11px]">
          <SelectorPildora
            etiqueta="Ciudad"
            icono={<MapPin size={15} aria-hidden />}
            valor={filtros.ciudad}
            onChange={(v) => buscar({ ...filtros, ciudad: v })}
          >
            <option value="">Todas las ciudades</option>
            {CIUDADES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </SelectorPildora>
          <SelectorPildora
            etiqueta="Tipo de negocio"
            icono={<LayoutGrid size={15} aria-hidden />}
            valor={filtros.giro}
            onChange={(v) => buscar({ ...filtros, giro: v })}
          >
            <option value="">Todos los tipos</option>
            {GIROS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </SelectorPildora>
          <BotonPildora
            onClick={() => buscar(filtros, () => avisar("Lista actualizada"))}
            disabled={buscando}
            icono={<RefreshCw size={15} aria-hidden className={buscando ? "animate-spin" : undefined} />}
          >
            Actualizar
          </BotonPildora>
          <BotonPildora
            disabled={!enNavegador || buscando || libres.length === 0}
            onClick={() =>
              alternar(
                libres.map((f) => f.empresa),
                !todasElegidas,
              )
            }
            aria-pressed={todasElegidas}
            activo={todasElegidas}
            icono={<Check size={16} aria-hidden strokeWidth={3} />}
          >
            {todasElegidas ? "Quitar todos" : "Elegir todos"}
          </BotonPildora>
          <p role="status" className="col-span-2 px-2 pt-1 text-[13px] font-semibold text-tinta-2 lg:col-span-1">
            {buscando ? "Cargando…" : `${cuantos}${elegidos ? ` · ${elegidos} ${elegidos === 1 ? "elegido" : "elegidos"}` : ""}`}
          </p>
        </div>
      }
      etiquetaPrincipal="Negocios"
      principal={
        <ContenidoClaro className="space-y-3">
          {esEjemplo ? <AvisoEjemplo>Ejemplo: estos negocios son inventados.</AvisoEjemplo> : null}

          {resultado?.aviso ? (
            <p role="alert" className="rounded-lg bg-[#fde2e2] px-4 py-3 text-sm font-semibold text-[#8e1b1b]">
              {resultado.aviso}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-lg bg-[#fde2e2] px-4 py-3 text-sm font-semibold text-[#8e1b1b]">
              {error}
            </p>
          ) : null}

          {!buscando && empresas.length === 0 && !error ? (
            <VacioClaro
              icono={<SearchX size={30} aria-hidden />}
              titulo="No hay negocios con esos filtros"
              texto="Prueba con otro tipo de negocio o con «Todas las ciudades»."
            />
          ) : (
            <HojaBlanca className="overflow-hidden">
              <ul className={cx("divide-y divide-black/[0.07] transition-opacity", buscando && "opacity-55")}>
                {filas.map((f) => (
                  <li key={f.empresa.id}>
                    <FilaEmpresa
                      fila={f}
                      esEjemplo={resultado?.fuente.esEjemplo ?? true}
                      listo={enNavegador}
                      resaltada={f.empresa.id === resaltado}
                      onCambio={(elegir) => alternar([f.empresa], elegir)}
                    />
                  </li>
                ))}
              </ul>
            </HojaBlanca>
          )}
        </ContenidoClaro>
      }
      pie={
        elegidos ? (
          <EnlacePie href="/redactar" icono={<PenLine size={18} aria-hidden />}>
            Redactar ({elegidos})
          </EnlacePie>
        ) : (
          <BotonPie disabled icono={<PenLine size={18} aria-hidden />}>
            Redactar
          </BotonPie>
        )
      }
    />
  );
}

function Casilla({ marcada, apagada = false }: { marcada: boolean; apagada?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors",
        marcada ? "border-marca-600 bg-marca-600 text-white" : apagada ? "border-black/15 bg-black/5" : "border-[#7b8fa3] bg-white",
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
  resaltada = false,
  onCambio,
}: {
  fila: Fila;
  esEjemplo: boolean;
  listo: boolean;
  resaltada?: boolean;
  onCambio: (elegir: boolean) => void;
}) {
  const nombre = nombreVisible(e.nombre, esEjemplo);
  const detalle = `${nombreGiro(e.giro)} · ${nombreCiudad(e.ciudad)}`;
  const caja = useRef<HTMLLabelElement>(null);
  useEffect(() => {
    if (resaltada) caja.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [resaltada]);
  return (
    <label
      ref={caja}
      className={cx(
        "flex min-h-[60px] items-center gap-3 px-3 py-2 sm:px-4",
        bloqueo ? "cursor-default" : "cursor-pointer transition-colors hover:bg-[#eef4fd]",
        elegida && "bg-[#dceafe] hover:bg-[#d2e4fd]",
        resaltada && "ring-2 ring-marca-600 ring-inset",
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
      <span className="rounded-[5px] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marca-600">
        <Casilla marcada={elegida} apagada={!!bloqueo} />
      </span>
      <span className={cx("text-black", bloqueo && "opacity-45")}>
        <IconoCirculo className="h-10 w-10">
          <TrazoGiro giro={e.giro} />
        </IconoCirculo>
      </span>
      <span className={cx("min-w-0 flex-1", bloqueo && "opacity-60")}>
        <span className="block truncate text-[15px] font-semibold text-chat-tinta">{nombre}</span>
        <span id={`detalle-${e.id}`} className="block truncate text-[13px] text-chat-tenue">
          {bloqueo === "enviado" ? "Ya le escribiste" : bloqueo === "no_contactar" ? "Pidió no recibir correos" : detalle}
        </span>
      </span>
      {bloqueo === "enviado" ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#dcf5e3] px-2.5 py-1 text-xs font-bold text-[#17603a]">
          <MailCheck size={13} aria-hidden /> Enviado
        </span>
      ) : bloqueo === "no_contactar" ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fde2e2] px-2.5 py-1 text-xs font-bold text-[#8e1b1b]">
          <Ban size={13} aria-hidden /> No contactar
        </span>
      ) : null}
    </label>
  );
}

"use client";

import { Ban, Check, PenLine, Search, Sparkles, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { avisar } from "@/components/avisos";
import {
  BOTON_BARRA,
  BarraAccion,
  Boton,
  BotonEnlace,
  Cargando,
  Encabezado,
  EstadoVacio,
  Insignia,
  PildoraSemaforo,
  Tarjeta,
} from "@/components/ui";
import { actualizarEstado, reiniciarEstado, useEnNavegador, useEstado } from "@/lib/almacen";
import {
  alternarSeleccion,
  contactosParaRedactar,
  deshacerNoContactar,
  marcarNoContactar,
  motivoBloqueo,
  nombreVisible,
  ORIGEN_CORTO,
  semaforoDe,
  TEXTO_BLOQUEO,
  type MotivoBloqueo,
} from "@/lib/contactos";
import { estadoDeRecorrido } from "@/lib/estado";
import type { Contacto, EstadoDemo } from "@/lib/tipos";
import { HojaContactoManual } from "./HojaContactoManual";

export function PantallaContactos() {
  const estado = useEstado();
  const enNavegador = useEnNavegador();
  const [agregando, setAgregando] = useState(false);
  if (!enNavegador) return <Cargando />;

  const permitidos = estado.contactos.filter((c) => !motivoBloqueo(c, estado));
  const bloqueados = estado.contactos
    .map((c) => ({ c, motivo: motivoBloqueo(c, estado) }))
    .filter((x): x is { c: Contacto; motivo: MotivoBloqueo } => x.motivo !== null);
  const elegidos = contactosParaRedactar(estado).length;
  const todos = permitidos.length > 0 && elegidos === permitidos.length;
  const vacio = estado.contactos.length === 0;

  const botonAgregar = (
    <Boton variante="secundario" icono={<UserPlus size={18} aria-hidden />} onClick={() => setAgregando(true)}>
      Agregar a mano
    </Boton>
  );

  return (
    <div>
      <Encabezado
        paso={2}
        titulo="Elegir contactos"
        subtitulo={
          vacio
            ? "Aquí verás a quién le vas a escribir."
            : "Los que agregaste ya están elegidos. Quita la palomita a quien no quieras escribirle."
        }
        acciones={vacio ? null : botonAgregar}
        ayuda={
          <>
            <p>Sólo a los que tengan palomita les vas a escribir.</p>
            <p>
              A quien no tiene correo, no sabemos de dónde salió o está en «No contactar», no se le puede escribir: la ley de
              datos personales pide poder demostrar de dónde sacaste cada correo.
            </p>
          </>
        }
      />

      {vacio ? (
        <EstadoVacio
          icono={<Users size={30} aria-hidden />}
          titulo="Tu lista está vacía"
          texto="Agrega negocios en «Buscar empresas», o mira cómo se ve con un ejemplo."
        >
          <BotonEnlace href="/buscar" icono={<Search size={18} aria-hidden />}>
            Buscar empresas
          </BotonEnlace>
          <Boton
            variante="secundario"
            icono={<Sparkles size={18} aria-hidden />}
            onClick={() => {
              const nuevo = estadoDeRecorrido();
              reiniciarEstado(nuevo);
              avisar(`Listo: ${nuevo.contactos.length} negocios de ejemplo`);
            }}
          >
            Llenar con un ejemplo
          </Boton>
          {botonAgregar}
        </EstadoVacio>
      ) : (
        <>
          <section aria-labelledby="titulo-se-puede">
            <div className="mb-2 flex min-h-9 items-center justify-between gap-3">
              <h2 id="titulo-se-puede" className="font-display text-lg font-bold text-tinta">
                Se les puede escribir <span className="font-sans font-semibold text-suave">({permitidos.length})</span>
              </h2>
              {permitidos.length > 1 ? (
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  className="text-marca-700"
                  onClick={() =>
                    actualizarEstado((e) => ({
                      ...e,
                      seleccionados: todos
                        ? e.seleccionados.filter((id) => !permitidos.some((c) => c.id === id))
                        : Array.from(new Set([...e.seleccionados, ...permitidos.map((c) => c.id)])),
                    }))
                  }
                >
                  {todos ? "Quitar todos" : "Elegir todos"}
                </Boton>
              ) : null}
            </div>
            {permitidos.length ? (
              <Tarjeta className="entrada overflow-hidden">
                <ul className="divide-y divide-linea">
                  {permitidos.map((c) => (
                    <FilaPermitida key={c.id} c={c} estado={estado} />
                  ))}
                </ul>
              </Tarjeta>
            ) : (
              <p className="rounded-tarjeta bg-white px-5 py-8 text-center text-suave">
                Todavía no hay nadie a quien se le pueda escribir.
              </p>
            )}
          </section>

          {bloqueados.length ? (
            <section aria-labelledby="titulo-no-se-puede" className="mt-7">
              <h2 id="titulo-no-se-puede" className="mb-2 font-display text-lg font-bold text-tinta">
                No se les puede escribir <span className="font-sans font-semibold text-suave">({bloqueados.length})</span>
              </h2>
              <Tarjeta className="entrada overflow-hidden">
                <ul className="divide-y divide-linea">
                  {bloqueados.map(({ c, motivo }) => (
                    <li key={c.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fondo text-tenue">
                        <Ban size={14} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-tinta-2">{nombreVisible(c.nombre, c.esEjemplo)}</span>
                          {c.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold text-rojo-700">{TEXTO_BLOQUEO[motivo]}</span>
                          {motivo === "sin_correo" && c.telefono ? <span className="text-suave"> · Tel. {c.telefono}</span> : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            </section>
          ) : null}

          <BarraAccion notaComputadora={`${elegidos} de ${permitidos.length} elegidos`}>
            {elegidos > 0 ? (
              <BotonEnlace href="/redactar" className={BOTON_BARRA} icono={<PenLine size={19} aria-hidden />}>
                {elegidos === 1 ? "Escribirle a 1" : `Escribirles a ${elegidos}`}
              </BotonEnlace>
            ) : permitidos.length ? (
              <Boton disabled className={BOTON_BARRA}>
                Elige al menos uno
              </Boton>
            ) : (
              <BotonEnlace href="/buscar" className={BOTON_BARRA} icono={<Search size={19} aria-hidden />}>
                Buscar más negocios
              </BotonEnlace>
            )}
          </BarraAccion>
        </>
      )}

      <HojaContactoManual abierta={agregando} onCerrar={() => setAgregando(false)} />
    </div>
  );
}

function FilaPermitida({ c, estado }: { c: Contacto; estado: EstadoDemo }) {
  const marcado = estado.seleccionados.includes(c.id);
  const nombre = nombreVisible(c.nombre, c.esEjemplo);
  const idCasilla = `elegir-${c.id}`;

  function noContactar() {
    const antes = estado;
    actualizarEstado((e) => marcarNoContactar(e, c.id));
    avisar("Ya no se le escribirá", {
      texto: "Deshacer",
      alHacer: () => actualizarEstado((e) => deshacerNoContactar(e, antes, c.id)),
    });
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <span className="relative mt-0.5 flex h-6 w-6 shrink-0">
        <input
          id={idCasilla}
          type="checkbox"
          aria-label={`Elegir ${nombre}`}
          checked={marcado}
          onChange={() => actualizarEstado((e) => alternarSeleccion(e, c.id))}
          className="h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-tenue/60 bg-white transition-colors checked:border-marca-600 checked:bg-marca-600"
        />
        {marcado ? (
          <Check size={15} strokeWidth={3.2} aria-hidden className="pointer-events-none absolute inset-0 m-auto text-white" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={idCasilla} className="block cursor-pointer">
          <span className="block font-semibold text-tinta">{nombre}</span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-sm text-suave">{c.correo}</span>
            {c.esEjemplo ? <Insignia tipo="ejemplo" /> : null}
          </span>
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <PildoraSemaforo valor={semaforoDe(c.origen)} texto={ORIGEN_CORTO[c.origen.tipo]} />
          <button
            type="button"
            onClick={noContactar}
            aria-label={`No contactar a ${nombre}`}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-suave hover:bg-rojo-50 hover:text-rojo-700"
          >
            <Ban size={13} aria-hidden /> No contactar
          </button>
        </div>
        {c.origen.nota ? <p className="mt-1 text-xs text-suave">«{c.origen.nota}»</p> : null}
      </div>
    </li>
  );
}

"use client";

import { MessageCircle, Plus, Save, Trash2, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { AREA, BOTON_AZUL, BOTON_CLARO, CAMPO, Etiqueta, Seccion, diaCorto } from "@/components/campos";
import { Guardia } from "@/components/Guardia";
import { IconoRed } from "@/components/IconoRed";
import {
  BotonPildora,
  ContenidoClaro,
  IconoCirculo,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  SelectorPildora,
  VacioClaro,
} from "@/components/PanelNexora";
import { guardar, useDatos } from "@/lib/datos";
import { ORDEN_REDES, nombreRed } from "@/lib/redes";
import type { EmpresaCliente, Red } from "@/lib/tipos";
import { ETAPAS, NOMBRE_ETAPA, direccionWhatsApp, hoyISO, telefonoValido, type Enlace, type Etapa, type Interesado } from "@/lib/ventas";

const NUEVO = "nuevo";

/** La gente que se interesó en cada perfil, con su etapa y cuándo darle seguimiento. */
export function PantallaInteresados() {
  return <Guardia titulo="Interesados">{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const datos = useDatos<{ interesados: Interesado[] }>("interesados", empresa.id);
  const enlaces = useDatos<{ enlaces: Enlace[] }>("enlaces", empresa.id)?.enlaces ?? [];
  const [elegido, setElegido] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("todas");
  const hoy = hoyISO();

  if (!datos) return <PanelCargando />;
  const todos = datos.interesados;
  // Primero a quien toca seguimiento hoy (o ya se pasó), luego el resto por fecha.
  const toca = (i: Interesado) => !!i.siguiente && i.siguiente <= hoy && i.etapa !== "vendido" && i.etapa !== "perdido";
  const lista = todos
    .filter((i) => filtro === "todas" || (filtro === "hoy" ? toca(i) : i.etapa === filtro))
    .sort((a, b) => Number(toca(b)) - Number(toca(a)));
  const hoyN = todos.filter(toca).length;

  const creando = elegido === NUEVO;
  const actual = todos.find((i) => i.id === elegido) ?? null;

  return (
    <PanelNexora
      titulo="Interesados"
      ayuda={
        <>
          <p>Aquí apuntas a cada persona que se interesó en {empresa.nombre}: quién es, por dónde llegó y en qué etapa va.</p>
          <p>Si le pones una fecha de seguimiento, NEXORA te la marca cuando llegue el día para que no se te enfríe.</p>
        </>
      }
      pastilla={
        <PastillaCliente
          texto={creando ? "Nuevo interesado" : (actual?.nombre ?? "Interesados")}
          icono={<IconoCirculo><Users size={18} aria-hidden /></IconoCirculo>}
        />
      }
      etiquetaLista="Interesados"
      lista={
        <>
          <BotonPildora className="mb-2 w-full" activo={creando} icono={<Plus size={16} aria-hidden />} onClick={() => setElegido(NUEVO)}>
            Agregar interesado
          </BotonPildora>
          <SelectorPildora etiqueta="Filtrar" icono={<Users size={15} aria-hidden />} valor={filtro} onChange={setFiltro} className="mb-3">
            <option value="todas">Todos ({todos.length})</option>
            <option value="hoy">Seguimiento hoy ({hoyN})</option>
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ETAPA[e]} ({todos.filter((i) => i.etapa === e).length})
              </option>
            ))}
          </SelectorPildora>
          {lista.length ? (
            <ul className="space-y-[11px]">
              {lista.map((i) => (
                <li key={i.id}>
                  <PildoraLista
                    activa={i.id === elegido}
                    titulo={i.nombre}
                    detalle={`${NOMBRE_ETAPA[i.etapa]}${i.siguiente ? ` · ${diaCorto(i.siguiente)}` : ""}`}
                    extra={toca(i) ? <span aria-label="Toca seguimiento" className="block h-2.5 w-2.5 rounded-full bg-proyecto" /> : undefined}
                    onClick={() => setElegido(i.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-sm text-tinta-2">{todos.length ? "Nadie en este filtro." : "Todavía no hay interesados."}</p>
          )}
        </>
      }
      etiquetaPrincipal={creando ? "Nuevo interesado" : `Interesado ${actual?.nombre ?? ""}`}
      modo="detalle"
      detalleAbierto={elegido !== null}
      onCerrarDetalle={() => setElegido(null)}
      encabezadoDetalle={<PastillaCliente texto={creando ? "Nuevo interesado" : (actual?.nombre ?? "")} icono={<Users size={18} aria-hidden />} />}
      principal={
        <ContenidoClaro>
          <div className="mx-auto max-w-2xl space-y-4">
            {creando || actual ? (
              <FormularioInteresado
                key={actual?.id ?? NUEVO}
                empresaId={empresa.id}
                interesado={actual}
                enlaces={enlaces}
                alTerminar={(id) => setElegido(id)}
              />
            ) : (
              <VacioClaro
                icono={<Users size={28} aria-hidden />}
                titulo={todos.length ? "Elige a alguien de la lista" : "Aún no hay interesados"}
                texto="Cuando alguien te escriba o se interese, apúntalo aquí con su etapa y su próximo seguimiento."
              >
                <button type="button" onClick={() => setElegido(NUEVO)} className={BOTON_AZUL}>
                  <Plus size={17} aria-hidden /> Agregar interesado
                </button>
              </VacioClaro>
            )}
          </div>
        </ContenidoClaro>
      }
    />
  );
}

function PanelCargando() {
  return <div aria-label="Cargando" className="m-3 h-64 animate-pulse rounded-2xl bg-panel/60" />;
}

function FormularioInteresado({
  empresaId,
  interesado,
  enlaces,
  alTerminar,
}: {
  empresaId: string;
  interesado: Interesado | null;
  enlaces: Enlace[];
  alTerminar: (id: string | null) => void;
}) {
  const [nombre, setNombre] = useState(interesado?.nombre ?? "");
  const [telefono, setTelefono] = useState(interesado?.telefono ?? "");
  const [red, setRed] = useState<string>(interesado?.red ?? "");
  const [enlaceId, setEnlaceId] = useState(interesado?.enlaceId ?? "");
  const [etapa, setEtapa] = useState<Etapa>(interesado?.etapa ?? "nuevo");
  const [siguiente, setSiguiente] = useState(interesado?.siguiente ?? "");
  const [notas, setNotas] = useState(interesado?.notas ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(false);
  const recargas: [string, string][] = [
    ["interesados", empresaId],
    ["enlaces", empresaId],
    ["resultados", empresaId],
  ];

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!nombre.trim() || ocupado) return;
    setOcupado(true);
    const cuerpo = { nombre: nombre.trim(), telefono: telefono.trim(), red, enlaceId, etapa, siguiente: siguiente || null, notas };
    const r = interesado
      ? await guardar("interesados/editar", { ...cuerpo, id: interesado.id }, recargas)
      : await guardar("interesados", { ...cuerpo, empresaId }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar(interesado ? "Cambios guardados" : "Interesado agregado");
      if (!interesado) alTerminar(r.id ?? null);
    }
  }

  async function borrar() {
    if (!interesado) return;
    setOcupado(true);
    const r = await guardar("interesados/borrar", { id: interesado.id }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar("Interesado borrado");
      alTerminar(null);
    }
  }

  return (
    <Seccion titulo={interesado ? "Datos del interesado" : "Agregar un interesado"}>
      <form onSubmit={enviar} className="space-y-3">
        <Etiqueta texto="Nombre">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} placeholder="Por ejemplo: Marco Salinas" className={CAMPO} />
        </Etiqueta>
        <Etiqueta texto="Teléfono" opcional>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            inputMode="tel"
            maxLength={40}
            placeholder="664 123 4567"
            className={CAMPO}
          />
        </Etiqueta>
        <div className="grid gap-3 sm:grid-cols-2">
          <Etiqueta texto="Por dónde llegó" opcional>
            <select value={red} onChange={(e) => setRed(e.target.value)} className={CAMPO}>
              <option value="">No sé</option>
              {ORDEN_REDES.map((r) => (
                <option key={r} value={r}>
                  {nombreRed(r)}
                </option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto="De qué enlace vino" opcional>
            <select value={enlaceId} onChange={(e) => setEnlaceId(e.target.value)} className={CAMPO}>
              <option value="">Ninguno</option>
              {enlaces.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto="Etapa">
            <select value={etapa} onChange={(e) => setEtapa(e.target.value as Etapa)} className={CAMPO}>
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {NOMBRE_ETAPA[e]}
                </option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto="Próximo seguimiento" opcional>
            <input type="date" value={siguiente} onChange={(e) => setSiguiente(e.target.value)} className={CAMPO} />
          </Etiqueta>
        </div>
        <Etiqueta texto="Notas" opcional>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={2000} placeholder="Qué le interesa, qué le dijiste…" className={AREA} />
        </Etiqueta>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!nombre.trim() || ocupado} className={BOTON_AZUL}>
            {interesado ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            {ocupado ? "Guardando…" : interesado ? "Guardar cambios" : "Agregar"}
          </button>
          {telefonoValido(telefono) ? (
            <a href={direccionWhatsApp(telefono, "")} target="_blank" rel="noreferrer" className={BOTON_CLARO}>
              <MessageCircle size={17} aria-hidden /> Abrir WhatsApp
            </a>
          ) : null}
          {interesado ? (
            porBorrar ? (
              <>
                <button type="button" onClick={() => setPorBorrar(false)} className={BOTON_CLARO}>
                  No
                </button>
                <button type="button" disabled={ocupado} onClick={() => void borrar()} className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-[#b42318] px-4 text-[15px] font-bold text-white">
                  <Trash2 size={16} aria-hidden /> Sí, borrar
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setPorBorrar(true)} className="inline-flex h-11 items-center gap-2 rounded-[6px] px-3 text-[15px] font-bold text-[#b42318] hover:bg-[#fdecea]">
                <Trash2 size={16} aria-hidden /> Borrar
              </button>
            )
          ) : null}
        </div>
        {interesado?.red ? (
          <p className="flex items-center gap-1.5 text-sm text-chat-tenue">
            <IconoRed red={interesado.red as Red} tamano={14} /> Llegó por {nombreRed(interesado.red as Red)}
            {interesado.enlace ? ` · enlace «${interesado.enlace}»` : ""}
          </p>
        ) : null}
      </form>
    </Seccion>
  );
}

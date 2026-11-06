"use client";

import { CalendarDays, Check, Copy, Plus, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { AREA, BOTON_AZUL, BOTON_CLARO, CAMPO, Copiable, Etiqueta, Seccion, copiar, diaCorto } from "@/components/campos";
import { Guardia } from "@/components/Guardia";
import { CirculoRed } from "@/components/IconoRed";
import { BotonPildora, ContenidoClaro, IconoCirculo, PanelNexora, PastillaCliente, PildoraLista, VacioClaro } from "@/components/PanelNexora";
import { guardar, useDatos } from "@/lib/datos";
import { ORDEN_REDES, nombreRed } from "@/lib/redes";
import type { EmpresaCliente, Red } from "@/lib/tipos";
import { hoyISO, type Enlace, type Publicacion } from "@/lib/ventas";

const NUEVA = "nueva";

/** Qué se publica, dónde y cuándo, para cada perfil. NEXORA no publica solo: tú subes cada cosa desde la app de la red. */
export function PantallaCalendario() {
  return <Guardia titulo="Publicaciones">{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const datos = useDatos<{ publicaciones: Publicacion[] }>("publicaciones", empresa.id);
  const enlaces = useDatos<{ enlaces: Enlace[] }>("enlaces", empresa.id)?.enlaces ?? [];
  const [elegida, setElegida] = useState<string | null>(null);

  if (!datos) return <div aria-label="Cargando" className="m-3 h-64 animate-pulse rounded-2xl bg-panel/60" />;
  const todas = datos.publicaciones;
  const hoy = hoyISO();
  const creando = elegida === NUEVA;
  const actual = todas.find((p) => p.id === elegida) ?? null;

  return (
    <PanelNexora
      titulo="Publicaciones"
      descripcion="Planea qué subes, en qué red y qué día. Tú lo publicas desde la app de la red."
      ayuda={
        <>
          <p>Aquí planeas qué se publica en {empresa.nombre}: la red, el día y el texto ya escrito.</p>
          <p>NEXORA no publica por ti. Cuando llegue el día, copias el texto, lo subes desde la app de la red y lo marcas como hecho.</p>
        </>
      }
      pastilla={
        <PastillaCliente
          texto={creando ? "Nueva publicación" : (actual?.titulo ?? "Publicaciones")}
          icono={<IconoCirculo><CalendarDays size={18} aria-hidden /></IconoCirculo>}
        />
      }
      etiquetaLista="Publicaciones"
      lista={
        <>
          <BotonPildora className="mb-3 w-full" activo={creando} icono={<Plus size={16} aria-hidden />} onClick={() => setElegida(NUEVA)}>
            Agregar publicación
          </BotonPildora>
          {todas.length ? (
            <ul className="space-y-[11px]">
              {todas.map((p) => (
                <li key={p.id}>
                  <PildoraLista
                    activa={p.id === elegida}
                    titulo={p.titulo}
                    detalle={`${diaCorto(p.fecha)}${p.red ? ` · ${nombreRed(p.red as Red)}` : ""}`}
                    icono={p.red ? <CirculoRed red={p.red as Red} activa={p.id === elegida} /> : undefined}
                    extra={
                      p.hecha ? (
                        <Check size={16} aria-label="Hecha" className="text-cifra" />
                      ) : p.fecha < hoy ? (
                        <span aria-label="Atrasada" className="block h-2.5 w-2.5 rounded-full bg-proyecto" />
                      ) : undefined
                    }
                    apagada={p.hecha}
                    onClick={() => setElegida(p.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-sm text-tinta-2">Todavía no hay publicaciones.</p>
          )}
        </>
      }
      etiquetaPrincipal={creando ? "Nueva publicación" : `Publicación ${actual?.titulo ?? ""}`}
      modo="detalle"
      detalleAbierto={elegida !== null}
      onCerrarDetalle={() => setElegida(null)}
      encabezadoDetalle={<PastillaCliente texto={creando ? "Nueva publicación" : (actual?.titulo ?? "")} icono={<CalendarDays size={18} aria-hidden />} />}
      principal={
        <ContenidoClaro>
          <div className="mx-auto max-w-2xl space-y-4">
            {creando || actual ? (
              <Formulario key={actual?.id ?? NUEVA} empresaId={empresa.id} publicacion={actual} enlaces={enlaces} alTerminar={(id) => setElegida(id)} />
            ) : (
              <VacioClaro
                icono={<CalendarDays size={28} aria-hidden />}
                titulo={todas.length ? "Elige una publicación" : "Aún no hay publicaciones"}
                texto="Ejemplo: «Lunes, Instagram: video de avance de obra», con su texto y el enlace de WhatsApp que lleva. El lunes copias el texto, lo subes y lo marcas como hecho."
              >
                <button type="button" onClick={() => setElegida(NUEVA)} className={BOTON_AZUL}>
                  <Plus size={17} aria-hidden /> Agregar publicación
                </button>
              </VacioClaro>
            )}
          </div>
        </ContenidoClaro>
      }
    />
  );
}

function Formulario({
  empresaId,
  publicacion,
  enlaces,
  alTerminar,
}: {
  empresaId: string;
  publicacion: Publicacion | null;
  enlaces: Enlace[];
  alTerminar: (id: string | null) => void;
}) {
  const [titulo, setTitulo] = useState(publicacion?.titulo ?? "");
  const [red, setRed] = useState<string>(publicacion?.red ?? "instagram");
  const [fecha, setFecha] = useState(publicacion?.fecha ?? hoyISO());
  const [texto, setTexto] = useState(publicacion?.texto ?? "");
  const [enlaceId, setEnlaceId] = useState(publicacion?.enlaceId ?? "");
  const [hecha, setHecha] = useState(publicacion?.hecha ?? false);
  const [ocupado, setOcupado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(false);
  const recargas: [string, string][] = [["publicaciones", empresaId]];
  const enlace = enlaces.find((e) => e.id === enlaceId);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!titulo.trim() || ocupado) return;
    setOcupado(true);
    const cuerpo = { titulo: titulo.trim(), red, fecha, texto, enlaceId, hecha };
    const r = publicacion
      ? await guardar("publicaciones/editar", { ...cuerpo, id: publicacion.id }, recargas)
      : await guardar("publicaciones", { ...cuerpo, empresaId }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar(publicacion ? "Cambios guardados" : "Publicación agregada");
      if (!publicacion) alTerminar(r.id ?? null);
    }
  }

  async function borrar() {
    if (!publicacion) return;
    setOcupado(true);
    const r = await guardar("publicaciones/borrar", { id: publicacion.id }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar("Publicación borrada");
      alTerminar(null);
    }
  }

  const direccion = enlace && typeof window !== "undefined" ? `${window.location.origin}/api/w/${enlace.id}` : null;

  return (
    <Seccion titulo={publicacion ? "Datos de la publicación" : "Agregar una publicación"}>
      <form onSubmit={enviar} className="space-y-3">
        <Etiqueta texto="Qué es">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} placeholder="Por ejemplo: Video avance de obra" className={CAMPO} />
        </Etiqueta>
        <div className="grid gap-3 sm:grid-cols-2">
          <Etiqueta texto="Red">
            <select value={red} onChange={(e) => setRed(e.target.value)} className={CAMPO}>
              {ORDEN_REDES.map((r) => (
                <option key={r} value={r}>
                  {nombreRed(r)}
                </option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto="Día">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={CAMPO} />
          </Etiqueta>
        </div>
        <Etiqueta texto="Texto para publicar" opcional>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={4000} placeholder="El texto que acompaña el video o la foto" className={AREA} />
        </Etiqueta>
        <Etiqueta texto="Enlace de WhatsApp que lleva" opcional>
          <select value={enlaceId} onChange={(e) => setEnlaceId(e.target.value)} className={CAMPO}>
            <option value="">Ninguno</option>
            {enlaces.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </Etiqueta>
        {direccion ? <Copiable texto={direccion} aviso="Enlace copiado" /> : null}
        <label className="flex items-center gap-2 text-sm font-semibold text-chat-tinta">
          <input type="checkbox" checked={hecha} onChange={(e) => setHecha(e.target.checked)} className="h-5 w-5 accent-[#2563eb]" />
          Ya la publiqué
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!titulo.trim() || ocupado} className={BOTON_AZUL}>
            {publicacion ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            {ocupado ? "Guardando…" : publicacion ? "Guardar cambios" : "Agregar"}
          </button>
          {texto.trim() ? (
            <button type="button" onClick={() => void copiar(direccion ? `${texto.trim()}\n${direccion}` : texto.trim(), "Texto copiado")} className={BOTON_CLARO}>
              <Copy size={16} aria-hidden /> Copiar texto
            </button>
          ) : null}
          {publicacion ? (
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
      </form>
    </Seccion>
  );
}

"use client";

import { Link2, MessageCircle, Plus, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { AREA, BOTON_AZUL, BOTON_CLARO, CAMPO, Copiable, Etiqueta, Seccion } from "@/components/campos";
import { Guardia } from "@/components/Guardia";
import { BotonPildora, ContenidoClaro, IconoCirculo, PanelNexora, PastillaCliente, PildoraLista, VacioClaro } from "@/components/PanelNexora";
import { guardar, useDatos } from "@/lib/datos";
import type { EmpresaCliente } from "@/lib/tipos";
import { direccionWhatsApp, telefonoValido, type Enlace } from "@/lib/ventas";

const NUEVO = "nuevo";

/** Enlaces de WhatsApp con medición: uno por publicación o anuncio, para saber cuál trae gente. */
export function PantallaEnlaces() {
  return <Guardia titulo="Enlaces">{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const datos = useDatos<{ enlaces: Enlace[] }>("enlaces", empresa.id);
  const [elegido, setElegido] = useState<string | null>(null);

  if (!datos) return <div aria-label="Cargando" className="m-3 h-64 animate-pulse rounded-2xl bg-panel/60" />;
  const todos = datos.enlaces;
  const creando = elegido === NUEVO;
  const actual = todos.find((e) => e.id === elegido) ?? null;

  return (
    <PanelNexora
      titulo="Enlaces"
      descripcion="Un enlace por cada video, foto o anuncio: abre WhatsApp con el mensaje escrito y cuenta cuántos lo tocan."
      ayuda={
        <>
          <p>Cada enlace abre el WhatsApp de {empresa.nombre} con un mensaje ya escrito, y NEXORA cuenta cuántas veces lo tocan.</p>
          <p>Haz uno por publicación o anuncio. Así sabes cuál trae gente y cuál no.</p>
        </>
      }
      pastilla={
        <PastillaCliente
          texto={creando ? "Nuevo enlace" : (actual?.nombre ?? "Enlaces")}
          icono={<IconoCirculo><Link2 size={18} aria-hidden /></IconoCirculo>}
        />
      }
      etiquetaLista="Enlaces"
      lista={
        <>
          <BotonPildora className="mb-3 w-full" activo={creando} icono={<Plus size={16} aria-hidden />} onClick={() => setElegido(NUEVO)}>
            Crear enlace
          </BotonPildora>
          {todos.length ? (
            <ul className="space-y-[11px]">
              {todos.map((e) => (
                <li key={e.id}>
                  <PildoraLista
                    activa={e.id === elegido}
                    titulo={e.nombre}
                    detalle={`${e.clics} ${e.clics === 1 ? "clic" : "clics"} · ${e.interesados} ${e.interesados === 1 ? "interesado" : "interesados"}`}
                    icono={
                      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-marco-2 text-marca-400">
                        <Link2 size={18} aria-hidden />
                      </span>
                    }
                    onClick={() => setElegido(e.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-sm text-tinta-2">Todavía no hay enlaces.</p>
          )}
        </>
      }
      etiquetaPrincipal={creando ? "Nuevo enlace" : `Enlace ${actual?.nombre ?? ""}`}
      modo="detalle"
      detalleAbierto={elegido !== null}
      onCerrarDetalle={() => setElegido(null)}
      encabezadoDetalle={<PastillaCliente texto={creando ? "Nuevo enlace" : (actual?.nombre ?? "")} icono={<Link2 size={18} aria-hidden />} />}
      principal={
        <ContenidoClaro>
          <div className="mx-auto max-w-2xl space-y-4">
            {creando || actual ? (
              <Formulario key={actual?.id ?? NUEVO} empresaId={empresa.id} enlace={actual} alTerminar={(id) => setElegido(id)} />
            ) : (
              <VacioClaro
                icono={<Link2 size={28} aria-hidden />}
                titulo={todos.length ? "Elige un enlace" : "Aún no hay enlaces"}
                texto="Ejemplo: haces «Video avance de obra» con el WhatsApp de la empresa. Pegas el enlace en la descripción del video. Cada persona que lo toque abre WhatsApp con «Hola, vi el video» ya escrito y NEXORA lo cuenta."
              >
                <button type="button" onClick={() => setElegido(NUEVO)} className={BOTON_AZUL}>
                  <Plus size={17} aria-hidden /> Crear enlace
                </button>
              </VacioClaro>
            )}
          </div>
        </ContenidoClaro>
      }
    />
  );
}

function Formulario({ empresaId, enlace, alTerminar }: { empresaId: string; enlace: Enlace | null; alTerminar: (id: string | null) => void }) {
  const [nombre, setNombre] = useState(enlace?.nombre ?? "");
  const [telefono, setTelefono] = useState(enlace?.telefono ?? "");
  const [mensaje, setMensaje] = useState(enlace?.mensaje ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(false);
  const recargas: [string, string][] = [
    ["enlaces", empresaId],
    ["interesados", empresaId],
    ["resultados", empresaId],
  ];
  const listo = nombre.trim() && telefonoValido(telefono);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!listo || ocupado) return;
    setOcupado(true);
    const cuerpo = { nombre: nombre.trim(), telefono: telefono.trim(), mensaje };
    const r = enlace
      ? await guardar("enlaces/editar", { ...cuerpo, id: enlace.id }, recargas)
      : await guardar("enlaces", { ...cuerpo, empresaId }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar(enlace ? "Cambios guardados" : "Enlace creado");
      if (!enlace) alTerminar(r.id ?? null);
    }
  }

  async function borrar() {
    if (!enlace) return;
    setOcupado(true);
    const r = await guardar("enlaces/borrar", { id: enlace.id }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar("Enlace borrado");
      alTerminar(null);
    }
  }

  const direccion = enlace && typeof window !== "undefined" ? `${window.location.origin}/api/w/${enlace.id}` : null;

  return (
    <>
      {enlace && direccion ? (
        <Seccion titulo="Tu enlace" detalle="Pégalo en la publicación, el anuncio o la biografía.">
          <Copiable texto={direccion} aviso="Enlace copiado" />
          <p className="mt-3 text-sm text-chat-tenue">
            {enlace.clics} {enlace.clics === 1 ? "persona lo tocó" : "personas lo tocaron"} · {enlace.interesados}{" "}
            {enlace.interesados === 1 ? "interesado apuntado" : "interesados apuntados"}
          </p>
        </Seccion>
      ) : null}
      <Seccion titulo={enlace ? "Datos del enlace" : "Crear un enlace"}>
        <form onSubmit={enviar} className="space-y-3">
          <Etiqueta texto="Para qué es">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} placeholder="Por ejemplo: Video avance de obra" className={CAMPO} />
          </Etiqueta>
          <Etiqueta texto="WhatsApp de la empresa">
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" maxLength={40} placeholder="664 123 4567" className={CAMPO} />
          </Etiqueta>
          <Etiqueta texto="Mensaje que sale escrito" opcional>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500} placeholder="Hola, vi el video de avance de obra" className={AREA} />
          </Etiqueta>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!listo || ocupado} className={BOTON_AZUL}>
              {enlace ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
              {ocupado ? "Guardando…" : enlace ? "Guardar cambios" : "Crear enlace"}
            </button>
            {telefonoValido(telefono) ? (
              <a href={direccionWhatsApp(telefono, mensaje)} target="_blank" rel="noreferrer" className={BOTON_CLARO}>
                <MessageCircle size={17} aria-hidden /> Probar
              </a>
            ) : null}
            {enlace ? (
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
          {enlace ? <p className="text-sm text-chat-tenue">Si borras el enlace, el que ya pegaste deja de funcionar.</p> : null}
        </form>
      </Seccion>
    </>
  );
}

"use client";

import { Eye, Heart, MousePointerClick, Plus, Save, Trash2, Video } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { Guardia } from "@/components/Guardia";
import { IconoRed } from "@/components/IconoRed";
import { BOTON, BOTON_CLARO, BOTON_PELIGRO, CAMPO, Cargando, Encabezado, Etiqueta, Tarjeta, Vacio } from "@/components/ui";
import { guardar, useDatos } from "@/lib/datos";
import { nombreRed } from "@/lib/redes";
import type { EmpresaCliente, Red } from "@/lib/tipos";
import { NOMBRE_TIPO, TIPOS, cifraCorta, type Contenido, type Estadisticas, type Tipo } from "@/lib/ventas";

const NUEVO = "nuevo";
const REDES_CONTENIDO: Red[] = ["instagram", "facebook", "tiktok", "whatsapp"];

/** Los videos, publicaciones y anuncios de la empresa, con sus cifras. */
export function PantallaContenidos() {
  return <Guardia>{(empresa) => <Lista key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Lista({ empresa }: { empresa: EmpresaCliente }) {
  const datos = useDatos<Estadisticas>("estadisticas", empresa.id);
  const [abierto, setAbierto] = useState<string | null>(null);
  if (!datos) return <Cargando />;
  const actual = datos.contenidos.find((c) => c.id === abierto) ?? null;

  return (
    <div className="entrada space-y-6">
      <Encabezado
        titulo="Videos y anuncios"
        frase="Anota aquí lo que publicaste y las cifras que te da cada red: vistas, clics y likes."
        derecha={
          <button type="button" onClick={() => setAbierto(NUEVO)} className={BOTON}>
            <Plus size={17} aria-hidden /> Agregar
          </button>
        }
      />

      {abierto === NUEVO || actual ? (
        <Formulario key={actual?.id ?? NUEVO} empresaId={empresa.id} contenido={actual} enlaces={datos.enlaces} alTerminar={() => setAbierto(null)} />
      ) : null}

      {datos.contenidos.length === 0 && abierto !== NUEVO ? (
        <Vacio icono={<Video size={26} aria-hidden />} titulo="Todavía no hay videos ni anuncios" texto="Agrega el primero con su red y sus cifras. Si quieres ver cómo se ve, llena datos de prueba en Estadísticas.">
          <button type="button" onClick={() => setAbierto(NUEVO)} className={BOTON}>
            <Plus size={17} aria-hidden /> Agregar el primero
          </button>
        </Vacio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {datos.contenidos.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setAbierto(c.id)}
                className="block w-full rounded-2xl border border-linea bg-tarjeta p-4 text-left shadow-tarjeta transition hover:border-marca-500"
              >
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-suave">
                  {c.red ? <IconoRed red={c.red as Red} tamano={15} /> : null}
                  {c.red ? nombreRed(c.red as Red) : "Sin red"} · {NOMBRE_TIPO[c.tipo]}
                </div>
                <p className="mt-1 truncate text-[16px] font-bold text-tinta">{c.titulo}</p>
                <div className="cifras mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-tinta-2">
                  <span className="inline-flex items-center gap-1.5"><Eye size={15} aria-hidden className="text-vistas" /> {cifraCorta(c.vistas)}</span>
                  <span className="inline-flex items-center gap-1.5"><MousePointerClick size={15} aria-hidden className="text-clics" /> {cifraCorta(c.clics)}</span>
                  <span className="inline-flex items-center gap-1.5"><Heart size={15} aria-hidden className="text-likes" /> {cifraCorta(c.likes)}</span>
                </div>
                {c.enlace ? (
                  <p className="mt-2 text-[13px] text-suave">
                    Enlace «{c.enlace}»: {c.visitas} visitas · {c.escribieron} escribieron
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Formulario({
  empresaId,
  contenido,
  enlaces,
  alTerminar,
}: {
  empresaId: string;
  contenido: Contenido | null;
  enlaces: Estadisticas["enlaces"];
  alTerminar: () => void;
}) {
  const [tipo, setTipo] = useState<Tipo>(contenido?.tipo ?? "video");
  const [red, setRed] = useState<string>(contenido?.red ?? "instagram");
  const [titulo, setTitulo] = useState(contenido?.titulo ?? "");
  const [enlaceId, setEnlaceId] = useState(contenido?.enlaceId ?? "");
  const [vistas, setVistas] = useState(String(contenido?.vistas ?? 0));
  const [clics, setClics] = useState(String(contenido?.clics ?? 0));
  const [likes, setLikes] = useState(String(contenido?.likes ?? 0));
  const [ocupado, setOcupado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(false);
  const recargas: [string, string][] = [
    ["estadisticas", empresaId],
    ["enlaces", empresaId],
  ];

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!titulo.trim() || ocupado) return;
    setOcupado(true);
    const cuerpo = { tipo, red, titulo: titulo.trim(), enlaceId, vistas: Number(vistas), clics: Number(clics), likes: Number(likes) };
    const r = contenido
      ? await guardar("contenidos/editar", { ...cuerpo, id: contenido.id }, recargas)
      : await guardar("contenidos", { ...cuerpo, empresaId }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar(contenido ? "Cambios guardados" : "Agregado");
      alTerminar();
    }
  }

  async function borrar() {
    if (!contenido) return;
    setOcupado(true);
    const r = await guardar("contenidos/borrar", { id: contenido.id }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar("Borrado");
      alTerminar();
    }
  }

  const numero = (valor: string, poner: (v: string) => void, texto: string) => (
    <Etiqueta texto={texto}>
      <input value={valor} onChange={(e) => poner(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" className={CAMPO} />
    </Etiqueta>
  );

  return (
    <Tarjeta titulo={contenido ? "Editar" : "Agregar un video, publicación o anuncio"}>
      <form onSubmit={enviar} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Etiqueta texto="Qué es">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className={CAMPO}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{NOMBRE_TIPO[t]}</option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto="En qué red">
            <select value={red} onChange={(e) => setRed(e.target.value)} className={CAMPO}>
              {REDES_CONTENIDO.map((r) => (
                <option key={r} value={r}>{nombreRed(r)}</option>
              ))}
            </select>
          </Etiqueta>
        </div>
        <Etiqueta texto="Nombre">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} placeholder="Por ejemplo: Recorrido del departamento modelo" className={CAMPO} />
        </Etiqueta>
        <div className="grid grid-cols-3 gap-3">
          {numero(vistas, setVistas, "Vistas")}
          {numero(clics, setClics, "Clics")}
          {numero(likes, setLikes, "Likes")}
        </div>
        <Etiqueta texto="Enlace de WhatsApp que lleva" opcional>
          <select value={enlaceId} onChange={(e) => setEnlaceId(e.target.value)} className={CAMPO}>
            <option value="">Ninguno</option>
            {enlaces.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </Etiqueta>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={!titulo.trim() || ocupado} className={BOTON}>
            {contenido ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            {ocupado ? "Guardando…" : contenido ? "Guardar" : "Agregar"}
          </button>
          <button type="button" onClick={alTerminar} className={BOTON_CLARO}>Cancelar</button>
          {contenido ? (
            porBorrar ? (
              <button type="button" disabled={ocupado} onClick={() => void borrar()} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#b42318] px-4 text-[15px] font-semibold text-white">
                <Trash2 size={16} aria-hidden /> Sí, borrar
              </button>
            ) : (
              <button type="button" onClick={() => setPorBorrar(true)} className={BOTON_PELIGRO}>
                <Trash2 size={16} aria-hidden /> Borrar
              </button>
            )
          ) : null}
        </div>
      </form>
    </Tarjeta>
  );
}

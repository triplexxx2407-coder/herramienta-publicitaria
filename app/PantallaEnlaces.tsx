"use client";

import { CalendarCheck, Link2, MessageCircle, Plus, Save, Trash2, Trophy, UserRoundPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { Guardia } from "@/components/Guardia";
import { AREA, BOTON, BOTON_CLARO, BOTON_PELIGRO, CAMPO, Cargando, Copiable, Encabezado, Etiqueta, Tarjeta, Vacio } from "@/components/ui";
import { guardar, useDatos } from "@/lib/datos";
import type { EmpresaCliente } from "@/lib/tipos";
import { ETAPAS, NOMBRE_ETAPA, direccionWhatsApp, telefonoValido, type Contacto, type Enlace, type Etapa } from "@/lib/ventas";

const NUEVO = "nuevo";

/** Enlaces de WhatsApp con medición: uno por video o anuncio, para saber cuál trae gente. */
export function PantallaEnlaces() {
  return <Guardia>{(empresa) => <Lista key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Lista({ empresa }: { empresa: EmpresaCliente }) {
  const datos = useDatos<{ enlaces: Enlace[] }>("enlaces", empresa.id);
  const contactos = useDatos<{ contactos: Contacto[] }>("contactos", empresa.id);
  const [abierto, setAbierto] = useState<string | null>(null);
  if (!datos) return <Cargando />;
  const actual = datos.enlaces.find((e) => e.id === abierto) ?? null;

  return (
    <div className="entrada space-y-6">
      <Encabezado
        titulo="Enlaces de WhatsApp"
        frase="Un enlace por cada video, anuncio o letrero. Abre el WhatsApp de la empresa con un código en el mensaje, y así sabes de dónde viene cada persona."
        derecha={
          <button type="button" onClick={() => setAbierto(NUEVO)} className={BOTON}>
            <Plus size={17} aria-hidden /> Crear enlace
          </button>
        }
      />

      {abierto === NUEVO || actual ? (
        <Formulario key={actual?.id ?? NUEVO} empresaId={empresa.id} enlace={actual} alTerminar={(id) => setAbierto(id)} />
      ) : null}
      {actual ? (
        <Personas empresaId={empresa.id} enlace={actual} contactos={(contactos?.contactos ?? []).filter((c) => c.enlaceId === actual.id)} />
      ) : null}

      {datos.enlaces.length === 0 && abierto !== NUEVO ? (
        <Vacio
          icono={<Link2 size={26} aria-hidden />}
          titulo="Todavía no hay enlaces"
          texto="Ejemplo: haces «TikTok recorrido del penthouse» con el WhatsApp de la empresa y pegas el enlace en la bio del video."
        >
          <button type="button" onClick={() => setAbierto(NUEVO)} className={BOTON}>
            <Plus size={17} aria-hidden /> Crear el primero
          </button>
        </Vacio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {datos.enlaces.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setAbierto(e.id)}
                className="block w-full rounded-2xl border border-linea bg-tarjeta p-4 text-left shadow-tarjeta transition hover:border-marca-500"
              >
                <p className="truncate text-[16px] font-bold text-tinta">{e.nombre}</p>
                <p className="mt-0.5 text-[13px] text-suave">WhatsApp {e.telefono}</p>
                <div className="cifras mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Visitas", e.visitas],
                    ["Escribió", e.escribieron],
                    ["Citas", e.citas],
                    ["Ventas", e.ventas],
                  ].map(([nombre, n]) => (
                    <div key={nombre} className="rounded-lg bg-relleno py-2">
                      <b className="block text-[18px] text-tinta">{n}</b>
                      <span className="text-[12px] text-suave">{nombre}</span>
                    </div>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
    ["estadisticas", empresaId],
    ["contactos", empresaId],
    ["whatsapp", empresaId],
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
    <Tarjeta titulo={enlace ? enlace.nombre : "Crear un enlace"} detalle={enlace ? "Pega este enlace en el video, el anuncio o la biografía." : undefined}>
      {enlace && direccion ? (
        <div className="mb-4">
          <Copiable texto={direccion} aviso="Enlace copiado" />
        </div>
      ) : null}
      <form onSubmit={enviar} className="space-y-3">
        <Etiqueta texto="Para qué es">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} placeholder="Por ejemplo: TikTok recorrido del penthouse" className={CAMPO} />
        </Etiqueta>
        <Etiqueta texto="WhatsApp de la empresa">
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" maxLength={40} placeholder="664 123 4567" className={CAMPO} />
        </Etiqueta>
        <Etiqueta texto="Mensaje que sale escrito" opcional>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500} placeholder="Hola, vi el video y quiero más información" className={AREA} />
        </Etiqueta>
        {enlace ? (
          <p className="rounded-lg bg-relleno p-3 text-[13px] leading-snug text-suave">
            Al final del mensaje se agrega solo el código <b className="text-tinta">(ref {enlace.ref})</b>. Cuando alguien te escriba con ese código, sabrás que vino de este enlace.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={!listo || ocupado} className={BOTON}>
            {enlace ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            {ocupado ? "Guardando…" : enlace ? "Guardar" : "Crear enlace"}
          </button>
          <button type="button" onClick={() => alTerminar(null)} className={BOTON_CLARO}>Cerrar</button>
          {telefonoValido(telefono) ? (
            <a href={direccionWhatsApp(telefono, mensaje)} target="_blank" rel="noreferrer" className={BOTON_CLARO}>
              <MessageCircle size={17} aria-hidden /> Probar
            </a>
          ) : null}
          {enlace ? (
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

/** Las personas que escribieron desde este enlace: se apuntan con un toque y se avanzan a cita o compra. */
function Personas({ empresaId, enlace, contactos }: { empresaId: string; enlace: Enlace; contactos: Contacto[] }) {
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const recargas: [string, string][] = [
    ["enlaces", empresaId],
    ["estadisticas", empresaId],
    ["contactos", empresaId],
  ];

  async function apuntar(ev: FormEvent) {
    ev.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    const r = await guardar("contactos", { empresaId, enlaceId: enlace.id, nota: nota.trim() }, recargas);
    setOcupado(false);
    if (r.error) avisar(r.error);
    else {
      avisar("Apuntado: alguien escribió");
      setNota("");
    }
  }

  async function avanzar(c: Contacto, etapa: Etapa) {
    const r = await guardar("contactos/etapa", { id: c.id, etapa }, recargas);
    if (r.error) avisar(r.error);
  }

  async function quitar(c: Contacto) {
    const r = await guardar("contactos/borrar", { id: c.id }, recargas);
    if (r.error) avisar(r.error);
  }

  const ICONO: Record<Etapa, typeof Link2> = { escribio: UserRoundPlus, cita: CalendarCheck, venta: Trophy };

  return (
    <Tarjeta titulo="Personas que escribieron" detalle="Cuando te llegue un mensaje con el código de este enlace, apúntalo aquí con un toque.">
      <form onSubmit={apuntar} className="flex flex-wrap gap-2">
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={120} placeholder="Nombre o nota (opcional)" className={`${CAMPO} mt-0 min-w-0 flex-1 basis-48`} />
        <button type="submit" disabled={ocupado} className={BOTON}>
          <UserRoundPlus size={17} aria-hidden /> Me escribió
        </button>
      </form>
      {contactos.length === 0 ? (
        <p className="mt-4 text-sm text-suave">Todavía no has apuntado a nadie en este enlace.</p>
      ) : (
        <ul className="mt-4 divide-y divide-linea">
          {contactos.map((c) => {
            const Icono = ICONO[c.etapa];
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marca-50 text-marca-600">
                  <Icono size={17} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 basis-32">
                  <p className="truncate text-[14.5px] font-semibold text-tinta">{c.nota || "Sin nombre"}</p>
                  <p className="text-[12.5px] text-suave">{NOMBRE_ETAPA[c.etapa]}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {ETAPAS.filter((e) => e !== "escribio" && e !== c.etapa).map((e) => (
                    <button key={e} type="button" onClick={() => void avanzar(c, e)} className="rounded-full border border-linea px-3 py-1.5 text-[13px] font-semibold text-tinta-2 hover:bg-relleno">
                      {e === "cita" ? "Cita" : "Compró"}
                    </button>
                  ))}
                  <button type="button" onClick={() => void quitar(c)} aria-label="Quitar" className="flex h-8 w-8 items-center justify-center rounded-full text-suave hover:bg-[#fdecea] hover:text-[#b42318]">
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}

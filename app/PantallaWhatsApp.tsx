"use client";

import { ArrowLeft, Link2, MessageCircle, Send, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { Guardia } from "@/components/Guardia";
import { BOTON, BOTON_CLARO, CAMPO, Cargando, Encabezado, Etiqueta, Tarjeta, cx } from "@/components/ui";
import { guardar, useDatos } from "@/lib/datos";
import { hora } from "@/lib/fechas";
import type { EmpresaCliente } from "@/lib/tipos";
import type { Chat, Enlace } from "@/lib/ventas";

/** Un WhatsApp de mentira para ver cómo llegan los mensajes de la gente que toca los enlaces. */
export function PantallaWhatsApp() {
  return <Guardia>{(empresa) => <Contenido key={empresa.id} empresa={empresa} />}</Guardia>;
}

function Contenido({ empresa }: { empresa: EmpresaCliente }) {
  const chats = useDatos<{ chats: Chat[] }>("whatsapp", empresa.id);
  const enlaces = useDatos<{ enlaces: Enlace[] }>("enlaces", empresa.id);
  const [enlaceElegido, setEnlaceElegido] = useState("");
  const [persona, setPersona] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  if (!chats || !enlaces) return <Cargando />;
  const lista = enlaces.enlaces;
  const enlaceId = lista.some((e) => e.id === enlaceElegido) ? enlaceElegido : (lista[0]?.id ?? "");
  const recargas: [string, string][] = [
    ["whatsapp", empresa.id],
    ["enlaces", empresa.id],
    ["contactos", empresa.id],
    ["estadisticas", empresa.id],
  ];

  async function simular(soloVisita: boolean) {
    if (!enlaceId || ocupado) return;
    setOcupado(true);
    const r = await guardar("whatsapp/simular", { empresaId: empresa.id, enlaceId, soloVisita }, recargas);
    setOcupado(false);
    avisar(r.error ?? (soloVisita ? "Alguien tocó el enlace y no escribió" : "Alguien tocó el enlace y te escribió"));
  }

  const abierto = chats.chats.find((c) => c.persona === persona) ?? null;

  return (
    <div className="entrada space-y-6">
      <Encabezado
        titulo="WhatsApp de prueba"
        frase="Así se vería tu WhatsApp. Aquí simulas gente que toca un enlace y escribe, con el código del enlace en el mensaje."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <div className="space-y-4">
          <Tarjeta titulo="1. Simula a una persona" detalle="Elige el enlace que tocó.">
            {lista.length === 0 ? (
              <p className="text-sm text-suave">Primero crea un enlace en la pestaña Enlaces (o llena datos de prueba en Estadísticas).</p>
            ) : (
              <div className="space-y-3">
                <Etiqueta texto="Enlace">
                  <select value={enlaceId} onChange={(e) => setEnlaceElegido(e.target.value)} className={CAMPO}>
                    {lista.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </Etiqueta>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={ocupado} onClick={() => void simular(false)} className={BOTON}>
                    <MessageCircle size={17} aria-hidden /> Toca el enlace y escribe
                  </button>
                  <button type="button" disabled={ocupado} onClick={() => void simular(true)} className={BOTON_CLARO}>
                    <Link2 size={17} aria-hidden /> Sólo toca el enlace
                  </button>
                </div>
              </div>
            )}
          </Tarjeta>
          <Tarjeta titulo="2. Mira el resultado">
            <ol className="list-decimal space-y-1.5 pl-5 text-[14.5px] text-tinta-2">
              <li>Le llega un mensaje nuevo al teléfono de la derecha.</li>
              <li>Ábrelo y contéstale, como harías en tu WhatsApp.</li>
              <li>Ve a <b>Resultados</b>: subieron las visitas al enlace y las personas que escribieron.</li>
            </ol>
            <p className="mt-3 rounded-lg bg-relleno p-3 text-[13px] leading-snug text-suave">
              Esto es una simulación. En la vida real, el código que sale en el mensaje te dice de qué enlace vino, y tú lo apuntas con un toque en Enlaces → Me escribió.
            </p>
          </Tarjeta>
        </div>

        <Telefono
          nombre={empresa.nombre}
          chats={chats.chats}
          abierto={abierto}
          alAbrir={setPersona}
          alVolver={() => setPersona(null)}
          alResponder={async (texto) => {
            if (!abierto) return;
            const r = await guardar("whatsapp/responder", { empresaId: empresa.id, persona: abierto.persona, texto }, recargas);
            if (r.error) avisar(r.error);
          }}
        />
      </div>
    </div>
  );
}

function Telefono({
  nombre,
  chats,
  abierto,
  alAbrir,
  alVolver,
  alResponder,
}: {
  nombre: string;
  chats: Chat[];
  abierto: Chat | null;
  alAbrir: (p: string) => void;
  alVolver: () => void;
  alResponder: (texto: string) => Promise<void>;
}) {
  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[2.2rem] border-[7px] border-tinta bg-tinta shadow-xl">
      <div className="flex h-[640px] flex-col overflow-hidden rounded-[1.7rem] bg-white">
        {abierto ? <Conversacion chat={abierto} alVolver={alVolver} alResponder={alResponder} /> : <ListaChats nombre={nombre} chats={chats} alAbrir={alAbrir} />}
      </div>
    </div>
  );
}

function ListaChats({ nombre, chats, alAbrir }: { nombre: string; chats: Chat[]; alAbrir: (p: string) => void }) {
  return (
    <>
      <div className="bg-wa px-4 pt-5 pb-3 text-white">
        <p className="text-[20px] font-bold">WhatsApp</p>
        <p className="truncate text-[12.5px] text-white/75">{nombre}</p>
      </div>
      {chats.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center text-suave">
          <MessageCircle size={34} aria-hidden />
          <p className="text-[14px]">Aún no te escribe nadie. Simula a una persona con el botón verde.</p>
        </div>
      ) : (
        <ul className="barra-fina flex-1 divide-y divide-linea overflow-y-auto">
          {chats.map((c) => {
            const ultimo = c.mensajes[c.mensajes.length - 1];
            return (
              <li key={c.persona}>
                <button type="button" onClick={() => alAbrir(c.persona)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-relleno">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-relleno text-suave">
                    <UserRound size={22} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <b className="truncate text-[15px] text-tinta">{c.persona}</b>
                      {ultimo ? <span className="shrink-0 text-[11.5px] text-suave">{hora(ultimo.fecha)}</span> : null}
                    </span>
                    <span className="block truncate text-[13.5px] text-suave">{ultimo ? (ultimo.de === "yo" ? "Tú: " : "") + ultimo.texto : ""}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Conversacion({ chat, alVolver, alResponder }: { chat: Chat; alVolver: () => void; alResponder: (texto: string) => Promise<void> }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    await alResponder(t);
    setTexto("");
    setEnviando(false);
  }

  return (
    <>
      <div className="flex items-center gap-2 bg-wa px-2 py-3 text-white">
        <button type="button" onClick={alVolver} aria-label="Volver a los chats" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <UserRound size={19} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">{chat.persona}</p>
          <p className="truncate text-[12px] text-white/75">{chat.telefono}{chat.enlace ? ` · desde «${chat.enlace}»` : ""}</p>
        </div>
      </div>
      <div className="fondo-wa barra-fina flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
        {chat.mensajes.map((m) => (
          <div key={m.id} className={cx("max-w-[82%] rounded-lg px-2.5 py-1.5 text-[14.5px] leading-snug shadow-sm", m.de === "yo" ? "self-end bg-wa-mio" : "self-start bg-white")}>
            {m.texto}
            <span className="ml-2 inline-block translate-y-1 text-[10.5px] text-suave">{hora(m.fecha)}</span>
          </div>
        ))}
      </div>
      <form onSubmit={enviar} className="flex items-center gap-2 bg-[#f0f2f5] p-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje"
          maxLength={1000}
          className="h-10 min-w-0 flex-1 rounded-full bg-white px-4 text-[16px] outline-none"
        />
        <button type="submit" disabled={!texto.trim() || enviando} aria-label="Enviar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wa-claro text-white disabled:opacity-50">
          <Send size={18} aria-hidden />
        </button>
      </form>
    </>
  );
}

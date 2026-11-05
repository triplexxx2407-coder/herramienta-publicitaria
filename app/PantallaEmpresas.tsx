"use client";

import { Building2, CircleCheck, CircleDashed, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { avisar } from "@/components/avisos";
import { CirculoRed, IconoRed } from "@/components/IconoRed";
import {
  BotonPildora,
  CargandoPanel,
  ContenidoClaro,
  HojaBlanca,
  IconoCirculo,
  PanelNexora,
  PastillaCliente,
  PildoraLista,
  VacioClaro,
} from "@/components/PanelNexora";
import { cx } from "@/components/ui";
import { actualizarEstado } from "@/lib/almacen";
import { elegirEmpresa } from "@/lib/bandeja";
import { agregarCuenta, borrarEmpresa, crearEmpresa, editarEmpresa, quitarCuenta, useFuente } from "@/lib/fuente";
import { nombreRed, ORDEN_REDES } from "@/lib/redes";
import type { CuentaCanal, EmpresaCliente, Red } from "@/lib/tipos";
import { useBandeja } from "@/lib/usar-bandeja";

/** Qué se escribe para dar de alta la cuenta de cada red. */
const COMO_SE_LLAMA: Record<Red, { etiqueta: string; ejemplo: string }> = {
  instagram: { etiqueta: "Usuario de Instagram", ejemplo: "@condominios.tj" },
  whatsapp: { etiqueta: "Número de WhatsApp", ejemplo: "+52 664 123 4567" },
  facebook: { etiqueta: "Nombre de la página de Facebook", ejemplo: "Condominios Tijuana" },
  tiktok: { etiqueta: "Usuario de TikTok", ejemplo: "@condominios.tj" },
  correo: { etiqueta: "Dirección de correo", ejemplo: "ventas@gmail.com" },
};

const NUEVA = "nueva";

/** Dar de alta las empresas que atiende el equipo y ligarles sus cuentas. */
export function PantallaEmpresas() {
  const { modo, usuario } = useFuente();
  const { empresas, empresaActiva } = useBandeja();
  const [elegida, setElegida] = useState<string | null>(null);

  if (modo === "revisando") return <CargandoPanel />;
  if (modo !== "real") {
    return (
      <PanelNexora
        titulo="Empresas"
        ayuda={<p>Aquí das de alta las empresas que atienden y sus cuentas. Funciona en la versión con servidor, no en la demo.</p>}
        pastilla={<PastillaCliente texto="Empresas" icono={<IconoCirculo><Building2 size={18} aria-hidden /></IconoCirculo>} />}
        etiquetaLista="Empresas"
        lista={<p className="px-2 py-3 text-sm text-tinta-2">En la demo las empresas son de ejemplo y no se pueden cambiar.</p>}
        etiquetaPrincipal="Empresa"
        principal={
          <ContenidoClaro>
            <VacioClaro
              icono={<Building2 size={28} aria-hidden />}
              titulo="Sólo en la versión de verdad"
              texto="Entra a NEXORA en su dirección de Cloudflare para dar de alta empresas y conectar sus cuentas."
            >
              <Link href="/" className="font-bold text-marca-600 underline underline-offset-2">
                Volver a la bandeja
              </Link>
            </VacioClaro>
          </ContenidoClaro>
        }
      />
    );
  }

  const esDueno = usuario?.papel === "dueño";
  // Lo elegido aquí manda; si no, la empresa que estabas viendo en la bandeja.
  const idActual = elegida ?? empresaActiva ?? empresas[0]?.id ?? NUEVA;
  const actual = empresas.find((e) => e.id === idActual) ?? null;
  const creando = idActual === NUEVA || !actual;

  function abrir(id: string) {
    setElegida(id);
    if (id !== NUEVA) actualizarEstado((e) => elegirEmpresa(e, id));
  }

  return (
    <PanelNexora
      titulo="Empresas"
      ayuda={
        <>
          <p>Aquí das de alta cada empresa que atienden y le ligas sus cuentas: su Instagram, su WhatsApp, su Facebook, su TikTok y su correo.</p>
          <p>Cada cuenta dice si ya está conectada (los mensajes llegan a la bandeja) o qué le falta para conectarse.</p>
        </>
      }
      pastilla={
        <PastillaCliente
          texto={creando ? "Nueva empresa" : actual.nombre}
          icono={
            <IconoCirculo>
              <Building2 size={18} aria-hidden />
            </IconoCirculo>
          }
        />
      }
      etiquetaLista="Empresas"
      lista={
        <>
          {esDueno ? (
            <BotonPildora
              className="mb-3 w-full"
              activo={creando}
              icono={<Plus size={16} aria-hidden />}
              onClick={() => setElegida(NUEVA)}
            >
              Agregar empresa
            </BotonPildora>
          ) : null}
          {empresas.length ? (
            <ul className="space-y-[11px]">
              {empresas.map((e) => {
                const conectadas = e.cuentas.filter((k) => k.estado === "conectada").length;
                return (
                  <li key={e.id}>
                    <PildoraLista
                      activa={!creando && e.id === actual?.id}
                      titulo={e.nombre}
                      detalle={
                        e.cuentas.length
                          ? `${e.cuentas.length === 1 ? "1 cuenta" : `${e.cuentas.length} cuentas`} · ${conectadas} conectada${conectadas === 1 ? "" : "s"}`
                          : "Sin cuentas todavía"
                      }
                      icono={
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-marco-2 text-marca-400">
                          <Building2 size={18} aria-hidden />
                        </span>
                      }
                      onClick={() => abrir(e.id)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2 py-1 text-sm text-tinta-2">Todavía no hay empresas.</p>
          )}
        </>
      }
      etiquetaPrincipal={creando ? "Nueva empresa" : `Empresa ${actual.nombre}`}
      modo="detalle"
      detalleAbierto={elegida !== null}
      onCerrarDetalle={() => setElegida(null)}
      encabezadoDetalle={<PastillaCliente texto={creando ? "Nueva empresa" : actual.nombre} icono={<Building2 size={18} aria-hidden />} />}
      principal={
        <ContenidoClaro>
          <div className="mx-auto max-w-2xl space-y-4">
            {creando ? (
              esDueno ? (
                <FormularioEmpresa key="nueva" onListo={(id) => abrir(id)} />
              ) : (
                <VacioClaro icono={<Building2 size={28} aria-hidden />} titulo="Elige una empresa" texto="Sólo el dueño puede agregar empresas." />
              )
            ) : (
              <>
                <FormularioEmpresa key={actual.id} empresa={actual} soloVer={!esDueno} />
                <Conexiones empresa={actual} soloVer={!esDueno} />
                {esDueno ? <BorrarEmpresa key={`borrar-${actual.id}`} empresa={actual} onBorrada={() => setElegida(null)} /> : null}
              </>
            )}
          </div>
        </ContenidoClaro>
      }
    />
  );
}

function Seccion({ titulo, children, detalle }: { titulo: string; detalle?: string; children: ReactNode }) {
  return (
    <HojaBlanca className="p-4 sm:p-5">
      <h2 className="text-[17px] font-bold text-chat-tinta">{titulo}</h2>
      {detalle ? <p className="mt-0.5 text-sm text-chat-tenue">{detalle}</p> : null}
      <div className="mt-3">{children}</div>
    </HojaBlanca>
  );
}

const CAMPO =
  "mt-1 h-11 w-full rounded-[6px] border border-[#cfd6e0] bg-white px-3 text-[16px] text-chat-tinta outline-none placeholder:text-[#9aa5b4] focus:border-marca-600 focus:ring-2 focus:ring-marca-600/25 disabled:bg-[#f2f4f7]";
const BOTON_AZUL =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-marca-600 px-5 text-[15px] font-bold text-white transition-colors hover:bg-marca-700 disabled:opacity-45";

function FormularioEmpresa({
  empresa,
  soloVer = false,
  onListo,
}: {
  empresa?: EmpresaCliente;
  soloVer?: boolean;
  onListo?: (id: string) => void;
}) {
  const [nombre, setNombre] = useState(empresa?.nombre ?? "");
  const [giro, setGiro] = useState(empresa && empresa.giro !== "Empresa" ? empresa.giro : "");
  const [guardando, setGuardando] = useState(false);
  const cambio = !empresa || nombre.trim() !== empresa.nombre || giro.trim() !== (empresa.giro === "Empresa" ? "" : empresa.giro);

  async function guardar(ev: FormEvent) {
    ev.preventDefault();
    if (!nombre.trim() || guardando) return;
    setGuardando(true);
    if (empresa) {
      const error = await editarEmpresa(empresa.id, nombre.trim(), giro.trim());
      avisar(error ?? "Cambios guardados");
    } else {
      const r = await crearEmpresa(nombre.trim(), giro.trim());
      if (r.error) avisar(r.error);
      else if (r.id) {
        avisar("Empresa agregada. Ahora ligale sus cuentas.");
        onListo?.(r.id);
      }
    }
    setGuardando(false);
  }

  return (
    <Seccion
      titulo={empresa ? "Datos de la empresa" : "Agregar una empresa"}
      detalle={empresa ? undefined : "La empresa que les encargó vender. Después le ligas sus cuentas."}
    >
      <form onSubmit={guardar} className="space-y-3">
        <label className="block text-sm font-semibold text-chat-tinta">
          Nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={soloVer}
            maxLength={120}
            placeholder="Por ejemplo: Inmobiliaria del Mar"
            className={CAMPO}
          />
        </label>
        <label className="block text-sm font-semibold text-chat-tinta">
          Qué vende <span className="font-normal text-chat-tenue">(opcional)</span>
          <input
            value={giro}
            onChange={(e) => setGiro(e.target.value)}
            disabled={soloVer}
            maxLength={120}
            placeholder="Por ejemplo: Condominios"
            className={CAMPO}
          />
        </label>
        {!soloVer ? (
          <button type="submit" disabled={!nombre.trim() || !cambio || guardando} className={BOTON_AZUL}>
            {empresa ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            {guardando ? "Guardando…" : empresa ? "Guardar cambios" : "Agregar empresa"}
          </button>
        ) : null}
      </form>
    </Seccion>
  );
}

function Conexiones({ empresa, soloVer }: { empresa: EmpresaCliente; soloVer: boolean }) {
  return (
    <Seccion titulo="Conexiones" detalle="Las cuentas de esta empresa en cada red. Los mensajes que les lleguen aparecen en la bandeja.">
      <ul className="divide-y divide-[#e6eaf0]">
        {ORDEN_REDES.map((red) => (
          <li key={red} className="py-3 first:pt-0 last:pb-0">
            <Conexion
              red={red}
              empresaId={empresa.id}
              cuentas={empresa.cuentas.filter((k) => k.red === red)}
              soloVer={soloVer}
            />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function Conexion({ red, empresaId, cuentas, soloVer }: { red: Red; empresaId: string; cuentas: CuentaCanal[]; soloVer: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [porQuitar, setPorQuitar] = useState<string | null>(null);
  const como = COMO_SE_LLAMA[red];

  async function agregar(ev: FormEvent) {
    ev.preventDefault();
    if (!valor.trim() || guardando) return;
    setGuardando(true);
    const error = await agregarCuenta(empresaId, red, valor.trim());
    setGuardando(false);
    if (error) avisar(error);
    else {
      avisar(`${nombreRed(red)} agregado`);
      setValor("");
      setAbierto(false);
    }
  }

  async function quitar(id: string) {
    const error = await quitarCuenta(id);
    setPorQuitar(null);
    avisar(error ?? `${nombreRed(red)} quitado`);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <CirculoRed red={red} />
        <p className="min-w-0 flex-1 text-[15px] font-bold text-chat-tinta">{nombreRed(red)}</p>
        {!soloVer && !abierto ? (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#cfd6e0] px-3 text-[13px] font-bold text-marca-600 hover:bg-[#f2f6fc]"
          >
            <Plus size={15} aria-hidden /> {cuentas.length ? "Otra" : "Agregar"}
          </button>
        ) : null}
      </div>

      {cuentas.length ? (
        <ul className="mt-2 space-y-2 pl-[50px]">
          {cuentas.map((k) => (
            <li key={k.id} className="rounded-[8px] bg-[#f5f7fa] px-3 py-2.5">
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[14.5px] font-semibold break-all text-chat-tinta">
                    <IconoRed red={red} tamano={14} /> {k.identificador}
                  </span>
                  <span
                    className={cx(
                      "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold",
                      k.estado === "conectada" ? "bg-[#dff0e4] text-[#1c6b3f]" : "bg-[#ffe7bd] text-[#7a4b00]",
                    )}
                  >
                    {k.estado === "conectada" ? <CircleCheck size={13} aria-hidden /> : <CircleDashed size={13} aria-hidden />}
                    {k.estado === "conectada" ? "Conectada" : "Falta conectar"}
                  </span>
                  {k.nota ? <span className="mt-1 block text-[12.5px] leading-snug text-chat-tenue">{k.nota}</span> : null}
                </span>
                {!soloVer ? (
                  porQuitar === k.id ? (
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[12px] font-semibold text-[#8e1b1b]">¿Quitarla? Se borran sus pláticas.</span>
                      <span className="flex gap-1.5">
                        <button type="button" onClick={() => setPorQuitar(null)} className="rounded-full px-2.5 py-1 text-[12.5px] font-bold text-chat-tenue hover:bg-white">
                          No
                        </button>
                        <button type="button" onClick={() => void quitar(k.id)} className="rounded-full bg-[#b42318] px-2.5 py-1 text-[12.5px] font-bold text-white">
                          Sí, quitar
                        </button>
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPorQuitar(k.id)}
                      aria-label={`Quitar ${k.identificador}`}
                      className="shrink-0 rounded-full p-1.5 text-chat-tenue hover:bg-white hover:text-[#b42318]"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  )
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : !abierto ? (
        <p className="mt-1 pl-[50px] text-[13px] text-chat-tenue">Sin cuenta todavía.</p>
      ) : null}

      {abierto ? (
        <form onSubmit={agregar} className="mt-2 pl-[50px]">
          <label className="block text-[13px] font-semibold text-chat-tinta">
            {como.etiqueta}
            <input
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={como.ejemplo}
              inputMode={red === "whatsapp" ? "tel" : red === "correo" ? "email" : "text"}
              autoCapitalize="none"
              maxLength={200}
              className={CAMPO}
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button type="submit" disabled={!valor.trim() || guardando} className={cx(BOTON_AZUL, "h-10 px-4 text-[14px]")}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setValor("");
              }}
              className="h-10 rounded-[6px] px-4 text-[14px] font-bold text-chat-tenue hover:bg-[#f2f4f7]"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function BorrarEmpresa({ empresa, onBorrada }: { empresa: EmpresaCliente; onBorrada: () => void }) {
  const [seguro, setSeguro] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    setBorrando(true);
    const error = await borrarEmpresa(empresa.id);
    setBorrando(false);
    if (error) avisar(error);
    else {
      actualizarEstado((e) => elegirEmpresa(e, null));
      avisar(`${empresa.nombre} borrada`);
      onBorrada();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
      {seguro ? (
        <>
          <p className="text-sm font-semibold text-[#8e1b1b]">Se borran la empresa, sus cuentas y todas sus pláticas. No se puede deshacer.</p>
          <button type="button" onClick={() => setSeguro(false)} className="h-10 rounded-[6px] px-4 text-[14px] font-bold text-chat-tenue hover:bg-white/60">
            Cancelar
          </button>
          <button
            type="button"
            disabled={borrando}
            onClick={() => void borrar()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[6px] bg-[#b42318] px-4 text-[14px] font-bold text-white disabled:opacity-50"
          >
            <Trash2 size={16} aria-hidden /> {borrando ? "Borrando…" : "Sí, borrar"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setSeguro(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-[6px] px-3 text-[14px] font-bold text-[#b42318] hover:bg-white/60"
        >
          <Trash2 size={16} aria-hidden /> Borrar esta empresa
        </button>
      )}
    </div>
  );
}

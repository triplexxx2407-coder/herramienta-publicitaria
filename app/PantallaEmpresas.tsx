"use client";

import { Building2, Plus, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { avisar } from "@/components/avisos";
import { BOTON, BOTON_CLARO, BOTON_PELIGRO, CAMPO, Cargando, Encabezado, Etiqueta, Tarjeta, Vacio, cx } from "@/components/ui";
import { borrarEmpresa, crearEmpresa, editarEmpresa, elegirEmpresa, useEmpresaActiva, useFuente } from "@/lib/fuente";
import type { EmpresaCliente } from "@/lib/tipos";

const NUEVA = "nueva";

/** Dar de alta las empresas que promociona el equipo. Cada una tiene sus propias estadísticas. */
export function PantallaEmpresas() {
  const { modo, usuario, empresas } = useFuente();
  const activa = useEmpresaActiva();
  const [abierta, setAbierta] = useState<string | null>(null);

  if (modo === "revisando") return <Cargando />;
  if (modo !== "real") {
    return <Vacio icono={<Building2 size={26} aria-hidden />} titulo="Abre NEXORA desde su dirección" texto="Esta pantalla sólo funciona entrando a NEXORA en su dirección de Cloudflare." />;
  }
  const esDueno = usuario?.papel === "dueño";
  const actual = empresas.find((e) => e.id === abierta) ?? null;

  return (
    <div className="entrada space-y-6">
      <Encabezado
        titulo="Perfiles"
        frase="Un perfil es una empresa que promocionas. Cada una lleva sus propios videos, enlaces, estadísticas y mensajes, sin mezclarse."
        derecha={
          esDueno ? (
            <button type="button" onClick={() => setAbierta(NUEVA)} className={BOTON}>
              <Plus size={17} aria-hidden /> Agregar empresa
            </button>
          ) : null
        }
      />

      {abierta === NUEVA || actual ? (
        <Formulario key={actual?.id ?? NUEVA} empresa={actual} soloVer={!esDueno} alTerminar={(id) => setAbierta(id)} />
      ) : null}

      {empresas.length === 0 ? (
        <Vacio icono={<Building2 size={26} aria-hidden />} titulo="Todavía no hay perfiles" texto="Agrega la primera empresa que promocionas.">
          {esDueno ? (
            <button type="button" onClick={() => setAbierta(NUEVA)} className={BOTON}>
              <Plus size={17} aria-hidden /> Agregar empresa
            </button>
          ) : null}
        </Vacio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {empresas.map((e) => {
            const viendo = activa?.id === e.id;
            return (
              <li key={e.id} className={cx("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border bg-tarjeta p-4 shadow-tarjeta", viendo ? "border-marca-500" : "border-linea")}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marca-50 text-marca-600">
                  <Building2 size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-[16px] font-bold text-tinta">{e.nombre}</p>
                  <p className="truncate text-[13px] text-suave">{e.giro}</p>
                </div>
                {viendo ? (
                  <span className="rounded-full bg-marca-50 px-2.5 py-1 text-[12px] font-semibold text-marca-600">Viendo</span>
                ) : (
                  <button type="button" onClick={() => elegirEmpresa(e.id)} className="rounded-full border border-linea px-3 py-1.5 text-[13px] font-semibold text-tinta-2 hover:bg-relleno">
                    Ver
                  </button>
                )}
                <button type="button" onClick={() => setAbierta(e.id)} className="rounded-full border border-linea px-3 py-1.5 text-[13px] font-semibold text-tinta-2 hover:bg-relleno">
                  {esDueno ? "Editar" : "Abrir"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Formulario({ empresa, soloVer, alTerminar }: { empresa: EmpresaCliente | null; soloVer: boolean; alTerminar: (id: string | null) => void }) {
  const [nombre, setNombre] = useState(empresa?.nombre ?? "");
  const [giro, setGiro] = useState(empresa && empresa.giro !== "Empresa" ? empresa.giro : "");
  const [ocupado, setOcupado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(false);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!nombre.trim() || ocupado || soloVer) return;
    setOcupado(true);
    if (empresa) {
      const error = await editarEmpresa(empresa.id, nombre.trim(), giro.trim());
      avisar(error ?? "Cambios guardados");
    } else {
      const r = await crearEmpresa(nombre.trim(), giro.trim());
      if (r.error) avisar(r.error);
      else if (r.id) {
        elegirEmpresa(r.id);
        avisar("Empresa agregada");
        alTerminar(null);
      }
    }
    setOcupado(false);
  }

  async function borrar() {
    if (!empresa) return;
    setOcupado(true);
    const error = await borrarEmpresa(empresa.id);
    setOcupado(false);
    if (error) avisar(error);
    else {
      avisar(`${empresa.nombre} borrada`);
      alTerminar(null);
    }
  }

  return (
    <Tarjeta titulo={empresa ? empresa.nombre : "Agregar una empresa"}>
      <form onSubmit={enviar} className="space-y-3">
        <Etiqueta texto="Nombre">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={soloVer} maxLength={120} placeholder="Por ejemplo: Condominios del Mar" className={CAMPO} />
        </Etiqueta>
        <Etiqueta texto="Qué vende" opcional>
          <input value={giro} onChange={(e) => setGiro(e.target.value)} disabled={soloVer} maxLength={120} placeholder="Por ejemplo: Condominios en construcción" className={CAMPO} />
        </Etiqueta>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!soloVer ? (
            <button type="submit" disabled={!nombre.trim() || ocupado} className={BOTON}>
              {empresa ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
              {ocupado ? "Guardando…" : empresa ? "Guardar" : "Agregar"}
            </button>
          ) : null}
          <button type="button" onClick={() => alTerminar(null)} className={BOTON_CLARO}>Cerrar</button>
          {empresa && !soloVer ? (
            porBorrar ? (
              <>
                <span className="text-sm font-semibold text-[#b42318]">Se borra todo lo de esta empresa.</span>
                <button type="button" disabled={ocupado} onClick={() => void borrar()} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#b42318] px-4 text-[15px] font-semibold text-white">
                  <Trash2 size={16} aria-hidden /> Sí, borrar
                </button>
              </>
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

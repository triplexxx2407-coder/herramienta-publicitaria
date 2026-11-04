"use client";

import { ChevronDown, UserPlus } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { avisar } from "@/components/avisos";
import { Hoja } from "@/components/Hoja";
import { Boton, Campo, PildoraSemaforo, cx } from "@/components/ui";
import { actualizarEstado, useEstado } from "@/lib/almacen";
import { CIUDADES, GIROS } from "@/lib/catalogos";
import { agregarContactos, contactoManual, correoValido, normalizarCorreo } from "@/lib/contactos";

/** Ventana para agregar un contacto a mano (queda en ámbar si dices de dónde salió, o en rojo si no). */
export function HojaContactoManual({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const idFormulario = useId();
  return (
    <Hoja
      abierta={abierta}
      onCerrar={onCerrar}
      titulo="Agregar a mano"
      descripcion="Para alguien que conociste o que te recomendaron."
      pie={
        <div className="flex gap-2">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form={idFormulario} className="flex-1" icono={<UserPlus size={18} aria-hidden />}>
            Agregar contacto
          </Boton>
        </div>
      }
    >
      <Formulario id={idFormulario} onListo={onCerrar} />
    </Hoja>
  );
}

const VACIO = { nombre: "", correo: "", giro: "", ciudad: "tijuana", telefono: "", nota: "" };

function Formulario({ id, onListo }: { id: string; onListo: () => void }) {
  const estado = useEstado();
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<{ nombre?: string; correo?: string }>({});
  const ambar = !!datos.nota.trim();

  function cambiar(campo: keyof typeof VACIO, valor: string) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (campo === "nombre" || campo === "correo") setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  function guardar(ev: FormEvent) {
    ev.preventDefault();
    const nuevos: typeof errores = {};
    if (!datos.nombre.trim()) nuevos.nombre = "Escribe el nombre.";
    if (!datos.correo.trim()) nuevos.correo = "Escribe el correo.";
    else if (!correoValido(datos.correo)) nuevos.correo = "Ese correo no parece válido.";
    else if (estado.contactos.some((c) => normalizarCorreo(c.correo) === normalizarCorreo(datos.correo))) {
      nuevos.correo = "Ese correo ya está en tu lista.";
    }
    setErrores(nuevos);
    if (nuevos.nombre || nuevos.correo) return;
    const contacto = contactoManual(datos);
    actualizarEstado((e) => agregarContactos(e, [contacto]));
    avisar(ambar ? "Agregado en ámbar" : "Agregado en rojo: no se podrá usar");
    onListo();
  }

  return (
    <form id={id} onSubmit={guardar} noValidate className="space-y-4">
      <div>
        <Campo
          etiqueta="Nombre del negocio o de la persona"
          value={datos.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          aria-invalid={!!errores.nombre}
          autoComplete="off"
        />
        <MensajeError texto={errores.nombre} />
      </div>
      <div>
        <Campo
          etiqueta="Correo"
          type="email"
          inputMode="email"
          value={datos.correo}
          onChange={(e) => cambiar("correo", e.target.value)}
          aria-invalid={!!errores.correo}
          autoComplete="off"
          placeholder="nombre@empresa.com"
        />
        <MensajeError texto={errores.correo} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Giro" valor={datos.giro} onChange={(v) => cambiar("giro", v)}>
          <option value="">Otro o no sé</option>
          {GIROS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Ciudad" valor={datos.ciudad} onChange={(v) => cambiar("ciudad", v)}>
          {CIUDADES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Seleccion>
      </div>
      <Campo
        etiqueta="Teléfono (si lo tienes)"
        type="tel"
        inputMode="tel"
        value={datos.telefono}
        onChange={(e) => cambiar("telefono", e.target.value)}
        autoComplete="off"
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-tinta-2">¿De dónde sacaste este contacto?</span>
        <textarea
          value={datos.nota}
          onChange={(e) => cambiar("nota", e.target.value)}
          rows={2}
          placeholder="Ej.: me dio su tarjeta en una expo"
          className="w-full rounded-xl border border-linea bg-white px-3.5 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-tenue focus:border-marca-500 focus:ring-4 focus:ring-marca-100"
        />
      </label>

      <div
        role="status"
        className={cx(
          "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm",
          ambar ? "bg-ambar-50 text-ambar-700" : "bg-rojo-50 text-rojo-700",
        )}
      >
        <PildoraSemaforo valor={ambar ? "ambar" : "rojo"} texto={`Quedará en: ${ambar ? "Ámbar" : "Rojo"}`} />
        <span className="pt-0.5 font-medium">
          {ambar ? "Lo podrás elegir para escribirle." : "Si no dices de dónde salió, no se podrá usar."}
        </span>
      </div>
    </form>
  );
}

function MensajeError({ texto }: { texto?: string }) {
  return texto ? (
    <p role="alert" className="mt-1.5 text-sm font-semibold text-rojo-700">
      {texto}
    </p>
  ) : null;
}

function Seleccion({
  etiqueta,
  valor,
  onChange,
  children,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-tinta-2">{etiqueta}</span>
      <span className="relative block">
        <select
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-linea bg-white pr-10 pl-3.5 text-[15px] text-tinta outline-none focus:border-marca-500 focus:ring-4 focus:ring-marca-100"
        >
          {children}
        </select>
        <ChevronDown size={18} aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-tenue" />
      </span>
    </label>
  );
}

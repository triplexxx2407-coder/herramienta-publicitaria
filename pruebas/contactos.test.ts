import { describe, expect, it } from "vitest";
import {
  alternarSeleccion,
  agregarContactos,
  contactoDesdeEmpresa,
  contactoManual,
  contactosParaRedactar,
  marcarNoContactar,
  puedeRedactar,
  semaforoDe,
} from "@/lib/contactos";
import { estadoDeRecorrido, estadoInicial } from "@/lib/estado";
import type { Contacto, EstadoDemo } from "@/lib/tipos";

const verde = contactoDesdeEmpresa(
  { id: "v1", nombre: "Verde (ejemplo)", giro: "hoteles", ciudad: "tijuana", estrato: 3, telefono: null, correo: "verde@example.com", sitioWeb: null },
  "Datos de ejemplo",
  true,
);
const rojo = contactoManual({ nombre: "Rojo", correo: "rojo@example.com", giro: "", ciudad: "" });
const ambar = contactoManual({ nombre: "Ámbar", correo: "ambar@example.com", giro: "", ciudad: "", nota: "Me dio su tarjeta" });

function con(...contactos: Contacto[]): EstadoDemo {
  return agregarContactos(estadoInicial(), contactos);
}

describe("semáforo", () => {
  it("directorio público es verde; manual con nota es ámbar; manual sin nota es rojo", () => {
    expect(semaforoDe(verde.origen)).toBe("verde");
    expect(semaforoDe(ambar.origen)).toBe("ambar");
    expect(semaforoDe(rojo.origen)).toBe("rojo");
  });

  it("una nota de puros espacios cuenta como sin origen (rojo)", () => {
    const c = contactoManual({ nombre: "X", correo: "x@example.com", giro: "", ciudad: "", nota: "   " });
    expect(semaforoDe(c.origen)).toBe("rojo");
    expect(semaforoDe({ tipo: "declarado", fuente: "x", fecha: "", nota: "" })).toBe("rojo");
  });
});

describe("un contacto en rojo nunca pasa a redactar", () => {
  it("no se puede elegir", () => {
    const e = alternarSeleccion(con(rojo), rojo.id);
    expect(e.seleccionados).not.toContain(rojo.id);
  });

  it("aunque se fuerce en la selección guardada, no aparece en Redactar", () => {
    const e = { ...con(verde, rojo, ambar), seleccionados: [verde.id, rojo.id, ambar.id] };
    const ids = contactosParaRedactar(e).map((c) => c.id);
    expect(ids).toEqual([verde.id, ambar.id]);
    expect(puedeRedactar(rojo, e)).toBe(false);
  });

  it("un contacto sin correo tampoco pasa", () => {
    const sinCorreo = { ...verde, id: "sc", correo: null };
    const e = { ...con(sinCorreo), seleccionados: ["sc"] };
    expect(contactosParaRedactar(e)).toEqual([]);
  });
});

describe("«No contactar» nunca pasa a redactar", () => {
  it("al marcarlo sale de la selección y de los borradores", () => {
    let e = alternarSeleccion(con(verde), verde.id);
    e = { ...e, borradores: { [verde.id]: { contactoId: verde.id, asunto: "a", cuerpo: "b", estado: "aprobado" } } };
    e = marcarNoContactar(e, verde.id);
    expect(e.seleccionados).toEqual([]);
    expect(e.borradores[verde.id]).toBeUndefined();
    expect(contactosParaRedactar(e)).toEqual([]);
  });

  it("no se puede volver a elegir", () => {
    const e = marcarNoContactar(con(verde), verde.id);
    expect(alternarSeleccion(e, verde.id).seleccionados).toEqual([]);
  });

  it("aunque se fuerce en la selección guardada, no aparece en Redactar", () => {
    const e = { ...marcarNoContactar(con(verde), verde.id), seleccionados: [verde.id] };
    expect(contactosParaRedactar(e)).toEqual([]);
  });

  it("si se vuelve a agregar con otro id pero el mismo correo, sigue bloqueado", () => {
    let e = marcarNoContactar(con(verde), verde.id);
    const otraVez = { ...verde, id: "v1-otra-vez", correo: "VERDE@example.com " };
    e = agregarContactos(e, [otraVez]);
    e = alternarSeleccion(e, otraVez.id);
    expect(e.seleccionados).toEqual([]);
    expect(contactosParaRedactar({ ...e, seleccionados: [otraVez.id] })).toEqual([]);
  });
});

describe("recorrido de ejemplo", () => {
  it("sólo trae contactos verdes de ejemplo con correo y aprobados", () => {
    const e = estadoDeRecorrido();
    const listos = contactosParaRedactar(e);
    expect(listos.length).toBeGreaterThan(0);
    for (const c of listos) {
      expect(c.esEjemplo).toBe(true);
      expect(c.correo).toMatch(/@example\.com$/);
      expect(e.borradores[c.id]?.estado).toBe("aprobado");
    }
  });
});

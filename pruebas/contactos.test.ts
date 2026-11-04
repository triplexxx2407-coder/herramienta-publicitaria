import { describe, expect, it } from "vitest";
import {
  alternarSeleccion,
  agregarContactos,
  agregarYElegir,
  contactoDesdeEmpresa,
  contactoManual,
  contactosParaRedactar,
  deshacerNoContactar,
  marcarNoContactar,
  nombreVisible,
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

describe("agregar y elegir en un solo paso", () => {
  it("elige sólo a los nuevos que se pueden usar", () => {
    const sinCorreo = contactoDesdeEmpresa(
      { id: "s1", nombre: "Sin correo (ejemplo)", giro: "hoteles", ciudad: "tijuana", estrato: 2, telefono: "664", correo: null, sitioWeb: null },
      "Datos de ejemplo",
      true,
    );
    const e = agregarYElegir(estadoInicial(), [verde, ambar, rojo, sinCorreo]);
    expect(e.contactos).toHaveLength(4);
    expect(e.seleccionados.sort()).toEqual([ambar.id, verde.id].sort());
    expect(contactosParaRedactar(e).map((c) => c.id)).not.toContain(rojo.id);
  });

  it("no vuelve a elegir a alguien que ya estaba en la lista y se quitó", () => {
    let e = agregarYElegir(estadoInicial(), [verde]);
    e = alternarSeleccion(e, verde.id);
    expect(e.seleccionados).toEqual([]);
    e = agregarYElegir(e, [verde, ambar]);
    expect(e.seleccionados).toEqual([ambar.id]);
  });

  it("un correo en «No contactar» se agrega pero no se elige", () => {
    let e = agregarYElegir(estadoInicial(), [verde]);
    e = marcarNoContactar(e, verde.id);
    const otraVez = { ...verde, id: "v1-bis" };
    e = agregarYElegir(e, [otraVez]);
    expect(e.seleccionados).not.toContain("v1-bis");
    expect(contactosParaRedactar(e)).toHaveLength(0);
  });

  it("quita el «(ejemplo)» del nombre sólo al final", () => {
    expect(nombreVisible("Hotel Sol (ejemplo)")).toBe("Hotel Sol");
    expect(nombreVisible("Hotel (ejemplo) Sol")).toBe("Hotel (ejemplo) Sol");
  });

  it("no toca el nombre de un contacto que no es de ejemplo", () => {
    expect(nombreVisible("Hotel Sol (ejemplo)", false)).toBe("Hotel Sol (ejemplo)");
  });
});

describe("deshacer «No contactar» tocado por error", () => {
  it("lo devuelve elegido y con su borrador", () => {
    const antes: EstadoDemo = {
      ...agregarYElegir(estadoInicial(), [verde]),
      borradores: { [verde.id]: { contactoId: verde.id, asunto: "A", cuerpo: "B", estado: "aprobado" } },
    };
    const marcado = marcarNoContactar(antes, verde.id);
    expect(contactosParaRedactar(marcado)).toHaveLength(0);
    const vuelto = deshacerNoContactar(marcado, antes, verde.id);
    expect(vuelto.supresion).toHaveLength(0);
    expect(vuelto.seleccionados).toEqual([verde.id]);
    expect(vuelto.borradores[verde.id]?.estado).toBe("aprobado");
    expect(contactosParaRedactar(vuelto).map((c) => c.id)).toEqual([verde.id]);
  });

  it("no quita a quien ya estaba en «No contactar» desde antes", () => {
    const antes = marcarNoContactar(agregarYElegir(estadoInicial(), [verde]), verde.id);
    expect(deshacerNoContactar(antes, antes, verde.id)).toBe(antes);
  });
});

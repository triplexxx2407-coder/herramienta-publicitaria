import { afterEach, describe, expect, it, vi } from "vitest";
import empresasJson from "@/datos/empresas-ejemplo.json";
import {
  contactoDesdeEmpresa,
  elegirEmpresas,
  estaSuprimido,
  FUENTE_EJEMPLO,
  listosParaEnviar,
  marcarNoContactar,
  porEscribir,
  puedeRedactar,
  quitarDeSeleccion,
} from "@/lib/contactos";
import {
  enviarSimulado,
  enviosHechos,
  marcarLeida,
  ordenarPlaticas,
  pideBaja,
  platicas,
  responderEnChat,
  respuestasDeEjemplo,
} from "@/lib/envio";
import { estadoDeRecorrido, estadoInicial, leerEstadoGuardado } from "@/lib/estado";
import type { Empresa, EstadoDemo } from "@/lib/tipos";

const EMPRESAS = empresasJson as Empresa[];
const AHORA = new Date("2026-11-04T20:00:00Z");

afterEach(() => vi.restoreAllMocks());

describe("buscar y elegir en la misma lista", () => {
  const tijuana = EMPRESAS.filter((e) => e.ciudad === "tijuana");

  it("elige las que tienen correo y deja fuera las que no", () => {
    const e = elegirEmpresas(estadoInicial(), tijuana, FUENTE_EJEMPLO, true, AHORA);
    const conCorreo = tijuana.filter((x) => x.correo).map((x) => x.id);
    expect([...e.seleccionados].sort()).toEqual([...conCorreo].sort());
    expect(e.seleccionados).not.toContain(tijuana.find((x) => !x.correo)?.id);
  });

  it("no vuelve a elegir a quien ya está en «No contactar» ni a quien ya le escribiste", () => {
    let e = estadoDeRecorrido(AHORA);
    const [a, b] = listosParaEnviar(e);
    e = marcarNoContactar(e, a.id, AHORA);
    e = enviarSimulado({ ...e, seleccionados: [b.id] }, AHORA);
    e = quitarDeSeleccion(e, e.seleccionados);
    e = elegirEmpresas(e, tijuana, FUENTE_EJEMPLO, true, AHORA);
    expect(e.seleccionados).not.toContain(a.id);
    expect(e.seleccionados).not.toContain(b.id);
    expect(porEscribir(e).map((c) => c.id)).not.toContain(b.id);
  });

  it("quitar de la selección no borra el borrador", () => {
    const e = estadoDeRecorrido(AHORA);
    const id = e.seleccionados[0];
    const sin = quitarDeSeleccion(e, [id]);
    expect(sin.seleccionados).not.toContain(id);
    expect(sin.borradores[id]).toBeDefined();
  });
});

describe("envío simulado", () => {
  it("no usa la red: no llama a ningún servicio", () => {
    const red = vi.spyOn(globalThis, "fetch");
    enviarSimulado(estadoDeRecorrido(AHORA), AHORA);
    expect(red).not.toHaveBeenCalled();
  });

  it("sólo envía los aprobados y permitidos, y cada uno lleva el pie legal", () => {
    let e = estadoDeRecorrido(AHORA);
    const [pendiente, bloqueado] = listosParaEnviar(e);
    e = { ...e, borradores: { ...e.borradores, [pendiente.id]: { ...e.borradores[pendiente.id], estado: "pendiente" } } };
    e = marcarNoContactar(e, bloqueado.id, AHORA);
    const despues = enviarSimulado(e, AHORA);
    const enviados = Object.values(despues.enviados);
    expect(enviados.length).toBe(listosParaEnviar(e).length);
    expect(despues.enviados[pendiente.id]).toBeUndefined();
    expect(despues.enviados[bloqueado.id]).toBeUndefined();
    for (const c of enviados) {
      expect(c.texto).toContain("responde con la palabra BAJA");
      expect(c.para).toMatch(/@example\.com$/);
    }
  });

  it("lo enviado sale de «Redactar» y de la selección", () => {
    const despues = enviarSimulado(estadoDeRecorrido(AHORA), AHORA);
    expect(porEscribir(despues)).toEqual([]);
    expect(listosParaEnviar(despues)).toEqual([]);
    expect(despues.seleccionados).toEqual([]);
  });

  it("anota la hora de cada envío, uno tras otro y nunca en el futuro", () => {
    const e = enviarSimulado(estadoDeRecorrido(AHORA), AHORA);
    const fechas = enviosHechos(e).map((x) => x.correo.fecha);
    expect(new Set(fechas).size).toBe(fechas.length);
    for (const f of fechas) expect(new Date(f).getTime()).toBeLessThan(AHORA.getTime());
    for (const p of platicas(e)) {
      expect(p.respuesta.fecha > p.correo.fecha).toBe(true);
      expect(new Date(p.respuesta.fecha).getTime()).toBeLessThanOrEqual(AHORA.getTime());
    }
  });

  it("enviar dos veces no duplica nada", () => {
    const una = enviarSimulado(estadoDeRecorrido(AHORA), AHORA);
    expect(enviarSimulado(una, AHORA)).toBe(una);
  });
});

describe("respuestas de ejemplo", () => {
  it("contestan 4 de cada 10, siempre los mismos, y uno pide BAJA si contestan 3 o más", () => {
    const contactos = listosParaEnviar(estadoDeRecorrido(AHORA));
    const r1 = respuestasDeEjemplo(contactos);
    const r2 = respuestasDeEjemplo([...contactos].reverse());
    expect(r1.size).toBe(Math.ceil(contactos.length * 0.4));
    expect([...r1.entries()].sort()).toEqual([...r2.entries()].sort());
    expect([...r1.values()].filter(pideBaja).length).toBe(r1.size >= 3 ? 1 : 0);
  });

  it("quien contesta BAJA queda en «No contactar» y ya no se puede elegir ni escribirle", () => {
    const e = enviarSimulado(estadoDeRecorrido(AHORA), AHORA);
    const baja = platicas(e).find((p) => p.baja);
    expect(baja).toBeDefined();
    expect(estaSuprimido(baja!.contacto, e)).toBe(true);
    expect(puedeRedactar(baja!.contacto, e)).toBe(false);
    expect(responderEnChat(e, baja!.contacto.id, "Hola otra vez", AHORA)).toBe(e);
    // El correo enviado se queda como prueba.
    expect(e.enviados[baja!.contacto.id]).toBeDefined();
  });
});

describe("chat", () => {
  const conRespuestas = () => enviarSimulado(estadoDeRecorrido(AHORA), AHORA);

  it("sólo aparecen los que contestaron", () => {
    const e = conRespuestas();
    const lista = platicas(e);
    expect(lista.length).toBe(enviosHechos(e).filter((x) => x.respuesta).length);
    expect(lista.length).toBeGreaterThan(0);
    for (const p of lista) expect(p.mensajes.some((m) => m.de === "ellos")).toBe(true);
  });

  it("se ordena por fecha del último mensaje y por nombre", () => {
    const lista = platicas(conRespuestas());
    const nombres = (orden: Parameters<typeof ordenarPlaticas>[1]) =>
      ordenarPlaticas(lista, orden).map((p) => p.contacto.nombre);
    const az = nombres("az");
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })));
    expect(nombres("za")).toEqual([...az].reverse());
    const recientes = ordenarPlaticas(lista, "recientes").map((p) => p.ultimo.fecha);
    expect(recientes).toEqual([...recientes].sort().reverse());
    expect(ordenarPlaticas(lista, "antiguos").map((p) => p.ultimo.fecha)).toEqual([...recientes].reverse());
  });

  it("tu respuesta queda al final, la plática sube a «más recientes» y queda leída", () => {
    const e = conRespuestas();
    const lista = platicas(e);
    const viejo = ordenarPlaticas(lista, "antiguos").find((p) => !p.baja)!;
    const despues = responderEnChat(e, viejo.contacto.id, "  Con gusto le mando los planos.  ", new Date(AHORA.getTime() + 600_000));
    const mensajes = despues.chats[viejo.contacto.id];
    expect(mensajes[mensajes.length - 1]).toMatchObject({ de: "yo", texto: "Con gusto le mando los planos." });
    expect(ordenarPlaticas(platicas(despues), "recientes")[0].contacto.id).toBe(viejo.contacto.id);
    expect(platicas(despues).find((p) => p.contacto.id === viejo.contacto.id)?.noLeida).toBe(false);
    expect(responderEnChat(despues, viejo.contacto.id, "   ")).toBe(despues);
  });

  it("las respuestas nuevas llegan sin leer y al abrir quedan leídas", () => {
    const e = conRespuestas();
    const p = platicas(e)[0];
    expect(p.noLeida).toBe(true);
    const leida = marcarLeida(e, p.contacto.id);
    expect(platicas(leida).find((x) => x.contacto.id === p.contacto.id)?.noLeida).toBe(false);
    expect(marcarLeida(leida, p.contacto.id)).toBe(leida);
  });
});

describe("lo guardado por la versión anterior", () => {
  it("se abre sin perder nada y con envíos y pláticas vacíos", () => {
    const viejo = estadoDeRecorrido(AHORA) as Partial<EstadoDemo>;
    delete viejo.enviados;
    delete viejo.chats;
    delete viejo.leidos;
    const e = leerEstadoGuardado(JSON.stringify(viejo));
    expect(e.contactos.length).toBe(viejo.contactos!.length);
    expect(e.enviados).toEqual({});
    expect(e.chats).toEqual({});
    expect(e.leidos).toEqual({});
  });

  it("un contacto nuevo de Buscar no trae nada enviado", () => {
    const c = contactoDesdeEmpresa(EMPRESAS[0], FUENTE_EJEMPLO, true, AHORA);
    const e = elegirEmpresas(estadoInicial(), [EMPRESAS[0]], FUENTE_EJEMPLO, true, AHORA);
    expect(e.enviados[c.id]).toBeUndefined();
  });
});

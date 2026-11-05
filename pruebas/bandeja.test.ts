import { describe, expect, it } from "vitest";
import bandejaJson from "@/datos/bandeja-ejemplo.json";
import {
  EMPRESAS,
  anclajeDeSesion,
  conversaciones,
  cuentaYEmpresa,
  elegirEmpresa,
  ficha,
  marcarLeidaRed,
  plazo,
  responderEnRed,
  sePuedeContestar,
  sinLeer,
  sinLeerPorEmpresa,
  sinLeerPorRed,
} from "@/lib/bandeja";
import { estadoInicial, leerEstadoGuardado } from "@/lib/estado";
import { ORDEN_REDES, REDES } from "@/lib/redes";
import type { ConversacionEjemplo } from "@/lib/tipos";

const EJEMPLOS = bandejaJson as ConversacionEjemplo[];
/** Un anclaje fijo, para que las horas de ejemplo no dependan de cuándo se corre la prueba. */
const ANCLAJE = new Date("2026-11-05T18:00:00Z").getTime();
const AHORA = new Date(ANCLAJE);

describe("datos de ejemplo de la bandeja", () => {
  it("todas las pláticas traen una red conocida y al menos un mensaje", () => {
    expect(EJEMPLOS.length).toBeGreaterThan(0);
    for (const e of EJEMPLOS) {
      expect(ORDEN_REDES).toContain(e.red);
      expect(e.mensajes.length).toBeGreaterThan(0);
      expect(e.persona).not.toBe("");
      expect(e.usuario).not.toBe("");
    }
  });

  it("los ids no se repiten", () => {
    const ids = EJEMPLOS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("los correos de ejemplo usan example.com", () => {
    for (const e of EJEMPLOS) {
      if (e.red === "correo") expect(e.usuario).toMatch(/@example\.com$/);
    }
  });

  it("cada plática empieza con un mensaje de la persona, porque las redes no dejan escribir primero", () => {
    for (const e of EJEMPLOS) {
      if (!REDES[e.red].puedeIniciar) expect(e.mensajes[0].de).toBe("ellos");
    }
  });
});

describe("conversaciones", () => {
  it("van de la más reciente a la más vieja", () => {
    const lista = conversaciones(estadoInicial(), ANCLAJE);
    expect(lista.length).toBe(EJEMPLOS.length);
    const fechas = lista.map((c) => c.ultimo.fecha);
    expect([...fechas].sort((a, b) => b.localeCompare(a))).toEqual(fechas);
  });

  it("marca sin leer sólo las que terminan con un mensaje de la persona", () => {
    const lista = conversaciones(estadoInicial(), ANCLAJE);
    for (const c of lista) expect(c.noLeida).toBe(c.ultimo.de === "ellos");
    // wa-laura termina con una respuesta mía, así que no cuenta como nueva.
    expect(lista.find((c) => c.id === "wa-laura")?.noLeida).toBe(false);
    expect(sinLeer(lista)).toBe(lista.filter((c) => c.ultimo.de === "ellos").length);
  });

  it("cuenta las nuevas por red", () => {
    const porRed = sinLeerPorRed(conversaciones(estadoInicial(), ANCLAJE));
    // Instagram: Laura, Salvador (condominios) y Mario (autos). WhatsApp: Jorge y Elena.
    expect(porRed.instagram).toBe(3);
    expect(porRed.whatsapp).toBe(2);
  });

  it("los mensajes de cada plática quedan en orden", () => {
    for (const c of conversaciones(estadoInicial(), ANCLAJE)) {
      const fechas = c.mensajes.map((m) => m.fecha);
      expect([...fechas].sort()).toEqual(fechas);
      expect(c.ultimo).toBe(c.mensajes[c.mensajes.length - 1]);
    }
  });
});

describe("plazo para contestar", () => {
  const lista = conversaciones(estadoInicial(), ANCLAJE);
  const de = (id: string) => lista.find((c) => c.id === id)!;

  it("el correo no tiene plazo", () => {
    expect(plazo(de("co-patricia"), AHORA)).toBeNull();
    expect(sePuedeContestar(de("co-patricia"), AHORA)).toBe(true);
  });

  it("Instagram da 24 horas desde el mensaje de la persona", () => {
    // ig-laura escribió hace 4 minutos: quedan 23 horas y 56 minutos.
    const p = plazo(de("ig-laura"), AHORA)!;
    expect(p.minutosRestantes).toBe(24 * 60 - 4);
    expect(p.vencido).toBe(false);
    expect(p.urgente).toBe(false);
    expect(p.texto).toBe("Te quedan 23 horas para contestar");
  });

  it("avisa cuando ya casi se acaba", () => {
    // ig-chava escribió hace 22 horas: quedan 2.
    const p = plazo(de("ig-chava"), AHORA)!;
    expect(p.urgente).toBe(true);
    expect(p.vencido).toBe(false);
    expect(p.texto).toBe("Te quedan 2 horas para contestar");
  });

  it("TikTok da 48 horas y las marca vencidas después", () => {
    expect(REDES.tiktok.plazoHoras).toBe(48);
    // tt-diana escribió hace 118 minutos, así que todavía hay tiempo.
    expect(plazo(de("tt-diana"), AHORA)!.vencido).toBe(false);
    // tt-carlos escribió hace 3000 minutos (50 horas): se pasó.
    const p = plazo(de("tt-carlos"), AHORA)!;
    expect(p.vencido).toBe(true);
    expect(p.texto).toBe("Se pasó el plazo para contestar");
    expect(sePuedeContestar(de("tt-carlos"), AHORA)).toBe(false);
  });

  it("el plazo corre desde el mensaje de la persona, no desde mi respuesta", () => {
    // En wa-laura ella escribió hace 200 minutos y yo contesté hace 180.
    const p = plazo(de("wa-laura"), AHORA)!;
    expect(p.minutosRestantes).toBe(24 * 60 - 200);
  });

  it("en minutos cuando falta menos de una hora", () => {
    const tarde = new Date(ANCLAJE + 23.5 * 60 * 60 * 1000);
    const p = plazo(de("ig-laura"), tarde)!;
    expect(p.texto).toBe("Te quedan 26 min para contestar");
    expect(p.urgente).toBe(true);
  });
});

describe("contestar (simulación)", () => {
  it("guarda la respuesta, la deja al final y marca la plática como leída", () => {
    const despues = new Date(ANCLAJE + 2 * 60_000);
    const estado = responderEnRed(estadoInicial(), "ig-laura", "  Claro, Laura. Le mando fotos.  ", ANCLAJE, despues);
    expect(estado.respuestasRed["ig-laura"]).toHaveLength(1);
    // Se guarda sin los espacios de sobra y con los minutos desde el anclaje.
    expect(estado.respuestasRed["ig-laura"][0].texto).toBe("Claro, Laura. Le mando fotos.");
    expect(estado.respuestasRed["ig-laura"][0].minutos).toBe(2);
    expect(estado.leidosRed).toContain("ig-laura");

    const c = conversaciones(estado, ANCLAJE).find((x) => x.id === "ig-laura")!;
    expect(c.mensajes).toHaveLength(2);
    expect(c.ultimo.de).toBe("yo");
    expect(c.ultimo.texto).toBe("Claro, Laura. Le mando fotos.");
    expect(c.noLeida).toBe(false);
    // La respuesta no mueve el plazo: sigue contando desde lo que ella escribió.
    expect(plazo(c, AHORA)!.minutosRestantes).toBe(24 * 60 - 4);
  });

  it("no guarda nada si el mensaje viene vacío", () => {
    const estado = estadoInicial();
    expect(responderEnRed(estado, "ig-laura", "   ", ANCLAJE)).toBe(estado);
  });

  it("varias respuestas se van acumulando", () => {
    let estado = responderEnRed(estadoInicial(), "fb-ramiro", "Buen día", ANCLAJE, new Date(ANCLAJE + 60_000));
    estado = responderEnRed(estado, "fb-ramiro", "Son 15% de enganche", ANCLAJE, new Date(ANCLAJE + 120_000));
    const c = conversaciones(estado, ANCLAJE).find((x) => x.id === "fb-ramiro")!;
    expect(c.mensajes.map((m) => m.de)).toEqual(["ellos", "yo", "yo"]);
    expect(new Set(estado.respuestasRed["fb-ramiro"].map((r) => r.id)).size).toBe(2);
  });

  it("marcar leída no se repite", () => {
    const leida = marcarLeidaRed(estadoInicial(), "tt-diana");
    expect(leida.leidosRed).toEqual(["tt-diana"]);
    expect(marcarLeidaRed(leida, "tt-diana")).toBe(leida);
    expect(conversaciones(leida, ANCLAJE).find((c) => c.id === "tt-diana")?.noLeida).toBe(false);
  });
});

describe("ficha de la persona", () => {
  const lista = conversaciones(estadoInicial(), ANCLAJE);

  it("junta los canales de quien escribe por dos redes", () => {
    const f = ficha(lista, "laura", "condominios")!;
    expect(f.persona).toBe("Laura M.");
    expect(f.canales.map((c) => c.red).sort()).toEqual(["instagram", "whatsapp"]);
    expect(f.mensajes).toBe(3);
  });

  it("de quien escribe por una sola red, un solo canal", () => {
    expect(ficha(lista, "jorge", "condominios")!.canales).toHaveLength(1);
  });

  it("de alguien que no está, nada", () => {
    expect(ficha(lista, "nadie", "condominios")).toBeNull();
  });

  it("nunca junta a una persona de otra empresa", () => {
    expect(ficha(lista, "laura", "autos")).toBeNull();
  });
});

describe("varias empresas", () => {
  it("cada plática es de una cuenta dada de alta y de la misma red que esa cuenta", () => {
    for (const e of EJEMPLOS) {
      const origen = cuentaYEmpresa(e.cuentaId);
      expect(origen, e.id).not.toBeNull();
      expect(origen!.cuenta.red).toBe(e.red);
    }
  });

  it("los ids de empresas y cuentas no se repiten", () => {
    const empresas = EMPRESAS.map((e) => e.id);
    const cuentas = EMPRESAS.flatMap((e) => e.cuentas.map((k) => k.id));
    expect(new Set(empresas).size).toBe(empresas.length);
    expect(new Set(cuentas).size).toBe(cuentas.length);
  });

  it("cada plática dice de qué empresa es y qué cuenta la recibió", () => {
    const c = conversaciones(estadoInicial(), ANCLAJE).find((x) => x.id === "ig-laura")!;
    expect(c.empresa).toBe("Condominios Ejemplo");
    expect(c.cuenta).toBe("@condominios.ejemplo");
  });

  it("al elegir una empresa sólo se ven sus pláticas", () => {
    const todas = conversaciones(estadoInicial(), ANCLAJE);
    const autos = conversaciones(estadoInicial(), ANCLAJE, "autos");
    expect(autos.length).toBeGreaterThan(0);
    expect(autos.length).toBeLessThan(todas.length);
    expect(autos.every((c) => c.empresaId === "autos")).toBe(true);
  });

  it("los sin leer se cuentan por empresa y suman el total", () => {
    const todas = conversaciones(estadoInicial(), ANCLAJE);
    const porEmpresa = sinLeerPorEmpresa(todas);
    const suma = Object.values(porEmpresa).reduce((a, b) => a + b, 0);
    expect(suma).toBe(sinLeer(todas));
    expect(porEmpresa.autos).toBeGreaterThan(0);
  });

  it("elegir la misma empresa no cambia nada", () => {
    const e = elegirEmpresa(estadoInicial(), "autos");
    expect(e.empresaActiva).toBe("autos");
    expect(elegirEmpresa(e, "autos")).toBe(e);
    expect(elegirEmpresa(e, null).empresaActiva).toBeNull();
  });
});

describe("lo guardado en el navegador", () => {
  it("lo que guardaron versiones anteriores sigue sirviendo", () => {
    const viejo = JSON.stringify({ version: 1, contactos: [], seleccionados: [], respuestasRed: { "ig-laura": [] } });
    const estado = leerEstadoGuardado(viejo);
    expect(estado.version).toBe(2);
    expect(estado.empresaActiva).toBeNull();
    expect(estado.respuestasRed).toEqual({ "ig-laura": [] });
    expect(estado.leidosRed).toEqual([]);
    expect(() => conversaciones(estado, ANCLAJE)).not.toThrow();
  });

  it("guarda y vuelve a leer las respuestas de la bandeja", () => {
    const estado = responderEnRed(estadoInicial(), "wa-jorge", "Le marco en un rato", ANCLAJE);
    const releido = leerEstadoGuardado(JSON.stringify(estado));
    expect(releido.respuestasRed["wa-jorge"][0].texto).toBe("Le marco en un rato");
    expect(releido.leidosRed).toContain("wa-jorge");
  });
});

describe("el anclaje de la sesión", () => {
  it("se fija una sola vez", () => {
    const primero = anclajeDeSesion(1000);
    expect(anclajeDeSesion(999_999)).toBe(primero);
  });
});

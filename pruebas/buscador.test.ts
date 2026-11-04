import { describe, expect, it, vi } from "vitest";
import empresas from "@/datos/empresas-ejemplo.json";
import { DatosDeEjemplo } from "@/lib/datos/datos-de-ejemplo";
import { DenueInegi, URL_BASE_DENUE } from "@/lib/datos/denue-inegi";
import { buscarConRespaldo, obtenerBuscador } from "@/lib/datos/obtener-buscador";
import type { BuscadorDeEmpresas } from "@/lib/datos/buscador";

describe("elegir la fuente de datos", () => {
  it("sin token usa los datos de ejemplo", () => {
    const b = obtenerBuscador({});
    expect(b).toBeInstanceOf(DatosDeEjemplo);
    expect(b.esEjemplo).toBe(true);
  });

  it("con token vacío o sólo espacios usa los datos de ejemplo", () => {
    expect(obtenerBuscador({ INEGI_TOKEN: "   ", DENUE_ACTIVADO: "si" })).toBeInstanceOf(DatosDeEjemplo);
  });

  it("con token pero sin activar el interruptor sigue usando los datos de ejemplo", () => {
    expect(obtenerBuscador({ INEGI_TOKEN: "abc" })).toBeInstanceOf(DatosDeEjemplo);
    expect(obtenerBuscador({ INEGI_TOKEN: "abc", DENUE_ACTIVADO: "no" })).toBeInstanceOf(DatosDeEjemplo);
  });

  it("con token y DENUE_ACTIVADO=si usa el DENUE", () => {
    const b = obtenerBuscador({ INEGI_TOKEN: "abc", DENUE_ACTIVADO: "si" });
    expect(b).toBeInstanceOf(DenueInegi);
    expect(b.esEjemplo).toBe(false);
  });
});

describe("respaldo con datos de ejemplo", () => {
  it("si el DENUE falla, devuelve datos de ejemplo con un aviso y no lanza error", async () => {
    const roto: BuscadorDeEmpresas = {
      nombre: "Roto",
      esEjemplo: false,
      buscar: () => Promise.reject(new Error("sin red")),
    };
    const r = await buscarConRespaldo(roto, { ciudad: "tijuana" });
    expect(r.fuente.esEjemplo).toBe(true);
    expect(r.aviso).toMatch(/datos de ejemplo/i);
    expect(r.empresas.length).toBeGreaterThan(0);
    expect(r.empresas.every((e) => e.ciudad === "tijuana")).toBe(true);
  });

  it("si la fuente funciona, no hay aviso", async () => {
    const r = await buscarConRespaldo(new DatosDeEjemplo(), {});
    expect(r.aviso).toBeUndefined();
    expect(r.empresas).toHaveLength(empresas.length);
  });
});

describe("datos de ejemplo", () => {
  it("todos los correos son @example.com y todos los nombres dicen (ejemplo)", () => {
    for (const e of empresas) {
      if (e.correo) expect(e.correo).toMatch(/@example\.com$/);
      if (e.sitioWeb) expect(e.sitioWeb).toMatch(/^https:\/\/example\.com\//);
      expect(e.nombre).toMatch(/\(ejemplo\)$/);
    }
  });

  it("filtra por giro, ciudad y tamaño", async () => {
    const b = new DatosDeEjemplo();
    const r = await b.buscar({ giro: "clinicas-dentales", ciudad: "", tamano: "grande" });
    expect(r.length).toBeGreaterThan(0);
    for (const e of r) {
      expect(e.giro).toBe("clinicas-dentales");
      expect([5, 6, 7]).toContain(e.estrato);
    }
  });
});

describe("esqueleto del DENUE (sin red)", () => {
  it("arma la dirección del método BuscarAreaActEstr como dice la documentación", () => {
    const d = new DenueInegi("TOKEN", vi.fn());
    const url = d.construirUrl({ giro: "clinicas-dentales", ciudad: "tijuana" }, 3);
    expect(url).toBe(`${URL_BASE_DENUE}/BuscarAreaActEstr/02/004/0/0/0/0/0/0/0/dental/1/50/0/3/TOKEN`);
  });

  it("convierte la respuesta y hace una consulta por cada estrato del tamaño", async () => {
    const fetchFalso = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ Id: "1", Nombre: "NEGOCIO FALSO", Correo_e: "X@EXAMPLE.COM", Telefono: "", Sitio_internet: "" }],
    });
    const d = new DenueInegi("TOKEN", fetchFalso);
    const r = await d.buscar({ ciudad: "tijuana", tamano: "pequeno" });
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(r[0]).toMatchObject({ nombre: "NEGOCIO FALSO", correo: "x@example.com", telefono: null, sitioWeb: null });
  });

  it("si la respuesta no es una lista, devuelve vacío sin romperse", async () => {
    const d = new DenueInegi("TOKEN", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => "No hay resultados" }));
    expect(await d.buscar({})).toEqual([]);
  });

  it("no se puede crear sin token", () => {
    expect(() => new DenueInegi("")).toThrow();
  });
});

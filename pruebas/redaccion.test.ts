import { describe, expect, it } from "vitest";
import { contactoDesdeEmpresa } from "@/lib/contactos";
import { AJUSTES_EJEMPLO } from "@/lib/estado";
import { aprobar, armarCorreo, generarBorrador, generarPieLegal, validarAsunto } from "@/lib/redaccion";
import type { AjustesProyecto, Borrador } from "@/lib/tipos";

const contacto = contactoDesdeEmpresa(
  { id: "c1", nombre: "Hotel Prueba (ejemplo)", giro: "hoteles", ciudad: "tijuana", estrato: 3, telefono: null, correo: "hotel@example.com", sitioWeb: null },
  "Datos de ejemplo (simula el DENUE de INEGI)",
  true,
);
const ajustes: AjustesProyecto = structuredClone(AJUSTES_EJEMPLO);

describe("plantilla", () => {
  it("rellena nombre del negocio, giro y ciudad", () => {
    const b = generarBorrador(contacto, ajustes);
    expect(b.cuerpo).toContain("Hotel Prueba (ejemplo)");
    expect(b.cuerpo).toContain("hoteles");
    expect(b.cuerpo).toContain("Tijuana");
    expect(b.cuerpo).not.toMatch(/\{\w+\}/);
    expect(b.estado).toBe("pendiente");
  });
});

describe("el pie legal no se puede quitar", () => {
  it("siempre va al final del correo armado", () => {
    const b = generarBorrador(contacto, ajustes);
    const { texto, pie } = armarCorreo(b, contacto, ajustes);
    expect(texto.endsWith(pie)).toBe(true);
    expect(pie).toContain(ajustes.asesorNombre);
    expect(pie).toContain(ajustes.telefono);
    expect(pie).toMatch(/no te escriba más/);
  });

  it("aunque el usuario borre todo el mensaje, el pie sigue ahí", () => {
    const b: Borrador = { ...generarBorrador(contacto, ajustes), cuerpo: "" };
    const { texto, pie } = armarCorreo(b, contacto, ajustes);
    expect(texto).toBe(pie);
    expect(texto).toMatch(/BAJA/);
  });

  it("el borrador no guarda el pie, así que editarlo no puede borrarlo", () => {
    const b = generarBorrador(contacto, ajustes);
    expect(Object.keys(b)).not.toContain("pie");
    expect(b.cuerpo).not.toContain("no te escriba más");
    const editado: Borrador = { ...b, cuerpo: "Texto nuevo", pie: "" } as Borrador;
    expect(armarCorreo(editado, contacto, ajustes).texto).toContain(generarPieLegal(ajustes, contacto));
  });

  it("aunque falten los datos del asesor, el pie sigue y la línea para pedir baja también; y no se puede aprobar", () => {
    const vacios = { ...ajustes, asesorNombre: "", telefono: "", empresa: "" };
    const pie = generarPieLegal(vacios, contacto);
    expect(pie).toMatch(/no te escriba más/);
    expect(pie).toMatch(/falta/);
    const r = aprobar(generarBorrador(contacto, vacios), vacios);
    expect("errores" in r && r.errores.length).toBeTruthy();
  });

  it("dice de dónde se tomó el correo", () => {
    expect(generarPieLegal(ajustes, contacto)).toContain(contacto.origen.fuente);
  });
});

describe("asunto veraz", () => {
  it.each(["Re: su consulta", "RE: condominios", "Fwd: info", "RV: precios", "  re : hola"])("rechaza «%s»", (a) => {
    expect(validarAsunto(a).length).toBeGreaterThan(0);
  });

  it.each(["Factura pendiente", "Su recibo de noviembre", "CFDI adjunto", "Estado de cuenta"])("rechaza «%s»", (a) => {
    expect(validarAsunto(a).length).toBeGreaterThan(0);
  });

  it("rechaza el asunto vacío", () => {
    expect(validarAsunto("   ")).toHaveLength(1);
  });

  it("acepta un asunto normal, incluso con palabras que empiezan con «re»", () => {
    expect(validarAsunto("Residencial Mirador: preventa en Tijuana")).toEqual([]);
    expect(validarAsunto("Recorrido por el desarrollo")).toEqual([]);
  });

  it("no deja aprobar un asunto engañoso", () => {
    const b = { ...generarBorrador(contacto, ajustes), asunto: "Re: lo que platicamos" };
    const r = aprobar(b, ajustes);
    expect("errores" in r).toBe(true);
  });

  it("aprueba un borrador correcto", () => {
    const r = aprobar(generarBorrador(contacto, ajustes), ajustes);
    expect("estado" in r && r.estado).toBe("aprobado");
  });
});

describe("plantilla sin giro", () => {
  it("no deja la frase a medias si el contacto no tiene giro", () => {
    const sinGiro = { ...contacto, giro: "" };
    const b = generarBorrador(sinGiro, ajustes);
    expect(b.cuerpo).toContain("vi que su negocio está en Tijuana");
    expect(b.cuerpo).not.toContain("negocio de  ");
  });
});

import { describe, expect, it } from "vitest";
import { cifraCorta, codigoRef, direccionWhatsApp, enteroPositivo, esEtapa, porcentaje, soloDigitos, telefonoValido } from "@/lib/ventas";

describe("teléfonos y enlaces de WhatsApp", () => {
  it("deja sólo los dígitos", () => {
    expect(soloDigitos("+52 (664) 123-4567")).toBe("526641234567");
  });

  it("acepta de 10 a 15 dígitos", () => {
    expect(telefonoValido("664 123 4567")).toBe(true);
    expect(telefonoValido("+52 664 123 4567")).toBe(true);
    expect(telefonoValido("12345")).toBe(false);
    expect(telefonoValido("1234567890123456")).toBe(false);
  });

  it("a un teléfono de 10 dígitos le pone el 52 de México", () => {
    expect(direccionWhatsApp("664 123 4567", "")).toBe("https://wa.me/526641234567");
  });

  it("respeta el código de país y escribe el mensaje en la dirección", () => {
    expect(direccionWhatsApp("+1 619 555 0100", "Hola, vi el video")).toBe("https://wa.me/16195550100?text=Hola%2C%20vi%20el%20video");
  });

  it("nunca manda a otro sitio que wa.me", () => {
    expect(direccionWhatsApp("http://malo.com 6641234567", "x").startsWith("https://wa.me/")).toBe(true);
  });
});

describe("números de las estadísticas", () => {
  it("convierte lo que se escribe a un entero válido", () => {
    expect(enteroPositivo("12,500")).toBe(12500);
    expect(enteroPositivo(3.9)).toBe(3);
    expect(enteroPositivo(-4)).toBe(0);
    expect(enteroPositivo("hola")).toBe(0);
    expect(enteroPositivo(undefined)).toBe(0);
  });

  it("acorta las cifras grandes", () => {
    expect(cifraCorta(950)).toBe("950");
    expect(cifraCorta(12500)).toBe("12.5 mil");
    expect(cifraCorta(250000)).toBe("250 mil");
    expect(cifraCorta(1200000)).toBe("1.2 M");
  });

  it("calcula porcentajes sin dividir entre cero", () => {
    expect(porcentaje(1, 4)).toBe(25);
    expect(porcentaje(0, 0)).toBe(0);
  });

  it("conoce las etapas de una persona", () => {
    expect(esEtapa("cita")).toBe(true);
    expect(esEtapa("otro")).toBe(false);
  });

  it("saca un código corto en mayúsculas del enlace", () => {
    expect(codigoRef("k7m2pabc")).toBe("K7M2P");
  });
});

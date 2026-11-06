import { describe, expect, it } from "vitest";
import { ETAPAS, direccionWhatsApp, esEtapa, fechaValida, hoyISO, porcentaje, soloDigitos, telefonoValido } from "@/lib/ventas";

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

describe("etapas y fechas", () => {
  it("conoce las etapas de venta", () => {
    for (const e of ETAPAS) expect(esEtapa(e)).toBe(true);
    expect(esEtapa("otra")).toBe(false);
    expect(esEtapa(undefined)).toBe(false);
  });

  it("valida el formato de las fechas", () => {
    expect(fechaValida("2026-11-06")).toBe(true);
    expect(fechaValida("06/11/2026")).toBe(false);
    expect(fechaValida("2026-13-45")).toBe(false);
    expect(fechaValida(null)).toBe(false);
  });

  it("el día de hoy es el de Tijuana, no el de UTC", () => {
    expect(hoyISO(new Date("2026-11-06T03:00:00Z"))).toBe("2026-11-05");
    expect(hoyISO(new Date("2026-11-06T20:00:00Z"))).toBe("2026-11-06");
  });

  it("calcula porcentajes sin dividir entre cero", () => {
    expect(porcentaje(1, 4)).toBe(25);
    expect(porcentaje(0, 0)).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { estadoDeRecorrido } from "@/lib/estado";
import { expedienteCsv, filasExpediente } from "@/lib/expediente";
import { cupoDelDia, generarPlan, OPCIONES_PLAN } from "@/lib/plan-envio";

describe("plan de envío (simulación)", () => {
  it("empieza con 20 al día y sube poco a poco hasta el tope", () => {
    expect(cupoDelDia(1)).toBe(20);
    expect(cupoDelDia(2)).toBe(25);
    expect(cupoDelDia(100)).toBe(OPCIONES_PLAN.cupoMaximo);
  });

  it("reparte todos los correos sin pasar el cupo diario ni el máximo por hora", () => {
    const plan = generarPlan(150);
    expect(plan.reduce((s, d) => s + d.envios.length, 0)).toBe(150);
    for (const d of plan) {
      expect(d.envios.length).toBeLessThanOrEqual(d.cupo);
      const porHora = new Map<number, number>();
      for (const e of d.envios) {
        const h = Math.floor(e.minuto / 60);
        porHora.set(h, (porHora.get(h) ?? 0) + 1);
        expect(e.minuto).toBeGreaterThanOrEqual(OPCIONES_PLAN.horaInicio * 60);
        expect(e.minuto).toBeLessThan(OPCIONES_PLAN.horaFin * 60);
      }
      for (const n of porHora.values()) expect(n).toBeLessThanOrEqual(OPCIONES_PLAN.maximoPorHora);
      for (let i = 1; i < d.envios.length; i++) {
        expect(d.envios[i].minuto - d.envios[i - 1].minuto).toBeGreaterThanOrEqual(OPCIONES_PLAN.minutosMin);
      }
    }
  });

  it("da el mismo resultado con la misma semilla", () => {
    expect(generarPlan(30)).toEqual(generarPlan(30));
  });
});

describe("expediente", () => {
  it("lista origen, fecha, semáforo y mensaje aprobado con su pie legal", () => {
    const e = estadoDeRecorrido();
    const filas = filasExpediente(e);
    expect(filas).toHaveLength(e.contactos.length);
    const aprobada = filas.find((f) => f.estadoMensaje === "Aprobado");
    expect(aprobada?.semaforo).toBe("verde");
    expect(aprobada?.fechaAlta).toBeTruthy();
    expect(aprobada?.mensajeAprobado).toMatch(/no te escriba más/);
  });

  it("genera un CSV con encabezados y celdas con comillas cuando hace falta", () => {
    const csv = expedienteCsv(estadoDeRecorrido());
    expect(csv.startsWith("﻿Contacto,Correo")).toBe(true);
    expect(csv).toContain('"');
    expect(csv.split("\r\n").length).toBeGreaterThan(2);
  });
});

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { firmaValida } from "../servidor/src/firma";

describe("firmaValida (avisos de Meta)", () => {
  const cuerpo = '{"object":"instagram","entry":[]}';
  const buena = `sha256=${createHmac("sha256", "secreto-de-prueba").update(cuerpo).digest("hex")}`;

  it("acepta la firma que Meta calcula con el secreto de la app", async () => {
    expect(await firmaValida(cuerpo, buena, "secreto-de-prueba")).toBe(true);
  });
  it("rechaza si el cuerpo cambió, si el secreto es otro o si no hay firma", async () => {
    expect(await firmaValida(`${cuerpo} `, buena, "secreto-de-prueba")).toBe(false);
    expect(await firmaValida(cuerpo, buena, "otro")).toBe(false);
    expect(await firmaValida(cuerpo, null, "secreto-de-prueba")).toBe(false);
    expect(await firmaValida(cuerpo, "sha256=abc", "secreto-de-prueba")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { textoPlano } from "../servidor/src/mime";

describe("textoPlano", () => {
  it("saca el texto de un correo en partes (la frontera viene en los encabezados)", () => {
    const cabeza = 'Content-Type: multipart/alternative; boundary="abc123"';
    const cuerpo = [
      "--abc123",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      "Hola, ¿cómo estás?",
      "",
      "--abc123",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      "<div>Hola</div>",
      "--abc123--",
    ].join("\r\n");
    expect(textoPlano(cuerpo, cabeza)).toBe("Hola, ¿cómo estás?");
  });

  it("descifra base64 y se queda con la versión de texto aunque venga anidada", () => {
    const base = btoa("Hola desde base64");
    const cabeza = 'Content-Type: multipart/mixed; boundary="fuera"';
    const cuerpo = [
      "--fuera",
      'Content-Type: multipart/alternative; boundary="dentro"',
      "",
      "--dentro",
      "Content-Type: text/html; charset=UTF-8",
      "",
      "<p>no esto</p>",
      "--dentro",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base,
      "--dentro--",
      "--fuera--",
    ].join("\n");
    expect(textoPlano(cuerpo, cabeza)).toBe("Hola desde base64");
  });

  it("si sólo hay versión con formato, quita las etiquetas", () => {
    const cabeza = "Content-Type: text/html; charset=UTF-8";
    expect(textoPlano("<style>p{}</style><p>Hola &amp; adiós</p>", cabeza)).toBe("Hola & adiós");
  });

  it("un correo simple sin encabezados se deja como viene", () => {
    expect(textoPlano("Nada raro\n> cita vieja")).toBe("Nada raro");
  });
});

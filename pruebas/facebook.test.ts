import { afterEach, describe, expect, it, vi } from "vitest";
import { paginasDelDueno } from "../servidor/src/facebook";

const clave = { appId: "1", appSecret: "s" };

/** Un Meta de mentiras: cada dirección contesta lo que se le diga. */
function meta(respuestas: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = new URL(url);
      const clavePedida = Object.keys(respuestas).find((k) => `${u.pathname}`.endsWith(k));
      return new Response(JSON.stringify(clavePedida ? respuestas[clavePedida] : { error: { message: "no hay" } }), {
        status: clavePedida ? 200 : 400,
      });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("páginas de Facebook", () => {
  it("usa la lista normal cuando existe", async () => {
    meta({
      "/oauth/access_token": { access_token: "tok" },
      "/me/accounts": { data: [{ id: "10", name: "Nexora", access_token: "pt" }] },
      "/10": { instagram_business_account: { id: "99", username: "nexora_ig" } },
    });
    const r = await paginasDelDueno(clave, "c", "https://x/v");
    expect("paginas" in r && r.paginas).toEqual([{ id: "10", nombre: "Nexora", token: "pt", instagram: { id: "99", usuario: "nexora_ig" } }]);
  });

  it("encuentra la página por las que marcó la persona si la lista viene vacía", async () => {
    meta({
      "/oauth/access_token": { access_token: "tok" },
      "/me/accounts": { data: [] },
      "/debug_token": { data: { granular_scopes: [{ scope: "pages_messaging", target_ids: ["10"] }] } },
      "/10": { id: "10", name: "Nexora", access_token: "pt" },
    });
    const r = await paginasDelDueno(clave, "c", "https://x/v");
    expect("paginas" in r && r.paginas.map((p) => p.id)).toEqual(["10"]);
  });

  it("busca en los portafolios comerciales si nada más funcionó", async () => {
    meta({
      "/oauth/access_token": { access_token: "tok" },
      "/me/accounts": { data: [] },
      "/debug_token": { data: { granular_scopes: [] } },
      "/me/businesses": { data: [{ id: "b1", name: "Mi negocio" }] },
      "/b1/owned_pages": { data: [{ id: "10", name: "Nexora", access_token: "pt" }] },
      "/b1/client_pages": { data: [] },
    });
    const r = await paginasDelDueno(clave, "c", "https://x/v");
    expect("paginas" in r && r.paginas.map((p) => p.nombre)).toEqual(["Nexora"]);
  });
});

import { describe, expect, it } from "vitest";
import { crearEstado, leerEstado, urlDeGoogle } from "../servidor/src/google";

describe("estado firmado de Google", () => {
  it("devuelve la cuenta si la firma es buena", async () => {
    const e = await crearEstado("secreto", "cuenta-1");
    expect(await leerEstado("secreto", e)).toBe("cuenta-1");
  });
  it("rechaza firma ajena o alterada", async () => {
    const e = await crearEstado("secreto", "cuenta-1");
    expect(await leerEstado("otro", e)).toBeNull();
    expect(await leerEstado("secreto", e.replace("cuenta-1", "cuenta-2"))).toBeNull();
    expect(await leerEstado("secreto", "basura")).toBeNull();
  });
  it("arma la dirección de Google con permiso offline", () => {
    const u = new URL(urlDeGoogle({ clientId: "id", clientSecret: "s" }, "https://x/y", "est", "a@b.com"));
    expect(u.searchParams.get("access_type")).toBe("offline");
    expect(u.searchParams.get("login_hint")).toBe("a@b.com");
    expect(u.searchParams.get("scope")).toBe("https://mail.google.com/");
  });
});

import { urlDeFacebook } from "../servidor/src/facebook";
describe("Facebook", () => {
  it("pide permisos de mensajes y de páginas", () => {
    const u = new URL(urlDeFacebook({ appId: "1", appSecret: "s" }, "https://x/v", "est"));
    expect(u.searchParams.get("scope")).toContain("pages_messaging");
    expect(u.searchParams.get("client_id")).toBe("1");
  });
});

import { urlDeInstagram } from "../servidor/src/instagram";
describe("Instagram sin Facebook", () => {
  it("pide permiso de mensajes de Instagram", () => {
    const u = new URL(urlDeInstagram({ appId: "9", appSecret: "s" }, "https://x/v", "est"));
    expect(u.host).toBe("www.instagram.com");
    expect(u.searchParams.get("scope")).toContain("instagram_business_manage_messages");
  });
});

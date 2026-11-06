/**
 * El servidor de Nexora.
 *
 * Hace dos cosas: entrega la pantalla (el mismo archivo que ya usabas) y atiende
 * las peticiones de la bandeja en /api/…. Cada cierto rato, solo, revisa el buzón
 * de correo y guarda lo que llegó.
 *
 * Nadie ve nada sin entrar: todas las rutas de /api piden sesión, menos entrar y salud.
 */

import {
  apuntar,
  conversacionesGuardadas,
  archivarPlatica,
  borrarArchivadasViejas,
  borrarCuenta,
  borrarEmpresa,
  crearCuenta,
  crearEmpresa,
  editarEmpresa,
  empresas,
  guardarClaveCorreo,
  guardarConexionMeta,
  guardarSaliente,
  marcarEntrega,
  tokenDeCuenta,
  marcarLeida,
  platicaParaResponder,
  dentroDelPlazo,
  guardarCuentaMeta,
} from "./bandeja";
import { credencialDeCorreo, entregarPorCorreo, revisarCorreo, revisarTodosLosCorreos } from "./canal-correo";
import { conectarInstagram, PREFIJO_IG, renovarTokenInstagram, suscribirInstagram, urlDeInstagram, type ClaveInstagram } from "./instagram";
import { paginasDelDueno, suscribirPagina, urlDeFacebook, type ClaveMeta } from "./facebook";
import { PREFIJO, crearEstado, intercambiarCodigo, leerEstado, urlDeGoogle, type ClaveGoogle } from "./google";
import { enviarPorMeta, firmaValida, guardarDeMeta } from "./meta";
import { ORDEN_REDES } from "../../lib/redes";
import type { Red } from "../../lib/tipos";
import type { CuentaCorreo } from "./correo";
import {
  GALLETA,
  abrirSesion,
  cerrarSesion,
  crearUsuario,
  demasiadosIntentos,
  galletaBorrada,
  galletaDeSesion,
  igualesSeguro,
  leerGalleta,
  limpiarSesiones,
  normalizarCorreo,
  revisarContrasena,
  usuarioDeLaSesion,
  type Usuario,
} from "./sesion";

export interface Entorno {
  DB: D1Database;
  PANTALLA: Fetcher;
  /** El correo de pruebas y su contraseña de aplicación. Viven en los secretos, nunca en el código. */
  CORREO_USUARIO?: string;
  CORREO_CONTRASENA?: string;
  /** Con qué nombre sales en los correos que contestas. */
  CORREO_NOMBRE?: string;
  /** Clave de un solo uso para crear al primer dueño. Después se borra. */
  CLAVE_ARRANQUE?: string;
  /** Instagram y Facebook: la clave de la app de Meta (firma los avisos) y la palabra con que Meta verifica tu dirección. */
  META_APP_SECRET?: string;
  META_VERIFY_TOKEN?: string;
  /** «Conectar con Google»: la clave de la app que se creó en Google Cloud. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** «Conectar con Facebook»: el número de la app de Meta (la clave secreta es META_APP_SECRET). */
  META_APP_ID?: string;
  /** Opcional: número de la «configuración» de inicio de sesión para empresas en Meta. */
  META_CONFIG_ID?: string;
  /** «Conectar Instagram» sin Facebook: el número y la clave de la parte de Instagram de la app de Meta. */
  INSTAGRAM_APP_ID?: string;
  INSTAGRAM_APP_SECRET?: string;
}

function json(datos: unknown, estado = 200, galleta?: string): Response {
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    // Que nadie guarde en caché lo que es de tu cuenta.
    "Cache-Control": "no-store",
  };
  if (galleta) cabeceras["Set-Cookie"] = galleta;
  return new Response(JSON.stringify(datos), { status: estado, headers: cabeceras });
}

/**
 * Si una cuenta ya recibe y manda mensajes de verdad, y si no, qué le falta.
 * Por ahora sólo el correo está conectado; las demás redes se conectan después.
 */
function estadoDeConexion(
  cuenta: { red: Red; identificador: string; idMeta?: string | null; tieneToken?: boolean },
  correo: CuentaCorreo | null,
  metaListo = false,
): { estado: "conectada" | "falta"; nota: string } {
  if (cuenta.red === "correo") {
    if (cuenta.tieneToken || (correo && correo.usuario === cuenta.identificador)) {
      return { estado: "conectada", nota: "Recibe y contesta correos desde aquí." };
    }
    return { estado: "falta", nota: "Falta pegar la contraseña de aplicación de Google de este correo." };
  }
  if (cuenta.red === "instagram" || cuenta.red === "facebook") {
    if (!metaListo) return { estado: "falta", nota: "Falta poner META_APP_SECRET y META_VERIFY_TOKEN en el servidor." };
    if (!cuenta.idMeta || !cuenta.tieneToken) return { estado: "falta", nota: "Falta pegar el número de la cuenta en Meta y su token." };
    return { estado: "conectada", nota: "Recibe y contesta por la API de Meta." };
  }
  if (cuenta.red === "tiktok") return { estado: "falta", nota: "Falta que TikTok apruebe el acceso a sus mensajes." };
  return { estado: "falta", nota: "Falta conectarla con Meta (la empresa dueña de Instagram, Facebook y WhatsApp)." };
}

function claveDeGoogle(entorno: Entorno): ClaveGoogle | null {
  if (!entorno.GOOGLE_CLIENT_ID || !entorno.GOOGLE_CLIENT_SECRET) return null;
  return { clientId: entorno.GOOGLE_CLIENT_ID, clientSecret: entorno.GOOGLE_CLIENT_SECRET };
}

function claveDeMeta(entorno: Entorno): ClaveMeta | null {
  if (!entorno.META_APP_ID || !entorno.META_APP_SECRET) return null;
  return { appId: entorno.META_APP_ID.trim(), appSecret: entorno.META_APP_SECRET.trim(), configId: entorno.META_CONFIG_ID?.trim() || undefined };
}

function claveDeInstagram(entorno: Entorno): ClaveInstagram | null {
  if (!entorno.INSTAGRAM_APP_ID || !entorno.INSTAGRAM_APP_SECRET) return null;
  return { appId: entorno.INSTAGRAM_APP_ID, appSecret: entorno.INSTAGRAM_APP_SECRET };
}

function cuentaDeCorreo(entorno: Entorno): CuentaCorreo | null {
  if (!entorno.CORREO_USUARIO || !entorno.CORREO_CONTRASENA) return null;
  return { usuario: normalizarCorreo(entorno.CORREO_USUARIO), contrasena: entorno.CORREO_CONTRASENA };
}

async function cuerpo(peticion: Request): Promise<Record<string, unknown>> {
  try {
    const datos = await peticion.json();
    return datos && typeof datos === "object" ? (datos as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function texto(valor: unknown, maximo = 4000): string {
  return typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
}

async function atender(peticion: Request, entorno: Entorno): Promise<Response> {
  const url = new URL(peticion.url);
  if (!url.pathname.startsWith("/api/")) {
    // Todo lo demás es la pantalla.
    return entorno.PANTALLA.fetch(peticion);
  }

  const ruta = url.pathname;
  const metodo = peticion.method;

  if (ruta === "/api/salud") {
    return json({ bien: true, correoConectado: !!cuentaDeCorreo(entorno) });
  }

  // Aviso de privacidad público: Google lo pide para publicar la app.
  if (ruta === "/api/privacidad") {
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aviso de privacidad de NEXORA</title></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5"><h1>Aviso de privacidad de NEXORA</h1><p>NEXORA es una herramienta privada de uso interno de un equipo de ventas. No está abierta al público.</p><p>Cuando el dueño conecta un correo con su cuenta de Google, NEXORA guarda un permiso de acceso a ese buzón. Lo usa únicamente para mostrar los mensajes recibidos y enviar las respuestas que el equipo escribe.</p><p>Los datos se guardan en la base de datos privada del equipo, en Cloudflare. No se venden, no se comparten con terceros y no se usan para publicidad ni para entrenar modelos.</p><p>El dueño puede quitar una cuenta en cualquier momento desde NEXORA o revocar el permiso en su cuenta de Google.</p></body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // La vuelta de Instagram al conectar una cuenta sin Facebook.
  if (ruta === "/api/instagram/vuelta" && metodo === "GET") {
    const ig = claveDeInstagram(entorno);
    const aPantalla = (resultado: string) => Response.redirect(`${url.origin}/?meta=${resultado}#empresas`, 302);
    if (!ig) return aPantalla("falta");
    const empresaId = await leerEstado(ig.appSecret, url.searchParams.get("state") ?? "");
    const codigo = url.searchParams.get("code");
    if (!empresaId || !codigo) return aPantalla("no");
    const hay = await entorno.DB.prepare("SELECT 1 AS si FROM empresas WHERE id = ?").bind(empresaId).first();
    if (!hay) return aPantalla("no");
    const r = await conectarInstagram(ig, codigo, `${url.origin}/api/instagram/vuelta`);
    if ("error" in r) {
      await apuntar(entorno.DB, "instagram", "error", `Instagram no dio el permiso: ${r.error}`);
      return aPantalla("no");
    }
    await guardarCuentaMeta(entorno.DB, { empresaId, red: "instagram", identificador: `@${r.usuario}`, idMeta: r.id, token: PREFIJO_IG + r.token });
    const suscrita = await suscribirInstagram(r.token);
    await apuntar(entorno.DB, "instagram", suscrita ? "info" : "error", `se conectó @${r.usuario}${suscrita ? "" : " (no se pudo suscribir a los avisos)"}`);
    return aPantalla("ok");
  }

  // La vuelta de Facebook al conectar páginas. Va sin sesión: se protege con el estado firmado.
  if (ruta === "/api/meta/vuelta" && metodo === "GET") {
    const meta = claveDeMeta(entorno);
    const aPantalla = (resultado: string) => Response.redirect(`${url.origin}/?meta=${resultado}#empresas`, 302);
    if (!meta) return aPantalla("falta");
    const empresaId = await leerEstado(meta.appSecret, url.searchParams.get("state") ?? "");
    const codigo = url.searchParams.get("code");
    if (!empresaId || !codigo) return aPantalla("no");
    const hay = await entorno.DB.prepare("SELECT 1 AS si FROM empresas WHERE id = ?").bind(empresaId).first();
    if (!hay) return aPantalla("no");
    const r = await paginasDelDueno(meta, codigo, `${url.origin}/api/meta/vuelta`);
    if ("error" in r) {
      await apuntar(entorno.DB, "meta", "error", `Facebook no dio el permiso: ${r.error}`);
      return aPantalla("no");
    }
    if (r.paginas.length === 0) {
      await apuntar(entorno.DB, "meta", "error", `Facebook no dio ninguna página (${r.diagnostico})`);
      return aPantalla("sinpaginas");
    }
    for (const p of r.paginas) {
      await guardarCuentaMeta(entorno.DB, { empresaId, red: "facebook", identificador: p.nombre, idMeta: p.id, token: p.token });
      if (p.instagram) {
        await guardarCuentaMeta(entorno.DB, { empresaId, red: "instagram", identificador: `@${p.instagram.usuario}`, idMeta: p.instagram.id, token: p.token });
      }
      const suscrita = await suscribirPagina(p.id, p.token);
      await apuntar(entorno.DB, "meta", suscrita ? "info" : "error", `se conectó la página ${p.nombre}${suscrita ? "" : " (no se pudo suscribir a los avisos)"}`);
    }
    return aPantalla("ok");
  }

  // La vuelta de Google al conectar un correo. Va sin sesión: se protege con el estado firmado que armó el dueño.
  if (ruta === "/api/google/vuelta" && metodo === "GET") {
    const google = claveDeGoogle(entorno);
    const aPantalla = (resultado: string) => Response.redirect(`${url.origin}/?google=${resultado}#empresas`, 302);
    if (!google) return aPantalla("falta");
    const cuentaId = await leerEstado(google.clientSecret, url.searchParams.get("state") ?? "");
    const codigo = url.searchParams.get("code");
    if (!cuentaId || !codigo) return aPantalla("no");
    const fila = await entorno.DB.prepare("SELECT identificador FROM cuentas WHERE id = ? AND red = 'correo'")
      .bind(cuentaId)
      .first<{ identificador: string }>();
    if (!fila) return aPantalla("no");
    const permiso = await intercambiarCodigo(google, codigo, `${url.origin}/api/google/vuelta`);
    if (!permiso.refresh_token || !permiso.access_token) {
      await apuntar(entorno.DB, "correo", "error", `Google no dio el permiso: ${permiso.error ?? "sin respuesta"}`);
      return aPantalla("no");
    }
    await guardarClaveCorreo(entorno.DB, cuentaId, PREFIJO + permiso.refresh_token);
    try {
      // La prueba de que el permiso es de ese correo: Google sólo deja entrar si coinciden.
      await revisarCorreo(entorno.DB, { usuario: fila.identificador, contrasena: "", accessToken: permiso.access_token });
    } catch {
      await guardarClaveCorreo(entorno.DB, cuentaId, null);
      return aPantalla("otrocorreo");
    }
    await apuntar(entorno.DB, "correo", "info", `se conectó con Google el correo ${fila.identificador}`);
    return aPantalla("ok");
  }

  // Los avisos de Instagram y Facebook entran sin sesión: Meta no tiene cuenta. Se protegen con la firma.
  if (ruta === "/api/meta/webhook") {
    if (metodo === "GET") {
      // Meta pregunta una vez, al dar de alta la dirección, si de verdad es nuestra.
      const palabra = entorno.META_VERIFY_TOKEN;
      const manda = url.searchParams.get("hub.verify_token") ?? "";
      if (palabra && url.searchParams.get("hub.mode") === "subscribe" && igualesSeguro(manda, palabra)) {
        return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
      }
      return new Response("no", { status: 403 });
    }
    if (metodo === "POST") {
      const secretos = [entorno.META_APP_SECRET, entorno.INSTAGRAM_APP_SECRET].filter((x): x is string => !!x);
      if (secretos.length === 0) return json({ error: "falta META_APP_SECRET" }, 503);
      const crudo = await peticion.text();
      const cabecera = peticion.headers.get("X-Hub-Signature-256");
      let firmada = false;
      for (const secreto of secretos) {
        if (await firmaValida(crudo, cabecera, secreto)) firmada = true;
      }
      if (!firmada) return json({ error: "firma incorrecta" }, 403);
      try {
        await guardarDeMeta(entorno.DB, JSON.parse(crudo));
      } catch (falla) {
        await apuntar(entorno.DB, "meta", "error", `no se pudo guardar un aviso: ${(falla as Error).message}`);
      }
      // Meta reintenta si no recibe 200, así que siempre se contesta bien aunque algo haya fallado.
      return json({ bien: true });
    }
  }

  // Crear al primer dueño. Sólo funciona si todavía no hay nadie y con la clave de arranque.
  if (ruta === "/api/arrancar" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const clave = texto(datos.clave, 200);
    if (!entorno.CLAVE_ARRANQUE || !igualesSeguro(clave, entorno.CLAVE_ARRANQUE)) {
      return json({ error: "clave incorrecta" }, 403);
    }
    const cuantos = await entorno.DB.prepare("SELECT COUNT(*) AS n FROM usuarios").first<{ n: number }>();
    if (cuantos && cuantos.n > 0) return json({ error: "ya hay una cuenta creada" }, 409);
    const correo = normalizarCorreo(texto(datos.correo, 200));
    const contrasena = texto(datos.contrasena, 200);
    const nombre = texto(datos.nombre, 80) || "Dueño";
    if (!correo.includes("@") || contrasena.length < 10) {
      return json({ error: "hace falta un correo y una contraseña de 10 letras o más" }, 400);
    }
    const usuario = await crearUsuario(entorno.DB, { correo, nombre, contrasena, papel: "dueño" });
    await apuntar(entorno.DB, "sesion", "info", "se creó la cuenta del dueño");
    return json({ usuario });
  }

  if (ruta === "/api/entrar" && metodo === "POST") {
    if (await demasiadosIntentos(entorno.DB)) {
      return json({ error: "Demasiados intentos. Espera 15 minutos y vuelve a probar." }, 429);
    }
    const datos = await cuerpo(peticion);
    const usuario = await revisarContrasena(entorno.DB, texto(datos.correo, 200), texto(datos.contrasena, 200));
    if (!usuario) {
      await apuntar(entorno.DB, "sesion", "info", "intento de entrada fallido");
      // A propósito no decimos si falló el correo o la contraseña.
      return json({ error: "correo o contraseña incorrectos" }, 401);
    }
    const token = await abrirSesion(entorno.DB, usuario.id);
    return json({ usuario }, 200, galletaDeSesion(token));
  }

  const token = leerGalleta(peticion, GALLETA);

  if (ruta === "/api/salir" && metodo === "POST") {
    if (token) await cerrarSesion(entorno.DB, token);
    return json({ bien: true }, 200, galletaBorrada());
  }

  const quien = await usuarioDeLaSesion(entorno.DB, token);
  if (!quien) return json({ error: "entra primero" }, 401);

  if (ruta === "/api/yo") return json({ usuario: quien });

  if (ruta === "/api/empresas" && metodo === "GET") {
    const correo = cuentaDeCorreo(entorno);
    const lista = await empresas(entorno.DB);
    return json({
      empresas: lista.map((e) => ({
        ...e,
        cuentas: e.cuentas.map((k) => ({
          id: k.id,
          red: k.red,
          identificador: k.identificador,
          idMeta: k.idMeta,
          tieneToken: k.tieneToken,
          ...estadoDeConexion(k, correo, (!!entorno.META_APP_SECRET || !!entorno.INSTAGRAM_APP_SECRET) && !!entorno.META_VERIFY_TOKEN),
        })),
      })),
    });
  }

  if (ruta === "/api/empresas/editar" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede editar empresas" }, 403);
    const datos = await cuerpo(peticion);
    const id = texto(datos.id, 60);
    const nombre = texto(datos.nombre, 120);
    if (!id || !nombre) return json({ error: "falta el nombre de la empresa" }, 400);
    try {
      const hecho = await editarEmpresa(entorno.DB, { id, nombre, giro: texto(datos.giro, 120) || null });
      return hecho ? json({ bien: true }) : json({ error: "esa empresa ya no existe" }, 404);
    } catch {
      return json({ error: "ya hay otra empresa con ese nombre" }, 409);
    }
  }

  if (ruta === "/api/empresas/borrar" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede borrar empresas" }, 403);
    const id = texto((await cuerpo(peticion)).id, 60);
    if (!id) return json({ error: "falta la empresa" }, 400);
    const hecho = await borrarEmpresa(entorno.DB, id);
    if (hecho) await apuntar(entorno.DB, "empresas", "info", `${quien.correo} borró una empresa`);
    return hecho ? json({ bien: true }) : json({ error: "esa empresa ya no existe" }, 404);
  }

  if (ruta === "/api/cuentas/borrar" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede quitar cuentas" }, 403);
    const id = texto((await cuerpo(peticion)).id, 60);
    if (!id) return json({ error: "falta la cuenta" }, 400);
    const hecho = await borrarCuenta(entorno.DB, id);
    return hecho ? json({ bien: true }) : json({ error: "esa cuenta ya no existe" }, 404);
  }

  // Dar de alta una empresa que el equipo va a atender.
  if (ruta === "/api/empresas" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede dar de alta empresas" }, 403);
    const datos = await cuerpo(peticion);
    const nombre = texto(datos.nombre, 120);
    if (!nombre) return json({ error: "falta el nombre de la empresa" }, 400);
    try {
      const empresa = await crearEmpresa(entorno.DB, { nombre, giro: texto(datos.giro, 120) || null });
      return json({ empresa });
    } catch {
      return json({ error: "ya hay una empresa con ese nombre" }, 409);
    }
  }

  // Ligar un canal (su Instagram, su correo…) a una empresa.
  if (ruta === "/api/cuentas" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede dar de alta cuentas" }, 403);
    const datos = await cuerpo(peticion);
    const empresaId = texto(datos.empresaId, 60);
    const red = texto(datos.red, 20) as Red;
    const identificador = texto(datos.identificador, 200);
    if (!empresaId || !ORDEN_REDES.includes(red) || !identificador) {
      return json({ error: "falta la empresa, la red o el nombre de la cuenta" }, 400);
    }
    try {
      const cuenta = await crearCuenta(entorno.DB, { empresaId, red, identificador });
      return json({ cuenta });
    } catch {
      return json({ error: "esa cuenta ya está ligada a una empresa, o la empresa no existe" }, 409);
    }
  }

  // Pegar el número de la cuenta en Meta y su token (sólo el dueño). El token no vuelve a salir del servidor.
  if (ruta === "/api/cuentas/meta" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede conectar cuentas" }, 403);
    const datos = await cuerpo(peticion);
    const cuentaId = texto(datos.cuentaId, 60);
    const idMeta = texto(datos.idMeta, 60);
    const token = texto(datos.token, 1000);
    if (!cuentaId || !/^\d{5,30}$/.test(idMeta)) return json({ error: "el número de la cuenta en Meta son sólo dígitos" }, 400);
    try {
      const hecho = await guardarConexionMeta(entorno.DB, { cuentaId, idMeta, token });
      if (!hecho) return json({ error: "esa cuenta no existe o no es de Instagram ni de Facebook" }, 404);
      await apuntar(entorno.DB, "meta", "info", `${quien.correo} conectó una cuenta con Meta`);
      return json({ bien: true });
    } catch {
      return json({ error: "ese número de Meta ya está en otra cuenta" }, 409);
    }
  }

  // Empieza «Conectar Instagram»: manda al dueño a Instagram a dar permiso, sin pasar por Facebook.
  if (ruta === "/api/instagram/iniciar" && metodo === "GET") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede conectar redes" }, 403);
    const ig = claveDeInstagram(entorno);
    if (!ig) return Response.redirect(`${url.origin}/?meta=falta#empresas`, 302);
    const empresaId = url.searchParams.get("empresaId") ?? "";
    const hay = await entorno.DB.prepare("SELECT 1 AS si FROM empresas WHERE id = ?").bind(empresaId).first();
    if (!hay) return json({ error: "esa empresa no existe" }, 404);
    const estado = await crearEstado(ig.appSecret, empresaId);
    return Response.redirect(urlDeInstagram(ig, `${url.origin}/api/instagram/vuelta`, estado), 302);
  }

  // Empieza «Conectar con Facebook»: manda al dueño a Meta a elegir las páginas de esa empresa.
  if (ruta === "/api/meta/iniciar" && metodo === "GET") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede conectar redes" }, 403);
    const meta = claveDeMeta(entorno);
    if (!meta) return Response.redirect(`${url.origin}/?meta=falta#empresas`, 302);
    const empresaId = url.searchParams.get("empresaId") ?? "";
    const hay = await entorno.DB.prepare("SELECT 1 AS si FROM empresas WHERE id = ?").bind(empresaId).first();
    if (!hay) return json({ error: "esa empresa no existe" }, 404);
    const estado = await crearEstado(meta.appSecret, empresaId);
    return Response.redirect(urlDeFacebook(meta, `${url.origin}/api/meta/vuelta`, estado), 302);
  }

  // Empieza «Conectar con Google»: manda a la persona a Google a dar permiso para ese correo.
  if (ruta === "/api/google/iniciar" && metodo === "GET") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede conectar correos" }, 403);
    const google = claveDeGoogle(entorno);
    if (!google) return json({ error: "falta GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el servidor" }, 503);
    const cuentaId = url.searchParams.get("cuentaId") ?? "";
    const fila = await entorno.DB.prepare("SELECT identificador FROM cuentas WHERE id = ? AND red = 'correo'")
      .bind(cuentaId)
      .first<{ identificador: string }>();
    if (!fila) return json({ error: "esa cuenta no existe o no es de correo" }, 404);
    const estado = await crearEstado(google.clientSecret, cuentaId);
    return Response.redirect(urlDeGoogle(google, `${url.origin}/api/google/vuelta`, estado, fila.identificador), 302);
  }

  // Pegar la contraseña de aplicación de un correo (sólo el dueño). Se prueba al momento: si Google no la acepta, no se guarda.
  if (ruta === "/api/cuentas/clave" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede conectar correos" }, 403);
    const datos = await cuerpo(peticion);
    const cuentaId = texto(datos.cuentaId, 60);
    const clave = texto(datos.clave, 60).replace(/\s+/g, "");
    if (!cuentaId || !/^[a-z]{16}$/i.test(clave)) {
      return json({ error: "la contraseña de aplicación son 16 letras (puedes pegarla con o sin espacios)" }, 400);
    }
    const fila = await entorno.DB.prepare("SELECT identificador FROM cuentas WHERE id = ? AND red = 'correo'")
      .bind(cuentaId)
      .first<{ identificador: string }>();
    if (!fila) return json({ error: "esa cuenta no existe o no es de correo" }, 404);
    await guardarClaveCorreo(entorno.DB, cuentaId, clave.toLowerCase());
    try {
      await revisarCorreo(entorno.DB, { usuario: fila.identificador, contrasena: clave.toLowerCase() });
    } catch {
      await guardarClaveCorreo(entorno.DB, cuentaId, null);
      return json({ error: "Google no aceptó esa clave. Revisa que sea de ese mismo correo y que esté completa." }, 400);
    }
    await apuntar(entorno.DB, "correo", "info", `${quien.correo} conectó el correo ${fila.identificador}`);
    return json({ bien: true });
  }

  if (ruta === "/api/bandeja" && metodo === "GET") {
    const platicas = await conversacionesGuardadas(entorno.DB, { empresaId: url.searchParams.get("empresa") });
    const ahora = new Date();
    return json({
      usuario: quien,
      correoConectado: !!cuentaDeCorreo(entorno),
      conversaciones: platicas.map((c) => ({ ...c, sePuedeContestar: dentroDelPlazo(c, ahora) })),
    });
  }

  if (ruta === "/api/leida" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const platicaId = texto(datos.platicaId, 60);
    if (!platicaId) return json({ error: "falta la plática" }, 400);
    await marcarLeida(entorno.DB, platicaId);
    return json({ bien: true });
  }

  if (ruta === "/api/archivar" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const platicaId = texto(datos.platicaId, 60);
    if (!platicaId) return json({ error: "falta la plática" }, 400);
    const hecho = await archivarPlatica(entorno.DB, platicaId, datos.archivar !== false);
    return hecho ? json({ bien: true }) : json({ error: "esa plática ya no existe" }, 404);
  }

  if (ruta === "/api/responder" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const platicaId = texto(datos.platicaId, 60);
    const mensaje = texto(datos.texto, 4000);
    if (!platicaId || !mensaje) return json({ error: "falta la plática o el texto" }, 400);

    const platica = await platicaParaResponder(entorno.DB, platicaId);
    if (!platica) return json({ error: "esa plática ya no existe" }, 404);
    if (!dentroDelPlazo(platica)) {
      return json({ error: "se pasó el plazo para contestar por esa red" }, 409);
    }

    const guardado = await guardarSaliente(entorno.DB, { platicaId, texto: mensaje });

    if (platica.red === "correo") {
      // Cada correo contesta con su propia contraseña; si no tiene, se usa la de los secretos (si es la misma dirección).
      const clave = await tokenDeCuenta(entorno.DB, platica.cuentaId);
      const deSecretos = cuentaDeCorreo(entorno);
      let cuenta: Awaited<ReturnType<typeof credencialDeCorreo>> | null = null;
      try {
        cuenta = clave
          ? await credencialDeCorreo(platica.cuenta, clave, claveDeGoogle(entorno))
          : deSecretos && deSecretos.usuario === platica.cuenta
            ? deSecretos
            : null;
      } catch (falla) {
        await marcarEntrega(entorno.DB, guardado.id, "falló", (falla as Error).message);
        return json({ mensaje: { ...guardado, entrega: "falló", error: (falla as Error).message } });
      }
      if (!cuenta) {
        return json({ mensaje: { ...guardado, entrega: "pendiente" }, aviso: "falta conectar el correo" });
      }
      const salida = await entregarPorCorreo(entorno.DB, cuenta, {
        platicaId,
        mensajeId: guardado.id,
        texto: mensaje,
        deNombre: entorno.CORREO_NOMBRE,
      });
      return json({
        mensaje: { ...guardado, entrega: salida.entregado ? "entregado" : "falló", error: salida.error ?? null },
      });
    }

    if (platica.red === "instagram" || platica.red === "facebook") {
      const token = await tokenDeCuenta(entorno.DB, platica.cuentaId);
      if (!token) return json({ mensaje: { ...guardado, entrega: "pendiente" }, aviso: "falta conectar esa cuenta con Meta" });
      const salida = await enviarPorMeta(platica.red, token, platica.usuario, mensaje);
      await marcarEntrega(entorno.DB, guardado.id, salida.entregado ? "entregado" : "falló", salida.error);
      if (!salida.entregado) await apuntar(entorno.DB, platica.red, "error", `no se pudo mandar: ${salida.error}`);
      return json({
        mensaje: { ...guardado, entrega: salida.entregado ? "entregado" : "falló", error: salida.error ?? null },
      });
    }

    // Las demás redes todavía no están conectadas: queda apuntado como pendiente.
    return json({ mensaje: guardado, aviso: `${platica.red} todavía no está conectada` });
  }

  // Para probar sin esperar al reloj.
  if (ruta === "/api/revisar-correo" && metodo === "POST") {
    const { nuevos, errores } = await revisarTodosLosCorreos(entorno.DB, cuentaDeCorreo(entorno), claveDeGoogle(entorno));
    return json({ nuevos, errores });
  }

  if (ruta === "/api/invitar" && metodo === "POST") {
    if (quien.papel !== "dueño") return json({ error: "sólo el dueño puede invitar" }, 403);
    const datos = await cuerpo(peticion);
    const correo = normalizarCorreo(texto(datos.correo, 200));
    const contrasena = texto(datos.contrasena, 200);
    const nombre = texto(datos.nombre, 80) || correo;
    if (!correo.includes("@") || contrasena.length < 10) {
      return json({ error: "hace falta un correo y una contraseña de 10 letras o más" }, 400);
    }
    let invitado: Usuario;
    try {
      invitado = await crearUsuario(entorno.DB, { correo, nombre, contrasena, papel: "invitado" });
    } catch {
      return json({ error: "ese correo ya tiene cuenta" }, 409);
    }
    await apuntar(entorno.DB, "sesion", "info", `${quien.correo} invitó a alguien`);
    return json({ usuario: invitado });
  }

  return json({ error: "no existe esa ruta" }, 404);
}

const servidor = {
  async fetch(peticion: Request, entorno: Entorno): Promise<Response> {
    try {
      return await atender(peticion, entorno);
    } catch (falla) {
      // El detalle no se manda a la pantalla: queda en la bitácora.
      try {
        await apuntar(entorno.DB, "servidor", "error", `${new URL(peticion.url).pathname}: ${(falla as Error).message}`);
      } catch {
        /* ni la bitácora contestó */
      }
      return json({ error: "Algo falló en el servidor. Intenta otra vez." }, 500);
    }
  },

  /** El reloj: cada rato revisa el buzón y tira las sesiones vencidas. */
  async scheduled(evento: ScheduledController, entorno: Entorno, contexto: ExecutionContext): Promise<void> {
    contexto.waitUntil(
      (async () => {
        await limpiarSesiones(entorno.DB);
        await borrarArchivadasViejas(entorno.DB);
        // Ya queda apuntado en la bitácora lo que falle; un buzón caído no tira el reloj.
        await revisarTodosLosCorreos(entorno.DB, cuentaDeCorreo(entorno), claveDeGoogle(entorno));
        // Una vez al día se alarga el permiso de las cuentas de Instagram (vence a los 60 días).
        const cuando = new Date(evento.scheduledTime);
        if (cuando.getUTCHours() === 4 && cuando.getUTCMinutes() === 0) {
          const { results } = await entorno.DB.prepare("SELECT id, token FROM cuentas WHERE red = 'instagram' AND token LIKE ?")
            .bind(`${PREFIJO_IG}%`)
            .all<{ id: string; token: string }>();
          for (const c of results) {
            const nuevo = await renovarTokenInstagram(c.token.slice(PREFIJO_IG.length));
            if (nuevo) await entorno.DB.prepare("UPDATE cuentas SET token = ? WHERE id = ?").bind(PREFIJO_IG + nuevo, c.id).run();
          }
        }
      })(),
    );
  },
};

export default servidor;

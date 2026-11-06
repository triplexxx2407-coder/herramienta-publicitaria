/**
 * El servidor de Nexora.
 *
 * Hace dos cosas: entrega la pantalla (el mismo archivo que ya usabas) y atiende
 * las peticiones de /api/…: perfiles, interesados, calendario, enlaces de WhatsApp y resultados.
 *
 * Nadie ve nada sin entrar: todas las rutas de /api piden sesión, menos entrar y salud.
 */

import { apuntar, borrarCuenta, borrarEmpresa, crearCuenta, crearEmpresa, editarEmpresa, empresas } from "./perfiles";
import {
  borrarEnlace,
  chatsDe,
  contarClic,
  crearContacto,
  contactosDe,
  ponerEtapa,
  borrarContacto,
  crearEnlace,
  editarEnlace,
  enlacesDe,
  estadisticasDe,
  llenarDatosDePrueba,
  responderPrueba,
  simularMensaje,
  simularVisita,
} from "./ventas";
import { ORDEN_REDES } from "../../lib/redes";
import { direccionWhatsApp, esEtapa, telefonoValido } from "../../lib/ventas";
import type { Red } from "../../lib/tipos";
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
  /** Clave de un solo uso para crear al primer dueño. Después se borra. */
  CLAVE_ARRANQUE?: string;
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

/** La red si es una de las conocidas; si no, vacío. */
function datosEnlace(d: Record<string, unknown>) {
  const nombre = texto(d.nombre, 120);
  const telefono = texto(d.telefono, 40);
  if (!nombre) return "falta el nombre del enlace";
  if (!telefonoValido(telefono)) return "el WhatsApp debe tener entre 10 y 15 números";
  return { nombre, telefono, mensaje: texto(d.mensaje, 500) };
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
    return json({ bien: true });
  }

  // El enlace público de WhatsApp: cuenta el clic y manda a la persona a WhatsApp. Va sin sesión.
  const corto = /^\/api\/w\/([a-z0-9]{4,20})$/.exec(ruta);
  if (corto && metodo === "GET") {
    const destino = await contarClic(entorno.DB, corto[1]);
    if (!destino) return new Response("Este enlace ya no existe.", { status: 404 });
    return Response.redirect(direccionWhatsApp(destino.telefono, `${destino.mensaje.trim() || "Hola, quiero más información"} (ref ${destino.ref})`), 302);
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
    const lista = await empresas(entorno.DB);
    return json({
      empresas: lista.map((e) => ({
        ...e,
        cuentas: e.cuentas,
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

  /* ── Ventas de cada perfil ── */

  const empresaDe = async (): Promise<string | null> => {
    const e = url.searchParams.get("empresa") ?? "";
    if (!e) return null;
    const hay = await entorno.DB.prepare("SELECT 1 AS si FROM empresas WHERE id = ?").bind(e).first();
    return hay ? e : null;
  };
  const deLaEmpresa = async (datos: Record<string, unknown>): Promise<string | null> => {
    const e = texto(datos.empresaId, 60);
    if (!e) return null;
    const hay = await entorno.DB.prepare("SELECT 1 AS si FROM empresas WHERE id = ?").bind(e).first();
    return hay ? e : null;
  };

  if (ruta === "/api/estadisticas" && metodo === "GET") {
    const e = await empresaDe();
    return e ? json(await estadisticasDe(entorno.DB, e)) : json({ error: "elige una empresa" }, 400);
  }

  if (ruta === "/api/contactos" && metodo === "GET") {
    const e = await empresaDe();
    return e ? json({ contactos: await contactosDe(entorno.DB, e) }) : json({ error: "elige una empresa" }, 400);
  }
  if (ruta === "/api/contactos" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const e = await deLaEmpresa(datos);
    if (!e) return json({ error: "elige una empresa" }, 400);
    const nuevo = await crearContacto(entorno.DB, e, texto(datos.enlaceId, 20), texto(datos.nota, 120));
    return nuevo ? json({ id: nuevo }) : json({ error: "elige un enlace de esta empresa" }, 400);
  }
  if (ruta === "/api/contactos/etapa" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    if (!esEtapa(datos.etapa)) return json({ error: "etapa no válida" }, 400);
    return (await ponerEtapa(entorno.DB, texto(datos.id, 60), datos.etapa)) ? json({ bien: true }) : json({ error: "esa persona ya no existe" }, 404);
  }
  if (ruta === "/api/contactos/borrar" && metodo === "POST") {
    const hecho = await borrarContacto(entorno.DB, texto((await cuerpo(peticion)).id, 60));
    return hecho ? json({ bien: true }) : json({ error: "esa persona ya no existe" }, 404);
  }

  if (ruta === "/api/enlaces" && metodo === "GET") {
    const e = await empresaDe();
    return e ? json({ enlaces: await enlacesDe(entorno.DB, e) }) : json({ error: "elige una empresa" }, 400);
  }
  if (ruta === "/api/enlaces" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const e = await deLaEmpresa(datos);
    const d = datosEnlace(datos);
    if (!e) return json({ error: "elige una empresa" }, 400);
    if (typeof d === "string") return json({ error: d }, 400);
    return json({ id: await crearEnlace(entorno.DB, e, d) });
  }
  if (ruta === "/api/enlaces/editar" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const d = datosEnlace(datos);
    if (typeof d === "string") return json({ error: d }, 400);
    return (await editarEnlace(entorno.DB, texto(datos.id, 60), d)) ? json({ bien: true }) : json({ error: "ese enlace ya no existe" }, 404);
  }
  if (ruta === "/api/enlaces/borrar" && metodo === "POST") {
    const hecho = await borrarEnlace(entorno.DB, texto((await cuerpo(peticion)).id, 60));
    return hecho ? json({ bien: true }) : json({ error: "ese enlace ya no existe" }, 404);
  }

  // El WhatsApp de prueba: simula personas que tocan un enlace y escriben.
  if (ruta === "/api/whatsapp" && metodo === "GET") {
    const e = await empresaDe();
    return e ? json({ chats: await chatsDe(entorno.DB, e) }) : json({ error: "elige una empresa" }, 400);
  }
  if (ruta === "/api/whatsapp/simular" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const e = await deLaEmpresa(datos);
    if (!e) return json({ error: "elige una empresa" }, 400);
    const r = datos.soloVisita === true
      ? (await simularVisita(entorno.DB, e, texto(datos.enlaceId, 20))) ? { persona: "" } : null
      : await simularMensaje(entorno.DB, e, texto(datos.enlaceId, 20));
    return r ? json({ bien: true, persona: r.persona }) : json({ error: "elige un enlace de esta empresa" }, 400);
  }
  if (ruta === "/api/whatsapp/responder" && metodo === "POST") {
    const datos = await cuerpo(peticion);
    const e = await deLaEmpresa(datos);
    const mensaje = texto(datos.texto, 4000);
    if (!e || !mensaje) return json({ error: "falta la empresa o el texto" }, 400);
    return (await responderPrueba(entorno.DB, e, texto(datos.persona, 120), mensaje)) ? json({ bien: true }) : json({ error: "esa conversación ya no existe" }, 404);
  }
  if (ruta === "/api/datos-de-prueba" && metodo === "POST") {
    const e = await deLaEmpresa(await cuerpo(peticion));
    if (!e) return json({ error: "elige una empresa" }, 400);
    await llenarDatosDePrueba(entorno.DB, e);
    return json({ bien: true });
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

  /** El reloj: tira las sesiones vencidas y borra cualquier permiso viejo que haya quedado guardado. */
  async scheduled(_evento: ScheduledController, entorno: Entorno, contexto: ExecutionContext): Promise<void> {
    contexto.waitUntil(
      (async () => {
        await limpiarSesiones(entorno.DB);
        // Por seguridad, cualquier permiso que haya quedado guardado de una conexión vieja se borra.
        await entorno.DB.prepare("UPDATE cuentas SET token = NULL, id_meta = NULL WHERE token IS NOT NULL OR id_meta IS NOT NULL").run();
      })(),
    );
  },
};

export default servidor;

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
  crearCuenta,
  crearEmpresa,
  empresas,
  guardarSaliente,
  marcarLeida,
  platicaParaResponder,
  dentroDelPlazo,
} from "./bandeja";
import { CorreoSinEmpresa, entregarPorCorreo, revisarCorreo } from "./canal-correo";
import { ORDEN_REDES } from "../../lib/redes";
import type { Red } from "../../lib/tipos";
import type { CuentaCorreo } from "./correo";
import {
  GALLETA,
  abrirSesion,
  cerrarSesion,
  crearUsuario,
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

const servidor = {
  async fetch(peticion: Request, entorno: Entorno): Promise<Response> {
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
      return json({ empresas: await empresas(entorno.DB) });
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
        const cuenta = cuentaDeCorreo(entorno);
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

      // Las demás redes todavía no están conectadas: queda apuntado como pendiente.
      return json({ mensaje: guardado, aviso: `${platica.red} todavía no está conectada` });
    }

    // Para probar sin esperar al reloj.
    if (ruta === "/api/revisar-correo" && metodo === "POST") {
      const cuenta = cuentaDeCorreo(entorno);
      if (!cuenta) return json({ error: "falta conectar el correo" }, 400);
      try {
        return json({ nuevos: await revisarCorreo(entorno.DB, cuenta) });
      } catch (falla) {
        if (falla instanceof CorreoSinEmpresa) return json({ error: falla.message }, 409);
        return json({ error: (falla as Error).message }, 502);
      }
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
  },

  /** El reloj: cada rato revisa el buzón y tira las sesiones vencidas. */
  async scheduled(_evento: ScheduledController, entorno: Entorno, contexto: ExecutionContext): Promise<void> {
    contexto.waitUntil(
      (async () => {
        await limpiarSesiones(entorno.DB);
        const cuenta = cuentaDeCorreo(entorno);
        if (!cuenta) return;
        try {
          await revisarCorreo(entorno.DB, cuenta);
        } catch {
          // Ya quedó apuntado en la bitácora; no tiramos el reloj por un buzón que no contestó.
        }
      })(),
    );
  },
};

export default servidor;

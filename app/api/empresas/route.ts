import type { NextRequest } from "next/server";
import { TAMANOS, type IdTamano } from "@/lib/catalogos";
import { buscarConRespaldo, obtenerBuscador } from "@/lib/datos/obtener-buscador";

// El token del INEGI sólo se lee aquí, en el servidor. Nunca llega al navegador.
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const tamano = p.get("tamano") ?? "";
  const resultado = await buscarConRespaldo(
    obtenerBuscador({ INEGI_TOKEN: process.env.INEGI_TOKEN, DENUE_ACTIVADO: process.env.DENUE_ACTIVADO }),
    {
      giro: p.get("giro") ?? "",
      ciudad: p.get("ciudad") ?? "",
      tamano: TAMANOS.some((t) => t.id === tamano) ? (tamano as IdTamano) : "",
    },
  );
  return Response.json(resultado);
}

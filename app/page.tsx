import Link from "next/link";
import { PANTALLAS } from "@/lib/pantallas";
import { QueHaceEsto } from "@/components/QueHaceEsto";
import { BotonesInicio } from "./BotonesInicio";

const RESUMEN: Record<string, string> = {
  "/buscar": "Encuentra negocios por giro, ciudad y tamaño.",
  "/contactos": "Escoge a quién escribirle y de dónde salió cada contacto.",
  "/redactar": "Prepara un correo personalizado por empresa y apruébalo.",
  "/envio": "Mira cómo se repartirían los envíos, poco a poco.",
  "/seguimiento": "Quién abrió, quién respondió y a quién volver a escribir.",
  "/expediente": "La prueba de dónde salió cada contacto, en un archivo.",
};

export default function Inicio() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Prospección por correo, paso a paso</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Una herramienta para encontrar negocios, escribirles un correo personal a cada uno y llevar el
          seguimiento, sin mandar correos masivos y guardando la prueba de dónde salió cada contacto.
        </p>
        <QueHaceEsto>
          <p>
            Esta es una demostración. Puedes recorrer las seis pantallas y probar todo, pero ningún correo sale de
            aquí y todos los negocios son inventados.
          </p>
          <p>Lo que escribas se guarda sólo en este navegador.</p>
        </QueHaceEsto>
        <BotonesInicio />
      </section>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PANTALLAS.map((p, i) => (
          <li key={p.ruta}>
            <Link
              href={p.ruta}
              className="flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-400 hover:shadow"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800">
                {i + 1}
              </span>
              <span className="text-lg font-semibold text-slate-900">{p.nombre}</span>
              <span className="text-slate-600">{RESUMEN[p.ruta]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

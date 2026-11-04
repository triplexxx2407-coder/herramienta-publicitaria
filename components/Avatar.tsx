import { hashTexto } from "@/lib/azar";

// Pares fondo / texto. Se evitan verde, ámbar, rojo y violeta: ya significan algo en la app.
const COLORES: [string, string][] = [
  ["#e7eeff", "#2451e6"],
  ["#e3f5fb", "#0e7490"],
  ["#fff0e5", "#c2410c"],
  ["#fde9f2", "#be185d"],
  ["#edf1f6", "#334155"],
  ["#eceeff", "#4338ca"],
  ["#e6f3ff", "#0369a1"],
];

const IGNORAR = new Set(["de", "del", "la", "el", "los", "las", "y", "e"]);

export function iniciales(nombre: string): string {
  const palabras = nombre
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((p) => p && !IGNORAR.has(p.toLowerCase()));
  return (palabras[0]?.[0] ?? "?").toUpperCase() + (palabras[1]?.[0] ?? "").toUpperCase();
}

export function Avatar({ nombre, tamano = 40, apagado = false }: { nombre: string; tamano?: number; apagado?: boolean }) {
  const [fondo, texto] = apagado ? ["#eef0f4", "#8b93a5"] : COLORES[hashTexto(nombre) % COLORES.length];
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      style={{ width: tamano, height: tamano, background: fondo, color: texto, fontSize: tamano * 0.38 }}
    >
      {iniciales(nombre)}
    </span>
  );
}

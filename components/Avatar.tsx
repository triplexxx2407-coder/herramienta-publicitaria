import { hashTexto } from "@/lib/azar";

// Pares fondo / letra, para el fondo azul oscuro de la app.
// Se evitan verde, ámbar, rojo y violeta: ya significan algo en la app.
const COLORES: [string, string][] = [
  ["#1d3a6b", "#9cc0ff"],
  ["#14414f", "#86d8ec"],
  ["#4a2e18", "#f6bb8c"],
  ["#4a2040", "#f5a3cb"],
  ["#2b3448", "#bccbdd"],
  ["#272b60", "#adb0f8"],
  ["#123b58", "#86cbf3"],
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
  const [fondo, texto] = apagado ? ["#1b2a44", "#7488a6"] : COLORES[hashTexto(nombre) % COLORES.length];
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

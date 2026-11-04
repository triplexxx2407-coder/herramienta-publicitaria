// Navegación por "#nombre" para la versión de un solo archivo (sin servidor).
export function rutaActual(): string {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
  return !h || h === "inicio" ? "/" : `/${h}`;
}

export function hashDe(ruta: string): string {
  const nombre = ruta.replace(/^\//, "");
  return `#${nombre || "inicio"}`;
}

export function ir(ruta: string) {
  window.location.hash = hashDe(ruta);
}

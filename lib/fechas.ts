/** Fechas en palabras sencillas, como en el celular: «2:05 p.m.», «Ayer», «3 nov». */

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function diaRelativo(d: Date, ahora: Date): "hoy" | "ayer" | null {
  if (mismoDia(d, ahora)) return "hoy";
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  return mismoDia(d, ayer) ? "ayer" : null;
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}

/** Corto, para listas: la hora si fue hoy, «Ayer» o el día. */
export function cuandoCorto(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  const rel = diaRelativo(d, ahora);
  if (rel === "hoy") return hora(iso);
  if (rel === "ayer") return "Ayer";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/** Completo: «Hoy, 2:05 p.m.», «Ayer, 9:10 a.m.» o «3 nov, 2:05 p.m.». */
export function cuandoLargo(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  const rel = diaRelativo(d, ahora);
  const dia = rel === "hoy" ? "Hoy" : rel === "ayer" ? "Ayer" : d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  return `${dia}, ${hora(iso)}`;
}

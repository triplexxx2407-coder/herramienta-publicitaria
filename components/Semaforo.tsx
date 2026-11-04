import type { Semaforo as TipoSemaforo } from "@/lib/tipos";

const COLOR: Record<TipoSemaforo, string> = {
  verde: "bg-emerald-500",
  ambar: "bg-amber-400",
  rojo: "bg-red-500",
};
const TEXTO: Record<TipoSemaforo, string> = { verde: "Verde", ambar: "Ámbar", rojo: "Rojo" };

export function Semaforo({ valor, conTexto = true }: { valor: TipoSemaforo; conTexto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium" title={`Semáforo ${TEXTO[valor]}`}>
      <span aria-hidden className={`h-3 w-3 rounded-full ${COLOR[valor]}`} />
      {conTexto ? TEXTO[valor] : <span className="sr-only">{TEXTO[valor]}</span>}
    </span>
  );
}

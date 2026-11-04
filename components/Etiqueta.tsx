const ESTILOS = {
  ejemplo: "bg-amber-100 text-amber-900 ring-amber-300",
  simulado: "bg-violet-100 text-violet-900 ring-violet-300",
  proximamente: "bg-slate-100 text-slate-700 ring-slate-300",
} as const;

const TEXTOS = { ejemplo: "Ejemplo", simulado: "Simulado", proximamente: "Próximamente" } as const;

export function Etiqueta({ tipo, children }: { tipo: keyof typeof ESTILOS; children?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${ESTILOS[tipo]}`}>
      {children ?? TEXTOS[tipo]}
    </span>
  );
}

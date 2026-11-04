/** Botón apagado con la leyenda "Próximamente". No hace nada a propósito. */
export function BotonProximamente({ texto, grande = false }: { texto: string; grande?: boolean }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 font-semibold text-slate-400 ${
          grande ? "px-8 py-4 text-xl" : "px-3 py-1.5 text-sm"
        }`}
      >
        {texto}
      </button>
      <span className="text-xs font-medium text-slate-500">Próximamente</span>
    </span>
  );
}

import Link from "next/link";

export function SiguientePaso({ ruta, texto }: { ruta: string; texto: string }) {
  return (
    <div className="mt-8 flex justify-end">
      <Link href={ruta} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">
        {texto} →
      </Link>
    </div>
  );
}

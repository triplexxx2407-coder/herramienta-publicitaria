import {
  BedDouble,
  Building2,
  Calculator,
  Car,
  Container,
  Factory,
  Scale,
  Smile,
  Stethoscope,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const GIROS: Record<string, { icono: LucideIcon; fondo: string; color: string }> = {
  "consultorios-medicos": { icono: Stethoscope, fondo: "#e3f5fb", color: "#0e7490" },
  "clinicas-dentales": { icono: Smile, fondo: "#e6f3ff", color: "#0369a1" },
  "despachos-abogados": { icono: Scale, fondo: "#eceeff", color: "#4338ca" },
  "despachos-contables": { icono: Calculator, fondo: "#e7eeff", color: "#2451e6" },
  "agencias-aduanales": { icono: Container, fondo: "#fff0e5", color: "#c2410c" },
  "agencias-autos": { icono: Car, fondo: "#edf1f6", color: "#334155" },
  restaurantes: { icono: UtensilsCrossed, fondo: "#fde9f2", color: "#be185d" },
  fabricas: { icono: Factory, fondo: "#f1efe9", color: "#57534e" },
  hoteles: { icono: BedDouble, fondo: "#e4f6f4", color: "#0f766e" },
  transporte: { icono: Truck, fondo: "#e8edff", color: "#1d4ed8" },
};

const OTRO = { icono: Building2, fondo: "#eef0f4", color: "#5a6478" };

export function iconoDeGiro(giro: string): LucideIcon {
  return (GIROS[giro] ?? OTRO).icono;
}

export function IconoGiro({ giro, tamano = 44 }: { giro: string; tamano?: number }) {
  const g = GIROS[giro] ?? OTRO;
  const Icono = g.icono;
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: tamano, height: tamano, background: g.fondo, color: g.color }}
    >
      <Icono size={Math.round(tamano * 0.48)} strokeWidth={2} />
    </span>
  );
}

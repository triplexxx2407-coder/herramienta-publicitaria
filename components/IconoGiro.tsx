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
  "consultorios-medicos": { icono: Stethoscope, fondo: "#14414f", color: "#86d8ec" },
  "clinicas-dentales": { icono: Smile, fondo: "#123b58", color: "#86cbf3" },
  "despachos-abogados": { icono: Scale, fondo: "#272b60", color: "#adb0f8" },
  "despachos-contables": { icono: Calculator, fondo: "#1d3a6b", color: "#9cc0ff" },
  "agencias-aduanales": { icono: Container, fondo: "#4a2e18", color: "#f6bb8c" },
  "agencias-autos": { icono: Car, fondo: "#2b3448", color: "#bccbdd" },
  restaurantes: { icono: UtensilsCrossed, fondo: "#4a2040", color: "#f5a3cb" },
  fabricas: { icono: Factory, fondo: "#3a362c", color: "#d7cfbb" },
  hoteles: { icono: BedDouble, fondo: "#13403c", color: "#84d7cd" },
  transporte: { icono: Truck, fondo: "#1b2f66", color: "#9bb4ff" },
};

const OTRO = { icono: Building2, fondo: "#1b2a44", color: "#9fb3d1" };

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

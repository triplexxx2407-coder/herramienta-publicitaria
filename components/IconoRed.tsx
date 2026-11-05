"use client";

import { Camera, Mail, MessageCircle, Music2, ThumbsUp, type LucideIcon } from "lucide-react";
import { REDES } from "@/lib/redes";
import type { Red } from "@/lib/tipos";
import { cx } from "./ui";

// La librería de íconos no trae los logos de las redes (son marcas registradas), así que cada
// una lleva un ícono parecido y su color, para que se distingan de un golpe de vista.
const ICONOS: Record<Red, LucideIcon> = {
  instagram: Camera,
  whatsapp: MessageCircle,
  facebook: ThumbsUp,
  tiktok: Music2,
  correo: Mail,
};

/** El ícono de una red, en su color. */
export function IconoRed({ red, tamano = 16, className }: { red: Red; tamano?: number; className?: string }) {
  const Icono = ICONOS[red];
  return <Icono size={tamano} aria-hidden strokeWidth={2.4} className={className} style={{ color: REDES[red].color }} />;
}

/** El ícono de la red dentro de un círculo, para las pláticas de la lista. */
export function CirculoRed({ red, activa = false }: { red: Red; activa?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full",
        activa ? "bg-white/85" : "bg-marco-2",
      )}
    >
      <IconoRed red={red} tamano={19} />
    </span>
  );
}

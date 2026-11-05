import type { Metadata } from "next";
import { PantallaSeguimiento } from "./PantallaSeguimiento";

export const metadata: Metadata = { title: "Seguimiento · NEXORA" };

export default function Pagina() {
  return <PantallaSeguimiento />;
}

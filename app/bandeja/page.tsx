import type { Metadata } from "next";
import { PantallaBandeja } from "./PantallaBandeja";

export const metadata: Metadata = { title: "Bandeja · NEXORA" };

export default function Pagina() {
  return <PantallaBandeja />;
}

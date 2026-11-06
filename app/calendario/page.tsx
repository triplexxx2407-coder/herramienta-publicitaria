import type { Metadata } from "next";
import { PantallaCalendario } from "../PantallaCalendario";

export const metadata: Metadata = { title: "Calendario · NEXORA" };

export default function Pagina() {
  return <PantallaCalendario />;
}

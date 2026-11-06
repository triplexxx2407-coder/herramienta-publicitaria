import type { Metadata } from "next";
import { PantallaResultados } from "../PantallaResultados";

export const metadata: Metadata = { title: "Resultados · NEXORA" };

export default function Pagina() {
  return <PantallaResultados />;
}

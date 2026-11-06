import type { Metadata } from "next";
import { PantallaContenidos } from "../PantallaContenidos";

export const metadata: Metadata = { title: "Contenidos · NEXORA" };

export default function Pagina() {
  return <PantallaContenidos />;
}

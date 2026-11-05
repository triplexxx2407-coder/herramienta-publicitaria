import type { Metadata } from "next";
import { PantallaRedactar } from "./PantallaRedactar";

export const metadata: Metadata = { title: "Redactar · NEXORA" };

export default function Pagina() {
  return <PantallaRedactar />;
}

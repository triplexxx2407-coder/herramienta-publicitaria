import type { Metadata } from "next";
import { PantallaRedactar } from "./PantallaRedactar";

export const metadata: Metadata = { title: "Redactar · Demo" };

export default function Pagina() {
  return <PantallaRedactar />;
}

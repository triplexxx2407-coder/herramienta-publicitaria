import type { Metadata } from "next";
import { PantallaEnvio } from "./PantallaEnvio";

export const metadata: Metadata = { title: "Envío · Demo" };

export default function Pagina() {
  return <PantallaEnvio />;
}

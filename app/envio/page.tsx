import type { Metadata } from "next";
import { PantallaEnvio } from "./PantallaEnvio";

export const metadata: Metadata = { title: "Envío · NEXORA" };

export default function Pagina() {
  return <PantallaEnvio />;
}

import type { Metadata } from "next";
import { PantallaExpediente } from "./PantallaExpediente";

export const metadata: Metadata = { title: "Expediente de cumplimiento · Demo" };

export default function Pagina() {
  return <PantallaExpediente />;
}

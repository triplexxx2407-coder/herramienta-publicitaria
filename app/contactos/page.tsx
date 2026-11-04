import type { Metadata } from "next";
import { PantallaContactos } from "./PantallaContactos";

export const metadata: Metadata = { title: "Elegir contactos · Demo" };

export default function Pagina() {
  return <PantallaContactos />;
}

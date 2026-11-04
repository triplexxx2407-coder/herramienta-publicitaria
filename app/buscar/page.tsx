import type { Metadata } from "next";
import { PantallaBuscar } from "./PantallaBuscar";

export const metadata: Metadata = { title: "Buscar empresas · Demo" };

export default function Pagina() {
  return <PantallaBuscar />;
}

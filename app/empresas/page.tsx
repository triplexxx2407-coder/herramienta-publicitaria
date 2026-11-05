import type { Metadata } from "next";
import { PantallaEmpresas } from "../PantallaEmpresas";

export const metadata: Metadata = { title: "Empresas · NEXORA" };

export default function Pagina() {
  return <PantallaEmpresas />;
}

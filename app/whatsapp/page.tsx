import type { Metadata } from "next";
import { PantallaWhatsApp } from "../PantallaWhatsApp";

export const metadata: Metadata = { title: "Whatsapp · NEXORA" };

export default function Pagina() {
  return <PantallaWhatsApp />;
}

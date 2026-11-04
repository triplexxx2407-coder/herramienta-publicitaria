import type { Metadata } from "next";
import { PantallaChat } from "./PantallaChat";

export const metadata: Metadata = { title: "Chat · Demo" };

export default function Pagina() {
  return <PantallaChat />;
}

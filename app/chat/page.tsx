import type { Metadata } from "next";
import { PantallaChat } from "./PantallaChat";

export const metadata: Metadata = { title: "Chat · NEXORA" };

export default function Pagina() {
  return <PantallaChat />;
}

import type { Metadata, Viewport } from "next";
import { Marco } from "@/components/Marco";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA",
  description:
    "NEXORA: herramienta privada del equipo para llevar las ventas de cada empresa que representan: interesados, calendario de publicaciones, enlaces de WhatsApp y resultados.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1428",
};

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Open+Sans:wght@800&family=Roboto:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700&display=swap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FUENTES} />
      </head>
      <body>
        <Marco>{children}</Marco>
      </body>
    </html>
  );
}

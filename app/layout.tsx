import type { Metadata, Viewport } from "next";
import { Marco } from "@/components/Marco";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA",
  description:
    "NEXORA: herramienta privada del equipo para ver las estadísticas de los videos y anuncios de cada empresa: vistas, clics, likes y mensajes por WhatsApp.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Open+Sans:wght@800&family=Inter:wght@400;500;600;700;800&display=swap";

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

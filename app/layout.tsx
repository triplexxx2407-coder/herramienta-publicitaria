import type { Metadata, Viewport } from "next";
import { Marco } from "@/components/Marco";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospección · Demo",
  description: "Demo de una herramienta de prospección comercial por correo. No envía correos; todos los datos son de ejemplo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1f3f8",
};

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap";

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

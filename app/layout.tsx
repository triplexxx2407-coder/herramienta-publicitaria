import type { Metadata, Viewport } from "next";
import { Marco } from "@/components/Marco";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospección por correo · Demo",
  description: "Demo de una herramienta de prospección comercial por correo. No envía correos; todos los datos son de ejemplo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Marco>{children}</Marco>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Navegacion } from "@/components/Navegacion";
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
        <div className="bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white">
          DEMO · No se envía ningún correo · Los datos son de ejemplo
        </div>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl space-y-3 px-4 pt-4 pb-2">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
                ✉
              </span>
              Prospección por correo
            </Link>
            <Navegacion />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-sm text-slate-500">
          Versión de demostración. Ningún botón de esta página envía correos.
        </footer>
      </body>
    </html>
  );
}

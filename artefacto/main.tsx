import { useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { PantallaContenidos } from "@/app/PantallaContenidos";
import { PantallaEmpresas } from "@/app/PantallaEmpresas";
import { PantallaEnlaces } from "@/app/PantallaEnlaces";
import { PantallaEstadisticas } from "@/app/PantallaEstadisticas";
import { PantallaWhatsApp } from "@/app/PantallaWhatsApp";
import { Marco } from "@/components/Marco";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

const PANTALLAS: Record<string, ComponentType> = {
  "/": PantallaEstadisticas,
  "/contenidos": PantallaContenidos,
  "/enlaces": PantallaEnlaces,
  "/whatsapp": PantallaWhatsApp,
  "/empresas": PantallaEmpresas,
};

function App() {
  const ruta = usePathname();
  const Pantalla = PANTALLAS[ruta] ?? PantallaEstadisticas;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [ruta]);
  return (
    <div className="flex min-h-full flex-col">
      <Marco>
        <Pantalla key={ruta} />
      </Marco>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(<App />);

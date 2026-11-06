import { useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { PantallaCalendario } from "@/app/PantallaCalendario";
import { PantallaEmpresas } from "@/app/PantallaEmpresas";
import { PantallaEnlaces } from "@/app/PantallaEnlaces";
import { PantallaInicio } from "@/app/PantallaInicio";
import { PantallaInteresados } from "@/app/PantallaInteresados";
import { PantallaResultados } from "@/app/PantallaResultados";
import { Marco } from "@/components/Marco";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

const PANTALLAS: Record<string, ComponentType> = {
  "/": PantallaInicio,
  "/interesados": PantallaInteresados,
  "/calendario": PantallaCalendario,
  "/enlaces": PantallaEnlaces,
  "/resultados": PantallaResultados,
  "/empresas": PantallaEmpresas,
};

function App() {
  const ruta = usePathname();
  const Pantalla = PANTALLAS[ruta] ?? PantallaInicio;
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

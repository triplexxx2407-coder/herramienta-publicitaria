import { useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { PantallaBandeja } from "@/app/PantallaBandeja";
import { PantallaEmpresas } from "@/app/PantallaEmpresas";
import { Marco } from "@/components/Marco";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

const PANTALLAS: Record<string, ComponentType> = {
  "/": PantallaBandeja,
  "/empresas": PantallaEmpresas,
};

function App() {
  const ruta = usePathname();
  const Pantalla = PANTALLAS[ruta] ?? PantallaBandeja;
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

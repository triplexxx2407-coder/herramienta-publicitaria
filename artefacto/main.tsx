import { useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import Inicio from "@/app/page";
import { PantallaBandeja } from "@/app/bandeja/PantallaBandeja";
import { PantallaBuscar } from "@/app/buscar/PantallaBuscar";
import { PantallaRedactar } from "@/app/redactar/PantallaRedactar";
import { PantallaEnvio } from "@/app/envio/PantallaEnvio";
import { PantallaSeguimiento } from "@/app/seguimiento/PantallaSeguimiento";
import { PantallaChat } from "@/app/chat/PantallaChat";
import { Marco } from "@/components/Marco";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

const PANTALLAS: Record<string, ComponentType> = {
  "/": Inicio,
  "/bandeja": PantallaBandeja,
  "/buscar": PantallaBuscar,
  "/redactar": PantallaRedactar,
  "/envio": PantallaEnvio,
  "/seguimiento": PantallaSeguimiento,
  "/chat": PantallaChat,
};

function App() {
  const ruta = usePathname();
  const Pantalla = PANTALLAS[ruta] ?? Inicio;
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

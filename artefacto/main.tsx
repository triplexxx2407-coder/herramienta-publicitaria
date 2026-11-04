import { useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import Inicio from "@/app/page";
import { PantallaBuscar } from "@/app/buscar/PantallaBuscar";
import { PantallaContactos } from "@/app/contactos/PantallaContactos";
import { PantallaRedactar } from "@/app/redactar/PantallaRedactar";
import { PantallaEnvio } from "@/app/envio/PantallaEnvio";
import { PantallaSeguimiento } from "@/app/seguimiento/PantallaSeguimiento";
import { PantallaExpediente } from "@/app/expediente/PantallaExpediente";
import { Marco } from "@/components/Marco";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

const PANTALLAS: Record<string, ComponentType> = {
  "/": Inicio,
  "/buscar": PantallaBuscar,
  "/contactos": PantallaContactos,
  "/redactar": PantallaRedactar,
  "/envio": PantallaEnvio,
  "/seguimiento": PantallaSeguimiento,
  "/expediente": PantallaExpediente,
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

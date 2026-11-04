import { useSyncExternalStore } from "react";
import { ir, rutaActual } from "./rutas";

function suscribir(f: () => void) {
  window.addEventListener("hashchange", f);
  return () => window.removeEventListener("hashchange", f);
}

export function usePathname(): string {
  return useSyncExternalStore(suscribir, rutaActual, () => "/");
}

export function useRouter() {
  return { push: ir, replace: ir, back: () => history.back(), refresh: () => {}, forward: () => history.forward(), prefetch: () => {} };
}

/**
 * Punto de conexión para "Mejorar con IA". APAGADO en esta demo.
 *
 * Para conectarlo después: crear una clase que implemente AsistenteDeRedaccion
 * (por ejemplo, llamando a un modelo de lenguaje desde una ruta del servidor,
 * con la clave en una variable de entorno), y devolverla en obtenerAsistente().
 * La pantalla "Redactar" ya muestra el botón y respeta `disponible`.
 * Regla: la IA sólo puede sugerir cambios al cuerpo; nunca toca el pie legal,
 * porque el pie no forma parte del borrador.
 */
export interface AsistenteDeRedaccion {
  readonly disponible: boolean;
  mejorar(cuerpo: string, contexto: { negocio: string; giro: string; ciudad: string }): Promise<string>;
}

export const asistenteApagado: AsistenteDeRedaccion = {
  disponible: false,
  async mejorar() {
    throw new Error("Próximamente");
  },
};

export function obtenerAsistente(): AsistenteDeRedaccion {
  return asistenteApagado;
}

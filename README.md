# NEXORA

Herramienta **privada** de uso interno del equipo. El equipo administra los canales digitales
(Instagram, Facebook, WhatsApp, TikTok y correo) de varias empresas que le encargan vender, y
atiende a los interesados desde una sola bandeja. NEXORA no se vende como suscripción y las
empresas no la usan: la usa el equipo.

Cómo funciona la bandeja:

1. Un interesado escribe a la cuenta de una empresa (por ejemplo, su Instagram).
2. NEXORA recibe el mensaje y anota de qué empresa es, qué cuenta lo recibió y quién lo manda.
3. Alguien del equipo contesta desde NEXORA.
4. NEXORA entrega la respuesta por la misma red. El cliente nunca cambia de aplicación.

## Lo que hay hoy

| Parte | Estado |
| --- | --- |
| Pantalla de la bandeja (`app/PantallaBandeja.tsx`) | Hecha. Varias empresas, filtro por empresa y por red, plazo para contestar de cada red. **Datos de ejemplo**: nada se manda de verdad. |
| Servidor (`servidor/`) | Escrito, sin publicar. Cloudflare Workers + base D1, entrada con usuario y contraseña, empresas y sus cuentas, correo real por IMAP/SMTP. |
| Instagram, WhatsApp, Facebook, TikTok reales | Pendientes. |

Las empresas y pláticas de ejemplo están en `datos/empresas-clientes.json` y
`datos/bandeja-ejemplo.json`. Todas son inventadas: correos con `example.com` y teléfonos 555.

## Probar la pantalla

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # pruebas
npm run build:archivo  # la pantalla en un solo archivo HTML (salida-archivo/)
```

## El servidor

```bash
npm run build:archivo                                   # arma la pantalla que sirve el servidor
npx wrangler d1 execute nexora --local --config servidor/wrangler.jsonc --file=servidor/esquema.sql
npm run servidor                                        # http://localhost:8787
npm run typecheck:servidor
```

Rutas (todas piden sesión menos `salud`, `entrar` y `arrancar`):

- `POST /api/arrancar`: crea la cuenta del dueño una sola vez, con `CLAVE_ARRANQUE`.
- `POST /api/entrar`, `POST /api/salir`, `GET /api/yo`.
- `GET /api/empresas`, `POST /api/empresas`, `POST /api/cuentas` (dar de alta empresas y ligarles sus canales).
- `GET /api/bandeja?empresa=…`, `POST /api/leida`, `POST /api/responder`.
- `POST /api/invitar`: el dueño da acceso a alguien más del equipo.
- `POST /api/revisar-correo`: lee el correo sin esperar al reloj (cada minuto lo hace solo; con Nexora abierta, la pantalla lo pide cada 10 segundos).

**Sin secretos en el código.** El repositorio es público: las claves van como secretos de
Cloudflare (`npx wrangler secret put NOMBRE --config servidor/wrangler.jsonc`). Los nombres están
en `.env.example`. El correo usa una contraseña de aplicación de Google, nunca la del correo.

# NEXORA · Prospección por correo (demo)

Es una demo de una herramienta para conseguir clientes por correo: encuentras negocios en un directorio
público, eliges a quién escribirle, preparas un correo personal para cada uno, lo envías y platicas con los que
te contestan.

**Esta versión no envía ningún correo de verdad.** El botón «Enviar» funciona, pero es una simulación: sólo anota
en tu navegador que se envió. Todos los negocios son inventados y sus correos terminan en `@example.com`, un
dominio que existe sólo para ejemplos.

## Las 5 pantallas

1. **Buscar empresas.** Una lista de negocios con correo, por ciudad y tipo. «Actualizar» la vuelve a cargar.
   Marcas a quién escribirle (o «Elegir todos») y tocas «Redactar». Los que ya recibieron tu correo o pidieron
   «BAJA» salen apagados y no se pueden volver a elegir.
2. **Redactar.** Lees el correo de cada negocio, lo corriges si quieres y tocas «Aprobar este correo»; pasa solo
   al siguiente. Los datos de tu desarrollo (nombre, precio, fotos y datos del pie legal) se cambian en
   **«Editar Proyecto»** (botón azul de arriba o el engrane). El pie legal se agrega solo y no se puede borrar. Los
   asuntos engañosos, como «Re:» o «Factura», se rechazan.
3. **Envío.** Tocas «Enviar» y ves cuántos se enviaron, a quién y a qué hora. Al tocar uno ves lo que le
   escribiste, con el pie legal.
4. **Seguimiento.** Dos listas que se abren: «Te contestaron» y «No te contestaron». Desde ahí también ves lo que
   le escribiste a cada uno y lo que te contestó.
5. **Chat.** Los negocios que te contestaron, ordenados por fecha del último mensaje o por nombre (A a Z, Z a A).
   Abres la plática y respondes. Si alguien contestó «BAJA», queda en «No contactar» y ya no se le puede escribir.

En cada pantalla hay un solo botón grande abajo que dice qué sigue. Para presentarla rápido, en el inicio está
**«O mira un ejemplo ya lleno»** (deja 9 correos listos para enviar), y «Borrar todo» la deja vacía otra vez.

## Cómo se ve

El diseño es copia del que hizo el dueño del proyecto (archivo `NEXORA 1.pdf`, 1440×810). Las medidas y los
colores salieron de medir ese archivo. Todas las pantallas usan el mismo marco (`components/PanelNexora.tsx`):

- **Barra de arriba.** Logo NEXORA con la marca «Demo», buscador de clientes y propiedades, campana con las
  pláticas que no has abierto y un engrane que abre «Editar proyecto».
- **Menú de la izquierda (computadora).** «Proyecto activo», los 5 pasos numerados con cuántos llevas en cada
  uno, y «Resumen de campaña» con la tasa de respuesta, que se calcula con lo que llevas enviado y contestado.
- **Tarjeta roja** del desarrollo (lleva al inicio) y, a su lado, la **barra azul** con la pastilla verde (con
  quién estás o de qué trata la pantalla), «¿Qué hace esto?», «Compartir» y «Editar Proyecto».
- **Lista de pastillas** a la izquierda: la elegida va en azul claro.
- **Área clara** a la derecha, como la plática del diseño: ahí va el correo, el editor o la lista de negocios.
  En el chat, burbujas como en WhatsApp: las tuyas en verde a la derecha, las suyas en blanco a la izquierda.
- **Celular.** El menú se convierte en pestañas abajo, el buscador queda en una lupa y, al tocar una pastilla,
  el correo o la plática se abre a pantalla completa (con la flecha para regresar).

El buscador de arriba lleva a donde está cada cliente: a su plática si te contestó, al correo que le mandaste si
ya se lo enviaste, a su borrador si está por escribir, o lo resalta en la lista de «Buscar».

## Qué es simulado

| Parte | Estado |
|---|---|
| Negocios, correos y teléfonos | Inventados (archivos en `datos/`) |
| Textos del desarrollo (nombre, precio, puntos fuertes, fotos) | De ejemplo, y los puedes editar |
| Pie legal | Texto de ejemplo. Antes de usarlo de verdad, que lo revise un abogado |
| Botón «Enviar» | Simulación: no hay ninguna conexión a un servicio de correo (`lib/envio.ts`) |
| Respuestas y chat | De ejemplo: contestan 4 de cada 10 (en la vida real son muchos menos) y una es «BAJA» |
| Lo que escribes en el chat | Se queda en tu navegador; no se envía |
| Directorio DENUE de INEGI | Preparado pero sin activar (`lib/datos/denue-inegi.ts`) |

Lo que escribes se guarda **sólo en tu navegador**, en `localStorage`. Si abres la demo en otra computadora,
la verás vacía.

Quedaron en el código, pero ya no en pantalla, para usarse después: el expediente de contactos para Excel
(`lib/expediente.ts`), el plan de envío poco a poco (`lib/plan-envio.ts`) y los contactos agregados a mano con
su semáforo de origen (`lib/contactos.ts`).

## Cómo verla sin instalar nada

Hay una versión de un solo archivo, sin servidor. Se arma con:

```bash
npm run build:archivo
```

Eso deja dos archivos en `salida-archivo/` (esa carpeta no se sube a GitHub):

- `demo-prospeccion.html`: se abre con doble clic en cualquier navegador.
- `demo-prospeccion-pagina.html`: la misma demo, lista para publicarse como página de claude.ai.

En esta versión los datos de ejemplo vienen dentro del archivo y lo que hagas se guarda sólo en ese navegador.

## Cómo correrla en tu computadora

Necesitas [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
npm install
npm run dev
```

Luego abre <http://localhost:3000>.

Otros comandos:

```bash
npm test          # pruebas automáticas
npm run lint      # revisión de estilo del código
npm run build     # versión final, como la usaría Vercel
```

## Cómo publicarla en Vercel (opcional, plan gratuito)

1. Entra a <https://vercel.com> con tu cuenta de GitHub.
2. Da clic en **Add New → Project** y elige el repositorio `herramienta-publicitaria`.
3. No cambies nada de la configuración: Vercel reconoce Next.js solo. Da clic en **Deploy**.
4. En uno o dos minutos te da una dirección como `https://herramienta-publicitaria.vercel.app` para compartirla.

Para la demo no hace falta poner ninguna variable de entorno.

## Cómo poner el token del INEGI (cuando lo tengas)

El token es gratuito. Se obtiene registrándose en la página de la API del DENUE:
<https://www.inegi.org.mx/servicios/api_denue.html>.

- **En tu computadora:** copia `.env.example` a un archivo nuevo llamado `.env.local` y escribe el token
  después de `INEGI_TOKEN=`. El archivo `.env.local` nunca se sube a GitHub.
- **En Vercel:** ve a **Settings → Environment Variables** y agrega `INEGI_TOKEN` con tu token.

Por seguridad, aunque pongas el token, la demo **sigue usando los datos de ejemplo**. El DENUE se enciende sólo
si además agregas `DENUE_ACTIVADO=si`. Si el DENUE falla, la app vuelve sola a los datos de ejemplo y lo avisa
en pantalla.

**Nunca escribas el token dentro del código.** El repositorio es público.

### Qué se verificó y qué no

De la documentación oficial del INEGI se verificó:

- la dirección de la API
- el orden de los datos que lleva cada consulta
- los tamaños de negocio (estratos 1 a 7)
- que la respuesta incluye teléfono, correo y página web

**No se pudo verificar**, porque no hay token:

- los nombres exactos de los campos en la respuesta
- qué contesta la API cuando no encuentra nada
- las claves de municipio de `datos/ciudades.json`

La documentación tampoco dice:

- si hay límite de consultas
- cuántos negocios traen correo

El giro se busca por una palabra en el nombre del negocio. Es lo más simple, pero puede dejar fuera algunos
negocios.

## Qué falta para enviar de verdad

1. **Conectar tu propio buzón** (Gmail o Outlook) con permiso tuyo, para que cada correo salga uno a uno desde
   tu cuenta. Los servicios de envío masivo, como Amazon SES o Resend, prohíben el correo en frío.
2. **Un correo con dominio propio** y su configuración (SPF, DKIM y DMARC), para no caer en spam.
3. **Una base de datos con usuarios**, para que la información no viva sólo en el navegador.
4. **Leer las respuestas de verdad** de tu buzón. En la demo, una «BAJA» de ejemplo ya marca al contacto como
   «No contactar».
5. **Activar el DENUE** con tu token y revisar los datos reales.
6. **Revisión legal** del pie del correo y del aviso de privacidad, conforme a la ley de protección de datos
   personales.
7. **Datos reales del desarrollo** (precios, fotos) y el permiso por escrito de la constructora para usarlos.

## Cómo está organizado el código

```
app/                 una carpeta por pantalla (buscar, redactar, envio, seguimiento, chat)
app/api/empresas/    consulta de empresas del lado del servidor (aquí se lee el token)
components/          piezas compartidas: barra de arriba, marco con menú y pestañas, botones y tarjetas
lib/                 las reglas: selección, plantilla, pie legal, envío simulado y chat, expediente
lib/datos/           capa de acceso a datos: BuscadorDeEmpresas, DatosDeEjemplo y DenueInegi
datos/               archivos JSON de ejemplo
public/fotos/        ilustraciones de ejemplo del desarrollo
artefacto/           versión de un solo archivo (npm run build:archivo)
pruebas/             pruebas automáticas
```

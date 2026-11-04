# Prospección por correo (demo)

Es una demo de una herramienta para conseguir clientes por correo: encuentras negocios en un directorio
público, escoges a quién escribirle, preparas un correo personal para cada uno y llevas el seguimiento.
Además guarda la prueba de dónde salió cada contacto.

**Esta versión no envía ningún correo.** Todos los negocios son inventados y sus correos terminan en
`@example.com`, un dominio que existe sólo para ejemplos.

## Las 6 pantallas

1. **Buscar empresas.** Filtras por giro, ciudad y tamaño, y agregas negocios a tu lista.
2. **Elegir contactos.** Escoges a mano a quién escribirle. Cada contacto tiene un semáforo según de dónde salió:
   - verde: viene de un directorio público, de tu formulario o de tus clientes
   - ámbar: lo agregaste tú y anotaste de dónde salió
   - rojo: no se sabe de dónde salió, y no se puede usar

   Los marcados «No contactar» ya no se pueden volver a elegir.
3. **Redactar.** Revisas el correo de cada negocio y lo apruebas. Los datos de tu desarrollo (nombre, precio,
   fotos y datos del pie legal) se cambian en **«Mi desarrollo»**. El pie legal se agrega solo y no se puede
   borrar. Los asuntos engañosos, como «Re:» o «Factura», se rechazan.
4. **Envío.** Aquí está el botón «Enviar», apagado. Debajo hay una simulación de cómo se repartirían los correos:
   pocos por hora, con pausas al azar y subiendo poco a poco cada día.
5. **Seguimiento.** Un tablero de ejemplo con quién «abrió», quién «respondió» y a quién mandarle un segundo
   mensaje. Todo ahí es simulado.
6. **Expediente.** De cada contacto dice de dónde salió, cuándo, qué semáforo tiene y qué mensaje se aprobó.
   Se descarga en un archivo CSV que abre en Excel.

Para presentarla rápido, en la página de inicio está el botón **«Cargar recorrido de ejemplo»**.

Se ve como una app: en el celular las pantallas van en pestañas abajo y en la computadora en una barra a la
izquierda.

## Qué es simulado

| Parte | Estado |
|---|---|
| Negocios, correos y teléfonos | Inventados (archivos en `datos/`) |
| Textos del desarrollo (nombre, precio, puntos fuertes, fotos) | De ejemplo, y los puedes editar |
| Pie legal | Texto de ejemplo. Antes de usarlo de verdad, que lo revise un abogado |
| Botón «Enviar» | Apagado |
| Plan de envío | Simulación |
| Seguimiento (enviados, abrieron, respondieron) | Inventado. No es un resultado ni una predicción |
| «Mejorar con IA» | Apagado. El código ya tiene dónde conectarlo (`lib/ia.ts`) |
| Directorio DENUE de INEGI | Preparado pero sin activar (`lib/datos/denue-inegi.ts`) |

Lo que escribes se guarda **sólo en tu navegador**, en `localStorage`. Si abres la demo en otra computadora,
la verás vacía.

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
4. **Leer las respuestas**, para que una «BAJA» marque al contacto como «No contactar» automáticamente.
5. **Activar el DENUE** con tu token y revisar los datos reales.
6. **Revisión legal** del pie del correo y del aviso de privacidad, conforme a la ley de protección de datos
   personales.
7. **Datos reales del desarrollo** (precios, fotos) y el permiso por escrito de la constructora para usarlos.

## Cómo está organizado el código

```
app/                 una carpeta por pantalla (buscar, contactos, redactar, envio, seguimiento, expediente)
app/api/empresas/    consulta de empresas del lado del servidor (aquí se lee el token)
components/          piezas compartidas: marco con pestañas, botones, tarjetas, ventanas y etiquetas
lib/                 las reglas: semáforo, plantilla, pie legal, plan de envío, expediente
lib/datos/           capa de acceso a datos: BuscadorDeEmpresas, DatosDeEjemplo y DenueInegi
datos/               archivos JSON de ejemplo
public/fotos/        ilustraciones de ejemplo del desarrollo
artefacto/           versión de un solo archivo (npm run build:archivo)
pruebas/             pruebas automáticas
```

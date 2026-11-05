-- Base de datos de Nexora (Cloudflare D1, que es SQLite).
-- Aquí viven de verdad los mensajes: ya no en el navegador.
-- Para aplicarlo:  npx wrangler d1 execute nexora --file=servidor/esquema.sql

-- Quién puede entrar. Las contraseñas NUNCA se guardan tal cual: se guarda su huella.
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  correo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  huella TEXT NOT NULL,              -- PBKDF2 de la contraseña
  sal TEXT NOT NULL,
  -- Integrantes del equipo. "dueño" puede invitar y dar de alta empresas; "invitado" atiende.
  papel TEXT NOT NULL DEFAULT 'invitado' CHECK (papel IN ('dueño', 'invitado')),
  creado_en TEXT NOT NULL
);

-- Cada vez que alguien entra se guarda una sesión. Se puede cerrar desde aquí.
CREATE TABLE IF NOT EXISTS sesiones (
  huella TEXT PRIMARY KEY,           -- huella del token de la galleta, no el token
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creada_en TEXT NOT NULL,
  expira_en TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sesiones_por_usuario ON sesiones(usuario_id);

-- Las empresas que atiende el equipo. Cada una es una operación aparte:
-- todo lo demás (cuentas, pláticas, interesados) cuelga de una empresa.
CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  -- Qué vende: condominios, autos, servicios…
  giro TEXT,
  notas TEXT,
  creada_en TEXT NOT NULL
);

-- Los canales de cada empresa que administra el equipo: su Instagram, su WhatsApp, su correo…
CREATE TABLE IF NOT EXISTS cuentas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  red TEXT NOT NULL CHECK (red IN ('instagram', 'whatsapp', 'facebook', 'tiktok', 'correo')),
  -- Cómo se llama la cuenta en esa red: @usuario, número o dirección de correo.
  identificador TEXT NOT NULL,
  creada_en TEXT NOT NULL,
  UNIQUE (red, identificador)
);
CREATE INDEX IF NOT EXISTS cuentas_por_empresa ON cuentas(empresa_id);

-- Un interesado de una empresa. Puede escribir por varias redes: ésta es su ficha única.
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  -- Etapa de venta, para el seguimiento.
  etapa TEXT NOT NULL DEFAULT 'nuevo',
  notas TEXT,
  creada_en TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS personas_por_empresa ON personas(empresa_id, nombre);

-- Una plática: un interesado escribiéndole a una cuenta de la empresa.
CREATE TABLE IF NOT EXISTS conversaciones (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- La cuenta de la empresa que recibió el mensaje.
  cuenta_id TEXT NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  red TEXT NOT NULL CHECK (red IN ('instagram', 'whatsapp', 'facebook', 'tiktok', 'correo')),
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  -- Cómo se le ve al interesado en esa red: @usuario, teléfono o correo.
  usuario_externo TEXT NOT NULL,
  -- El hilo del lado de la red, para contestar en el mismo hilo.
  hilo_externo TEXT,
  ultimo_en TEXT NOT NULL,
  -- Del último mensaje de la persona: de ahí corre el plazo para contestar.
  ultimo_de_ellos_en TEXT,
  leida_en TEXT,
  -- Cuándo se archivó. A los 7 días de archivada se borra sola.
  archivada_en TEXT,
  creada_en TEXT NOT NULL,
  UNIQUE (cuenta_id, usuario_externo)
);
CREATE INDEX IF NOT EXISTS conversaciones_recientes ON conversaciones(ultimo_en DESC);
CREATE INDEX IF NOT EXISTS conversaciones_por_empresa ON conversaciones(empresa_id, ultimo_en DESC);
CREATE INDEX IF NOT EXISTS conversaciones_por_persona ON conversaciones(persona_id);

CREATE TABLE IF NOT EXISTS mensajes (
  id TEXT PRIMARY KEY,
  conversacion_id TEXT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  de TEXT NOT NULL CHECK (de IN ('yo', 'ellos')),
  texto TEXT NOT NULL,
  fecha TEXT NOT NULL,
  -- El id que le da la red. Sirve para no repetir el mismo mensaje dos veces.
  externo_id TEXT,
  -- Para los que mandas tú: si la red lo aceptó o qué falló.
  entrega TEXT NOT NULL DEFAULT 'recibido' CHECK (entrega IN ('recibido', 'pendiente', 'entregado', 'falló')),
  error TEXT,
  creado_en TEXT NOT NULL,
  UNIQUE (conversacion_id, externo_id)
);
CREATE INDEX IF NOT EXISTS mensajes_por_platica ON mensajes(conversacion_id, fecha);

-- Memoria del lector de correo: hasta qué mensaje ya leímos, para no repetirlos.
CREATE TABLE IF NOT EXISTS estado_canal (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

-- Para ver qué pasó cuando algo falle.
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuando TEXT NOT NULL,
  canal TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('info', 'error')),
  mensaje TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bitacora_reciente ON bitacora(cuando DESC);

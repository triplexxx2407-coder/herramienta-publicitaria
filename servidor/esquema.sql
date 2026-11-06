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
  -- Sólo Instagram y Facebook: el número de la cuenta o página en Meta (llega en los avisos) y su token de acceso.
  -- El token NUNCA se manda a la pantalla.
  id_meta TEXT,
  token TEXT,
  creada_en TEXT NOT NULL,
  UNIQUE (red, identificador)
);
CREATE INDEX IF NOT EXISTS cuentas_por_empresa ON cuentas(empresa_id);

-- Lo de la bandeja de mensajes (NEXORA ya no se conecta a las redes) se tira.
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS conversaciones;
DROP TABLE IF EXISTS personas;
DROP TABLE IF EXISTS estado_canal;

-- Enlaces de WhatsApp con medición: cada clic se cuenta y manda a WhatsApp con el mensaje ya escrito.
CREATE TABLE IF NOT EXISTS enlaces (
  id TEXT PRIMARY KEY,               -- código corto de la dirección pública /api/w/<id>
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,              -- por ejemplo «Video avance de obra»
  telefono TEXT NOT NULL,            -- el WhatsApp de la empresa
  mensaje TEXT,
  clics INTEGER NOT NULL DEFAULT 0,
  creada_en TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS enlaces_por_empresa ON enlaces(empresa_id);

-- Quien escribió o se interesó, con su etapa de venta y cuándo darle seguimiento.
CREATE TABLE IF NOT EXISTS interesados (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  -- Por dónde llegó (instagram, whatsapp, facebook, tiktok, correo u otro).
  red TEXT NOT NULL DEFAULT '',
  enlace_id TEXT REFERENCES enlaces(id),
  etapa TEXT NOT NULL DEFAULT 'nuevo' CHECK (etapa IN ('nuevo', 'platicando', 'cita', 'apartado', 'vendido', 'perdido')),
  notas TEXT,
  siguiente_en TEXT,                 -- día del próximo seguimiento, «2026-11-06»
  creada_en TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS interesados_por_empresa ON interesados(empresa_id, creada_en DESC);

-- El calendario de publicaciones de cada empresa.
CREATE TABLE IF NOT EXISTS publicaciones (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  red TEXT NOT NULL,
  titulo TEXT NOT NULL,
  texto TEXT,
  fecha TEXT NOT NULL,               -- día de publicación, «2026-11-06»
  hecha INTEGER NOT NULL DEFAULT 0,
  enlace_id TEXT REFERENCES enlaces(id),
  creada_en TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS publicaciones_por_empresa ON publicaciones(empresa_id, fecha);

-- Para ver qué pasó cuando algo falle.
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuando TEXT NOT NULL,
  canal TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('info', 'error')),
  mensaje TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bitacora_reciente ON bitacora(cuando DESC);

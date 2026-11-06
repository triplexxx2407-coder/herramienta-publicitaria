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

-- Ya no se llevan interesados ni calendario: se tiran (si hubiera algo, era de prueba).
DROP TABLE IF EXISTS interesados;
DROP TABLE IF EXISTS publicaciones;

DROP TABLE IF EXISTS contenidos;

-- Cada persona que escribió desde un enlace, y hasta dónde llegó (escribió, cita, compró).
CREATE TABLE IF NOT EXISTS contactos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  enlace_id TEXT NOT NULL,
  nota TEXT NOT NULL DEFAULT '',
  etapa TEXT NOT NULL CHECK (etapa IN ('escribio', 'cita', 'venta')),
  creada_en TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS contactos_por_empresa ON contactos(empresa_id);
CREATE INDEX IF NOT EXISTS contactos_por_enlace ON contactos(enlace_id);

-- El WhatsApp de prueba: personas que tocan un enlace y escriben, para ver cómo se vería todo.
CREATE TABLE IF NOT EXISTS mensajes_prueba (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  enlace_id TEXT,
  persona TEXT NOT NULL,
  telefono TEXT NOT NULL,
  de TEXT NOT NULL CHECK (de IN ('yo', 'ellos')),
  texto TEXT NOT NULL,
  fecha TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS mensajes_prueba_por_empresa ON mensajes_prueba(empresa_id, fecha);

-- Para ver qué pasó cuando algo falle.
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuando TEXT NOT NULL,
  canal TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('info', 'error')),
  mensaje TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bitacora_reciente ON bitacora(cuando DESC);

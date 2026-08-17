-- Crear tabla de contenido web
CREATE TABLE IF NOT EXISTS contenido_web (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    seccion VARCHAR(50) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de habitaciones
CREATE TABLE IF NOT EXISTS habitaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    caracteristicas TEXT[],
    capacidad_adultos INTEGER DEFAULT 2,
    capacidad_ninos INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    habitacion_id INTEGER REFERENCES habitaciones(id),
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    adultos INTEGER DEFAULT 1,
    ninos INTEGER DEFAULT 0,
    desayuno BOOLEAN DEFAULT FALSE,
    importe_total DECIMAL(10,2) NOT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    apellidos_cliente VARCHAR(100),
    email_cliente VARCHAR(100) NOT NULL,
    telefono_cliente VARCHAR(20) NOT NULL,
    dni_cliente VARCHAR(20),
    hora_llegada VARCHAR(10),
    solicitud_especial TEXT,
    token_prechecking VARCHAR(100),
    prechecking_realizado BOOLEAN DEFAULT FALSE,
    fecha_prechecking TIMESTAMP,
    codigo_reserva VARCHAR(50) UNIQUE NOT NULL,
    hash_seguro VARCHAR(100) UNIQUE,
    dni_frontal_url VARCHAR(255),
    dni_trasero_url VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    icono VARCHAR(50) NOT NULL,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de redes sociales
CREATE TABLE IF NOT EXISTS redes_sociales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    icono VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de páginas legales
CREATE TABLE IF NOT EXISTS paginas_legales (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de mensajes de contacto
CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    forma_contacto VARCHAR(20),
    horario_contacto VARCHAR(20),
    leido BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos del footer
INSERT INTO contenido_web (clave, valor, seccion) VALUES
('footer_nombre', 'Hotel Amanecer en Campos', 'footer'),
('footer_slogan', 'Un lugar donde la naturaleza y el confort se encuentran', 'footer'),
('footer_direccion', 'C/ Fuente Nueva, s/n Población de Campos 34449 - Palencia', 'footer'),
('footer_telefono', '+34 979 81 10 99 - +34 685 51 00 20', 'footer'),
('footer_email_normal', 'info@hotelamanecer.com', 'footer'),
('footer_email', 'info&#64;hotelamanecer.com', 'footer'),
('footer_check_in', '15:00 – 22:00', 'footer'),
('footer_check_out', '12:00', 'footer'),
('footer_certificacion_1', 'Calidad Turística', 'footer'),
('footer_certificacion_2', 'Recomendado 2025', 'footer')
ON CONFLICT (clave) DO NOTHING;

-- Datos de habitaciones
INSERT INTO contenido_web (clave, valor, seccion) VALUES
('habitaciones_desayuno', '10', 'habitaciones'),
('habitaciones_title', 'Nuestras Habitaciones', 'habitaciones'),
('habitaciones_subtitle', 'Descubre el confort y la tranquilidad en cada espacio', 'habitaciones')
ON CONFLICT (clave) DO NOTHING;

-- Datos de hero
INSERT INTO contenido_web (clave, valor, seccion) VALUES
('hero_title_1', 'UNA EXPERIENCIA ÚNICA', 'hero'),
('hero_title_2', 'DONDE DISFRUTAR', 'hero'),
('hero_subtitle', 'HOTEL AMANECER EN CAMPOS', 'hero')
ON CONFLICT (clave) DO NOTHING;

-- Servicios iniciales
INSERT INTO servicios (titulo, descripcion, icono, orden, activo) VALUES
('WiFi Gratuito', 'Conexión a internet de alta velocidad en todo el hotel', 'bi-wifi', 1, TRUE),
('Desayuno Incluido', 'Delicioso desayuno buffet con productos locales', 'bi-cup-hot', 2, TRUE),
('Piscina Climatizada', 'Piscina cubierta abierta todo el año', 'bi-droplet', 3, TRUE),
('Senderismo', 'Rutas de senderismo por los alrededores', 'bi-tree', 4, TRUE),
('Parking Gratuito', 'Amplio aparcamiento gratuito para clientes', 'bi-car-front', 5, TRUE)
ON CONFLICT DO NOTHING;
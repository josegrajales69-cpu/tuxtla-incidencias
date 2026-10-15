-- database/schema.sql
-- Habilitación de extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Tipos enumerados
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('CIUDADANO', 'BRIGADISTA', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_enum AS ENUM (
        'BACHE', 
        'LUMINARIA', 
        'BASURA', 
        'ARBOL_CAIDO', 
        'FUGA_AGUA', 
        'DRENAJE', 
        'SEMAFORO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('RECIBIDO', 'EN_REVISION', 'EN_ATENCION', 'RESUELTO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_enum DEFAULT 'CIUDADANO',
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Incidencias Urbanas
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category category_enum NOT NULL,
    status status_enum DEFAULT 'RECIBIDO',
    location geometry(Point, 4326) NOT NULL,
    address VARCHAR(255),
    photo_url TEXT,
    citizen_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice Espacial GiST para consultas de proximidad ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Función PL/pgSQL: Detección de duplicados en un radio de 30 metros usando PostGIS
CREATE OR REPLACE FUNCTION check_duplicate_report(
    p_category category_enum,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 30.0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        ST_Distance(
            r.location::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters
    FROM reports r
    WHERE r.category = p_category
      AND r.status != 'RESUELTO'
      AND ST_DWithin(
            r.location::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            p_radius_meters
      )
    ORDER BY distance_meters ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- POBLACIÓN INICIAL: 9 Incidencias en Tuxtla Gutiérrez (Coordenadas reales)
INSERT INTO reports (id, title, description, category, status, location, address, photo_url, created_at)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'Basura en la 5a norte',
        'Acumulación de bolsas de basura en esquina comercial obstruyendo el paso peatonal.',
        'BASURA',
        'EN_REVISION',
        ST_SetSRID(ST_MakePoint(-93.1190, 16.7585), 4326),
        '5a Norte Poniente, Barrio Colón',
        'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500',
        NOW() - INTERVAL '1 hour'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Bache profundo frente al parque central',
        'Bache de gran tamaño en carril derecho ocasiona daño a suspensiones.',
        'BACHE',
        'RECIBIDO',
        ST_SetSRID(ST_MakePoint(-93.1155, 16.7530), 4326),
        'Av. Central esquina Calle Central, Centro',
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500',
        NOW() - INTERVAL '1 hour'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Luminaria apagada en avenida Central',
        'Lámpara de alumbrado público fundida dejando tramo oscuro e inseguro por las noches.',
        'LUMINARIA',
        'EN_ATENCION',
        ST_SetSRID(ST_MakePoint(-93.1250, 16.7520), 4326),
        'Av. Central Poniente entre 8a y 9a Poniente',
        'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500',
        NOW() - INTERVAL '3 days'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Contenedor desbordado en Parque de la Marimba',
        'Contenedores llenos de residuos de visitantes del parque.',
        'BASURA',
        'RECIBIDO',
        ST_SetSRID(ST_MakePoint(-93.1235, 16.7545), 4326),
        '8a Poniente Norte, Guadalupe',
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500',
        NOW() - INTERVAL '5 hours'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Luminaria parpadeando en Calzada Hombres Ilustres',
        'Falla intermitente en poste eléctrico frente al jardín botánico.',
        'LUMINARIA',
        'EN_REVISION',
        ST_SetSRID(ST_MakePoint(-93.1090, 16.7570), 4326),
        'Calzada de las Personas Ilustres',
        'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500',
        NOW() - INTERVAL '6 hours'
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        'Bache peligroso en Blvd. Belisario Domínguez',
        'Desprendimiento de carpeta asfáltica en incorporación rápida.',
        'BACHE',
        'EN_ATENCION',
        ST_SetSRID(ST_MakePoint(-93.1410, 16.7590), 4326),
        'Boulevard Belisario Domínguez km 1081',
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500',
        NOW() - INTERVAL '1 day'
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        'Rama rota en San Roque',
        'Árbol con riesgo inminente de caer sobre cableado de telefonía.',
        'ARBOL_CAIDO',
        'RECIBIDO',
        ST_SetSRID(ST_MakePoint(-93.1120, 16.7480), 4326),
        '4a Sur Oriente, Barrio San Roque',
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500',
        NOW() - INTERVAL '2 days'
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'Fuga de agua potable en Terán',
        'Fuga de agua constante saliendo de la banqueta hacia el asfalto.',
        'FUGA_AGUA',
        'EN_ATENCION',
        ST_SetSRID(ST_MakePoint(-93.1550, 16.7450), 4326),
        '2a Poniente Sur, Delegación Terán',
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500',
        NOW() - INTERVAL '4 hours'
    ),
    (
        '99999999-9999-9999-9999-999999999999',
        'Falla en semáforo crucero Las Palmas',
        'Semáforo en destello constante provocando congestionamiento vial.',
        'SEMAFORO',
        'RECIBIDO',
        ST_SetSRID(ST_MakePoint(-93.0950, 16.7510), 4326),
        'Boulevard Ángel Albino Corzo y Las Palmas',
        'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=500',
        NOW() - INTERVAL '30 minutes'
    )
ON CONFLICT (id) DO NOTHING;

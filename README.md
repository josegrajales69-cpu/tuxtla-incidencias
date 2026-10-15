# Tuxtla Reportes GIS 🗺️📍

Plataforma integral de reporte ciudadano, georreferenciación espacial con PostGIS y supervisión de cuadrillas municipales para la ciudad de **Tuxtla Gutiérrez, Chiapas**.

---

## 🚀 Características Principales

1. **Mapa Interactivo GIS de Alta Definición**:
   - Capas Leaflet (Calles con nombres de Tuxtla, Satelital, Canvas claro y oscuro).
   - Marcadores vectoriales SVG por tipo de incidencia (Bache, Luminaria, Basura, Árbol caído, Fuga de agua, Drenaje, Semáforo).
   - Mapa de calor de densidad de incidencias en tiempo real.
   - Buscador inteligente de avenidas, colonias y puntos emblemáticos de Tuxtla.

2. **Georreferenciación y Geocodificación Inversa Inteligente**:
   - Detección precisa de calles, colonias y municipios metropolitanos (Tuxtla Gutiérrez, Berriozábal, Chiapa de Corzo, San Fernando).
   - Caché en memoria para respuestas inmediatas (< 1 ms).
   - Prevención de duplicados espaciales con funciones PostGIS en radio de 30 metros.

3. **Respaldo Vecinal: "A mí también me afecta (+1 / Like Vecinal)"**:
   - Los vecinos pueden respaldar reportes existentes sin generar tickets duplicados.
   - Contador en tiempo real y ordenamiento por **Mayor Demanda Vecinal (+1)**.
   - Deduplicación por usuario y huella de dispositivo en PostgreSQL (`report_upvotes`).

4. **Separación Estricta de Roles**:
   - 👤 **Ciudadana**: Levantar reportes, seguimiento con semáforo/stepper, mis folios.
   - 👷 **Brigadista**: Panel de Operaciones de Cuadrilla, órdenes de trabajo asignadas, georutas GPS turn-by-turn con Google Maps y actualización de estatus en campo.
   - 🛡️ **Admin**: Consola de Gobierno, asignación y despacho de cuadrillas, monitoreo de brigadistas activos en campo, auditoría, eliminación y métricas ejecutivas.

5. **Clustering y Detección de Zonas Críticas con PostGIS**:
   - Agrupación espacial automática en cuadrículas de ~110 metros (`ST_SnapToGrid`).
   - Botón directo para volar y filtrar en el mapa por zona crítica.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Arquitectura Hexagonal (Domain, Ports, Adapters).
- **Base de Datos**: PostgreSQL 18 con extensión geoespacial **PostGIS**.
- **Servicios**: Systemd daemons en WSL2 / Linux.

---

## 📦 Instalación y Puesta en Marcha

### 1. Requisitos Previos
- Node.js >= 18
- PostgreSQL >= 14 con PostGIS instalado

### 2. Base de Datos
```bash
sudo -u postgres psql -c "CREATE DATABASE tuxtla_incidencias;"
sudo -u postgres psql -d tuxtla_incidencias -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d tuxtla_incidencias -f database/tuxtla_backup_complete.sql
```

### 3. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run build
npm start
# Corre en http://localhost:3001
```

### 4. Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
# Corre en http://localhost:5173
```

---

## 👥 Usuarios de Prueba Rápida
- **Administrador**: `admin@tuxtla.gob.mx` (Ing. Carlos Mendoza)
- **Brigadista**: `brigada@tuxtla.gob.mx` (Brigada Obras Públicas 04)
- **Ciudadana**: `ciudadana@tuxtla.gob.mx` (María Elena Solís)
- **Invitado**: Acceso libre para exploración ciudadana.

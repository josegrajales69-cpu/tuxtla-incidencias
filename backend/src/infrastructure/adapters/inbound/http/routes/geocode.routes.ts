import { Router, Request, Response } from 'express';

interface GeoCacheItem {
  address: string;
  timestamp: number;
}

const geoCache = new Map<string, GeoCacheItem>();

const TUXTLA_ZONES = [
  { name: 'Av. Central y Calle Central, Col. Centro, Tuxtla Gutiérrez', lat: 16.7530, lng: -93.1155 },
  { name: '5a Norte Poniente, Barrio Colón, Tuxtla Gutiérrez', lat: 16.7585, lng: -93.1190 },
  { name: 'Parque de la Marimba, Av. Central Pte, Tuxtla Gutiérrez', lat: 16.7565, lng: -93.1245 },
  { name: 'Blvd. Belisario Domínguez, Fracc. Arboledas, Tuxtla Gutiérrez', lat: 16.7580, lng: -93.1550 },
  { name: '3a Poniente Sur, Col. Terán, Tuxtla Gutiérrez', lat: 16.7450, lng: -93.1650 },
  { name: 'Calzada Samuel León Brindis, Col. Caminera, Tuxtla Gutiérrez', lat: 16.7460, lng: -93.1020 },
  { name: 'Barrio San Roque, 4a Sur Oriente, Tuxtla Gutiérrez', lat: 16.7480, lng: -93.1120 },
  { name: 'Calz. Ángel Albino Corzo, Fracc. Las Palmas, Tuxtla Gutiérrez', lat: 16.7580, lng: -93.0950 },
  { name: 'Libramiento Norte Poniente, Col. Miravalle, Tuxtla Gutiérrez', lat: 16.7720, lng: -93.1120 },
  { name: 'Libramiento Sur Oriente, Col. Francisco I. Madero, Tuxtla Gutiérrez', lat: 16.7380, lng: -93.1280 },
  { name: 'Caña Hueca, Periférico Norte Poniente, Tuxtla Gutiérrez', lat: 16.7620, lng: -93.1480 },
  { name: 'Col. Patria Nueva, Calle Nogal, Tuxtla Gutiérrez', lat: 16.7650, lng: -93.0780 },
  { name: 'Calzada al Sumidero, Col. Albania Baja, Tuxtla Gutiérrez', lat: 16.7680, lng: -93.0980 },
  { name: 'Carretera a Copoya / Calzada al Cristo, Copoya, Tuxtla Gutiérrez', lat: 16.7050, lng: -93.1100 },
  { name: 'Colonia Plan de Ayala, Av. Nuevo León, Tuxtla Gutiérrez', lat: 16.7620, lng: -93.1750 },
];

function estimateMunicipality(lat: number, lng: number): string {
  if (lng < -93.22) return 'Berriozábal, Chiapas';
  if (lng > -93.04) return 'Chiapa de Corzo, Chiapas';
  if (lat > 16.82) return 'San Fernando, Chiapas';
  if (lat < 16.68) return 'Suchiapa, Chiapas';
  return 'Tuxtla Gutiérrez, Chiapas';
}

export const createGeocodeRouter = (): Router => {
  const router = Router();

  router.get('/reverse', async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Parámetros lat y lng requeridos y numéricos' });
      return;
    }

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = geoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) {
      res.json({ address: cached.address, source: 'cache' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TuxtlaReportesGIS/1.0 (atencionciudadana@tuxtla.gob.mx)',
          'Accept-Language': 'es, es-MX;q=0.9',
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as any;
        const addr = data.address || {};

        const road = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || addr.highway || addr.cycleway;
        const houseNumber = addr.house_number ? ` #${addr.house_number}` : '';
        const colonia = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.city_district || addr.hamlet;
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || estimateMunicipality(lat, lng).split(',')[0];

        let formatted = '';

        if (road && colonia) {
          formatted = `${road}${houseNumber}, Col. ${colonia}, ${city}`;
        } else if (road) {
          formatted = `${road}${houseNumber}, ${city}`;
        } else if (colonia) {
          formatted = `Col. ${colonia}, ${city}`;
        } else if (data.display_name) {
          const parts = data.display_name.split(',').map((s: string) => s.trim()).filter(Boolean);
          formatted = parts.slice(0, 3).join(', ');
        } else {
          formatted = `Ubicación en ${city} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }

        geoCache.set(cacheKey, { address: formatted, timestamp: Date.now() });
        res.json({ address: formatted, source: 'nominatim' });
        return;
      }
    } catch {
      // Ignorar error de red y usar fallback inteligente
    }

    let closest = TUXTLA_ZONES[0];
    let minDist = Infinity;
    for (const z of TUXTLA_ZONES) {
      const d = Math.hypot(lat - z.lat, lng - z.lng);
      if (d < minDist) {
        minDist = d;
        closest = z;
      }
    }

    let fallbackAddress = '';
    if (minDist < 0.0075) {
      fallbackAddress = closest.name;
    } else {
      const muni = estimateMunicipality(lat, lng);
      fallbackAddress = `Ubicación georreferenciada, ${muni} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }

    geoCache.set(cacheKey, { address: fallbackAddress, timestamp: Date.now() });
    res.json({ address: fallbackAddress, source: 'local_fallback' });
  });

  return router;
};

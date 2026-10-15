// Servicio de Geocodificación Inversa y Formato para Tuxtla Gutiérrez y Zona Metropolitana

function estimateMunicipality(lat: number, lng: number): string {
  if (lng < -93.22) return 'Berriozábal, Chiapas';
  if (lng > -93.04) return 'Chiapa de Corzo, Chiapas';
  if (lat > 16.82) return 'San Fernando, Chiapas';
  if (lat < 16.68) return 'Suchiapa, Chiapas';
  return 'Tuxtla Gutiérrez, Chiapas';
}

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

export async function reverseGeocodeTuxtla(lat: number, lng: number): Promise<string> {
  // 1. Intentar resolver a través del backend (/api/geocode/reverse) con User-Agent oficial y caché
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        return data.address;
      }
    }
  } catch {
    // Si la API local falla, continuar con fallback
  }

  // 2. Fallback inteligente de zona
  let closest = TUXTLA_ZONES[0];
  let minDist = Infinity;
  for (const z of TUXTLA_ZONES) {
    const d = Math.hypot(lat - z.lat, lng - z.lng);
    if (d < minDist) {
      minDist = d;
      closest = z;
    }
  }

  // Si está cerca (< 800m) de un punto de referencia en Tuxtla
  if (minDist < 0.0075) {
    return closest.name;
  }

  // Si está fuera de Tuxtla (ej. Berriozábal, Chiapa de Corzo, Copoya, etc.)
  const muni = estimateMunicipality(lat, lng);
  return `Ubicación georreferenciada, ${muni} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export function formatReportDate(dateStr?: string): string {
  if (!dateStr) return 'Reciente';
  if (dateStr.startsWith('hace')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Hace un momento';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

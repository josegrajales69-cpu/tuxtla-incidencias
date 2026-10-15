import L from 'leaflet';
import { ReportCategory } from '../types/report';

export const getCategoryColor = (category: ReportCategory): string => {
  switch (category) {
    case 'BASURA': return '#22c55e';       // Verde
    case 'BACHE': return '#f97316';        // Naranja
    case 'LUMINARIA': return '#eab308';    // Amarillo
    case 'ARBOL_CAIDO': return '#10b981';  // Esmeralda
    case 'FUGA_AGUA': return '#06b6d4';    // Cian
    case 'DRENAJE': return '#3b82f6';      // Azul
    case 'SEMAFORO': return '#ef4444';     // Rojo
    default: return '#64748b';
  }
};

const getCategoryIconSvg = (category: ReportCategory): string => {
  switch (category) {
    case 'BACHE':
      // Cono de obra vial y advertencia de bache en asfalto (claramente reconocible)
      return `
        <path d="M12 2L6 18h12L12 2z" stroke="white" stroke-width="2" stroke-linejoin="round" fill="none"/>
        <path d="M8.5 12.5h7M10 8h4M3 21h18" stroke="white" stroke-width="2" stroke-linecap="round"/>
      `;
    case 'LUMINARIA':
      // Bombilla radiante con destellos de luz (alumbrado público)
      return `
        <path d="M9 16a5 5 0 1 1 6 0c-.5.8-1 1.5-1 2.5h-4c0-1-.5-1.7-1-2.5z" stroke="white" stroke-width="1.8" fill="none"/>
        <path d="M10 21h4M12 2v2M4.9 5.2l1.4 1.4M19.1 5.2l-1.4 1.4M2 12h2M20 12h2" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      `;
    case 'BASURA':
      // Bote contenedor de basura con tapa y franjas
      return `
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M10 11v6M14 11v6" stroke="white" stroke-width="2" stroke-linecap="round"/>
      `;
    case 'ARBOL_CAIDO':
      // Árbol caído con tronco inclinado sobre el suelo
      return `
        <path d="M3 20h18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 19l8-8M9 19l4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="8" r="5" stroke="white" stroke-width="2" fill="none"/>
        <path d="M16 5a3 3 0 0 0-2.5 4.5" stroke="white" stroke-width="1.5"/>
      `;
    case 'FUGA_AGUA':
      // Grifo / llave de agua con gota goteando
      return `
        <path d="M3 9h6l3-3h5a2 2 0 0 1 2 2v2M19 10h2v3h-2M9 9v3a3 3 0 0 0 6 0V9" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M12 16.5c-1 1-1 2.5 0 3.5s2.5 1 2.5 0-1.5-2.5-2.5-3.5z" fill="white"/>
      `;
    case 'DRENAJE':
      // Tapa de alcantarilla / rejilla de drenaje pluvial circular
      return `
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" fill="none"/>
        <circle cx="12" cy="12" r="4.5" stroke="white" stroke-width="1.8" fill="none"/>
        <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      `;
    case 'SEMAFORO':
      // Semáforo vertical con viseras y 3 luces nítidas
      return `
        <rect x="7" y="2" width="10" height="20" rx="3" stroke="white" stroke-width="2" fill="none"/>
        <circle cx="12" cy="6.5" r="2" fill="white"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
        <circle cx="12" cy="17.5" r="2" fill="white"/>
        <path d="M5 6.5h2M17 6.5h2M5 12h2M17 12h2M5 17.5h2M17 17.5h2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      `;
    default:
      return `<circle cx="12" cy="12" r="6" fill="white"/>`;
  }
};

export const createCustomPin = (category: ReportCategory) => {
  const color = getCategoryColor(category);
  const iconSvg = getCategoryIconSvg(category);

  const html = `
    <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transition: transform 0.2s;" class="hover:scale-110">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 27.5 14.5 42 16.2 43.6C16.65 44.05 17.35 44.05 17.8 43.6C19.5 42 34 27.5 34 17C34 7.611 26.389 0 17 0Z" fill="${color}"/>
        <circle cx="17" cy="17" r="13" fill="${color}"/>
      </svg>
      <div style="position: absolute; top: 6px; left: 6px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${iconSvg}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42],
  });
};

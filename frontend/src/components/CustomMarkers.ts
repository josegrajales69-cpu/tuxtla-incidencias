import { reportSymbols } from '../utils/reportSymbols';
import L from 'leaflet';
import { ReportCategory } from '../types/report';

export const getCategoryColor = (category: ReportCategory): string => {
  switch (category) {
    case 'BASURA': return '#44836a';
    case 'BACHE': return '#bb7038';
    case 'LUMINARIA': return '#a17b20';
    case 'ARBOL_CAIDO': return '#33877c';
    case 'FUGA_AGUA': return '#2986a1';
    case 'DRENAJE': return '#517fb2';
    case 'SEMAFORO': return '#b65660';
    default: return '#64748b';
  }
};

export const createCustomPin = (category: ReportCategory) => {
  const color = getCategoryColor(category);
  return L.divIcon({
    className: 'custom-leaflet-marker report-map-marker',
    html: `<div class="report-pin" style="--pin-color:${color}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${reportSymbols[category]||''}</svg></div><span class="report-pin-point"></span>`,
    iconSize: [34,44], iconAnchor: [17,44], popupAnchor: [0,-42],
  });
};

export const createResolvedPin=()=>L.divIcon({
 className:'resolved-map-marker',
 html:'<span class="resolved-map-symbol"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span>',
 iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-18],
});

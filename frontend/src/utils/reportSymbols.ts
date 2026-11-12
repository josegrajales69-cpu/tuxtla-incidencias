import { ReportCategory } from '../types/report';
export const reportSymbols: Record<ReportCategory,string> = {
  BACHE: '<path d="M3 15h4l2 3h6l2-3h4M5 10l2-4m12 4-2-4M12 4v5"/>',
  LUMINARIA: '<path d="M8 21V5a2 2 0 0 1 2-2h6a3 3 0 0 1 3 3v2M15 8h7M17 12v2m4-2 1 2M5 21h6"/>',
  BASURA: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5m4-5v5"/>',
  ARBOL_CAIDO: '<path d="M12 3 6 10h3l-5 6h7v5h2v-5h7l-5-6h3L12 3Z"/>',
  FUGA_AGUA: '<path d="M12 3c-2 3-7 7-7 11a7 7 0 0 0 14 0c0-4-5-8-7-11Z M8 14a4 4 0 0 0 4 4"/>',
  DRENAJE: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M7 10v5m5-5v5m5-5v5M7 3h10"/>',
  SEMAFORO: '<rect x="7" y="3" width="10" height="17" rx="3"/><path d="M12 20v2M5 7h2m10 0h2M5 12h2m10 0h2"/><circle cx="12" cy="7" r=".9"/><circle cx="12" cy="11.5" r=".9"/><circle cx="12" cy="16" r=".9"/>',
};

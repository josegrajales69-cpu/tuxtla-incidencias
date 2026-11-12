import { ReportCategory, ReportStatus } from '../types/report';

export const categoryLabel = (category: ReportCategory): string => ({
  BACHE: 'Bache', LUMINARIA: 'Alumbrado', BASURA: 'Basura',
  ARBOL_CAIDO: 'Árbol caído', FUGA_AGUA: 'Fuga de agua',
  DRENAJE: 'Drenaje', SEMAFORO: 'Semáforo',
}[category] || category);

export const statusLabel = (status: ReportStatus): string => ({
  RECIBIDO: 'Recibido', EN_REVISION: 'En revisión',
  EN_ATENCION: 'En atención', RESUELTO: 'Resuelto',
}[status] || status);

export const reportFolio = (report: {id:string;folio?:string}): string => report.folio || `ID-${report.id.slice(0,8).toUpperCase()}`;

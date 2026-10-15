export type ReportCategory = 
  | 'BACHE' 
  | 'LUMINARIA' 
  | 'BASURA' 
  | 'ARBOL_CAIDO' 
  | 'FUGA_AGUA' 
  | 'DRENAJE' 
  | 'SEMAFORO';

export type ReportStatus = 'RECIBIDO' | 'EN_REVISION' | 'EN_ATENCION' | 'RESUELTO';

export interface ReportProps {
  id?: string;
  title: string;
  description?: string;
  category: ReportCategory;
  status?: ReportStatus;
  lat: number;
  lng: number;
  address?: string;
  photoUrl?: string;
  citizenId?: string;
  assignedTo?: string;
  assignedBrigadeName?: string;
  upvotesCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Report {
  public readonly id?: string;
  public readonly title: string;
  public readonly description?: string;
  public readonly category: ReportCategory;
  public readonly status: ReportStatus;
  public readonly lat: number;
  public readonly lng: number;
  public readonly address?: string;
  public readonly photoUrl?: string;
  public readonly citizenId?: string;
  public readonly assignedTo?: string;
  public readonly assignedBrigadeName?: string;
  public readonly upvotesCount: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ReportProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('El título del reporte es obligatorio');
    }
    if (props.lat < 16.5 || props.lat > 17.0 || props.lng < -93.3 || props.lng > -92.9) {
      throw new Error('Las coordenadas están fuera de la jurisdicción de Tuxtla Gutiérrez');
    }
    this.id = props.id;
    this.title = props.title.trim();
    this.description = props.description;
    this.category = props.category;
    this.status = props.status || 'RECIBIDO';
    this.lat = props.lat;
    this.lng = props.lng;
    this.address = props.address;
    this.photoUrl = props.photoUrl;
    this.citizenId = props.citizenId;
    this.assignedTo = props.assignedTo;
    this.assignedBrigadeName = props.assignedBrigadeName;
    this.upvotesCount = props.upvotesCount || 0;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }
}

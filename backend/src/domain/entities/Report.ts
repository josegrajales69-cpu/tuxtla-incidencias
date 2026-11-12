import { getSituation, ReportPriority } from './ReportSituations';
import { DomainError } from '../errors/DomainError';
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
  folio?: string;
  title: string;
  description?: string;
  category: ReportCategory;
  status?: ReportStatus;
  lat: number;
  lng: number;
  address?: string;
  photoUrl?: string;
  resolutionPhotoUrl?:string;
  resolutionNotes?:string;
  resolvedBy?:string;
  resolvedByName?:string;
  resolvedAt?:Date;
  situation?: string;
  situationLabel?: string;
  priority?: ReportPriority;
  priorityReason?: string;
  citizenId?: string;
  assignedTo?: string;
  assignedBrigadeName?: string;
  upvotesCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Report {
  public readonly id?: string;
  public readonly folio?: string;
  public readonly title: string;
  public readonly description?: string;
  public readonly category: ReportCategory;
  public readonly status: ReportStatus;
  public readonly lat: number;
  public readonly lng: number;
  public readonly address?: string;
  public readonly photoUrl?: string;
  public readonly resolutionPhotoUrl?:string;
  public readonly resolutionNotes?:string;
  public readonly resolvedBy?:string;
  public readonly resolvedByName?:string;
  public readonly resolvedAt?:Date;
  public readonly situation?: string;
  public readonly situationLabel?: string;
  public readonly priority?: ReportPriority;
  public readonly priorityReason?: string;
  public readonly citizenId?: string;
  public readonly assignedTo?: string;
  public readonly assignedBrigadeName?: string;
  public readonly upvotesCount: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ReportProps) {
    if (typeof props.title !== 'string' || props.title.trim().length === 0) {
      throw new DomainError('El título del reporte es obligatorio');
    }
    if (props.title.trim().length > 200) throw new DomainError('El título admite hasta 200 caracteres');
    if (!['BACHE','LUMINARIA','BASURA','ARBOL_CAIDO','FUGA_AGUA','DRENAJE','SEMAFORO'].includes(props.category)) throw new DomainError('Categoría no válida');
    if (props.description != null && (typeof props.description !== 'string' || props.description.length > 4000)) throw new DomainError('La descripción admite hasta 4000 caracteres');
    if (props.address != null && (typeof props.address !== 'string' || props.address.length > 255)) throw new DomainError('La dirección admite hasta 255 caracteres');
    if (!Number.isFinite(props.lat) || !Number.isFinite(props.lng)) throw new DomainError('Coordenadas no válidas');
    if (props.lat < 16.5 || props.lat > 17.0 || props.lng < -93.3 || props.lng > -92.9) {
      throw new DomainError('Las coordenadas están fuera del área configurada para Tuxtla Gutiérrez');
    }
    const situation = props.situation ? getSituation(props.category,props.situation) : undefined;
    if (props.situation && !situation) throw new DomainError('La situación no corresponde a la categoría elegida');
    this.situation = situation?.id;
    this.situationLabel = props.situationLabel || situation?.label;
    this.priority = situation?.priority || props.priority || undefined;
    this.priorityReason = situation?.reason || props.priorityReason || undefined;
    this.id = props.id;
    this.folio = props.folio;
    this.title = props.title.trim();
    this.description = props.description;
    this.category = props.category;
    this.status = props.status || 'RECIBIDO';
    this.lat = props.lat;
    this.lng = props.lng;
    this.address = props.address;
    this.photoUrl = props.photoUrl;
    this.resolutionPhotoUrl=props.resolutionPhotoUrl;this.resolutionNotes=props.resolutionNotes;this.resolvedBy=props.resolvedBy;this.resolvedByName=props.resolvedByName;this.resolvedAt=props.resolvedAt;
    this.citizenId = props.citizenId;
    this.assignedTo = props.assignedTo;
    this.assignedBrigadeName = props.assignedBrigadeName;
    this.upvotesCount = props.upvotesCount || 0;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }
}

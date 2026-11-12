import {IReportRepository} from '../ports/IReportRepository';
import {IPhotoStorage} from '../ports/IPhotoStorage';
import {DomainError} from '../../domain/errors/DomainError';
export class ResolveReportUseCase {
 constructor(private readonly reports:IReportRepository,private readonly photos:IPhotoStorage){}
 async execute(id:string,actor:{id:string;role:string},photo?:Buffer,notes?:unknown){
  if(!['ADMIN','BRIGADISTA'].includes(actor.role))throw new DomainError('Solo el personal autorizado puede cerrar reportes.',403);
  const report=await this.reports.findById(id);if(!report)throw new DomainError('El reporte ya no está disponible.',404);
  if(actor.role!=='ADMIN'&&report.assignedTo!==actor.id)throw new DomainError('Solo el brigadista responsable puede cerrar este reporte.',403);
  if(report.status!=='EN_ATENCION')throw new DomainError('El reporte debe estar en atención antes de cerrarlo.',409);
  if(!photo?.length)throw new DomainError('Adjunta una foto del trabajo terminado para marcar el reporte como resuelto.');
  if(notes!==undefined&&(typeof notes!=='string'||notes.length>2000))throw new DomainError('La nota de solución admite hasta 2000 caracteres.');
  const url=await this.photos.save(photo);
  let resolved;try{resolved=await this.reports.resolveWithEvidence(id,actor.id,url,typeof notes==='string'?notes.trim():undefined);if(!resolved)throw new DomainError('Cambió la asignación o el estado del reporte. Actualiza la lista.',409);}catch(error){await this.photos.remove(url);throw error;}

  if(report.resolutionPhotoUrl&&report.resolutionPhotoUrl!==url)await this.photos.remove(report.resolutionPhotoUrl).catch(()=>{});
  return resolved;
 }
}

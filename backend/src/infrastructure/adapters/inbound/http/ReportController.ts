import {ResolveReportUseCase} from '../../../../application/use-cases/ResolveReportUseCase';
import {visibleReport} from './auth';
import { Request, Response } from 'express';
import { CreateReportUseCase } from '../../../../application/use-cases/CreateReportUseCase';
import { GetReportsUseCase } from '../../../../application/use-cases/GetReportsUseCase';
import { UpdateReportStatusUseCase } from '../../../../application/use-cases/UpdateReportStatusUseCase';
import { IReportRepository } from '../../../../application/ports/IReportRepository';
import { ReportCategory, ReportStatus } from '../../../../domain/entities/Report';

export class ReportController {
  constructor(
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly getReportsUseCase: GetReportsUseCase,
    private readonly updateReportStatusUseCase: UpdateReportStatusUseCase,
    private readonly reportRepo: IReportRepository,
    private readonly resolveReport:ResolveReportUseCase
  ) {}

  async resolve(req:Request,res:Response):Promise<void>{try{const report=await this.resolveReport.execute(req.params.id,req.actor!,req.file?.buffer,req.body.notes);res.json(report);}catch(error:any){res.status(error.statusCode||500).json({error:error.statusCode?error.message:'No pudimos guardar la solución. Conserva la foto e inténtalo de nuevo.'});}}
  async nearby(req:Request,res:Response):Promise<void>{
   try{const {category,lat,lng,situation}=req.query;
    if(!['BACHE','LUMINARIA','BASURA','ARBOL_CAIDO','FUGA_AGUA','DRENAJE','SEMAFORO'].includes(String(category))||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Number(lat)<16.5||Number(lat)>17||Number(lng)<-93.3||Number(lng)>-92.9){res.status(400).json({error:'Ubicación o categoría no válida'});return;}
    res.json((await this.reportRepo.findNearby(category as ReportCategory,Number(lat),Number(lng),situation as string)).map(report=>visibleReport(report,req.actor)));
   }catch{res.status(500).json({error:'No pudimos buscar reportes cercanos.'});}
  }
  async claim(req:Request,res:Response):Promise<void>{
   try{if(req.actor?.role!=='BRIGADISTA'){res.status(403).json({error:'Usa tu cuenta de brigadista para tomar el reporte; administración puede asignarlo.'});return;}
    const report=await this.reportRepo.claim(req.params.id,req.actor.id);if(!report){res.status(409).json({error:'El reporte ya tiene responsable, fue resuelto o retirado.'});return;}res.json(report);
   }catch{res.status(500).json({error:'No pudimos tomar el reporte.'});}
  }
  async withdraw(req:Request,res:Response):Promise<void>{
   try{const done=await this.reportRepo.withdraw(req.params.id,req.actor!.id);if(!done){res.status(403).json({error:'Solo puedes retirar reportes que tú publicaste.'});return;}res.json({success:true});}
   catch{res.status(500).json({error:'No pudimos retirar el reporte.'});}
  }
  async support(req:Request,res:Response):Promise<void>{try{res.json(await this.reportRepo.support(req.params.id,req.actor!.id));}catch{res.status(404).json({error:'El reporte ya no está disponible.'});}}
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, lat, lng, address, situation, citizenId } = req.body;

      if (!title || !category || lat === undefined || lng === undefined) {
        res.status(400).json({ error: 'Faltan campos obligatorios: title, category, lat, lng' });
        return;
      }

      const nearby=await this.reportRepo.findNearby(category,Number(lat),Number(lng),situation);
      if(nearby.length&&req.body.confirmDistinct!=='true'&&req.body.confirmDistinct!==true){res.status(409).json({error:'Hay reportes similares cerca. Puedes apoyar uno o indicar que es otro problema.',nearby:nearby.map(report=>visibleReport(report,req.actor))});return;}
      const result = await this.createReportUseCase.execute({
        title,
        description,
        category,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address,
        situation,
        citizenId:req.actor!.id,
      }, req.file?.buffer);

      res.status(201).json({...result,report:visibleReport(result.report,req.actor)});
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { category, status } = req.query;
      const reports = await this.getReportsUseCase.execute({
        category: category as ReportCategory,
        status: status as string,
      });
      res.json(reports.map(report=>visibleReport(report,req.actor)));
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener reportes' });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ error: 'El nuevo estatus es obligatorio' });
        return;
      }

      if(!['RECIBIDO','EN_REVISION','EN_ATENCION','RESUELTO'].includes(status)){res.status(400).json({error:'Estado no válido'});return;}
      if(status==='RESUELTO'){res.status(400).json({error:'Adjunta una foto de solución desde Cerrar reporte.'});return;}
      const report=await this.reportRepo.findById(id);if(!report){res.status(404).json({error:'Reporte no disponible'});return;}
      if(req.actor!.role!=='ADMIN'){
       if(status==='EN_ATENCION'&&!report.assignedTo){const claimed=await this.reportRepo.claim(id,req.actor!.id);if(!claimed){res.status(409).json({error:'Otro brigadista ya tomó el reporte.'});return;}res.json(claimed);return;}
       if(report.assignedTo!==req.actor!.id){res.status(403).json({error:'Primero toma el reporte. Solo su responsable puede actualizarlo.'});return;}
      }
      const updated = await this.reportRepo.updateStatusForActor(id,status as ReportStatus,req.actor!.id,req.actor!.role==='ADMIN');if(!updated){res.status(409).json({error:'La asignación cambió o el reporte fue retirado. Actualiza la lista.'});return;}
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al actualizar estatus' });
    }
  }

  async assignBrigade(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { brigadeId } = req.body;
      if(brigadeId){const {pool}=await import('../../../config/db');const target=await pool.query("SELECT id FROM users WHERE id=$1 AND role='BRIGADISTA' AND is_active=true",[brigadeId]);if(!target.rowCount){res.status(400).json({error:'Selecciona una cuenta de brigadista válida.'});return;}}
      const updated = await this.reportRepo.assignBrigade(id, brigadeId || null);
      if (!updated) {
        res.status(404).json({ error: 'Reporte no encontrado' });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al asignar brigada' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.reportRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Reporte no encontrado' });
        return;
      }
      res.json({ success: true, message: 'Reporte eliminado correctamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al eliminar reporte' });
    }
  }

  async toggleUpvote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, fingerprint } = req.body;
      const fp = fingerprint || (req.headers['x-fingerprint'] as string) || req.ip;
      const result = await this.reportRepo.toggleUpvote(id, req.actor?.id, fp as string);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al respaldar reporte' });
    }
  }

  async getUserUpvotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const fp = (req.query.fingerprint as string) || (req.headers['x-fingerprint'] as string) || req.ip;
      const reportIds = await this.reportRepo.getUserUpvotes(req.actor?.id, fp as string);
      res.json(reportIds);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener reportes respaldados' });
    }
  }
}

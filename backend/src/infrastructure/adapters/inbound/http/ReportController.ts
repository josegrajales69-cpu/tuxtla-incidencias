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
    private readonly reportRepo: IReportRepository
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, lat, lng, address, photoUrl, citizenId } = req.body;
      
      if (!title || !category || lat === undefined || lng === undefined) {
        res.status(400).json({ error: 'Faltan campos obligatorios: title, category, lat, lng' });
        return;
      }

      const result = await this.createReportUseCase.execute({
        title,
        description,
        category,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address,
        photoUrl,
        citizenId,
      });

      res.status(201).json(result);
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
      res.json(reports);
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

      const updated = await this.updateReportStatusUseCase.execute(id, status as ReportStatus);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al actualizar estatus' });
    }
  }

  async assignBrigade(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { brigadeId } = req.body;
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
      const result = await this.reportRepo.toggleUpvote(id, userId || undefined, fp as string);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al respaldar reporte' });
    }
  }

  async getUserUpvotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const fp = (req.query.fingerprint as string) || (req.headers['x-fingerprint'] as string) || req.ip;
      const reportIds = await this.reportRepo.getUserUpvotes(userId || undefined, fp as string);
      res.json(reportIds);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener reportes respaldados' });
    }
  }
}

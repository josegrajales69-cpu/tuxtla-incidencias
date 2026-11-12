import { IPhotoStorage } from '../ports/IPhotoStorage';
import { Report, ReportProps } from '../../domain/entities/Report';
import { IReportRepository } from '../ports/IReportRepository';

export class CreateReportUseCase {
  constructor(
    private readonly reportRepo: IReportRepository,
    private readonly photoStorage?: IPhotoStorage
  ) {}

  async execute(dto: ReportProps, photo?:Buffer): Promise<{ report: Report; duplicateWarning?: string }> {
    const entity = new Report(dto);

    const duplicateCheck = await this.reportRepo.checkDuplicate(dto.category, dto.lat, dto.lng, 30.0);

    let duplicateWarning: string | undefined;
    if (duplicateCheck.isDuplicate && duplicateCheck.existingId) {
      duplicateWarning = `Atención: Existe un reporte de ${dto.category} a ${Math.round(duplicateCheck.distanceMeters || 0)}m. Se registró como correlacionado.`;
    }

    let photoUrl:string|undefined;
    let created:Report;
    try {
      if(photo && this.photoStorage)photoUrl=await this.photoStorage.save(photo);
      created = await this.reportRepo.create(photoUrl?new Report({...dto,photoUrl}):entity);
    }catch(error){if(photoUrl)await this.photoStorage?.remove(photoUrl);throw error;}

    return { report: created, duplicateWarning };
  }
}

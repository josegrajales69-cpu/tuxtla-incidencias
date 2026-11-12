import {IReportRepository} from '../ports/IReportRepository';
import {ITelegramBrigadeRepository} from '../ports/ITelegramBrigadeRepository';
export class ClaimReportFromTelegram {
 constructor(private readonly reports:IReportRepository,private readonly links:ITelegramBrigadeRepository){}
 async execute(reportId:string,telegramUserId:string,messageId:number){
  if(!await this.links.isDispatchMessage(reportId,messageId))return {ok:false,text:'Este aviso no está disponible para asignación.'};
  const actor=await this.links.findBrigadist(telegramUserId);
  if(!actor)return {ok:false,text:'Vincula tu Telegram una sola vez desde Operaciones de brigada → Vincular Telegram.'};
  const claimed=await this.reports.claim(reportId,actor.id);
  if(claimed)return {ok:true,text:'El reporte quedó a tu cargo.',report:claimed};
  const report=await this.reports.findById(reportId);
  return {ok:false,text:!report?'El reporte fue retirado o ya no está disponible.':report.status==='RESUELTO'?'Este reporte ya está resuelto.':`Este reporte ya está a cargo de ${report.assignedBrigadeName||'otra brigada'}.`,report:report||undefined};
 }
}

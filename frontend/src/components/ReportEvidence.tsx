import {usePhotoViewer} from './PhotoViewer';
import React from 'react';
import {ReportItem} from '../types/report';
export function ReportPhoto({report,compact=false}:{report:ReportItem;compact?:boolean}){
 const openPhoto=usePhotoViewer();
 if(!report.photoUrl||!/^\/media\/reports\/[0-9a-f-]{36}\.jpg$/.test(report.photoUrl))return null;
 return <button type="button" className={`report-evidence-photo ${compact?'compact':''}`} onClick={()=>openPhoto({url:report.photoUrl!,title:report.title})} aria-label={`Abrir foto: ${report.title}`}><img src={report.photoUrl} loading="lazy" alt={`Foto del reporte: ${report.title}`}/><span>Foto original · Ampliar</span></button>;
}
export function ReportSituation({report,showPriority=false}:{report:ReportItem;showPriority?:boolean}){
 if(!report.situationLabel)return null;
 return <div className="report-situation-info"><span>{report.situationLabel}</span>{showPriority&&report.priority&&<small className={`priority-${report.priority.toLowerCase()}`}>Prioridad sugerida: {report.priority==='POR_CONFIRMAR'?'Por confirmar':report.priority.toLowerCase()}</small>}</div>;
}

export function ReportResolution({report}:{report:ReportItem}){
 const openPhoto=usePhotoViewer();
 if(!report.resolutionPhotoUrl||!/^\/media\/reports\/[0-9a-f-]{36}\.jpg$/.test(report.resolutionPhotoUrl))return null;
 return <section className="report-resolution"><div><strong>{report.status==='RESUELTO'?'Solución registrada':'Evidencia del cierre anterior'}</strong><small>{report.resolvedByName?`Trabajo registrado por ${report.resolvedByName}`:'Foto del trabajo terminado'}{report.resolvedAt?` · ${new Date(report.resolvedAt).toLocaleDateString('es-MX')}`:''}</small></div><button type="button" className="report-evidence-photo" onClick={()=>openPhoto({url:report.resolutionPhotoUrl!,title:`Foto de solución · ${report.title}`})}><img src={report.resolutionPhotoUrl} alt={`Foto de solución: ${report.title}`} loading="lazy"/><span>Foto de solución · Ampliar</span></button>{report.resolutionNotes&&<p>{report.resolutionNotes}</p>}</section>;
}

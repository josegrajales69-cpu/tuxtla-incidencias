import {ReportPhoto,ReportSituation,ReportResolution} from './ReportEvidence';
import { useDialog } from '../utils/useDialog';
import React, { useState } from 'react';
import { X, Plus, ArrowUpRight, ClipboardList, Check } from 'lucide-react';
import { ReportItem } from '../types/report';
import { categoryLabel, statusLabel, reportFolio } from '../utils/presentation';
import { formatReportDate } from '../utils/geocoding';
import { ReportIcon } from './ReportIcon';

interface Props { reports: ReportItem[]; onClose:()=>void; onCreate:()=>void; onLocate:(report:ReportItem)=>void; onWithdraw:(id:string)=>Promise<void>; }
const steps=['RECIBIDO','EN_REVISION','EN_ATENCION','RESUELTO'] as const;
export function MyReports({reports,onClose,onCreate,onLocate,onWithdraw}:Props) {
  const dialogRef = useDialog(true,onClose);
  const [withdrawing,setWithdrawing]=useState<string>();const [confirmId,setConfirmId]=useState<string>();const [error,setError]=useState('');
  const [filter,setFilter]=useState<'all'|'open'|'done'>('all');
  const visible=reports.filter(r=>filter==='all'||(filter==='done'?r.status==='RESUELTO':r.status!=='RESUELTO'));
  return <div className="simple-overlay" onClick={onClose}>
    <section ref={dialogRef} className="simple-sheet my-reports-sheet" role="dialog" aria-modal="true" aria-labelledby="my-reports-title" onClick={e=>e.stopPropagation()}>
      <header className="reports-heading"><div><p className="eyebrow">Tu actividad</p><h2 id="my-reports-title">Mis reportes</h2><p>Cada reporte es un paso para mejorar tu ciudad.</p></div><button className="sheet-close" onClick={onClose} aria-label="Cerrar mis reportes"><X size={18}/></button></header>
      <div className="reports-tools"><div className="segmented-control"><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>Todos <span>{reports.length}</span></button><button aria-pressed={filter==='open'} onClick={()=>setFilter('open')}>En curso</button><button aria-pressed={filter==='done'} onClick={()=>setFilter('done')}>Resueltos</button></div><button className="new-report-link" onClick={onCreate}><Plus size={17}/>Nuevo reporte</button></div>
      {error&&<p role="alert" className="report-field-error">{error}</p>}
      <div className="sheet-scroll reports-scroll">
        {visible.length===0 ? <div className="reports-empty"><ClipboardList size={38} strokeWidth={1.3}/><h3>{reports.length?'Todo en orden por aquí.':'Tu primer reporte hace la diferencia.'}</h3><p>{reports.length?'No hay reportes en esta sección.':'Si ves algo que necesita atención, ubícalo en el mapa y cuéntanos qué sucede.'}</p>{!reports.length&&<button className="system-primary" onClick={onCreate}>Crear un reporte<Plus size={16}/></button>}</div> : visible.map(r=><article className="personal-report" key={r.id}>
          <div className="personal-report-top"><span className="category-symbol"><ReportIcon category={r.category} size={22}/></span><div><span className="report-category-name">{categoryLabel(r.category)} · {reportFolio(r)}</span><h3>{r.title}</h3></div><span className={`quiet-status ${r.status==='RESUELTO'?'done':''}`}>{r.status==='RESUELTO'&&<Check size={12}/>} {statusLabel(r.status)}</span></div>
          <p className="report-address">{r.address||'Tuxtla Gutiérrez'} · {formatReportDate(r.createdAt)}</p>
          {r.description&&r.description!==r.title&&<p className="personal-description">{r.description}</p>}
          <p className="report-assignee">{r.assignedBrigadeName?`${r.status==='RESUELTO'?'Atendido por':'En atención por'} ${r.assignedBrigadeName}`:'Pendiente de asignación'}</p>
          <ReportSituation report={r}/><ReportPhoto report={r}/><ReportResolution report={r}/>
          <ol className="report-progress" aria-label={`Estado: ${statusLabel(r.status)}`}>{steps.map((step,i)=><li key={step} className={i<=steps.indexOf(r.status)?'complete':''} aria-current={r.status===step?'step':undefined}><span>{i<steps.indexOf(r.status)?<Check size={10}/>:i+1}</span><small>{['Recibido','En revisión','En atención','Resuelto'][i]}</small></li>)}</ol>
          {confirmId===r.id?<div className="withdraw-confirm"><p>¿Retirar este reporte? Dejará de aparecer en la página. Los avisos ya enviados a Telegram permanecerán en el grupo.</p><button disabled={!!withdrawing} onClick={async()=>{setWithdrawing(r.id);setError('');try{await onWithdraw(r.id);setConfirmId(undefined);}catch(error:any){setError(error.message);}finally{setWithdrawing(undefined);}}}>{withdrawing===r.id?'Retirando…':'Sí, retirar reporte'}</button><button disabled={!!withdrawing} onClick={()=>setConfirmId(undefined)}>Conservar</button></div>:<button className="withdraw-report" onClick={()=>setConfirmId(r.id)}>Retirar mi reporte</button>}
          <footer><span>{r.upvotesCount||0} apoyos de la comunidad</span><button onClick={()=>onLocate(r)}>Ver ubicación<ArrowUpRight size={15}/></button></footer>
        </article>)}
      </div>
    </section>
  </div>;
}

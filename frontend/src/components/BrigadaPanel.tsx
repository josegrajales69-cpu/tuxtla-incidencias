import {ResolveReportDialog} from './ResolveReportDialog';
import {TelegramLink} from './TelegramLink';
import {ReportPhoto,ReportSituation,ReportResolution} from './ReportEvidence';
import {ThemeToggle, useTheme} from './Theme';
import { categoryLabel, statusLabel, reportFolio } from '../utils/presentation';
import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowLeft,
  Navigation,
  MapPin,
  ExternalLink,
  Phone,
  Calendar,
  Filter,
  Check,
  RotateCcw,
  ShieldAlert,
  Flame,
  CheckCircle,
  Building
} from 'lucide-react';
import { ReportItem, ReportStatus, UserSession, ReportCategory } from '../types/report';
import { getCategoryColor } from './CustomMarkers';
import { formatReportDate } from '../utils/geocoding';

interface BrigadaPanelProps {
  onBackToMap: () => void;
  onViewReportOnMap: (lat: number, lng: number) => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
}

export const BrigadaPanel: React.FC<BrigadaPanelProps> = ({
  onBackToMap,
  onViewReportOnMap,
  currentUser,
  onOpenAuth,
}) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDIENTES' | 'EN_ATENCION' | 'RESUELTO'>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [resolvingReport, setResolvingReport] = useState<ReportItem | null>(null);
  const [brigadeNotes, setBrigadeNotes] = useState('');

  const isBrigadeOrAdmin = currentUser?.role === 'BRIGADISTA' || currentUser?.role === 'ADMIN';

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports',{headers:currentUser?.token?{Authorization:`Bearer ${currentUser.token}`}:{}});
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(()=>{const interval=setInterval(()=>{if(document.visibilityState==='visible')void loadReports();},15000);return()=>clearInterval(interval);},[currentUser?.token]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleClaim=async(id:string)=>{setUpdatingId(id);try{const response=await fetch(`/api/reports/${id}/claim`,{method:'POST',headers:{Authorization:`Bearer ${currentUser?.token||''}`}});const result=await response.json();if(!response.ok){showNotice(result.error||'No pudimos tomar el reporte.');await loadReports();return;}setReports(previous=>previous.map(report=>report.id===id?result:report));showNotice('El reporte quedó a tu cargo.');}catch{showNotice('No pudimos conectar. Inténtalo de nuevo.');}finally{setUpdatingId(null);}};
  const handleUpdateStatus = async (id: string, newStatus: ReportStatus, note?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(currentUser?.token?{Authorization:`Bearer ${currentUser.token}`}:{}) },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated=await res.json();setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
        );
        const statusLabels: Record<ReportStatus, string> = {
          RECIBIDO: 'Recibido',
          EN_REVISION: 'En Revisión Técnica',
          EN_ATENCION: 'En atención',
          RESUELTO: 'Resuelto Satisfactoriamente',
        };
        showNotice(`Reporte actualizado a "${statusLabels[newStatus]}".`);
        setResolvingReport(null);
        setBrigadeNotes('');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Error al actualizar el estatus');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const linkedId=new URLSearchParams(window.location.search).get('report');
  const filteredReports = [...reports].sort((a,b)=>Number(b.id===linkedId)-Number(a.id===linkedId)).filter((r) => {

    let matchesStatus = true;
    if (statusFilter === 'PENDIENTES') {
      matchesStatus = r.status === 'RECIBIDO' || r.status === 'EN_REVISION';
    } else if (statusFilter === 'EN_ATENCION') {
      matchesStatus = r.status === 'EN_ATENCION';
    } else if (statusFilter === 'RESUELTO') {
      matchesStatus = r.status === 'RESUELTO';
    }

    const matchesCategory = categoryFilter === 'TODAS' || r.category === categoryFilter;

    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const pendingCount = reports.filter((r) => r.status === 'RECIBIDO' || r.status === 'EN_REVISION').length;
  const inAttentionCount = reports.filter((r) => r.status === 'EN_ATENCION').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESUELTO').length;

  if (!isBrigadeOrAdmin) {
    return (
      <div className="h-full w-full bg-[#0b0f17] flex items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Acceso para Brigadistas</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Este panel está destinado exclusivamente a las <strong>Cuadrillas Operativas de Campo</strong> para dar soporte,
            atención y resolver las quejas ciudadanas de Tuxtla Gutiérrez.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={onOpenAuth}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition"
            >
              Iniciar Sesión como Brigadista
            </button>
            <button
              onClick={onBackToMap}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              ← Volver al Mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace brigade-workspace h-full w-full text-white flex flex-col overflow-hidden">

      <header className="px-6 py-4 bg-slate-950/95 border-b border-amber-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToMap}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Mapa</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/40">
                <Wrench className="w-5 h-5" />
              </span>
              <h1 className="text-lg font-black tracking-tight text-white">
                Operaciones de brigada
              </h1>
              <span className="bg-amber-900/60 text-amber-200 border border-amber-600/60 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                Trabajo de campo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tuxtla Gutiérrez · Seguimiento y atención de reportes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle/>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{currentUser?.name}</div>
            <div className="text-[10px] text-amber-400 font-mono">{currentUser?.email}</div>
          </div>
          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition"
            title="Recargar reportes"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {actionNotice && (
        <div className="bg-amber-600 text-slate-950 text-xs font-black px-4 py-2 text-center animate-in fade-in duration-150 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {resolvingReport&&currentUser&&<ResolveReportDialog report={resolvingReport} user={currentUser} onClose={()=>setResolvingReport(null)} onResolved={updated=>{setReports(previous=>previous.map(report=>report.id===updated.id?updated:report));showNotice('Reporte resuelto con foto de solución.');}}/>}

      <div className="workspace-content flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

        <div className="metric-strip grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button type="button" aria-pressed={statusFilter === 'TODOS'}
            onClick={() => setStatusFilter('TODOS')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'TODOS'
                ? 'bg-slate-800/90 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Todos los reportes</div>
            <div className="text-2xl font-black text-white">{reports.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Registradas en el municipio</div>
          </button>

          <button type="button" aria-pressed={statusFilter === 'PENDIENTES'}
            onClick={() => setStatusFilter('PENDIENTES')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'PENDIENTES'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Por atender</span>
            </div>
            <div className="text-2xl font-black text-amber-300">{pendingCount}</div>
            <div className="text-[11px] text-amber-400/80 mt-1">Requieren despacho de cuadrilla</div>
          </button>

          <button type="button" aria-pressed={statusFilter === 'EN_ATENCION'}
            onClick={() => setStatusFilter('EN_ATENCION')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'EN_ATENCION'
                ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>En atención</span>
            </div>
            <div className="text-2xl font-black text-blue-300">{inAttentionCount}</div>
            <div className="text-[11px] text-blue-400/80 mt-1">Personal trabajando en sitio</div>
          </button>

          <button type="button" aria-pressed={statusFilter === 'RESUELTO'}
            onClick={() => setStatusFilter('RESUELTO')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'RESUELTO'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resueltos</span>
            </div>
            <div className="text-2xl font-black text-emerald-300">{resolvedCount}</div>
            <div className="text-[11px] text-emerald-400/80 mt-1">Incidencias solucionadas</div>
          </button>
        </div>

        {currentUser?.role==='BRIGADISTA'&&<TelegramLink user={currentUser}/>}

        <div className="filter-bar flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por calle, folio o descripción..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Filtrar por categoría"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="TODAS">Todas las categorías</option>
              <option value="BACHE">Baches</option>
              <option value="LUMINARIA">Alumbrado</option>
              <option value="FUGA_AGUA">Fugas SMAPA</option>
              <option value="DRENAJE">Drenaje</option>
              <option value="BASURA">Basura</option>
              <option value="SEMAFORO">Semáforos</option>
              <option value="ARBOL_CAIDO">Árboles Caídos</option>
            </select>

            <span className="text-xs text-slate-400 font-mono px-2">
              Mostrando {filteredReports.length} de {reports.length}
            </span>
          </div>
        </div>

        <div className="work-orders grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Wrench className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No hay órdenes de trabajo que coincidan con los filtros.</p>
              <button
                onClick={() => { setStatusFilter('TODOS'); setCategoryFilter('TODAS'); setSearchQuery(''); }}
                className="mt-3 text-xs text-amber-400 hover:underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            filteredReports.map((report, idx) => {
              const isUpdating = updatingId === report.id;
              const isResolved = report.status === 'RESUELTO';
              const isInProgress = report.status === 'EN_ATENCION';
              const canManage=currentUser?.role==='ADMIN'||report.assignedTo===currentUser?.id;
              const isPending = report.status === 'RECIBIDO' || report.status === 'EN_REVISION';

              return (
                <div
                  key={report.id}
                  data-linked={report.id===linkedId}
                  className={`work-order bg-slate-900/80 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-600 shadow-xl ${
                    isResolved
                      ? 'border-emerald-900/40 opacity-80'
                      : isInProgress
                      ? 'border-blue-700/60 shadow-blue-900/10'
                      : 'border-amber-700/50 shadow-amber-900/10'
                  }`}
                >
                  <div>

                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {reportFolio(report)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{
                            color: getCategoryColor(report.category),
                            backgroundColor: `${getCategoryColor(report.category)}20`,
                            border: `1px solid ${getCategoryColor(report.category)}40`,
                          }}
                        >
                          {categoryLabel(report.category)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isResolved
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50'
                              : isInProgress
                              ? 'bg-blue-950/70 text-blue-300 border-blue-600/50 animate-pulse'
                              : 'bg-amber-950/70 text-amber-300 border-amber-600/50'
                          }`}
                        >
                          {statusLabel(report.status)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-1">{report.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{report.address || 'Tuxtla Gutiérrez, Chiapas'}</span>
                    </div>

                    <p className="report-description text-sm text-slate-300 mb-4 line-clamp-3">
                      {report.description || 'Sin descripción adicional por el ciudadano.'}
                    </p>

                    <p className="report-assignee">{report.assignedBrigadeName?`${isResolved?'Atendido por':'Responsable:'} ${report.assignedBrigadeName}`:'Sin responsable'}</p>
                    <ReportSituation showPriority report={report}/><ReportPhoto report={report}/><ReportResolution report={report}/>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-4 pt-1 border-t border-slate-800">
                      <span>Lat: {report.lat.toFixed(4)}, Lng: {report.lng.toFixed(4)}</span>
                      <span>{formatReportDate(report.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2">

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition text-center"
                        title="Abrir indicaciones de GPS en Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-400" />
                        <span>Ruta GPS</span>
                      </a>

                      <button
                        onClick={() => onViewReportOnMap(report.lat, report.lng)}
                        className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition text-center"
                        title="Ver ubicación en el visor de Tuxtla"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver en Mapa</span>
                      </button>
                    </div>

                    {!report.assignedTo&&!isResolved&&currentUser?.role==='BRIGADISTA'&&<button disabled={isUpdating} className="system-primary claim-report" onClick={()=>void handleClaim(report.id)}>{isUpdating?'Asignando…':'Tomar reporte'}</button>}
                    {isPending && canManage && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(report.id, 'EN_ATENCION')}
                        className="primary-action w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>{isUpdating ? 'Actualizando...' : 'Atender reporte'}</span>
                      </button>
                    )}

                    {isInProgress && canManage && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={isUpdating}
                          onClick={() => setResolvingReport(report)}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{isUpdating ? 'Guardando...' : 'Resolver'}</span>
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(report.id, 'EN_REVISION')}
                          className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>A Revisión</span>
                        </button>
                      </div>
                    )}

                    {isResolved && (
                      <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl">
                        <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Reporte resuelto</span>
                        </span>
                        <button
                          disabled={isUpdating||!canManage}
                          onClick={() => handleUpdateStatus(report.id, 'EN_ATENCION')}
                          className="text-[11px] text-slate-400 hover:text-white underline font-semibold"
                        >
                          Reabrir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

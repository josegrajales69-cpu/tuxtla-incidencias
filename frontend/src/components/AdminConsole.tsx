import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Trash2,
  Download,
  CheckCircle2,
  Search,
  RefreshCw,
  ArrowLeft,
  Building2,
  Wrench,
  Phone,
  Clock,
  MapPin,
  Truck,
  HardHat,
  AlertCircle
} from 'lucide-react';
import { ReportItem, UserSession, UserRole } from '../types/report';
import { getCategoryColor } from './CustomMarkers';
import { formatReportDate } from '../utils/geocoding';

interface AdminConsoleProps {
  onBackToMap: () => void;
  onNavigateToMapWithCoords?: (lat: number, lng: number) => void;
  currentUser: UserSession | null;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  onBackToMap,
  onNavigateToMapWithCoords,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'brigades' | 'users'>('reports');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchReport, setSearchReport] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [userRoleUpdating, setUserRoleUpdating] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {}
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {}
  };

  // Cargar usuarios del sistema desde la base de datos
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/auth/demo-users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {}
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadReports();
    }
  }, [isAdmin]);

  // Actualizar rol de usuario en tiempo real en la BD
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setUserRoleUpdating(userId);
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showNotice(`Rol de usuario actualizado a ${newRole} en la base de datos.`);
      }
    } catch (err: any) {
      alert('Error al actualizar rol: ' + err.message);
    } finally {
      setUserRoleUpdating(null);
    }
  };

  // Asignar o despachar una cuadrilla a una incidencia específica
  const handleAssignBrigade = async (reportId: string, brigadeId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brigadeId: brigadeId || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r))
        );
        const brigadeObj = users.find((u) => u.id === brigadeId);
        showNotice(
          brigadeId
            ? `Incidencia despachada a "${brigadeObj?.name || 'Cuadrilla'}" exitosamente.`
            : 'Incidencia desasignada de cuadrilla.'
        );
      }
    } catch (err: any) {
      alert('Error al asignar cuadrilla: ' + err.message);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Exportar todas las incidencias a CSV compatible con Excel
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = ['Folio_ID', 'Titulo', 'Categoria', 'Estatus', 'Cuadrilla_Asignada', 'Direccion', 'Latitud', 'Longitud', 'Fecha_Reporte'];
    const rows = reports.map((r, i) => [
      `TX-${String(i + 1).padStart(4, '0')}`,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.status,
      `"${(r.assignedBrigadeName || 'Sin Asignar').replace(/"/g, '""')}"`,
      `"${(r.address || 'Tuxtla Gutiérrez').replace(/"/g, '""')}"`,
      r.lat,
      r.lng,
      r.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `incidencias_tuxtla_reporte_oficial_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Archivo CSV exportado exitosamente con cuadrillas y folios.');
  };

  // Filtrado de incidencias
  const filteredReports = reports.filter((r) => {
    const matchesCat = filterCategory === 'TODAS' || r.category === filterCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchReport.toLowerCase()) ||
      (r.address && r.address.toLowerCase().includes(searchReport.toLowerCase())) ||
      (r.assignedBrigadeName && r.assignedBrigadeName.toLowerCase().includes(searchReport.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Métricas completas de Brigadas y Cuadrillas
  const brigadistas = users.filter((u) => u.role === 'BRIGADISTA');
  const activeBrigadistas = brigadistas.filter((b) =>
    reports.some((r) => r.assignedTo === b.id && r.status === 'EN_ATENCION')
  );
  const activeBrigadistasCount = activeBrigadistas.length;
  const availableBrigadistasCount = Math.max(0, brigadistas.length - activeBrigadistasCount);
  const pendingReportsCount = reports.filter((r) => r.status === 'RECIBIDO' || r.status === 'EN_REVISION').length;
  const inAttentionCount = reports.filter((r) => r.status === 'EN_ATENCION').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESUELTO').length;

  // Si no es Administrador, bloquear acceso y mostrar aviso de seguridad
  if (!isAdmin) {
    return (
      <div className="h-full w-full bg-[#0b0f17] flex items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-600/50 flex items-center justify-center text-red-400 mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Acceso Denegado (Solo Admin)</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            La <strong>Consola de Gobierno y Supervisión de Brigadas</strong> está restringida exclusivamente para el 
            <strong> Director General / Administrador</strong>. Como <strong>{currentUser?.role || 'INVITADO'}</strong>, tus operaciones están en el panel asignado.
          </p>
          <button
            onClick={onBackToMap}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            ← Volver al Mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0b0f17] text-white flex flex-col overflow-hidden select-none">
      {/* Header Superior de la Consola Admin */}
      <header className="px-6 py-4 bg-slate-950/95 border-b border-purple-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToMap}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Mapa</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/40">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-lg font-black tracking-tight text-white">
                Consola de Gobierno y Supervisión de Brigadas
              </h1>
              <span className="bg-purple-900/60 text-purple-200 border border-purple-600/60 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                ADMIN DIRECTIVO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tuxtla Gutiérrez, Chiapas • Monitoreo de Cuadrillas Activas, Incidencias y Moderación
            </p>
          </div>
        </div>

        {/* Botones de acción global */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
            title="Exportar base de datos a CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Excel)</span>
          </button>
        </div>
      </header>

      {/* Notificación Flotante de Acción Exitosa */}
      {actionNotice && (
        <div className="bg-green-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in duration-150 flex items-center justify-center gap-2 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TARJETAS KPI DE BRIGADAS Y REPORTES (SUPER COMPLETAS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pt-5 pb-2 shrink-0">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Incidencias Totales</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{reports.length}</div>
          <div className="text-[11px] text-purple-300/80 mt-1">
            {pendingReportsCount} pendientes • {inAttentionCount} en atención
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Brigadistas Registrados</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{brigadistas.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cuadrillas oficiales en Tuxtla
          </div>
        </div>

        <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl shadow-lg">
          <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Dando Atención Activa</span>
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {activeBrigadistasCount} <span className="text-sm font-semibold text-emerald-400/80">/ {brigadistas.length}</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Desplegados en campo ahora</span>
          </div>
        </div>

        <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl shadow-lg">
          <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Cuadrillas en Guardia</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {availableBrigadistasCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Listas para despacho inmediato
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación de la Consola */}
      <div className="px-6 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestión de Incidencias ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brigades')}
          className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'brigades'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Cuadrillas y Brigadistas en Atención ({brigadistas.length})</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/40 font-mono">
            {activeBrigadistasCount} activos
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Cuentas y Roles ({users.length})</span>
        </button>
      </div>

      {/* Contenido Principal Scrolleable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* ========================================================= */}
        {/* PESTAÑA 1: GESTIÓN Y MODERACIÓN DE INCIDENCIAS */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchReport}
                  onChange={(e) => setSearchReport(e.target.value)}
                  placeholder="Buscar por calle, cuadrilla o título..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="TODAS">Todas las categorías</option>
                  <option value="BACHE">Bache</option>
                  <option value="LUMINARIA">Alumbrado</option>
                  <option value="BASURA">Basura</option>
                  <option value="FUGA_AGUA">Fuga de Agua</option>
                  <option value="DRENAJE">Drenaje</option>
                  <option value="SEMAFORO">Semáforo</option>
                  <option value="ARBOL_CAIDO">Árbol Caído</option>
                </select>

                <button
                  onClick={loadReports}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 transition"
                  title="Recargar incidencias"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabla de Incidencias con Acciones Exclusivas de Admin */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Folio</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Título y Dirección</th>
                      <th className="py-3 px-4">Demanda Vecinal</th>
                      <th className="py-3 px-4">Estatus</th>
                      <th className="py-3 px-4">Cuadrilla Asignada</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4 text-right">Acción Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No se encontraron incidencias que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-purple-400">
                            #TX-{String(idx + 1).padStart(3, '0')}
                          </td>
                          <td className="py-3 px-4">
                            <span 
                              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                              style={{ 
                                color: getCategoryColor(r.category),
                                backgroundColor: `${getCategoryColor(r.category)}20`,
                                border: `1px solid ${getCategoryColor(r.category)}40`
                              }}
                            >
                              {r.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-white truncate">{r.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">📍 {r.address || 'Tuxtla Gutiérrez'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                              (r.upvotesCount || 0) > 0 
                                ? 'bg-blue-950 text-blue-300 border border-blue-600/50' 
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }`}>
                              <span>👍</span>
                              <span>{r.upvotesCount || 0}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {/* Selector de Asignación / Despacho a Brigadista */}
                            <select
                              value={r.assignedTo || ''}
                              onChange={(e) => handleAssignBrigade(r.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-[11px] text-slate-200 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer max-w-[190px] truncate"
                              title="Asignar o despachar cuadrilla a esta incidencia"
                            >
                              <option value="">⚠️ Sin Asignar</option>
                              {brigadistas.map((b) => (
                                <option key={b.id} value={b.id}>
                                  🚜 {b.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                            {formatReportDate(r.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {/* Botón Exclusivo de Administrador: Borrado con confirmación */}
                            <button
                              onClick={() => {
                                if (confirm(`¿ADMIN: Confirmas eliminar definitivamente el reporte "${r.title}" de la base de datos?`)) {
                                  handleDeleteReport(r.id);
                                  showNotice(`Reporte "${r.title}" eliminado de la base de datos.`);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/60 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ml-auto"
                              title="Eliminar reporte (Solo Administrador)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 2: SUPERVISIÓN Y MONITOREO DE CUADRILLAS EN ATENCIÓN */}
        {/* ========================================================= */}
        {activeTab === 'brigades' && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Monitoreo de Brigadistas Registrados y Atención en Campo</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supervisión oficial de {brigadistas.length} cuadrillas municipales de Tuxtla Gutiérrez: personal desplegado, incidencias en curso y disponibilidad.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{activeBrigadistasCount} en campo dando atención</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-700/60 font-bold">
                  {availableBrigadistasCount} disponibles
                </span>
              </div>
            </div>

            {/* Listado de tarjetas completas de cada cuadrilla */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brigadistas.map((brigade) => {
                const assignedReports = reports.filter((r) => r.assignedTo === brigade.id);
                const activeTasks = assignedReports.filter((r) => r.status === 'EN_ATENCION');
                const resolvedTasks = assignedReports.filter((r) => r.status === 'RESUELTO');
                const isGivingAttention = activeTasks.length > 0;

                return (
                  <div
                    key={brigade.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition shadow-xl ${
                      isGivingAttention
                        ? 'bg-slate-900/90 border-emerald-600/50 shadow-emerald-900/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Header de la tarjeta de brigadista */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                            isGivingAttention
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}>
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{brigade.name}</h4>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{brigade.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Estatus Operativo en tiempo real */}
                      <div className="mb-3.5">
                        {isGivingAttention ? (
                          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Dando Atención Activa ({activeTasks.length} {activeTasks.length === 1 ? 'incidencia' : 'incidencias'})</span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Disponible en Base / En Guardia</span>
                          </div>
                        )}
                      </div>

                      {/* Teléfono de contacto y tareas resueltas */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-3 border-b border-slate-800 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Radio/Tel: {brigade.phone || '961-000-0000'}</span>
                        </span>
                        <span className="text-[11px] text-purple-400 font-bold">
                          {resolvedTasks.length} resueltos
                        </span>
                      </div>

                      {/* Reportes activos que esta brigada está atendiendo */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Incidencias en atención ({activeTasks.length}):</span>
                          {isGivingAttention && (
                            <span className="text-[10px] text-emerald-400 font-bold">En Cuadrilla</span>
                          )}
                        </div>
                        {activeTasks.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">
                            Sin reportes activos en este momento. Puedes despacharle reportes desde la pestaña "Gestión de Incidencias".
                          </p>
                        ) : (
                          activeTasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span
                                    className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded"
                                    style={{
                                      color: getCategoryColor(t.category),
                                      backgroundColor: `${getCategoryColor(t.category)}20`,
                                    }}
                                  >
                                    {t.category}
                                  </span>
                                  <span className="text-[11px] text-white font-bold truncate">
                                    {t.title}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>{t.address || 'Tuxtla Gutiérrez'}</span>
                                </div>
                              </div>
                              {onNavigateToMapWithCoords && (
                                <button
                                  onClick={() => onNavigateToMapWithCoords(t.lat, t.lng)}
                                  className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg text-xs transition shrink-0"
                                  title="Ubicar cuadrilla en el mapa"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span>Total Asignadas: <strong className="text-white">{assignedReports.length}</strong></span>
                      <span className="text-emerald-400 font-bold text-[11px]">● Cuadrilla Municipal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 3: GESTIÓN DE PERSONAL Y CUENTAS MUNICIPALES */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Control de Usuarios y Roles de Tuxtla Gutiérrez
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Promueve o asigna permisos de Brigadista y Administrador en tiempo real directamente en PostgreSQL.
                </p>
              </div>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Correo Institucional</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4">Rol Actual</th>
                      <th className="py-3 px-4 text-right">Modificar Permiso (Solo Admin)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-600 text-white' : u.role === 'BRIGADISTA' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {u.role[0]}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{u.email}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{u.phone || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-950/70 text-purple-300 border-purple-600/50'
                              : u.role === 'BRIGADISTA'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-600/50'
                              : 'bg-blue-950/70 text-blue-300 border-blue-600/50'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {/* Selector exclusivo para que el Admin cambie roles */}
                          <select
                            disabled={userRoleUpdating === u.id || u.id === currentUser?.id}
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="CIUDADANO">CIUDADANO</option>
                            <option value="BRIGADISTA">BRIGADISTA</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

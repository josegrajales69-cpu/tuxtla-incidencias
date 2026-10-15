import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Flame, 
  TrendingUp, 
  Sun, 
  Moon, 
  ArrowLeft,
  ShieldAlert,
  Lock,
  LogIn,
  MapPin,
  X
} from 'lucide-react';
import { DashboardData, UserSession, HotZone, ReportItem } from '../types/report';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { 
  const d = new Date(); 
  d.setDate(d.getDate() - n); 
  return iso(d); 
};

const PRESETS = [
  { id: '7', label: '7 días', range: () => ({ from: daysAgo(7), to: iso(new Date()) }) },
  { id: '30', label: '30 días', range: () => ({ from: daysAgo(30), to: iso(new Date()) }) },
  {
    id: 'month',
    label: 'Este mes',
    range: () => {
      const n = new Date();
      return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) };
    },
  },
  { id: 'all', label: 'Histórico', range: () => ({}) },
  { id: 'custom', label: 'Personalizado', range: null },
];

interface KpiCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  helper?: string;
  isDark: boolean;
}

function KpiCard({ icon: Icon, label, value, color, helper, isDark }: KpiCardProps) {
  return (
    <div 
      className={`flex flex-col justify-between rounded-3xl p-5 shadow-xl transition-all duration-200 hover:scale-[1.02] border ${
        isDark 
          ? 'glass-dark text-white' 
          : 'glass-light text-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</span>
        <span 
          className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-md transition-transform hover:rotate-6"
          style={{ background: color }}
        >
          <Icon size={20} />
        </span>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-black tracking-tight">{value}</span>
        {helper && <p className="mt-1 text-xs opacity-60 font-medium">{helper}</p>}
      </div>
    </div>
  );
}

interface AnalyticsViewProps {
  onBackToMap: () => void;
  onNavigateToMapWithZone?: (zone: { lat: number; lng: number; name: string }) => void;
  onNavigateToBrigada?: () => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  onBackToMap, 
  onNavigateToMapWithZone,
  onNavigateToBrigada,
  currentUser,
  onOpenAuth 
}) => {
  const [isDark, setIsDark] = useState(true);
  const [preset, setPreset] = useState('30');
  const [custom, setCustom] = useState({ from: daysAgo(30), to: iso(new Date()) });
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  // Zonas interactivas y reportes asociados
  const [selectedZone, setSelectedZone] = useState<HotZone | null>(null);
  const [allReports, setAllReports] = useState<ReportItem[]>([]);

  // Control de acceso por rol: Exclusivo para ADMIN Directivo
  const hasAccess = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (!hasAccess) return;

    const p = PRESETS.find((x) => x.id === preset);
    const range = p?.range ? p.range() : custom;
    const query = new URLSearchParams({
      ...(range as any),
      granularity,
    }).toString();

    fetch(`/api/analytics/summary?${query}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => {
        setError(e.message);
      });
  }, [preset, custom, granularity, hasAccess]);

  // Cargar todas las incidencias para poder inspeccionar las zonas calientes
  useEffect(() => {
    if (!hasAccess) return;
    fetch('/api/reports')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAllReports(d))
      .catch(() => {});
  }, [hasAccess]);

  // Cálculo de distancia en metros usando fórmula de Haversine
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const zoneReports = selectedZone
    ? allReports.filter(
        (r) => getDistanceMeters(r.lat, r.lng, selectedZone.lat, selectedZone.lng) <= 450
      )
    : [];

  // Si no tiene acceso (es brigadista, ciudadano o visitante), restringir
  if (!hasAccess) {
    return (
      <div className={`h-full w-full flex items-center justify-center p-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className={`max-w-md w-full p-8 rounded-3xl text-center shadow-2xl border ${isDark ? 'glass-dark' : 'glass-light'}`}>
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acceso Exclusivo de Dirección</h2>
          <p className="text-xs opacity-70 mb-6 leading-relaxed">
            El <strong>Dashboard Ejecutivo de Analítica y Estadísticas</strong> está reservado exclusivamente para la
            <strong> Dirección General / Administrador</strong>.
            {currentUser?.role === 'BRIGADISTA' && (
              <span className="block mt-2 text-amber-400 font-semibold">
                Como Brigadista operativo, tu espacio de trabajo es el <strong>Panel de Brigadas</strong> para dar soporte y resolver quejas y reportes.
              </span>
            )}
          </p>

          <div className="space-y-3">
            {currentUser?.role === 'BRIGADISTA' && onNavigateToBrigada && (
              <button
                onClick={onNavigateToBrigada}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <span>Ir al Panel de Soporte de Brigada</span>
              </button>
            )}
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition"
            >
              Iniciar Sesión como Administrador
            </button>
            <button
              onClick={onBackToMap}
              className={`w-full py-2 text-xs font-semibold rounded-xl border transition ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Volver al Mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-y-auto custom-scrollbar transition-colors duration-300 ${
      isDark ? 'bg-[#0b0f17] text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Barra superior del Dashboard */}
      <div className={`sticky top-0 z-20 px-6 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white/80 border-slate-200/80'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToMap}
            className={`p-2 rounded-xl border transition flex items-center gap-2 text-xs font-semibold ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mapa</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                {currentUser?.role === 'ADMIN' ? 'Panel Directivo y Analítica Ejecutiva' : 'Centro de Operaciones de Cuadrilla'}
              </h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-purple-950/70 text-purple-300 border-purple-600/50'
                  : 'bg-amber-950/70 text-amber-300 border-amber-600/50'
              }`}>
                {currentUser?.role === 'ADMIN' ? 'Supervisión Directiva' : 'Personal Operativo'}
              </span>
            </div>
            <p className="text-xs opacity-60">
              {currentUser?.role === 'ADMIN'
                ? 'Tuxtla Gutiérrez • KPIs globales, tiempos medios de resolución y auditoría institucional'
                : 'Tuxtla Gutiérrez • Seguimiento de productividad de cuadrillas y avance de campo'}
            </p>
          </div>
        </div>

        {/* Controles de Filtros y Modo Claro/Oscuro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets de fecha */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
            isDark ? 'glass-dark' : 'glass-light'
          }`}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  preset === p.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {p.label}
              </button>
            ))}

            {preset === 'custom' && (
              <div className="flex items-center gap-1 px-2 text-xs">
                <input
                  type="date"
                  value={custom.from}
                  onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                  className={`px-2 py-1 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <span className="opacity-40">-</span>
                <input
                  type="date"
                  value={custom.to}
                  onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                  className={`px-2 py-1 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Granularidad */}
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="day">Por día</option>
            <option value="week">Por semana</option>
            <option value="month">Por mes</option>
          </select>

          {/* Switch Modo Claro / Modo Oscuro */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className={`p-2.5 rounded-xl border transition shadow-md ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Contenido principal de Métricas */}
      <div className="p-6 lg:p-8 space-y-6">
        {data ? (
          <>
            {/* 1. KPIs Estilo Apple */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={FileText}
                label="Total de incidencias"
                value={data.summary.totalReports}
                color="#0a84ff"
                helper="En el rango seleccionado"
                isDark={isDark}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Resueltos con éxito"
                value={data.summary.resolvedReports}
                color="#30d158"
                helper="Atendidos por brigadas"
                isDark={isDark}
              />
              <KpiCard
                icon={TrendingUp}
                label="Efectividad de atención"
                value={`${data.summary.resolutionRatePct}%`}
                color="#bf5af2"
                helper="Tasa de resolución"
                isDark={isDark}
              />
              <KpiCard
                icon={Clock}
                label="Tiempo promedio"
                value={data.summary.avgResolutionHours === null ? '—' : `${data.summary.avgResolutionHours} hrs`}
                color="#ff9f0a"
                helper="Desde creación a solución"
                isDark={isDark}
              />
            </div>

            {/* 2. Gráficos Interactivos con Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Área de Tendencia en el Tiempo */}
              <div className={`p-6 rounded-3xl shadow-xl border lg:col-span-2 ${
                isDark ? 'glass-dark' : 'glass-light'
              }`}>
                <h2 className="text-base font-bold mb-4 tracking-tight">Tendencia de reportes en el tiempo</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#0a84ff" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis 
                        dataKey="period" 
                        tickLine={false} 
                        axisLine={false} 
                        fontSize={12} 
                        stroke={isDark ? '#64748b' : '#94a3b8'}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tickLine={false} 
                        axisLine={false} 
                        fontSize={12} 
                        stroke={isDark ? '#64748b' : '#94a3b8'}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                          color: isDark ? '#f8fafc' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Incidencias"
                        stroke="#0a84ff"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReports)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Dona de Distribución por Estatus */}
              <div className={`p-6 rounded-3xl shadow-xl border ${
                isDark ? 'glass-dark' : 'glass-light'
              }`}>
                <h2 className="text-base font-bold mb-4 tracking-tight">Distribución por estatus operativo</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.byStatus}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                      >
                        {data.byStatus.map((s, index) => (
                          <Cell key={`status-${index}`} fill={s.color || '#3b82f6'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v: any, n: any, p: any) => [`${v} reportes (${p.payload.pct}%)`, n]}
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 3: Barras de Distribución por Categoría */}
              <div className={`p-6 rounded-3xl shadow-xl border ${
                isDark ? 'glass-dark' : 'glass-light'
              }`}>
                <h2 className="text-base font-bold mb-4 tracking-tight">Distribución por categoría</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        fontSize={11} 
                        interval={0} 
                        angle={-15} 
                        textAnchor="end"
                        stroke={isDark ? '#64748b' : '#94a3b8'}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tickLine={false} 
                        axisLine={false} 
                        fontSize={12} 
                        stroke={isDark ? '#64748b' : '#94a3b8'}
                      />
                      <Tooltip 
                        formatter={(v: any, _n: any, p: any) => [`${v} (${p.payload.pct}%)`, p.payload.name]}
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.byCategory.map((c, i) => (
                          <Cell key={`cat-${i}`} fill={c.color || '#0a84ff'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Top Zonas Calientes (~110m PostGIS) Interactivas y Filtrables */}
              <div className={`p-6 rounded-3xl shadow-xl border lg:col-span-2 ${
                isDark ? 'glass-dark' : 'glass-light'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                    <div>
                      <h2 className="text-base font-bold tracking-tight">
                        Top zonas con mayor concentración de incidencias (Clustering PostGIS ~110m)
                      </h2>
                      <p className="text-xs opacity-60">
                        Haz clic en cualquier zona para inspeccionar sus reportes o filtrarla en el mapa en vivo.
                      </p>
                    </div>
                  </div>
                  {selectedZone && (
                    <button
                      onClick={() => setSelectedZone(null)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition self-start sm:self-auto flex items-center gap-1 font-semibold"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Quitar selección</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.hotZones.map((z, i) => {
                    const isSelected = selectedZone?.lat === z.lat && selectedZone?.lng === z.lng;
                    return (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => setSelectedZone(isSelected ? null : z)}
                        className={`text-left flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 scale-[1.02]' 
                            : isDark 
                            ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/60' 
                            : 'bg-white/80 border-slate-200 hover:border-amber-500/60 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="pr-2 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Zona #{i + 1}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                ● Seleccionada
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold mt-1 text-white truncate">{z.zone || 'Tuxtla Gutiérrez'}</p>
                          <p className="text-[11px] opacity-60 font-mono mt-0.5">
                            Lat: {z.lat.toFixed(4)}, Lng: {z.lng.toFixed(4)}
                          </p>
                          <span className="text-[10px] text-amber-400/90 font-medium mt-1.5 inline-block">
                            {isSelected ? '✓ Viendo incidencias abajo' : '👉 Clic para inspeccionar y filtrar'}
                          </span>
                        </div>
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                        }`}>
                          {z.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Panel interactivo de inspección y filtro cuando una zona está seleccionada */}
                {selectedZone && (
                  <div className={`mt-5 p-5 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
                    isDark ? 'bg-slate-950/95 border-amber-500/60 shadow-2xl' : 'bg-amber-50/90 border-amber-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <MapPin className="w-4 h-4" />
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            Inspección de Zona Crítica: {selectedZone.zone}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          📍 Coordenadas: Lat {selectedZone.lat.toFixed(4)}, Lng {selectedZone.lng.toFixed(4)} • Radio de análisis PostGIS: ~400m • {zoneReports.length} incidencias encontradas
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onNavigateToMapWithZone && (
                          <button
                            onClick={() => onNavigateToMapWithZone({
                              lat: selectedZone.lat,
                              lng: selectedZone.lng,
                              name: selectedZone.zone || 'Zona Crítica',
                            })}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition active:scale-95"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>Ver y Filtrar en el Mapa de Tuxtla</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedZone(null)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>

                    {/* Lista de incidencias detectadas dentro del radio de esta zona */}
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Incidencias georreferenciadas en este perímetro ({zoneReports.length}):</span>
                        <span className="text-[11px] text-amber-400 font-mono">Filtro activo de proximidad</span>
                      </div>
                      {zoneReports.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">
                          Esta zona concentra el punto centroidal del cluster. Haz clic en "Ver y Filtrar en el Mapa de Tuxtla" para verla con todas las capas GIS activas.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1 pt-1">
                          {zoneReports.map((r, idx) => (
                            <div 
                              key={r.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                                    {r.category}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {r.status}
                                  </span>
                                </div>
                                <div className="text-xs font-bold truncate text-white">{r.title}</div>
                                <div className="text-[10px] text-slate-400 truncate">📍 {r.address || 'Tuxtla Gutiérrez'}</div>
                              </div>
                              {onNavigateToMapWithZone && (
                                <button
                                  onClick={() => onNavigateToMapWithZone({
                                    lat: r.lat,
                                    lng: r.lng,
                                    name: `${r.category}: ${r.title}`,
                                  })}
                                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1"
                                  title="Ver esta incidencia específica en el visor del mapa"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Ir</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 border shadow-lg ${
              isDark ? 'glass-dark' : 'glass-light'
            }`}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Cargando métricas del municipio de Tuxtla...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, 
  Search, 
  Plus, 
  Crosshair, 
  Flame, 
  ChevronLeft, 
  ChevronRight,
  Construction,
  Lightbulb,
  Trash2,
  Trees,
  Droplets,
  Disc,
  TrafficCone,
  User,
  Shield,
  ShieldCheck,
  Wrench,
  MousePointerClick,
  X,
  LayoutDashboard,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Clock,
  Eye,
  LogIn
} from 'lucide-react';
import { ReportItem, ReportCategory, ReportStatus, UserSession } from '../types/report';
import { getCategoryColor } from './CustomMarkers';
import { ReportModal } from './ReportModal';
import { MapView } from './MapView';
import { formatReportDate } from '../utils/geocoding';

// Lugares y Avenidas emblemáticas de Tuxtla Gutiérrez para el buscador inteligente
const TUXTLA_LANDMARKS = [
  { name: 'Parque Central (Palacio de Gobierno)', coords: [16.7530, -93.1155] as [number, number], desc: 'Centro de Tuxtla' },
  { name: 'Parque de la Marimba', coords: [16.7565, -93.1245] as [number, number], desc: 'Av. Central y 8a Poniente' },
  { name: 'Caña Hueca y Joyyo Mayu', coords: [16.7620, -93.1480] as [number, number], desc: 'Periférico Norte Poniente' },
  { name: 'Avenida Central Poniente', coords: [16.7535, -93.1250] as [number, number], desc: 'Eje Vial Principal' },
  { name: '5a Norte Poniente', coords: [16.7585, -93.1190] as [number, number], desc: 'Corredor Comercial Norte' },
  { name: 'Colonia Terán', coords: [16.7450, -93.1650] as [number, number], desc: 'Zona Poniente Sur' },
  { name: 'Libramiento Norte Poniente', coords: [16.7720, -93.1120] as [number, number], desc: 'Vía Rápida Norte' },
  { name: 'Libramiento Sur', coords: [16.7380, -93.1280] as [number, number], desc: 'Vía Rápida Sur' },
  { name: 'Chiapasiónate (Salida Oriente)', coords: [16.7320, -93.0720] as [number, number], desc: 'Entrada Oriente Tuxtla' },
  { name: 'Colonia San Roque', coords: [16.7480, -93.1120] as [number, number], desc: 'Barrio Tradicional' },
  { name: 'Colonia Las Palmas', coords: [16.7580, -93.0950] as [number, number], desc: 'Zona Oriente' },
  { name: 'Plaza Cristal / Blvd. Belisario Domínguez', coords: [16.7580, -93.1550] as [number, number], desc: 'Zona Hotelera Poniente' },
  { name: 'Colonia Patria Nueva', coords: [16.7650, -93.0780] as [number, number], desc: 'Zona Nororiente' },
  { name: 'Calzada Samuel León Brindis', coords: [16.7460, -93.1020] as [number, number], desc: 'Caminera / Estadio Flor del Sospó' },
];

const INITIAL_REPORTS_MOCK: ReportItem[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Basura en la 5a norte',
    description: 'Basura acumulada en esquina comercial obstruyendo el paso.',
    category: 'BASURA',
    status: 'EN_REVISION',
    lat: 16.7585,
    lng: -93.1190,
    address: '5a norte',
    citizenId: 'c3333333-3333-3333-3333-333333333333',
    createdAt: 'hace 1 h',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Bache profundo frente al parque central',
    description: 'Bache de gran tamaño en carril derecho que daña suspensiones.',
    category: 'BACHE',
    status: 'RECIBIDO',
    lat: 16.7530,
    lng: -93.1155,
    address: 'Parque Central',
    createdAt: 'hace 1 h',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Luminaria apagada en avenida Central',
    description: 'Luminaria apagada en avenida Central dejando tramo oscuro.',
    category: 'LUMINARIA',
    status: 'EN_ATENCION',
    lat: 16.7520,
    lng: -93.1250,
    address: 'Avenida Central',
    citizenId: 'c3333333-3333-3333-3333-333333333333',
    createdAt: 'hace 3 d',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Contenedor desbordado',
    description: 'Exceso de residuos en vía pública.',
    category: 'BASURA',
    status: 'RECIBIDO',
    lat: 16.7545,
    lng: -93.1235,
    address: 'Parque de la Marimba',
    createdAt: 'hace 5 h',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Luminaria intermitente',
    description: 'Luz parpadea continuamente.',
    category: 'LUMINARIA',
    status: 'EN_REVISION',
    lat: 16.7570,
    lng: -93.1090,
    address: 'Calzada Hombres Ilustres',
    createdAt: 'hace 6 h',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: 'Bache en carril de alta',
    description: 'Cráter de 15 cm de profundidad.',
    category: 'BACHE',
    status: 'EN_ATENCION',
    lat: 16.7590,
    lng: -93.1410,
    address: 'Blvd. Belisario Domínguez',
    createdAt: 'hace 1 d',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    title: 'Árbol caído sobre banqueta',
    description: 'Ramas bloquean el paso de peatones.',
    category: 'ARBOL_CAIDO',
    status: 'RECIBIDO',
    lat: 16.7480,
    lng: -93.1120,
    address: 'Barrio San Roque',
    createdAt: 'hace 2 d',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    title: 'Fuga de agua potable',
    description: 'Salida abundante de agua limpia.',
    category: 'FUGA_AGUA',
    status: 'EN_ATENCION',
    lat: 16.7450,
    lng: -93.1550,
    address: 'Terán',
    createdAt: 'hace 4 h',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    title: 'Semáforo descompuesto',
    description: 'Luces apagadas en crucero transitado.',
    category: 'SEMAFORO',
    status: 'RECIBIDO',
    lat: 16.7510,
    lng: -93.0950,
    address: 'Las Palmas',
    createdAt: 'hace 30 min',
  },
];

interface MapDashboardProps {
  currentTab: 'map' | 'dashboard' | 'brigada' | 'admin';
  setCurrentTab: (tab: 'map' | 'dashboard' | 'brigada' | 'admin') => void;
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  onOpenAuth: () => void;
  activeZoneFilter?: { lat: number; lng: number; name: string } | null;
  onClearZoneFilter?: () => void;
  initialFlyCoords?: [number, number] | null;
}

export const MapDashboard: React.FC<MapDashboardProps> = ({ 
  currentTab, 
  setCurrentTab,
  currentUser,
  setCurrentUser,
  onOpenAuth,
  activeZoneFilter,
  onClearZoneFilter,
  initialFlyCoords
}) => {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS_MOCK);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCitizenReportsModalOpen, setIsCitizenReportsModalOpen] = useState(false);
  const [citizenFilterMode, setCitizenFilterMode] = useState<'mine' | 'all'>('mine');
  const [flyCoords, setFlyCoords] = useState<[number, number] | null>(null);
  const [heat, setHeat] = useState(false);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes'>('recent');

  // Modo de selección interactiva en el mapa
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 16.7530,
    lng: -93.1155,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const isGuest = !currentUser || !currentUser.id;
  const isCitizen = !isGuest && currentUser?.role === 'CIUDADANO';
  const isStaff = !isGuest && (currentUser?.role === 'ADMIN' || currentUser?.role === 'BRIGADISTA');

  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('tuxtla_device_fp');
    if (!fp) {
      fp = 'dev-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();
      localStorage.setItem('tuxtla_device_fp', fp);
    }
    return fp;
  };

  // Si se pasa una coordenada inicial para centrar (ej. desde el Panel de Brigada o Dashboard)
  useEffect(() => {
    if (initialFlyCoords) {
      setFlyCoords(initialFlyCoords);
    }
  }, [initialFlyCoords]);

  // Si se activa un filtro por Zona Crítica (PostGIS)
  useEffect(() => {
    if (activeZoneFilter) {
      setFlyCoords([activeZoneFilter.lat, activeZoneFilter.lng]);
    }
  }, [activeZoneFilter]);

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
        }
      }
    } catch {}
  };

  const loadUserUpvotes = async () => {
    try {
      const fp = getDeviceFingerprint();
      const userIdParam = currentUser?.id ? `&userId=${currentUser.id}` : '';
      const res = await fetch(`/api/reports/user-upvotes?fingerprint=${fp}${userIdParam}`);
      if (res.ok) {
        const ids: string[] = await res.json();
        setUserUpvotes(new Set(ids));
      }
    } catch {}
  };

  useEffect(() => {
    loadReports();
    loadUserUpvotes();
  }, [currentUser]);

  const handleToggleUpvote = async (reportId: string) => {
    const fp = getDeviceFingerprint();
    const wasUpvoted = userUpvotes.has(reportId);

    // Actualización visual inmediata
    setUserUpvotes((prev) => {
      const next = new Set(prev);
      if (wasUpvoted) next.delete(reportId);
      else next.add(reportId);
      return next;
    });

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const currentCount = r.upvotesCount || 0;
          const newCount = wasUpvoted ? Math.max(0, currentCount - 1) : currentCount + 1;
          return { ...r, upvotesCount: newCount, hasUpvoted: !wasUpvoted };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`/api/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || undefined,
          fingerprint: fp,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, upvotesCount: data.upvotesCount, hasUpvoted: data.hasUpvoted }
              : r
          )
        );
        setUserUpvotes((prev) => {
          const next = new Set(prev);
          if (data.hasUpvoted) next.add(reportId);
          else next.delete(reportId);
          return next;
        });
      }
    } catch {
      loadReports();
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err: any) {
      alert('Error al actualizar estatus: ' + err.message);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('¿Confirmas eliminar esta incidencia del sistema?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (err: any) {
      alert('Error al eliminar reporte: ' + err.message);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    if (isSelectingOnMap) {
      setIsSelectingOnMap(false);
      setIsModalOpen(true);
    }
  };

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

  // Reportes del ciudadano activo
  const myCitizenReports = reports.filter(
    (r) => r.citizenId === currentUser?.id || (currentUser?.email === 'ciudadana@tuxtla.gob.mx' && r.citizenId === 'c3333333-3333-3333-3333-333333333333')
  );

  // Filtrado de incidencias según rol, categoría y zona crítica
  const filteredReports = reports.filter((r) => {
    // Filtro por Zona Crítica activa (~450m)
    if (activeZoneFilter) {
      const dist = getDistanceMeters(r.lat, r.lng, activeZoneFilter.lat, activeZoneFilter.lng);
      if (dist > 450) return false;
    }

    // Si es ciudadano y tiene activo el filtro 'mine', solo muestra sus propios reportes
    if (isCitizen && citizenFilterMode === 'mine') {
      const isMine = r.citizenId === currentUser?.id || (currentUser?.email === 'ciudadana@tuxtla.gob.mx' && r.citizenId === 'c3333333-3333-3333-3333-333333333333');
      if (!isMine) return false;
    }

    const matchesCategory = selectedCategory === 'TODAS' || r.category === selectedCategory;
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Ordenamiento de incidencias (Más recientes o Mayor demanda vecinal)
  const displayReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'upvotes') {
      return (b.upvotesCount || 0) - (a.upvotesCount || 0);
    }
    return 0;
  });

  // Búsqueda de lugares en Tuxtla
  const matchedLandmarks = searchQuery.trim().length > 1
    ? TUXTLA_LANDMARKS.filter((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectLandmark = (coords: [number, number], name: string) => {
    setFlyCoords(coords);
    setSearchQuery(name);
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedLandmarks.length > 0) {
      handleSelectLandmark(matchedLandmarks[0].coords, matchedLandmarks[0].name);
    } else if (filteredReports.length > 0) {
      setFlyCoords([filteredReports[0].lat, filteredReports[0].lng]);
      setIsSearchFocused(false);
    }
  };

  const scrollChips = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'RECIBIDO':
        return <span className="bg-blue-900/60 text-blue-300 border border-blue-700/60 text-[10px] px-2 py-0.5 rounded-full font-medium">[Recibido]</span>;
      case 'EN_REVISION':
        return <span className="bg-purple-900/60 text-purple-300 border border-purple-700/60 text-[10px] px-2 py-0.5 rounded-full font-medium">[En revisión]</span>;
      case 'EN_ATENCION':
        return <span className="bg-amber-900/60 text-amber-300 border border-amber-700/60 text-[10px] px-2 py-0.5 rounded-full font-medium">[En atención]</span>;
      case 'RESUELTO':
        return <span className="bg-green-900/60 text-green-300 border border-green-700/60 text-[10px] px-2 py-0.5 rounded-full font-medium">[Resuelto]</span>;
    }
  };

  // Iconos visuales claros e intuitivos para cada tipo de incidencia
  const getItemIcon = (category: ReportCategory) => {
    switch (category) {
      case 'BASURA': return <Trash2 className="w-4 h-4 text-green-400 shrink-0" />;
      case 'BACHE': return <Construction className="w-4 h-4 text-orange-400 shrink-0" />;
      case 'LUMINARIA': return <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />;
      case 'ARBOL_CAIDO': return <Trees className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'FUGA_AGUA': return <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'DRENAJE': return <Disc className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'SEMAFORO': return <TrafficCone className="w-4 h-4 text-red-400 shrink-0" />;
    }
  };

  // Acción de reporte con restricción para invitados
  const handleReportClick = () => {
    if (isGuest) {
      onOpenAuth();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden select-none ${isSelectingOnMap ? 'cursor-crosshair' : ''}`}>
      {/* ========================================================= */}
      {/* 1. MAPA BASE LEAFLET: Capa estructural 0 (Siempre debajo de los paneles) */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0">
        <MapView
          reports={filteredReports}
          flyCoords={flyCoords}
          onMapClick={handleMapClick}
          pickPoint={selectedCoords}
          onPickPointChange={(c) => setSelectedCoords(c)}
          picking={isSelectingOnMap}
          heat={heat}
          isDark={true}
          currentUser={currentUser}
          userUpvotes={userUpvotes}
          onToggleUpvote={handleToggleUpvote}
          onStatusChange={handleStatusChange}
          onDeleteReport={handleDeleteReport}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. HEADER SUPERIOR FLOTANTE (z-[1000]) */}
      {/* ========================================================= */}
      <header className="absolute top-0 left-0 right-0 z-[1000] h-16 bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between shadow-lg">
        {/* Logo y pestañas */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <MapIcon className="w-5 h-5" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Tuxtla Reportes</span>
          </div>

          <nav className="flex items-center gap-5">
            <button
              onClick={() => setCurrentTab('map')}
              className={`relative py-5 text-sm font-semibold transition-colors ${
                currentTab === 'map' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mapa
              {currentTab === 'map' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* Pestaña MIS REPORTES para el ciudadano */}
            {isCitizen && (
              <button
                onClick={() => setIsCitizenReportsModalOpen(true)}
                className="relative py-5 text-sm font-semibold transition-colors flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Mis Reportes</span>
                <span className="bg-blue-600/40 text-blue-200 border border-blue-500/50 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {myCitizenReports.length}
                </span>
              </button>
            )}

            {/* Pestaña OPERACIONES BRIGADA (Para BRIGADISTA y ADMIN) */}
            {(currentUser?.role === 'BRIGADISTA' || currentUser?.role === 'ADMIN') && (
              <button
                onClick={() => setCurrentTab('brigada')}
                className={`relative py-5 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'brigada' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Panel Brigada</span>
                <span className="bg-amber-950/80 text-amber-200 border border-amber-600/60 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  SOPORTE
                </span>
                {currentTab === 'brigada' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            )}

            {/* Pestaña DASHBOARD EJECUTIVO (SOLO ADMIN: Brigadista tiene su panel propio de soporte) */}
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`relative py-5 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>Dashboard Ejecutivo</span>
                <span className="bg-blue-950/80 text-blue-200 border border-blue-600/60 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  MÉTRICAS
                </span>
                {currentTab === 'dashboard' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            )}

            {/* Pestaña EXCLUSIVA: Consola de Gobierno (Solo ADMIN) */}
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`relative py-5 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Consola Admin</span>
                <span className="bg-purple-950/80 text-purple-200 border border-purple-500/60 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  AUDITORÍA
                </span>
                {currentTab === 'admin' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Lado derecho: Selector Rápido de Roles y Perfil */}
        <div className="flex items-center gap-2.5">
          {/* Alternador Rápido de Roles en 1 Clic para Evaluación */}
          <div className="hidden sm:flex items-center bg-slate-950/90 border border-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                const admin = {
                  id: 'a1111111-1111-1111-1111-111111111111',
                  name: 'Ing. Carlos Mendoza',
                  email: 'admin@tuxtla.gob.mx',
                  role: 'ADMIN' as const,
                };
                localStorage.setItem('tuxtla_user', JSON.stringify(admin));
                setCurrentUser(admin);
              }}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                currentUser?.role === 'ADMIN' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Cambiar al instante a perfil Administrador"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const brigada = {
                  id: 'b2222222-2222-2222-2222-222222222222',
                  name: 'Brigada Obras Públicas 04',
                  email: 'brigada@tuxtla.gob.mx',
                  role: 'BRIGADISTA' as const,
                };
                localStorage.setItem('tuxtla_user', JSON.stringify(brigada));
                setCurrentUser(brigada);
                if (currentTab === 'dashboard' || currentTab === 'admin') {
                  setCurrentTab('brigada');
                }
              }}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                currentUser?.role === 'BRIGADISTA' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Cambiar al instante a perfil Brigadista"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Brigada</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const ciudadana = {
                  id: 'c3333333-3333-3333-3333-333333333333',
                  name: 'María Elena Solís',
                  email: 'ciudadana@tuxtla.gob.mx',
                  role: 'CIUDADANO' as const,
                };
                localStorage.setItem('tuxtla_user', JSON.stringify(ciudadana));
                setCurrentUser(ciudadana);
                if (currentTab !== 'map') {
                  setCurrentTab('map');
                }
              }}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                isCitizen ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Cambiar al instante a perfil Ciudadana"
            >
              <User className="w-3.5 h-3.5" />
              <span>Ciudadana</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const guest = {
                  id: '',
                  name: 'Invitado',
                  email: '',
                  role: 'CIUDADANO' as const,
                };
                localStorage.setItem('tuxtla_user', JSON.stringify(guest));
                setCurrentUser(guest);
                if (currentTab !== 'map') {
                  setCurrentTab('map');
                }
              }}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                isGuest ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Cambiar a Modo Invitado"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Invitado</span>
            </button>
          </div>

          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition shadow-sm ${
              isGuest
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-white'
            }`}
          >
            <div 
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-purple-600 text-white'
                  : currentUser?.role === 'BRIGADISTA'
                  ? 'bg-amber-600 text-white'
                  : isGuest
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {currentUser?.role === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : currentUser?.role === 'BRIGADISTA' ? (
                <Wrench className="w-4 h-4" />
              ) : isGuest ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold leading-tight">
                {!isGuest ? currentUser.name.split(' ')[0] : 'Iniciar Sesión'}
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                {!isGuest ? currentUser.role : 'INVITADO'}
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* BANNER FLOTANTE CUANDO HAY UN FILTRO POR ZONA CRÍTICA (POSTGIS) */}
      {activeZoneFilter && !isSelectingOnMap && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[950] bg-amber-500 text-slate-950 px-5 py-2 rounded-full shadow-2xl flex items-center gap-3 border-2 border-amber-300 font-bold text-xs animate-in fade-in">
          <Flame className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>
            Filtrando por Zona Crítica: <strong>{activeZoneFilter.name}</strong> ({filteredReports.length} incidencias en ~450m)
          </span>
          <button
            onClick={() => onClearZoneFilter && onClearZoneFilter()}
            className="px-2.5 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-full text-[10px] font-bold transition flex items-center gap-1 ml-1"
          >
            <X className="w-3 h-3" />
            <span>Ver toda la ciudad</span>
          </button>
        </div>
      )}

      {/* BANNER FLOTANTE CUANDO ESTÁ ACTIVO EL MODO SELECCIÓN EN MAPA */}
      {isSelectingOnMap && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[950] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white/40">
          <MousePointerClick className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-bold">
            Haz clic en la calle o colonia de Tuxtla para situar el punto exacto
          </span>
          <button
            onClick={() => {
              setIsSelectingOnMap(false);
              setIsModalOpen(true);
            }}
            className="p-1 rounded-full bg-blue-800 hover:bg-blue-900 transition ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BUSCADOR INTELIGENTE Y CARRUSEL DE CATEGORÍAS (z-[900] - NUNCA SE OCULTA AL HACER ZOOM) */}
      {/* ========================================================= */}
      {!isSelectingOnMap && (
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 z-[900] w-full max-w-4xl px-4 flex flex-col items-center gap-2.5 pointer-events-none"
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* Buscador de Píldora con Autocompletado */}
          <div ref={searchWrapperRef} className="pointer-events-auto w-full max-w-lg relative">
            <form 
              onSubmit={handleSearchSubmit}
              className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full py-2 px-4 flex items-center gap-3 shadow-2xl focus-within:border-blue-500 transition"
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Buscar calle, avenida o colonia en Tuxtla..."
                className="bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Menú de sugerencias desplegable */}
            {isSearchFocused && (matchedLandmarks.length > 0 || (searchQuery.trim().length > 1 && filteredReports.length > 0)) && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-[950]"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {matchedLandmarks.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                      Lugares en Tuxtla Gutiérrez
                    </div>
                    {matchedLandmarks.map((lm, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLandmark(lm.coords, lm.name)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-white flex items-center gap-2.5 transition"
                      >
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div className="font-semibold">{lm.name}</div>
                          <div className="text-[10px] text-slate-400">{lm.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredReports.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 border-t border-slate-800 mt-1 pt-2">
                      Incidencias ({filteredReports.length})
                    </div>
                    {filteredReports.slice(0, 4).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setFlyCoords([r.lat, r.lng]);
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between gap-2 transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getItemIcon(r.category)}
                          <span className="truncate">{r.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{r.address}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carrusel horizontal de categorías (No interfiere con el mapa) */}
          <div 
            className="pointer-events-auto flex items-center gap-2 w-full justify-center"
            onWheel={(e) => {
              e.stopPropagation();
              if (scrollRef.current) scrollRef.current.scrollLeft += e.deltaY;
            }}
          >
            <button 
              onClick={() => scrollChips('left')}
              className="p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div 
              ref={scrollRef} 
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 max-w-[85%]"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setSelectedCategory('TODAS')}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'TODAS'
                    ? 'bg-slate-800 border-slate-500 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Todas ({filteredReports.length})
              </button>

              <button
                onClick={() => setSelectedCategory('BACHE')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'BACHE'
                    ? 'bg-orange-950/60 border-orange-500 text-orange-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Construction className="w-3.5 h-3.5 text-orange-500" />
                <span>Bache</span>
              </button>

              <button
                onClick={() => setSelectedCategory('LUMINARIA')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'LUMINARIA'
                    ? 'bg-yellow-950/60 border-yellow-500 text-yellow-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                <span>Alumbrado</span>
              </button>

              <button
                onClick={() => setSelectedCategory('BASURA')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'BASURA'
                    ? 'bg-green-950/60 border-green-500 text-green-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-green-500" />
                <span>Basura</span>
              </button>

              <button
                onClick={() => setSelectedCategory('ARBOL_CAIDO')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'ARBOL_CAIDO'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-500" />
                <span>Árbol caído</span>
              </button>

              <button
                onClick={() => setSelectedCategory('FUGA_AGUA')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'FUGA_AGUA'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fuga de agua</span>
              </button>

              <button
                onClick={() => setSelectedCategory('DRENAJE')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'DRENAJE'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Disc className="w-3.5 h-3.5 text-blue-500" />
                <span>Drenaje</span>
              </button>

              <button
                onClick={() => setSelectedCategory('SEMAFORO')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === 'SEMAFORO'
                    ? 'bg-red-950/60 border-red-500 text-red-200'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <TrafficCone className="w-3.5 h-3.5 text-red-500" />
                <span>Semáforo</span>
              </button>
            </div>

            <button 
              onClick={() => scrollChips('right')}
              className="p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* BANNER FLOTANTE INDICADOR DE MAPA DE CALOR */}
      {heat && (
        <div 
          className="absolute top-36 left-1/2 -translate-x-1/2 z-[900] bg-slate-900/95 backdrop-blur-md border border-amber-500/50 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Mapa de Calor Activo:</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="text-slate-400">Baja</span>
            <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-[#00e5ff] via-[#00e676] via-[#ffea00] via-[#ff6d00] to-[#ff1744] shadow-inner" />
            <span className="text-red-400 font-semibold">Crítica</span>
          </div>
          <button
            onClick={() => setHeat(false)}
            className="ml-1 text-slate-400 hover:text-white p-0.5"
            title="Desactivar mapa de calor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PANEL FLOTANTE DE INCIDENCIAS (ESQUINA INFERIOR IZQUIERDA - z-[900]) */}
      {/* ========================================================= */}
      <div 
        className="absolute bottom-6 left-6 z-[900] w-96 glass rounded-3xl p-4 shadow-2xl"
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1 truncate">
              {isCitizen 
                ? (citizenFilterMode === 'mine' ? 'Mis Reportes' : 'Incidencias')
                : 'Incidencias'}
              <span className="text-slate-400 font-mono text-[11px]">({displayReports.length})</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Selector de ordenamiento: Recientes vs Mayor Demanda (+1) */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`px-1.5 py-0.5 rounded-lg font-semibold transition ${
                  sortBy === 'recent' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Ordenar por más recientes"
              >
                🕒
              </button>
              <button
                type="button"
                onClick={() => setSortBy('upvotes')}
                className={`px-1.5 py-0.5 rounded-lg font-semibold transition flex items-center gap-0.5 ${
                  sortBy === 'upvotes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Ordenar por mayor cantidad de vecinos afectados (+1)"
              >
                <span>🔥</span>
                <span>+1</span>
              </button>
            </div>

            {/* Toggle de vista para el ciudadano */}
            {isCitizen && (
              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[10px]">
                <button
                  onClick={() => setCitizenFilterMode('mine')}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                    citizenFilterMode === 'mine' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mis Folios
                </button>
                <button
                  onClick={() => setCitizenFilterMode('all')}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                    citizenFilterMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
              </div>
            )}

            {isStaff && (
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                Gestor
              </span>
            )}
          </div>
        </div>

        {/* Lista de reportes */}
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {displayReports.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No hay incidencias que coincidan con el filtro.</p>
              {isCitizen && citizenFilterMode === 'mine' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-blue-400 hover:underline font-semibold"
                >
                  + Levantar mi primer reporte
                </button>
              )}
            </div>
          ) : (
            displayReports.map((item) => {
              const isMyReport = 
                item.citizenId === currentUser?.id || 
                (currentUser?.email === 'ciudadana@tuxtla.gob.mx' && item.citizenId === 'c3333333-3333-3333-3333-333333333333');
              const hasUpvoted = userUpvotes.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setFlyCoords([item.lat, item.lng])}
                  className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-800/80 cursor-pointer transition border border-transparent hover:border-slate-700/60 group"
                >
                  <div className="mt-1">{getItemIcon(item.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-200 leading-snug truncate flex-1">
                        <span className="font-semibold" style={{ color: getCategoryColor(item.category) }}>
                          {item.category}:{' '}
                        </span>
                        {item.title}
                      </p>
                      {isCitizen && citizenFilterMode === 'all' && (
                        isMyReport ? (
                          <span className="shrink-0 bg-blue-900/80 text-blue-300 border border-blue-500/60 text-[9px] px-1.5 py-0.2 rounded-md font-bold">
                            Mi Reporte
                          </span>
                        ) : (
                          <span className="shrink-0 bg-slate-800/90 text-slate-400 border border-slate-700/60 text-[9px] px-1.5 py-0.2 rounded-md font-normal">
                            Comunitario
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span className="truncate">📍 {item.address || 'Tuxtla Gutiérrez'}</span>
                      <span className="shrink-0 ml-1 text-slate-500 font-mono">{formatReportDate(item.createdAt)}</span>
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(item.status)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleUpvote(item.id);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                            hasUpvoted
                              ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:text-white'
                          }`}
                          title="A mí también me afecta (+1 / Like vecinal)"
                        >
                          <span>👍</span>
                          <span>{item.upvotesCount || 0}</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                        📍 Centrar
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. BOTONES FLOTANTES DE ACCIÓN Y CONTROL (ESQUINA INFERIOR DERECHA - z-[900]) */}
      {/* ========================================================= */}
      <div 
        className="absolute bottom-6 right-6 z-[900] flex items-center gap-3"
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setFlyCoords([pos.coords.latitude, pos.coords.longitude]);
              });
            } else {
              setFlyCoords([16.7530, -93.1155]);
            }
          }}
          title="Centrar en mi ubicación"
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md transition hover:scale-105"
        >
          <Crosshair className="w-5 h-5 text-blue-400" />
        </button>

        <button
          onClick={() => setHeat(!heat)}
          title={heat ? 'Desactivar mapa de calor' : 'Activar mapa de calor'}
          className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md transition hover:scale-105 ${
            heat 
              ? 'bg-amber-600 border-amber-400 text-white' 
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-amber-500'
          }`}
        >
          <Flame className="w-5 h-5" />
        </button>

        {/* Botón Reportar: Obliga a iniciar sesión si es Invitado */}
        <button
          onClick={handleReportClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-2xl shadow-xl shadow-blue-600/30 transition hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Reportar</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 6. MODAL DEDICADO: SEGUIMIENTO Y ESTATUS DE REPORTES CIUDADANOS */}
      {/* ========================================================= */}
      {isCitizenReportsModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-b from-slate-800/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Mis Reportes Ciudadanos</h2>
                  <p className="text-xs text-slate-400">
                    Seguimiento y estatus en tiempo real de tus solicitudes municipales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCitizenReportsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable de reportes del ciudadano */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
              {myCitizenReports.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">No tienes incidencias registradas</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cuando levantes un reporte en el mapa, podrás consultar su atención y avance aquí.
                  </p>
                  <button
                    onClick={() => {
                      setIsCitizenReportsModalOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg transition"
                  >
                    + Levantar Nuevo Reporte
                  </button>
                </div>
              ) : (
                myCitizenReports.map((r, index) => (
                  <div
                    key={r.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80">
                          {getItemIcon(r.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-blue-400">
                              #TX-{String(index + 1).padStart(3, '0')}
                            </span>
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
                            <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-600/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span>👥</span>
                              <span>{r.upvotesCount || 0} afectados</span>
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{r.title}</h4>
                        </div>
                      </div>
                      <div>{getStatusBadge(r.status)}</div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span>📍 {r.address || 'Tuxtla Gutiérrez, Chiapas'} · <span className="font-mono text-slate-400">{formatReportDate(r.createdAt)}</span></span>
                      <button
                        onClick={() => {
                          setIsCitizenReportsModalOpen(false);
                          setFlyCoords([r.lat, r.lng]);
                        }}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver en Mapa</span>
                      </button>
                    </div>

                    {/* Stepper visual de progreso del estatus */}
                    <div className="grid grid-cols-4 gap-1 pt-2">
                      <div className={`p-1.5 rounded-lg text-center text-[10px] font-semibold border ${
                        r.status === 'RECIBIDO' || r.status === 'EN_REVISION' || r.status === 'EN_ATENCION' || r.status === 'RESUELTO'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-600/60'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        1. Recibido
                      </div>
                      <div className={`p-1.5 rounded-lg text-center text-[10px] font-semibold border ${
                        r.status === 'EN_REVISION' || r.status === 'EN_ATENCION' || r.status === 'RESUELTO'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-600/60'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        2. En Revisión
                      </div>
                      <div className={`p-1.5 rounded-lg text-center text-[10px] font-semibold border ${
                        r.status === 'EN_ATENCION' || r.status === 'RESUELTO'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-600/60'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        3. Cuadrilla
                      </div>
                      <div className={`p-1.5 rounded-lg text-center text-[10px] font-semibold border ${
                        r.status === 'RESUELTO'
                          ? 'bg-green-950/60 text-green-300 border-green-600/60'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        4. Resuelto
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsCitizenReportsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Cerrar Menú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL INTERACTIVO DE NUEVO REPORTE */}
      {/* ========================================================= */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadReports()}
        initialCoords={selectedCoords}
        onStartMapSelection={() => {
          setIsModalOpen(false);
          setIsSelectingOnMap(true);
        }}
        currentUser={currentUser}
      />
    </div>
  );
};

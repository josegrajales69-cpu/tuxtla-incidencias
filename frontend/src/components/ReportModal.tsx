import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  Send,
  Navigation,
  Trash2,
  Lightbulb,
  Construction,
  Trees,
  Droplets,
  Disc,
  TrafficCone,
  MousePointerClick,
} from 'lucide-react';
import { ReportCategory, UserSession } from '../types/report';
import { reverseGeocodeTuxtla } from '../utils/geocoding';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCoords: { lat: number; lng: number };
  onStartMapSelection: () => void;
  currentUser: UserSession | null;
}

const CATEGORIES: { id: ReportCategory; label: string; icon: any; color: string }[] = [
  { id: 'BACHE', label: 'Bache / Asfalto', icon: Construction, color: '#f97316' },
  { id: 'LUMINARIA', label: 'Alumbrado', icon: Lightbulb, color: '#eab308' },
  { id: 'BASURA', label: 'Basura / Desecho', icon: Trash2, color: '#22c55e' },
  { id: 'ARBOL_CAIDO', label: 'Árbol caído', icon: Trees, color: '#10b981' },
  { id: 'FUGA_AGUA', label: 'Fuga de agua', icon: Droplets, color: '#06b6d4' },
  { id: 'DRENAJE', label: 'Drenaje / Rejilla', icon: Disc, color: '#3b82f6' },
  { id: 'SEMAFORO', label: 'Semáforo', icon: TrafficCone, color: '#ef4444' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCoords,
  onStartMapSelection,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('BACHE');
  const [address, setAddress] = useState('Detectando calle en Tuxtla...');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(initialCoords);

  useEffect(() => {
    setCoords(initialCoords);
    setIsResolvingAddress(true);
    setAddress('Detectando ubicación exacta...');
    reverseGeocodeTuxtla(initialCoords.lat, initialCoords.lng).then((addr) => {
      setAddress(addr);
      setIsResolvingAddress(false);
    }).catch(() => {
      setIsResolvingAddress(false);
      setAddress(`Ubicación (${initialCoords.lat.toFixed(4)}, ${initialCoords.lng.toFixed(4)})`);
    });
  }, [initialCoords.lat, initialCoords.lng]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDuplicateAlert(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || title.trim(), // Opcional: si está vacía toma el título
          category,
          lat: coords.lat,
          lng: coords.lng,
          address: address.trim(),
          photoUrl: null,
          citizenId: currentUser?.id || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el reporte');
      }

      if (data.isDuplicate) {
        setDuplicateAlert(
          `⚠️ Ya existe un reporte de "${data.existingReport?.category || category}" a menos de 30 metros de esta ubicación.`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsResolvingAddress(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(newCoords);
          reverseGeocodeTuxtla(newCoords.lat, newCoords.lng).then((addr) => {
            setAddress(addr);
            setIsResolvingAddress(false);
          });
        },
        () => {
          setIsResolvingAddress(false);
          alert('No se pudo obtener la ubicación GPS actual.');
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nuevo Reporte Ciudadano</h2>
              <p className="text-xs text-slate-400">Tuxtla Gutiérrez, Chiapas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {duplicateAlert && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-950/60 border border-amber-600/50 rounded-2xl text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{duplicateAlert}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 1. SELECCIÓN DE CATEGORÍA */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Tipo de Incidencia
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/50 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" style={{ color: cat.color }} />
                    <span className="text-[11px] font-semibold leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. UBICACIÓN EN TUXTLA */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ubicación Georreferenciada
            </label>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-mono text-slate-200">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </div>
                  <div className="text-[10px] text-slate-400">PostGIS Point (SRID 4326)</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition"
                  title="Obtener coordenadas de mi GPS"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>GPS</span>
                </button>
                <button
                  type="button"
                  onClick={onStartMapSelection}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>Ubicar en Mapa</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, avenida o colonia (ej. 5a Norte esquina 2a Poniente)"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-4 pr-10 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isResolvingAddress && (
                <div className="absolute right-3 top-2.5 flex items-center pointer-events-none" title="Detectando calle...">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* 3. TÍTULO Y DESCRIPCIÓN */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Título Resumido <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Bache profundo frente a escuela"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Descripción Detallada
                </label>
                <span className="text-[10px] text-blue-400 font-medium bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                  Opcional
                </span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional: Agrega detalles adicionales, dimensiones o referencias de apoyo..."
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* ACCIONES */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <span className="text-xs text-slate-400">
              {currentUser ? `Registrando como: ${currentUser.name}` : 'Reporte Ciudadano'}
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Enviando...' : 'Enviar Reporte'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Plus, Minus, Layers } from 'lucide-react';
import { ReportItem, ReportStatus, UserSession } from '../types/report';
import { createCustomPin, getCategoryColor } from './CustomMarkers';

type BasemapStyle = 'dark-street' | 'osm' | 'satellite' | 'esri-canvas';

const getStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case 'RECIBIDO': return '#3b82f6';
    case 'EN_REVISION': return '#a855f7';
    case 'EN_ATENCION': return '#f59e0b';
    case 'RESUELTO': return '#22c55e';
  }
};

interface MapViewProps {
  isDark?: boolean;
  reports: ReportItem[];
  flyCoords: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
  pickPoint: { lat: number; lng: number } | null;
  onPickPointChange: (coords: { lat: number; lng: number }) => void;
  picking: boolean;
  heat: boolean;
  currentUser: UserSession | null;
  userUpvotes?: Set<string>;
  onToggleUpvote?: (id: string) => void;
  onStatusChange: (id: string, status: ReportStatus) => void;
  onDeleteReport: (id: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  reports,
  flyCoords,
  onMapClick,
  pickPoint,
  onPickPointChange,
  picking,
  heat,
  currentUser,
  userUpvotes,
  onToggleUpvote,
  onStatusChange,
  onDeleteReport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseTileGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);

  // Capa base por defecto: Dark GIS con 100% de nombres de calles y avenidas de Tuxtla
  const [basemap, setBasemap] = useState<BasemapStyle>('dark-street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const pickingRef = useRef(picking);
  pickingRef.current = picking;

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const onPickPointChangeRef = useRef(onPickPointChange);
  onPickPointChangeRef.current = onPickPointChange;

  // 1. Inicializar mapa Leaflet 2D centrado exactamente en Tuxtla Gutiérrez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [16.7530, -93.1155],
      zoom: 13.5,
      minZoom: 12.5,
      maxZoom: 19,
      maxBounds: [
        [16.65, -93.30],
        [16.86, -92.98],
      ],
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: false,
    });

    baseTileGroupRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      if (pickingRef.current) {
        onPickPointChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Cambio de capa base: Libre de marcas de agua y con nombres completos de calles
  useEffect(() => {
    if (!mapRef.current || !baseTileGroupRef.current) return;
    const group = baseTileGroupRef.current;
    group.clearLayers();

    if (basemap === 'dark-street') {
      // OSM con filtro Dark GIS: 100% libre de marca y con TODAS las calles/avenidas de Tuxtla
      const osmDark = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: 'dark-gis-tiles',
        maxNativeZoom: 19,
        maxZoom: 19,
        subdomains: 'abc',
      });
      group.addLayer(osmDark);
    } else if (basemap === 'osm') {
      // OpenStreetMap Estándar diurno a todo color
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 19,
        maxZoom: 19,
        subdomains: 'abc',
      });
      group.addLayer(osm);
    } else if (basemap === 'satellite') {
      // Satélite ESRI World Imagery + Capa de etiquetas de calles
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxNativeZoom: 18, maxZoom: 19 }
      );
      const satLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxNativeZoom: 18, maxZoom: 19 }
      );
      group.addLayer(sat);
      group.addLayer(satLabels);
    } else if (basemap === 'esri-canvas') {
      // ESRI Dark Gray Canvas (Minimalista)
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxNativeZoom: 16, maxZoom: 19 }
      );
      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxNativeZoom: 16, maxZoom: 19 }
      );
      group.addLayer(base);
      group.addLayer(labels);
    }
  }, [basemap]);

  // 3. Centrado suave y zoom al buscar o hacer clic
  useEffect(() => {
    if (!mapRef.current || !flyCoords) return;
    mapRef.current.flyTo(flyCoords, 16, { duration: 1.2, easeLinearity: 0.25 });
  }, [flyCoords]);

  // 4. Cursor en modo selección
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor = picking ? 'crosshair' : '';
  }, [picking]);

  // 5. Render de marcadores vectoriales SVG de alta definición
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    if (heat) {
      // En modo calor, mostrar los centros de los incidentes como puntos radiantes visibles
      reports.forEach((report) => {
        const color = getCategoryColor(report.category);
        const dotHtml = `
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.5);"></div>
        `;
        const dotIcon = L.divIcon({
          html: dotHtml,
          className: 'heat-point-dot',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const m = L.marker([report.lat, report.lng], { icon: dotIcon });
        group.addLayer(m);
      });
      return;
    }

    const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'BRIGADISTA';
    const isAdmin = currentUser?.role === 'ADMIN';

    reports.forEach((report) => {
      const color = getCategoryColor(report.category);
      const statusColor = getStatusColor(report.status);

      const icon = createCustomPin(report.category);
      const marker = L.marker([report.lat, report.lng], { icon });

      const hasUpvoted = (userUpvotes && userUpvotes.has(report.id)) || report.hasUpvoted || false;
      const upvotes = report.upvotesCount || 0;

      // Popup informativo elegante y profesional SIN imágenes
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-2 space-y-2.5 max-w-[290px] text-white select-none';

      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}; box-shadow: 0 0 8px ${color};"></span>
            <span class="text-[11px] font-bold uppercase tracking-wider" style="color: ${color};">
              ${report.category}
            </span>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background-color: ${statusColor}25; color: ${statusColor}; border: 1px solid ${statusColor}60;">
            ${report.status}
          </span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-white leading-tight mb-1">${report.title}</h3>
          <p class="text-xs text-slate-300 leading-relaxed">${report.description}</p>
        </div>
        <div class="pt-1 flex flex-col gap-1 text-[11px] text-slate-400">
          <div class="flex items-center gap-1.5">
            <span>📍</span>
            <span class="text-slate-300 font-medium">${report.address || 'Tuxtla Gutiérrez, Chiapas'}</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
            <span>⏱️ ${report.createdAt || 'Reciente'}</span>
            <span>${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</span>
          </div>
        </div>

        <!-- BOTÓN VECINAL: A mí también me afecta (+1) -->
        <div class="pt-2 border-t border-slate-700/60">
          <button id="btn-upvote-${report.id}" class="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition shadow-md cursor-pointer ${
            hasUpvoted
              ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-600/30 ring-2 ring-blue-400/50'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600/80 hover:text-white'
          }">
            <span class="flex items-center gap-1.5">
              <span class="text-base">${hasUpvoted ? '👍' : '👥'}</span>
              <span>${hasUpvoted ? '¡A mí también me afecta!' : 'A mí también me afecta (+1)'}</span>
            </span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              hasUpvoted ? 'bg-blue-800 text-white' : 'bg-slate-900 text-blue-400 border border-blue-900/40'
            }">
              ${upvotes}
            </span>
          </button>
          <div class="text-[9px] text-slate-400 text-center mt-1">
            ${upvotes === 0 ? 'Sé el primero en respaldar este reporte vecinal' : `${upvotes} vecinos han respaldado esta incidencia`}
          </div>
        </div>
      `;

      popupDiv.querySelector(`#btn-upvote-${report.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onToggleUpvote) {
          onToggleUpvote(report.id);
        }
      });

      if (isStaff) {
        const staffDiv = document.createElement('div');
        staffDiv.className = 'pt-2.5 border-t border-slate-700/80 space-y-2';
        staffDiv.innerHTML = `
          <div class="flex items-center justify-between pb-1 border-b border-slate-700/60">
            <span class="text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'text-purple-400' : 'text-amber-400'}">
              ${isAdmin ? '🛡️ Panel Directivo (Admin)' : '👷 Cuadrilla en Campo (Brigadista)'}
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.2 rounded ${isAdmin ? 'bg-purple-950 text-purple-300 border border-purple-700/50' : 'bg-amber-950 text-amber-300 border border-amber-700/50'}">${currentUser?.role}</span>
          </div>
          <div class="text-[10px] text-slate-300 font-semibold pt-0.5">
            Actualizar avance de atención:
          </div>
          <div class="grid grid-cols-2 gap-1.5 text-[10px]">
            <button id="btn-rev-${report.id}" class="px-2 py-1.5 rounded-lg border font-semibold transition ${
              report.status === 'EN_REVISION'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }">1. En Revisión</button>
            <button id="btn-atn-${report.id}" class="px-2 py-1.5 rounded-lg border font-semibold transition ${
              report.status === 'EN_ATENCION'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }">2. Cuadrilla en Sitio</button>
            <button id="btn-res-${report.id}" class="col-span-2 px-2 py-2 rounded-lg border font-semibold transition ${
              report.status === 'RESUELTO'
                ? 'bg-green-600 text-white border-green-500 shadow-md'
                : 'bg-green-950/40 text-green-300 border-green-700/60 hover:bg-green-900/60'
            }">✓ Marcar como Resuelto (Finalizado)</button>
          </div>
          ${
            isAdmin
              ? `<button id="btn-del-${report.id}" class="w-full mt-2 px-2 py-1.5 text-[10px] text-red-400 hover:bg-red-950/60 hover:text-red-200 rounded-lg border border-red-900/60 font-semibold transition flex items-center justify-center gap-1.5">
                  <span>🗑️ Eliminar Incidencia (Solo Admin)</span>
                </button>`
              : `<div class="text-[9px] text-slate-500 text-center italic pt-1">
                  Solo personal administrador tiene permisos para eliminar registros
                </div>`
          }
        `;

        staffDiv.querySelector(`#btn-rev-${report.id}`)?.addEventListener('click', () => {
          onStatusChange(report.id, 'EN_REVISION');
          marker.closePopup();
        });
        staffDiv.querySelector(`#btn-atn-${report.id}`)?.addEventListener('click', () => {
          onStatusChange(report.id, 'EN_ATENCION');
          marker.closePopup();
        });
        staffDiv.querySelector(`#btn-res-${report.id}`)?.addEventListener('click', () => {
          onStatusChange(report.id, 'RESUELTO');
          marker.closePopup();
        });
        if (isAdmin) {
          staffDiv.querySelector(`#btn-del-${report.id}`)?.addEventListener('click', () => {
            onDeleteReport(report.id);
            marker.closePopup();
          });
        }

        popupDiv.appendChild(staffDiv);
      }

      marker.bindPopup(popupDiv);
      group.addLayer(marker);
    });
  }, [reports, heat, currentUser, userUpvotes]);

  // 6. Marcador del punto de selección interactiva
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!pickPoint) {
      if (pickMarkerRef.current) {
        map.removeLayer(pickMarkerRef.current);
        pickMarkerRef.current = null;
      }
      return;
    }

    if (!pickMarkerRef.current) {
      const html = `
        <div class="pick-marker-wrapper">
          <div class="pick-3d animate-bounce">
            <div class="pick-3d-dot"></div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'apple-pick-pin-container',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([pickPoint.lat, pickPoint.lng], {
        icon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        onPickPointChangeRef.current({ lat: latlng.lat, lng: latlng.lng });
      });

      pickMarkerRef.current = marker;
    } else {
      pickMarkerRef.current.setLatLng([pickPoint.lat, pickPoint.lng]);
    }
  }, [pickPoint]);

  // 7. Mapa de calor
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!heat || reports.length === 0 || !(L as any).heatLayer) return;

    // Focos térmicos reforzados para que el calor sea denso, brillante y altamente visible
    const points: [number, number, number][] = [];
    reports.forEach((r) => {
      points.push([r.lat, r.lng, 1.0]);
      points.push([r.lat + 0.00018, r.lng + 0.00018, 0.85]);
      points.push([r.lat - 0.00018, r.lng - 0.00018, 0.85]);
      points.push([r.lat + 0.00018, r.lng - 0.00018, 0.7]);
      points.push([r.lat - 0.00018, r.lng + 0.00018, 0.7]);
    });

    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 54,
      blur: 22,
      maxZoom: 16,
      max: 0.9,
      minOpacity: 0.7,
      gradient: {
        0.15: '#00e5ff', // Cyan neón
        0.35: '#00e676', // Verde brillante
        0.55: '#ffea00', // Amarillo fuego
        0.75: '#ff6d00', // Naranja intenso
        1.0: '#ff1744',  // Rojo incandescente
      },
    }).addTo(map);
  }, [heat, reports]);

  return (
    <div className="relative h-full w-full">
      {/* Contenedor Leaflet */}
      <div ref={containerRef} className="h-full w-full bg-[#0b0f17]" />

      {/* Selector de capas flotante */}
      <div 
        className="pointer-events-auto absolute bottom-44 right-6 z-[400] flex flex-col items-end gap-2"
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {showLayerMenu && (
          <div className="glass p-2 rounded-2xl flex flex-col gap-1.5 shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-right-2 duration-150 text-xs w-56">
            <button
              onClick={() => { setBasemap('dark-street'); setShowLayerMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold transition ${
                basemap === 'dark-street' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🌙</span>
              <div>
                <div>Oscuro GIS (Calles)</div>
                <div className="text-[10px] font-normal opacity-70">Nombres completos de calles</div>
              </div>
            </button>
            <button
              onClick={() => { setBasemap('osm'); setShowLayerMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold transition ${
                basemap === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🗺️</span>
              <div>
                <div>Calles y Rutas (Claro)</div>
                <div className="text-[10px] font-normal opacity-70">OpenStreetMap diurno</div>
              </div>
            </button>
            <button
              onClick={() => { setBasemap('satellite'); setShowLayerMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold transition ${
                basemap === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🛰️</span>
              <div>
                <div>Satélite HD</div>
                <div className="text-[10px] font-normal opacity-70">Fotografía ESRI aérea</div>
              </div>
            </button>
            <button
              onClick={() => { setBasemap('esri-canvas'); setShowLayerMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold transition ${
                basemap === 'esri-canvas' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🌑</span>
              <div>
                <div>Dark Canvas Minimal</div>
                <div className="text-[10px] font-normal opacity-70">Fondo tenue minimalista</div>
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`p-3 rounded-2xl border shadow-2xl transition hover:scale-105 flex items-center justify-center ${
            showLayerMenu ? 'bg-blue-600 text-white border-blue-400' : 'glass text-slate-200 border-slate-700/80 hover:bg-slate-800'
          }`}
          title="Cambiar capa del mapa"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Controles de Zoom */}
        <div className="glass flex flex-col overflow-hidden rounded-2xl shadow-xl border border-slate-700/80 mt-1">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-10 w-10 items-center justify-center text-white transition hover:bg-slate-700/50 active:scale-95"
            title="Acercar"
          >
            <Plus size={18} />
          </button>
          <div className="h-px w-full bg-slate-700/60" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-10 w-10 items-center justify-center text-white transition hover:bg-slate-700/50 active:scale-95"
            title="Alejar"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MapDashboard } from './components/MapDashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminConsole } from './components/AdminConsole';
import { BrigadaPanel } from './components/BrigadaPanel';
import { AuthModal } from './components/AuthModal';
import { UserSession } from './types/report';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'map' | 'dashboard' | 'brigada' | 'admin'>('map');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Filtro de Zona Crítica (PostGIS) transmitido entre vistas
  const [activeZoneFilter, setActiveZoneFilter] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [initialFlyCoords, setInitialFlyCoords] = useState<[number, number] | null>(null);

  // Sesión de usuario persistente
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('tuxtla_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Ing. Carlos Mendoza',
      email: 'admin@tuxtla.gob.mx',
      role: 'ADMIN',
    };
  });

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      {currentTab === 'map' ? (
        <MapDashboard 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          activeZoneFilter={activeZoneFilter}
          onClearZoneFilter={() => setActiveZoneFilter(null)}
          initialFlyCoords={initialFlyCoords}
        />
      ) : currentTab === 'dashboard' ? (
        <AnalyticsView
          onBackToMap={() => setCurrentTab('map')}
          onNavigateToMapWithZone={(zone) => {
            setActiveZoneFilter(zone);
            setInitialFlyCoords([zone.lat, zone.lng]);
            setCurrentTab('map');
          }}
          onNavigateToBrigada={() => setCurrentTab('brigada')}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      ) : currentTab === 'brigada' ? (
        <BrigadaPanel
          onBackToMap={() => setCurrentTab('map')}
          onViewReportOnMap={(lat, lng) => {
            setInitialFlyCoords([lat, lng]);
            setCurrentTab('map');
          }}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <AdminConsole
          onBackToMap={() => setCurrentTab('map')}
          onNavigateToMapWithCoords={(lat, lng) => {
            setInitialFlyCoords([lat, lng]);
            setCurrentTab('map');
          }}
          currentUser={currentUser}
        />
      )}

      {/* Modal global de Autenticación y Cambio de Rol */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          // Redirigir según el rol si el actual ya no está disponible
          if (user.role === 'CIUDADANO' && (currentTab === 'dashboard' || currentTab === 'brigada' || currentTab === 'admin')) {
            setCurrentTab('map');
          } else if (user.role === 'BRIGADISTA' && (currentTab === 'dashboard' || currentTab === 'admin')) {
            setCurrentTab('brigada');
          }
        }}
        currentUser={currentUser}
      />
    </div>
  );
};

export default App;

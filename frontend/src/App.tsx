import {PasswordChange} from './components/PasswordChange';
import {useTheme} from './components/Theme';
import React,{Suspense,lazy,useEffect,useRef,useState} from 'react';
import {LandingPage} from './components/LandingPage';
import {AuthModal} from './components/AuthModal';
import {UserSession} from './types/report';
const MapDashboard=lazy(()=>import('./components/MapDashboard').then(module=>({default:module.MapDashboard})));
const AnalyticsView=lazy(()=>import('./components/AnalyticsView').then(module=>({default:module.AnalyticsView})));
const AdminConsole=lazy(()=>import('./components/AdminConsole').then(module=>({default:module.AdminConsole})));
const BrigadaPanel=lazy(()=>import('./components/BrigadaPanel').then(module=>({default:module.BrigadaPanel})));
type Tab='map'|'dashboard'|'brigada'|'admin';
const paths:Record<Tab,string>={map:'/mapa',dashboard:'/analitica',brigada:'/brigadas',admin:'/administracion'};
const readRoute=():Tab|'home'=>{const path=window.location.pathname;const known=Object.entries(paths).find(([,url])=>url===path)?.[0] as Tab|undefined;if(known)return known;if(new URLSearchParams(window.location.search).has('report'))return 'map';return 'home';};
export const App:React.FC=()=>{
 const {theme}=useTheme();const initial=readRoute();const [showLanding,setShowLanding]=useState(initial==='home');const [currentTab,setTab]=useState<Tab>(initial==='home'?'map':initial);
 const [isAuthModalOpen,setIsAuthModalOpen]=useState(false);const [authTab,setAuthTab]=useState<'login'|'register'>('login');const intent=useRef<'report'|null>(null);const [pendingReport,setPendingReport]=useState(false);
 const [activeZoneFilter,setActiveZoneFilter]=useState<{lat:number;lng:number;name:string}|null>(null);const [initialFlyCoords,setInitialFlyCoords]=useState<[number,number]|null>(null);
 const [currentUser,setCurrentUser]=useState<UserSession|null>(()=>{try{const user=JSON.parse(localStorage.getItem('tuxtla_user')||'null');return user?.token?user:null;}catch{return null;}});
 const navigate=(tab:Tab|'home')=>{setShowLanding(tab==='home');if(tab!=='home')setTab(tab);const report=new URLSearchParams(window.location.search).get('report');const target=tab==='home'?'/':paths[tab]+(report?'?report='+encodeURIComponent(report):'');if(window.location.pathname+window.location.search!==target)window.history.pushState(null,'',target);};
 const logout=()=>{localStorage.removeItem('tuxtla_user');setCurrentUser(null);setIsAuthModalOpen(false);navigate('home');};
 const openAuth=(tab:'login'|'register'='login')=>{intent.current=null;setAuthTab(tab);setIsAuthModalOpen(true);};
 const requestReport=()=>{if(currentUser?.id){navigate('map');setPendingReport(true);}else{intent.current='report';setAuthTab('login');setIsAuthModalOpen(true);}};
 const myPanel=()=>navigate(currentUser?.role==='ADMIN'?'admin':currentUser?.role==='BRIGADISTA'?'brigada':'map');
 useEffect(()=>{const handler=()=>{const route=readRoute();setShowLanding(route==='home');if(route!=='home')setTab(route);};window.addEventListener('popstate',handler);return()=>window.removeEventListener('popstate',handler);},[]);
 useEffect(()=>{if(!currentUser?.token)return;const controller=new AbortController();fetch('/api/auth/me',{headers:{Authorization:`Bearer ${currentUser.token}`},signal:controller.signal}).then(async response=>{if(response.status===401){logout();return;}if(response.ok){const data=await response.json();setCurrentUser(previous=>previous?{...data,token:previous.token}:null);}}).catch(()=>{});return()=>controller.abort();},[currentUser?.token]);
 useEffect(()=>{const handler=()=>logout();window.addEventListener('tuxtla-session-expired',handler);return()=>window.removeEventListener('tuxtla-session-expired',handler);},[]);
 if(currentUser?.mustChangePassword)return <div data-theme={theme} className="civic-app"><PasswordChange user={currentUser} onSuccess={setCurrentUser} onLogout={logout}/></div>;
 return <div data-theme={theme} className="civic-app w-screen h-screen overflow-hidden flex flex-col font-sans">
  {showLanding?<LandingPage user={currentUser} onMap={()=>navigate('map')} onReport={requestReport} onLogin={()=>openAuth()} onRegister={()=>openAuth('register')} onPanel={myPanel}/>:<Suspense fallback={<div className="app-route-loading" role="status"><span/>Abriendo tu espacio…</div>}>
   {currentTab==='map'?<MapDashboard currentTab={currentTab} setCurrentTab={navigate} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuth={()=>openAuth()} onRequestReportAuth={requestReport} onGoHome={()=>navigate('home')} initialReportRequest={pendingReport} onInitialReportHandled={()=>setPendingReport(false)} activeZoneFilter={activeZoneFilter} onClearZoneFilter={()=>setActiveZoneFilter(null)} initialFlyCoords={initialFlyCoords}/>:currentTab==='dashboard'?<AnalyticsView currentUser={currentUser} onOpenAuth={()=>openAuth()} onBackToMap={()=>navigate('map')} onNavigateToMapWithZone={zone=>{setActiveZoneFilter(zone);setInitialFlyCoords([zone.lat,zone.lng]);navigate('map');}} onNavigateToBrigada={()=>navigate('brigada')}/>:currentTab==='brigada'?<BrigadaPanel currentUser={currentUser} onOpenAuth={()=>openAuth()} onBackToMap={()=>navigate('map')} onViewReportOnMap={(lat,lng)=>{setInitialFlyCoords([lat,lng]);navigate('map');}}/>:<AdminConsole currentUser={currentUser} onOpenAccount={()=>openAuth()} onBackToMap={()=>navigate('map')} onNavigateToMapWithCoords={(lat,lng)=>{setInitialFlyCoords([lat,lng]);navigate('map');}}/>}
  </Suspense>}
  <AuthModal isOpen={isAuthModalOpen} initialTab={authTab} currentUser={currentUser} onClose={()=>{setIsAuthModalOpen(false);intent.current=null;}} onLoginSuccess={user=>{setCurrentUser(user);if(!user.id){navigate('home');return;}if(intent.current==='report'){intent.current=null;navigate('map');setPendingReport(true);}else navigate(user.role==='ADMIN'?'admin':user.role==='BRIGADISTA'?'brigada':'map');}}/>
 </div>;
};
export default App;

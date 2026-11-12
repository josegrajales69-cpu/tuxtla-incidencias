import { useDialog } from '../utils/useDialog';
import { ReportIcon } from './ReportIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Camera, ImagePlus,
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
import { ReportCategory, UserSession, SituationOption, ReportItem } from '../types/report';
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
  { id: 'FUGA_AGUA', label: 'Agua / Fugas', icon: Droplets, color: '#06b6d4' },
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
  const dialogRef = useDialog<HTMLDivElement>(isOpen,onClose);
  const [situations,setSituations]=useState<Partial<Record<ReportCategory,SituationOption[]>>>({});
  const [situation,setSituation]=useState<string>();
  const [optionsError,setOptionsError]=useState(false);
  const [photo,setPhoto]=useState<File>();
  const [photoPreview,setPhotoPreview]=useState<string>();
  const photoInput=useRef<HTMLInputElement>(null);
  const [nearby,setNearby]=useState<(ReportItem & {distanceMeters:number})[]>([]);
  const [checkingNearby,setCheckingNearby]=useState(false);
  const [nearbyError,setNearbyError]=useState(false);
  const [confirmDistinct,setConfirmDistinct]=useState(false);
  const [supportedId,setSupportedId]=useState<string>();
  const [supportingId,setSupportingId]=useState<string>();
  const [nearbyRetry,setNearbyRetry]=useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('BACHE');
  const [address, setAddress] = useState('Detectando calle en Tuxtla...');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{title?:string;address?:string;situation?:string;photo?:string}>({});
  const [submitError,setSubmitError] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(initialCoords);

  const selectedSituation=situations[category]?.find(option=>option.id===situation);
  const loadSituations=async()=>{
    setOptionsError(false);
    try{const response=await fetch('/api/reports/options');if(!response.ok)throw new Error();setSituations(await response.json());}
    catch{setOptionsError(true);}
  };
  useEffect(()=>{void loadSituations();},[]);
  useEffect(()=>{
    if(!photo){setPhotoPreview(undefined);return;}
    const url=URL.createObjectURL(photo);setPhotoPreview(url);return()=>URL.revokeObjectURL(url);
  },[photo]);
  const removePhoto=()=>{setPhoto(undefined);if(photoInput.current)photoInput.current.value='';setFieldErrors(previous=>({...previous,photo:undefined}));};
  const choosePhoto=(file?:File)=>{
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setFieldErrors(previous=>({...previous,photo:'Elige una foto JPG, PNG o WEBP.'}));return;}
    if(file.size>8*1024*1024){setFieldErrors(previous=>({...previous,photo:'La foto debe pesar como máximo 8 MB.'}));return;}
    setPhoto(file);setFieldErrors(previous=>({...previous,photo:undefined}));
  };

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

  useEffect(()=>{
    if(!isOpen)return;
    const abort=new AbortController();setCheckingNearby(true);setNearbyError(false);setConfirmDistinct(false);setSupportedId(undefined);setNearby([]);
    const timer=setTimeout(async()=>{try{const params=new URLSearchParams({category,lat:String(coords.lat),lng:String(coords.lng),...(situation?{situation}:{})});
      const response=await fetch(`/api/reports/nearby?${params}`,{signal:abort.signal});if(!response.ok)throw new Error();setNearby(await response.json());
    }catch(error){if(!abort.signal.aborted)setNearbyError(true);}finally{if(!abort.signal.aborted)setCheckingNearby(false);}},300);
    return()=>{clearTimeout(timer);abort.abort();};
  },[isOpen,category,situation,coords.lat,coords.lng,nearbyRetry]);
  const supportNearby=async(id:string)=>{
    setSupportingId(id);setSubmitError('');try{const response=await fetch(`/api/reports/${id}/support`,{method:'POST',headers:{Authorization:`Bearer ${currentUser?.token||''}`}});const result=await response.json();if(!response.ok)throw new Error(result.error);setSupportedId(id);onSuccess();}catch(error:any){setSubmitError(error.message||'No pudimos registrar tu apoyo.');}finally{setSupportingId(undefined);}
  };
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {title?:string;address?:string;situation?:string;photo?:string} = {};
    if(!selectedSituation)errors.situation='Elige la situación que mejor describe el problema.';
    if(fieldErrors.photo)errors.photo=fieldErrors.photo;
    if (!title.trim()) errors.title = 'Cuéntanos qué sucede para enviar el reporte.';
    if (!address.trim()) errors.address = 'Escribe la calle o elige la ubicación en el mapa.';
    else if (isResolvingAddress) errors.address = 'Estamos buscando la dirección. Espera un momento.';
    setFieldErrors(errors);
    setSubmitError('');
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => {if(errors.situation)document.querySelector<HTMLInputElement>('#report-situation input')?.focus();else if(errors.photo)photoInput.current?.focus();else document.getElementById(errors.address?'report-address':'report-title')?.focus();});
      return;
    }
    if(checkingNearby){setSubmitError('Estamos revisando si ya existe un reporte cercano.');return;}
    if(nearby.length&&!confirmDistinct){setSubmitError('Revisa los reportes cercanos. Puedes apoyar uno o indicar que se trata de otro problema.');document.getElementById('nearby-reports')?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
    setLoading(true);
    setDuplicateAlert(null);

    try {
      const form=new FormData();
      form.set('title',title.trim());form.set('description',description.trim()||title.trim());
      form.set('confirmDistinct',String(confirmDistinct));form.set('category',category);form.set('situation',situation!);
      form.set('lat',String(coords.lat));form.set('lng',String(coords.lng));form.set('address',address.trim());
      if(currentUser?.id)form.set('citizenId',currentUser.id);
      if(photo)form.set('photo',photo);
      const response=await fetch('/api/reports',{method:'POST',headers:currentUser?.token?{Authorization:`Bearer ${currentUser.token}`}:{},body:form});

      const data = await response.json();

      if(response.status===409&&Array.isArray(data.nearby)){setNearby(data.nearby);setConfirmDistinct(false);setSubmitError(data.error);return;}
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el reporte');
      }

      if (data.isDuplicate) {
        setDuplicateAlert(
          `⚠️ Ya existe un reporte de "${data.existingReport?.category || category}" a menos de 30 metros de esta ubicación.`
        );
      }

      setTitle('');setDescription('');setSituation(undefined);setNearby([]);setConfirmDistinct(false);setSupportedId(undefined);removePhoto();setFieldErrors({});
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'No pudimos enviar tu reporte. Tus datos siguen aquí; inténtalo de nuevo.');
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
    <div className="report-dialog fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Reportar una incidencia"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Reportar una incidencia</h2>
              <p className="text-xs text-slate-400">Tuxtla Gutiérrez, Chiapas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar formulario"
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

        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {submitError && <p className="report-field-error" role="alert">{submitError}</p>}

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
                    aria-pressed={isSelected}
                    type="button"
                    onClick={() => {if(cat.id===category)return;if(title===selectedSituation?.label)setTitle('');setCategory(cat.id);setSituation(undefined);setFieldErrors(previous=>({...previous,situation:undefined}));}}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/50 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ReportIcon category={cat.id} size={23}/>
                    <span className="text-[11px] font-semibold leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <fieldset id="report-situation" className="situation-picker" aria-describedby={fieldErrors.situation?'report-situation-error':undefined}>
            <legend>Describe la situación</legend>
            <p className="situation-helper">Elige la opción que mejor se acerque.</p>
            {optionsError?<button type="button" className="options-retry" onClick={()=>void loadSituations()}>No cargaron las opciones. Volver a intentar</button>:!situations[category]?<p className="situation-helper" role="status">Cargando opciones…</p>:<div className="situation-options">
              {situations[category]?.map(option=><label key={option.id} className={`situation-choice ${situation===option.id?'selected':''}`}>
                <input type="radio" name="report-situation" value={option.id} checked={situation===option.id} onChange={()=>{if(option.id!=='NO_SE'&&(!title.trim()||title===selectedSituation?.label))setTitle(option.label);setSituation(option.id);setFieldErrors(previous=>({...previous,situation:undefined,title:undefined}));}}/>
                <span>{option.label}</span>
              </label>)}
            </div>}
            {fieldErrors.situation&&<p id="report-situation-error" className="report-field-error" role="alert">{fieldErrors.situation}</p>}

          </fieldset>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              ¿Dónde ocurre?
            </label>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="report-coordinates text-xs font-mono text-slate-200">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </div>
                  <div className="text-[10px] text-slate-400">Ubicación seleccionada</div>
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
                  <span>Elegir en mapa</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="report-address"
                aria-invalid={!!fieldErrors.address}
                aria-describedby={fieldErrors.address ? 'report-address-error' : undefined}
                aria-label="Dirección de la incidencia"
                type="text"
                required
                value={address}
                onChange={(e) => {setAddress(e.target.value);setFieldErrors(previous=>({...previous,address:undefined}));}}
                placeholder="Calle, avenida o colonia (ej. 5a Norte esquina 2a Poniente)"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-4 pr-10 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldErrors.address && <p id="report-address-error" className="report-field-error" role="alert">{fieldErrors.address}</p>}
              {isResolvingAddress && (
                <div className="absolute right-3 top-2.5 flex items-center pointer-events-none" title="Detectando calle...">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {(checkingNearby||nearbyError||nearby.length>0)&&<section id="nearby-reports" className="nearby-reports" aria-label="Reportes similares cercanos">
            {checkingNearby?<p role="status">Buscando reportes similares cerca…</p>:nearbyError?<p>No pudimos revisar los reportes cercanos. <button type="button" onClick={()=>setNearbyRetry(n=>n+1)}>Reintentar</button></p>:<>
              <h3>¿Alguien ya reportó este problema?</h3><p>Hay reportes del mismo tipo cerca. Apoyar uno evita repetir la solicitud.</p>
              {nearby.map(report=><article key={report.id}><strong>{report.title}</strong><small>{report.address||'Ubicación cercana'} · A unos {report.distanceMeters} m</small><button type="button" disabled={!!supportingId||supportedId===report.id} onClick={()=>void supportNearby(report.id)}>{supportedId===report.id?'✓ Apoyo registrado':supportingId===report.id?'Guardando…':'También me afecta'}</button></article>)}
              {supportedId?<div className="nearby-success" role="status"><p>Tu apoyo quedó registrado en el reporte existente. No hace falta crear otro.</p><button type="button" onClick={onClose}>Listo</button></div>:null}
              <label className="distinct-report"><input type="checkbox" checked={confirmDistinct} onChange={event=>{setConfirmDistinct(event.target.checked);setSubmitError('');}}/><span>Es otro problema cercano. Quiero crear un reporte distinto.</span></label>
            </>}
          </section>}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Título del reporte <span className="text-red-400">*</span>
              </label>
              <input
                id="report-title"
                maxLength={200}
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? 'report-title-error' : undefined}
                aria-label="Título del reporte"
                type="text"
                required
                value={title}
                onChange={(e) => {setTitle(e.target.value);setFieldErrors(previous=>({...previous,title:undefined}));}}
                placeholder={selectedSituation?.id==='NO_SE'?'Cuéntanos qué sucede':selectedSituation?.label||'Ej. Bache frente a la escuela'}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldErrors.title && <p id="report-title-error" className="report-field-error" role="alert">{fieldErrors.title}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Detalles adicionales
                </label>
                <span className="text-[10px] text-blue-400 font-medium bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                  Opcional
                </span>
              </div>
              <textarea
                aria-label="Detalles adicionales"
                maxLength={4000}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional: Agrega detalles adicionales, dimensiones o referencias de apoyo..."
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <section className="photo-picker" aria-label="Foto del reporte">
            <div className="photo-picker-heading"><label htmlFor="report-photo">Foto del problema</label><span>Opcional</span></div>
            <input ref={photoInput} id="report-photo" className="photo-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>choosePhoto(e.target.files?.[0])} aria-describedby={fieldErrors.photo?'report-photo-error':'report-photo-help'}/>
            {photoPreview?<div className="photo-preview"><img src={photoPreview} alt="Vista previa de la foto del reporte"/><div><button type="button" onClick={()=>photoInput.current?.click()}>Cambiar foto</button><button type="button" onClick={removePhoto}>Quitar foto</button></div></div>:<button type="button" className="add-report-photo" onClick={()=>photoInput.current?.click()}><ImagePlus size={22}/><span>Añadir una foto<small>Desde tu cámara o galería</small></span><Camera size={18}/></button>}
            <p id="report-photo-help" className="situation-helper">JPG, PNG o WEBP · Máximo 8 MB</p>
            {fieldErrors.photo&&<p id="report-photo-error" className="report-field-error" role="alert">{fieldErrors.photo}</p>}
          </section>

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

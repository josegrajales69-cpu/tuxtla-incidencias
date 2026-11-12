import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';

type Photo={url:string;title:string};
const ViewerContext=createContext<(photo:Photo)=>void>(()=>{});
export const usePhotoViewer=()=>useContext(ViewerContext);
export function PhotoViewerProvider({children}:{children:React.ReactNode}){
 const [photo,setPhoto]=useState<Photo>();
 const [loading,setLoading]=useState(true);
 const [failed,setFailed]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 const opener=useRef<HTMLElement|null>(null);
 const close=useCallback(()=>setPhoto(undefined),[]);
 const open=useCallback((next:Photo)=>{
  if(!/^\/media\/reports\/[0-9a-f-]{36}\.jpg$/.test(next.url))return;
  opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setLoading(true);setFailed(false);setPhoto(next);
 },[]);
 useEffect(()=>{
  if(!photo||!dialog.current)return;
  const element=dialog.current;element.showModal();closeButton.current?.focus();

  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
   if(event.key==='Tab'){event.preventDefault();event.stopImmediatePropagation();closeButton.current?.focus();}
  };
  window.addEventListener('keydown',onKey,true);
  return()=>{window.removeEventListener('keydown',onKey,true);element.close();if(opener.current?.isConnected)opener.current.focus();};
 },[photo,close]);
 return <ViewerContext.Provider value={open}>{children}{photo&&createPortal(
  <dialog ref={dialog} className="report-photo-viewer" aria-labelledby="photo-viewer-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
   <section className="photo-viewer-content">
    <header><div><span>Foto del reporte</span><h2 id="photo-viewer-title">{photo.title}</h2></div><button ref={closeButton} type="button" onClick={close} aria-label="Cerrar foto"><X size={22}/></button></header>
    <figure>{loading&&!failed&&<p className="photo-viewer-status" role="status">Cargando foto…</p>}{failed?<p className="photo-viewer-status" role="alert">No pudimos cargar esta foto. Cierra y vuelve a intentarlo.</p>:<img src={photo.url} alt={`Foto del reporte: ${photo.title}`} onLoad={()=>setLoading(false)} onError={()=>{setLoading(false);setFailed(true);}}/>}</figure>
   </section>
  </dialog>,document.body)}</ViewerContext.Provider>;
}

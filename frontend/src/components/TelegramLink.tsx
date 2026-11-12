import React,{useEffect,useState} from 'react';
import {Send,CheckCircle2} from 'lucide-react';
import {UserSession} from '../types/report';
export function TelegramLink({user}:{user:UserSession}){
 const [linked,setLinked]=useState(false);const [available,setAvailable]=useState(false);const [loaded,setLoaded]=useState(false);
 const [url,setUrl]=useState<string>();const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [confirmUnlink,setConfirmUnlink]=useState(false);
 const headers={Authorization:`Bearer ${user.token||''}`};
 const refresh=async()=>{const response=await fetch('/api/telegram/link',{headers});const data=await response.json();if(!response.ok)throw new Error(data.error||'No pudimos consultar Telegram.');setLinked(data.linked);setAvailable(data.available);setLoaded(true);if(data.linked)setUrl(undefined);};
 useEffect(()=>{void refresh().catch(error=>{setLoaded(true);setError(error.message);});},[user.id,user.token]);
 useEffect(()=>{if(!url)return;const timer=setInterval(()=>void refresh().catch(()=>{}),3000);const expiry=setTimeout(()=>{setUrl(undefined);setError('El enlace venció. Genera uno nuevo.');},10*60*1000);return()=>{clearInterval(timer);clearTimeout(expiry);};},[url,user.id,user.token]);
 const connect=async()=>{setBusy(true);setError('');try{const response=await fetch('/api/telegram/link',{method:'POST',headers});const data=await response.json();if(!response.ok)throw new Error(data.error);setUrl(data.url);}catch(error:any){setError(error.message||'No pudimos conectar Telegram.');}finally{setBusy(false);}};
 const disconnect=async()=>{setBusy(true);setError('');try{const response=await fetch('/api/telegram/link',{method:'DELETE',headers});const data=await response.json();if(!response.ok)throw new Error(data.error);setLinked(false);setUrl(undefined);setConfirmUnlink(false);}catch(error:any){setError(error.message);}finally{setBusy(false);}};
 return <section className="telegram-link-card" aria-label="Conectar Telegram"><div className="telegram-link-intro"><Send size={21}/><div><h2>{linked?'Telegram vinculado':'Atiende desde Telegram'}</h2><p>{linked?'Ya puedes pulsar «Tomar reporte» en las alertas del grupo.':'Vincula tu cuenta una sola vez. Después toma reportes desde el grupo sin entrar a la web.'}</p></div></div>
 {linked?<div className="telegram-link-actions"><span className="telegram-linked"><CheckCircle2 size={16}/>Conectado</span>{confirmUnlink?<><button disabled={busy} onClick={()=>void disconnect()}>Confirmar desvinculación</button><button disabled={busy} onClick={()=>setConfirmUnlink(false)}>Conservar</button></>:<button onClick={()=>setConfirmUnlink(true)}>Desvincular</button>}</div>:url?<div className="telegram-link-steps"><a href={url} target="_blank" rel="noreferrer" className="system-primary">Abrir Telegram y vincular ↗</a><p>En el chat privado del bot, pulsa «Iniciar». Este enlace dura 10 minutos; no lo compartas.</p><button onClick={()=>void refresh().catch(error=>setError(error.message))}>Ya lo hice · Comprobar</button></div>:<button className="system-primary" disabled={busy||!loaded} onClick={()=>void connect()}>{busy?'Preparando…':'Vincular Telegram'}</button>}
 {!available&&loaded&&!error&&<p className="telegram-link-help">El bot se está conectando. Puedes volver a comprobarlo en un momento.</p>}
 {error&&<p role="alert" className="report-field-error">{error}</p>}
 </section>;
}

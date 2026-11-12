import {Router} from 'express';
import {optionalActor,requireActor} from '../auth';
import {ITelegramBrigadeRepository} from '../../../../../application/ports/ITelegramBrigadeRepository';
export function createTelegramRouter(links:ITelegramBrigadeRepository,isActive:()=>boolean){
 const router=Router();router.use(optionalActor,requireActor);
 router.use((req,res,next)=>{if(req.actor?.role!=='BRIGADISTA'){res.status(403).json({error:'Vincula Telegram desde una cuenta de brigadista.'});return;}next();});
 router.get('/link',async(req,res)=>{try{res.setHeader('Cache-Control','no-store');res.json({...await links.getLink(req.actor!.id),available:isActive()});}catch{res.status(500).json({error:'No pudimos consultar la vinculación.'});}});
 router.post('/link',async(req,res)=>{try{
  res.setHeader('Cache-Control','no-store');if(!isActive()){res.status(503).json({error:'El bot aún no está disponible. Inténtalo en un momento.'});return;}
  if((await links.getLink(req.actor!.id)).linked){res.status(409).json({error:'Tu cuenta ya está vinculada.'});return;}
  const code=await links.issueCode(req.actor!.id);const username=process.env.TELEGRAM_BOT_USERNAME;
  if(!username||!/^\w+bot$/i.test(username))throw new Error();
  res.json({url:`https://t.me/${username}?start=link_${code}`,expiresInMinutes:10});
 }catch{res.status(500).json({error:'No pudimos generar el enlace.'});}});
 router.delete('/link',async(req,res)=>{try{await links.unlink(req.actor!.id);res.json({success:true});}catch{res.status(500).json({error:'No pudimos desvincular Telegram.'});}});return router;
}

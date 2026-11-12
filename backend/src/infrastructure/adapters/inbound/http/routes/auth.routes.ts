import {optionalActor,requireActor} from '../auth';
import {Router} from 'express';
import {AuthController} from '../AuthController';
export const createAuthRouter=(controller:AuthController):Router=>{
 const failures=new Map<string,{count:number;until:number}>();
 const router=Router();router.post('/login',(req,res,next)=>{const now=Date.now();for(const[key,item]of failures)if(item.until<now)failures.delete(key);const key=String(req.ip)+'|'+String(req.body.identifier||req.body.email||'').slice(0,200).toLowerCase();const current=failures.get(key);if(current&&current.count>=10){res.status(429).json({error:'Demasiados intentos. Espera unos minutos y vuelve a intentar.'});return;}res.once('finish',()=>{if(res.statusCode===401){const item=failures.get(key)||{count:0,until:now+10*60*1000};item.count++;if(failures.size>10000)failures.clear();failures.set(key,item);}else if(res.statusCode===200)failures.delete(key);});next();},(req,res)=>controller.login(req,res));router.post('/register',(req,res)=>controller.register(req,res));
 router.get('/me',optionalActor,requireActor,(req,res)=>controller.me(req,res));router.post('/password',optionalActor,requireActor,(req,res)=>controller.password(req,res));return router;
};

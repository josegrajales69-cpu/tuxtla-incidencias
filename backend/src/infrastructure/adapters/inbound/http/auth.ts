import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {pool} from '../../../config/db';
export interface Actor {id:string;role:'ADMIN'|'BRIGADISTA'|'CIUDADANO';name:string;mustChangePassword:boolean;}
declare global {namespace Express {interface Request {actor?:Actor;}}}
export async function optionalActor(req:Request,res:Response,next:NextFunction){
 const header=req.headers.authorization;if(!header){next();return;}
 try{if(!header.startsWith('Bearer '))throw new Error();const payload=jwt.verify(header.slice(7),process.env.JWT_SECRET!) as {id:string;ver?:number};
 const result=await pool.query('SELECT id,role,name,is_active,must_change_password,session_version FROM users WHERE id=$1',[payload.id]);const user=result.rows[0];
 if(!user||!user.is_active||(payload.ver??0)!==user.session_version)throw new Error();
 req.actor={id:user.id,name:user.name,role:user.role,mustChangePassword:user.must_change_password};
 if(user.must_change_password&&!['/api/auth/me','/api/auth/password'].includes(req.originalUrl.split('?')[0])){res.status(403).json({error:'Cambia tu contraseña temporal para continuar.',code:'PASSWORD_CHANGE_REQUIRED'});return;}next();
 }catch{res.status(401).json({error:'Tu sesión venció o el acceso fue desactivado. Inicia sesión de nuevo.'});}
}
export function requireActor(req:Request,res:Response,next:NextFunction){if(!req.actor){res.status(401).json({error:'Inicia sesión para continuar.'});return;}next();}
export function staffOnly(req:Request,res:Response,next:NextFunction){if(!req.actor||!['ADMIN','BRIGADISTA'].includes(req.actor.role)){res.status(req.actor?403:401).json({error:'Esta acción corresponde al personal operativo.'});return;}next();}
export function adminOnly(req:Request,res:Response,next:NextFunction){if(req.actor?.role!=='ADMIN'){res.status(req.actor?403:401).json({error:'Esta acción corresponde a administración.'});return;}next();}
export function visibleReport(report:any,actor?:Actor){const result={...report};if(!actor||actor.role==='CIUDADANO'){delete result.priority;delete result.priorityReason;}return result;}

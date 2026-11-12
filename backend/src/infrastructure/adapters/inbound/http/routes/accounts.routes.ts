import {Router} from 'express';
import {optionalActor,adminOnly} from '../auth';
import {ManageAccounts} from '../../../../../application/use-cases/ManageAccounts';
export function createAccountsRouter(accounts:ManageAccounts){
 const router=Router();router.use(optionalActor,adminOnly);router.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
 const error=(res:any,e:any)=>res.status(e.statusCode||500).json({error:e.statusCode?e.message:'No pudimos completar la operación. Inténtalo de nuevo.'});
 router.get('/',async(_req,res)=>{try{res.json(await accounts.list());}catch(e){error(res,e);}});
 router.post('/',async(req,res)=>{try{res.status(201).json(await accounts.create(req.actor!.id,req.body));}catch(e){error(res,e);}});
 router.patch('/:id',async(req,res)=>{try{res.json(await accounts.update(req.actor!.id,req.params.id,req.body));}catch(e){error(res,e);}});
 router.post('/:id/reset-password',async(req,res)=>{try{res.json(await accounts.reset(req.actor!.id,req.params.id));}catch(e){error(res,e);}});
 router.delete('/:id/telegram',async(req,res)=>{try{await accounts.unlink(req.actor!.id,req.params.id);res.json({success:true});}catch(e){error(res,e);}});return router;
}

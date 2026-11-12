import {optionalActor,requireActor,staffOnly,adminOnly} from '../auth';
import multer from 'multer';
import { REPORT_SITUATIONS } from '../../../../../domain/entities/ReportSituations';
import { Router } from 'express';
import { ReportController } from '../ReportController';

export const createReportRouter = (controller: ReportController): Router => {
  const router = Router();
  router.use(optionalActor);
  router.get('/options', (_req,res)=>res.json(Object.fromEntries(Object.entries(REPORT_SITUATIONS).map(([key,options])=>[key,options.map(({id,label})=>({id,label}))]))));
  router.get('/nearby', (req,res)=>controller.nearby(req,res));
  router.post('/:id/claim',requireActor,staffOnly,(req,res)=>controller.claim(req,res));
  router.post('/:id/withdraw',requireActor,(req,res)=>controller.withdraw(req,res));
  router.post('/:id/support',requireActor,(req,res)=>controller.support(req,res));
  router.get('/user-upvotes', (req, res) => controller.getUserUpvotes(req, res));
  router.get('/', (req, res) => controller.getAll(req, res));
  const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:1,fields:15,fieldSize:20000}}).single('photo');
  router.post('/:id/resolve',requireActor,staffOnly,(req,res)=>{upload(req,res,error=>{if(error){res.status(400).json({error:error.code==='LIMIT_FILE_SIZE'?'La foto debe pesar como máximo 8 MB':'Adjunta una sola foto JPG, PNG o WEBP.'});return;}void controller.resolve(req,res);});});
  router.post('/',requireActor,(req,res)=>{upload(req,res,error=>{if(error){res.status(400).json({error:error.code==='LIMIT_FILE_SIZE'?'La foto debe pesar como máximo 8 MB':'No pudimos recibir la foto. Elige una sola imagen de hasta 8 MB'});return;}void controller.create(req,res);});});
  router.post('/:id/upvote', (req, res) => controller.toggleUpvote(req, res));
  router.patch('/:id/status', staffOnly, (req, res) => controller.updateStatus(req, res));
  router.patch('/:id/assign', adminOnly, (req, res) => controller.assignBrigade(req, res));
  router.delete('/:id', adminOnly, (req, res) => controller.delete(req, res));
  return router;
};


require('dotenv').config();
const {Pool}=require('pg');
const fs=require('node:fs');
const path=require('node:path');
const db=new Pool({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),user:process.env.DB_USER||'jose',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'tuxtla_incidencias'});
(async()=>{
 const action=process.argv[2]||'status';
 if(action==='migrate') {
  await db.query(fs.readFileSync(path.resolve(__dirname,'../../database/migrations/001_dispatch_outbox.sql'),'utf8'));
  console.log('Migración de despacho aplicada. No se encolaron reportes históricos.');
 } else if(action==='status') {
  console.log(JSON.stringify((await db.query('SELECT status,count(*)::int AS events FROM dispatch_outbox GROUP BY status ORDER BY status')).rows));
 } else if(action==='check') {
  const client=await db.connect();
  try {
   await client.query('BEGIN');
   const {PostgresReportRepository}=require('../dist/infrastructure/adapters/outbound/PostgresReportRepository.js');
   const {Report}=require('../dist/domain/entities/Report.js');
   const repo=new PostgresReportRepository(client);
   const report=await repo.create(new Report({title:'PRUEBA TRANSACCIONAL - NO ENVIAR',description:'Prueba con rollback',category:'BACHE',lat:16.753,lng:-93.1155,address:'Dirección de prueba'}));
   const result=await client.query('SELECT event_id,folio,payload FROM dispatch_outbox WHERE report_id=$1',[report.id]);
   if(result.rowCount!==1||result.rows[0].payload.category!=='BACHE') throw new Error('No se generó un evento atómico');
   if(!/^TX-\d{6,}$/.test(report.folio||'')) throw new Error('No se devolvió el folio persistente');
   if((await repo.findById(report.id)).folio!==report.folio) throw new Error('Folio inconsistente al consultar el reporte');
   if(!(await repo.findAll()).some(item=>item.id===report.id&&item.folio===report.folio)) throw new Error('El listado no conserva el folio');
   await client.query('ROLLBACK');
   console.log('OK: inserción y evento atómicos; prueba revertida sin crear reportes ni avisos.');
  } finally {await client.query('ROLLBACK');client.release();}
 } else throw new Error('Usar migrate, status o check');
})().catch(e=>{console.error('Error de despacho:',e.code||e.message);process.exitCode=1;}).finally(()=>db.end());

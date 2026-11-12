const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=require('path').resolve(__dirname,'../..'),b=root+'/backend';require(b+'/node_modules/dotenv').config({path:b+'/.env',quiet:true});
const {Pool}=require(b+'/node_modules/pg');const db=new Pool({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),user:process.env.DB_USER||'jose',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'tuxtla_incidencias'});
const id=crypto.randomUUID(),tg='999999999900000001',checks=[];
async function preview(text,user=tg){const r=await fetch('http://localhost:5678/webhook/tuxtla-consultar-v1',{method:'POST',headers:{'Content-Type':'application/json','X-Tuxtla-Webhook-Secret':process.env.N8N_DISPATCH_SECRET},body:JSON.stringify({schemaVersion:1,telegramUserId:user,chatId:user,text,previewOnly:true}),signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);return r.json();}
(async()=>{
 for(let i=0;i<20;i++){try{const r=await fetch('http://localhost:5678/healthz/readiness');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
 const denied=await fetch('http://localhost:5678/webhook/tuxtla-consultar-v1',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,403);checks.push('Webhook sin secreto rechazado (403)');
 await db.query("INSERT INTO users(id,name,username,role,password_hash,is_active,must_change_password) VALUES($1,'Prueba temporal de consulta',$2,'BRIGADISTA','invalid-not-a-login',true,false)",[id,'test.query.'+id.slice(0,8)]);
 await db.query('INSERT INTO telegram_brigade_links(user_id,telegram_user_id) VALUES($1,$2)',[id,tg]);
 const folio=(await db.query('SELECT folio FROM n8n_consulta.reportes LIMIT 1')).rows[0]?.folio;assert.ok(folio,'Se necesita un reporte existente');
 let r=await preview('/consultar '+folio);assert.equal(r.authorized,true);assert.equal(r.exists,true);assert.match(r.text,/Registro encontrado/);checks.push('Folio existente: encontrado y estado actual obtenido de PostgreSQL');
 r=await preview('/consultar TX-999999999999999999');assert.equal(r.exists,false);assert.match(r.text,/No existe/);checks.push('Folio inexistente: respuesta negativa');
 r=await preview("/consultar TX-000004' OR 1=1 --");assert.equal(r.exists,false);assert.match(r.text,/Escribe/);checks.push('Entrada malformada e intento de inyección: rechazados');
 r=await preview('/consultar '+folio,'999999999900000002');assert.equal(r.authorized,false);assert.equal(r.exists,false);checks.push('Telegram sin vínculo: no revela registros');
 await db.query('UPDATE users SET is_active=false WHERE id=$1',[id]);r=await preview('/consultar '+folio);assert.equal(r.authorized,false);checks.push('Cuenta desactivada: autorización revocada inmediatamente');
 const cred=JSON.parse(fs.readFileSync(root+'/n8n/.query-credentials.local.json'))[0].data;
 const reader=new Pool({...cred,host:'localhost',ssl:false});
 try{
  await reader.query('SELECT * FROM n8n_consulta.reportes LIMIT 1');
  await assert.rejects(()=>reader.query('SELECT password_hash FROM public.users'));
  await assert.rejects(()=>reader.query('DELETE FROM n8n_consulta.reportes WHERE false'));
  checks.push('Credencial de solo lectura: no puede consultar contraseñas ni eliminar reportes');
 }finally{await reader.end();}
 const {TelegramBrigadeWorker}=require(b+'/dist/infrastructure/adapters/inbound/TelegramBrigadeWorker');
 const calls=[];let routed=0;
 const api={call:async(method,body)=>{calls.push({method,body});return {};}};
 const worker=new TelegramBrigadeWorker(db,api,{}, {},'-1',{execute:async()=>{routed++;}});
 await worker.handleUpdate({update_id:1,message:{text:'/consultar '+folio,chat:{id:42,type:'private'},from:{id:42}}},123);assert.equal(routed,1);
 await worker.handleUpdate({update_id:2,message:{text:'/consultar '+folio,chat:{id:-1,type:'group'},from:{id:42}}},123);assert.equal(routed,1);
 checks.push('Recepción: comando privado dirigido a n8n; el grupo no revela consultas');
 const result={date:new Date().toISOString(),mode:'Consultas reales a n8n y PostgreSQL en vista previa; Telegram simulado, sin mensajes externos',checks,passed:checks.length};
 fs.writeFileSync(root+'/n8n/consulta-verificacion.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(async()=>{await db.query('DELETE FROM telegram_brigade_links WHERE user_id=$1',[id]).catch(()=>{});await db.query('DELETE FROM users WHERE id=$1',[id]).catch(()=>{});await db.end();});

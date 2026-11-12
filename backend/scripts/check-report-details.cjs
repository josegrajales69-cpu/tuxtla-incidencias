const root=require('node:path').resolve(__dirname,'../..');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const sharp=require(root+'/backend/node_modules/sharp');
const {Report}=require(root+'/backend/dist/domain/entities/Report');
const {REPORT_SITUATIONS}=require(root+'/backend/dist/domain/entities/ReportSituations');
const {LocalPhotoStorage,dispatchPhoto}=require(root+'/backend/dist/infrastructure/adapters/outbound/LocalPhotoStorage');
const {formatAlert}=require(root+'/n8n/format-alert.cjs');
process.loadEnvFile(root+'/backend/.env');
process.chdir(root+'/backend');
(async()=>{
 const catalog=await (await fetch('http://localhost:3001/api/reports/options')).json();
 console.log('Catalog response keys:',Object.keys(catalog));
 const base={title:'PRUEBA REVERTIDA',category:'FUGA_AGUA',situation:'ABUNDANTE',lat:16.753,lng:-93.1155,address:'Dirección de prueba'};
 const report=new Report({...base,priority:'BAJA'});
 assert.equal(report.priority,'ALTA');
 assert.throws(()=>new Report({...base,situation:'PROFUNDO'}));
 const image=await sharp({create:{width:2000,height:1200,channels:3,background:'#d7e7ef'}}).jpeg().toBuffer();
 const storage=new LocalPhotoStorage();
 await assert.rejects(()=>storage.save(Buffer.from('not a photo')));
 await assert.rejects(()=>storage.save(Buffer.alloc(8*1024*1024+1)));
 const url=await storage.save(image);
 try {
  const photo=await dispatchPhoto(url);assert.ok(photo);
  const meta=await sharp(Buffer.from(photo.data,'base64')).metadata();
  assert.equal(meta.width,1600);assert.equal(meta.exif,undefined);
  const pool=new (require(root+'/backend/node_modules/pg').Pool)({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   const {PostgresReportRepository}=require(root+'/backend/dist/infrastructure/adapters/outbound/PostgresReportRepository');
   const saved=await new PostgresReportRepository(client).create(new Report({...base,photoUrl:url}));
   const payload=(await client.query('SELECT payload FROM dispatch_outbox WHERE report_id=$1',[saved.id])).rows[0].payload;
   assert.equal(payload.priority,'ALTA');assert.equal(payload.situation,'ABUNDANTE');assert.equal(payload.photoUrl,url);
   const sample=JSON.parse(await fs.readFile(root+'/n8n/sample-event.json','utf8'));
   sample.data={...sample.data,...payload};
   const alert=formatAlert(sample);assert.equal(alert.priority,'ALTA');assert.match(alert.html,/Fuga abundante/);
   sample.data.situation='SIN_SUMINISTRO';sample.data.situationLabel='Falta de suministro';assert.match(formatAlert(sample).html,/Falta de suministro de agua/);
   await client.query('ROLLBACK');
  }finally{await client.query('ROLLBACK');client.release();await pool.end();}
  const jwt=require(root+'/backend/node_modules/jsonwebtoken');const {pool:authPool}=require(root+'/backend/dist/infrastructure/config/db');const testId=require('node:crypto').randomUUID();await authPool.query("INSERT INTO users(id,name,email,password_hash,role) VALUES($1,'Photo test',$2,'unused','CIUDADANO')",[testId,testId+'@example.invalid']);
  try{const login={token:jwt.sign({id:testId,ver:0},process.env.JWT_SECRET,{expiresIn:'5m'})};
  const invalid=new FormData();invalid.append('confirmDistinct','true');for(const [k,v]of Object.entries(base))invalid.append(k,String(v));invalid.append('photo',new Blob(['invalid'],{type:'image/jpeg'}),'invalid.jpg');
  const response=await fetch('http://localhost:3001/api/reports',{method:'POST',headers:{Authorization:`Bearer ${login.token}`},body:invalid});assert.equal(response.status,400);
  }finally{await authPool.query('DELETE FROM users WHERE id=$1',[testId]);await authPool.end();}

  console.log('OK: server priority, invalid category, photo validation/compression/metadata, transactional persistence/outbox, multipart rejection. All DB data rolled back.');
 }finally{await storage.remove(url);assert.equal(await dispatchPhoto(url),undefined);}
})().catch(e=>{console.error(e);process.exitCode=1;});

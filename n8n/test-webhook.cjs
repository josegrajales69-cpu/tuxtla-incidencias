
process.loadEnvFile(require('node:path').resolve(__dirname,'../backend/.env'));
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const url=process.env.N8N_DISPATCH_URL;
 const sample=JSON.parse(fs.readFileSync(path.join(__dirname,'sample-event.json'),'utf8'));
 sample.data.reportUrl='http://localhost:5173/?report='+sample.data.id;
 const denied=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sample),signal:AbortSignal.timeout(15000)});
 assert.ok([401,403].includes(denied.status),`Se esperaba rechazo sin autenticación; HTTP ${denied.status}`);
 const valid=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Tuxtla-Webhook-Secret':process.env.N8N_DISPATCH_SECRET},body:JSON.stringify(sample),signal:AbortSignal.timeout(40000)});
 assert.equal(valid.status,200);
 const result=await valid.json();assert.equal(result.mode,'preview');assert.equal(result.ok,false);assert.equal(result.eventId,sample.eventId);assert.equal(result.priority,'ALTA');assert.match(result.html,/Ver detalle en la web/);
 console.log(JSON.stringify({authenticationWithoutSecret:denied.status,authenticatedWebhook:valid.status,mode:result.mode,priority:result.priority,sentToTelegram:false}));
})().catch(e=>{console.error('Prueba local falló:',e.message);process.exitCode=1;});

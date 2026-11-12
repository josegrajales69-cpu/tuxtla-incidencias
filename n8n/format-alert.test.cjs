const {test}=require('node:test');
const assert=require('node:assert/strict');
const {formatAlert}=require('./format-alert.cjs');
const event=(category='BACHE', description='Bache frente a la escuela')=>({schemaVersion:1,event:'REPORT_CREATED',eventId:'a1111111-1111-4111-8111-111111111111',data:{id:'b2222222-2222-4222-8222-222222222222',folio:'TX-000123',category,title:'Incidente reportado',description,address:'Av. Central, Centro',coordinates:{latitude:16.753,longitude:-93.1155}}});
test('all seven map categories preserve their category',()=>{for(const category of ['BACHE','LUMINARIA','BASURA','ARBOL_CAIDO','FUGA_AGUA','DRENAJE','SEMAFORO']) assert.equal(formatAlert(event(category)).category,category);});
test('priority is a suggestion based on described risk',()=>{
 assert.equal(formatAlert(event('BACHE')).priority,'MEDIA');
 assert.equal(formatAlert(event('BASURA','Residuos acumulados')).priority,'BAJA');
 assert.equal(formatAlert(event('BASURA','Incendio en contenedor')).priority,'ALTA');
 assert.equal(formatAlert(event('DRENAJE','Alcantarilla sin tapa')).priority,'ALTA');
 assert.equal(formatAlert(event('DRENAJE','Drenaje abierto frente a escuela')).priority,'ALTA');
 assert.equal(formatAlert(event('FUGA_AGUA','Fuga de agua severa')).priority,'ALTA');
 assert.equal(formatAlert(event('ARBOL_CAIDO','Árbol bloquea avenida principal')).priority,'ALTA');
 assert.equal(formatAlert(event('FUGA_AGUA','No hay fuga severa')).priority,'POR CONFIRMAR');
});
test('does not invent missing address or missing severity',()=>{let e=event('FUGA_AGUA','Agua en la banqueta');delete e.data.address;let a=formatAlert(e);assert.match(a.html,/Dirección por confirmar/);assert.equal(a.priority,'POR CONFIRMAR');});
test('rejects malformed events, missing folio and out of area points',()=>{
 assert.throws(()=>formatAlert({}));
 for(const change of [{category:'OTRO'},{folio:'TX-fake'},{coordinates:{latitude:NaN,longitude:-93.1}},{coordinates:{latitude:19.4,longitude:-99.1}}]) {let e=event();Object.assign(e.data,change);assert.throws(()=>formatAlert(e));}
});
test('citizen HTML is escaped and cannot alter the message structure',()=>{const a=formatAlert(event('BACHE','<b>ALTA</b> & <a href="x">otro</a>'));assert.match(a.html,/&lt;b&gt;ALTA/);assert.ok(!a.html.includes('<a href="x">'));assert.equal(a.priority,'MEDIA');});
test('message remains short and does not send personal contact data',()=>{let e=event('BACHE','x'.repeat(10000));e.data.email='private@example.test';e.data.phone='123456789';const a=formatAlert(e);assert.ok(a.html.length<2000);assert.ok(!a.html.includes(e.data.email));assert.ok(!a.html.includes(e.data.phone));});

test('structured situation supplies priority and reason without guessing from prose',()=>{
 const e=event('FUGA_AGUA','No hay agua');Object.assign(e.data,{prioritySource:'structured-v1',situation:'ABUNDANTE',situationLabel:'Fuga abundante o inundación',priority:'ALTA',priorityReason:'Flujo abundante con riesgo de inundación.'});
 const a=formatAlert(e);assert.equal(a.priority,'ALTA');assert.match(a.html,/Situación/);assert.match(a.html,/Flujo abundante/);
 e.data.situation='SIN_SUMINISTRO';e.data.situationLabel='Falta de suministro';assert.match(formatAlert(e).html,/Falta de suministro de agua/);
 e.data.priority='INVALID';assert.throws(()=>formatAlert(e));
});

test('operational report link is safe and only uses the supplied public URL',()=>{
 const e=event();e.data.reportUrl='https://reportes.example.test/?report='+e.data.id;
 assert.match(formatAlert(e).html,/Ver detalle en la web/);
 for(const url of ['javascript:alert(1)','https://host.test/" onclick="bad','https://user:pass@host.test/?report='+e.data.id]){e.data.reportUrl=url;assert.ok(!formatAlert(e).html.includes('Ver detalle en la web'));}
});

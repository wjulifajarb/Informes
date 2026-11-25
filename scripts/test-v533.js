'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(js);
const nodes={};function elem(id){return nodes[id]??(nodes[id]={value:'',textContent:'',innerHTML:'',disabled:false,checked:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},replaceChildren(){},append(){}})}
const ctx={document:{getElementById:elem},console,Intl,Date,Map,Set,JSON,Option:function(text,value){return {text,value}},setTimeout(){},atob};vm.createContext(ctx);vm.runInContext(js,ctx);
const sheetRows=[{row:17,b:'Disponible para convocatoria 2027-I',e:'',c:1500000,f:null,cDisplay:'$ 1.500.000',fDisplay:''},
 {row:21,b:'Preaprobación Educamás',e:'Simulación con aprobación final empresa'},
 {row:24,b:'Preaprobados Educamás pendientes (BM/BO)',e:'Aprobados empresa pendientes (BN/BO)',c:2,f:1},
 {row:27,b:'(+) Matrículas BI: pendientes y pagados',e:'(+) Matrículas autorizadas (BI + BU)',c:2300000,f:1400000},
 {row:28,b:'(+) Gastos administrativos',e:'(+) Gastos administrativos',c:800000,f:400000},
 {row:31,b:'Solicitud de donación',e:'Saldo neto del fondo (disponible - compromisos)',c:1300000,f:400000},
 {row:37,b:'Informativo 2026-II - Estado de cartera'},
 {row:38,b:'(-) Pago de matrículas 2026-II',c:400000}];
function project(name,group,isGroup){return {name,group,isGroup,company:isGroup?'':name,sheet:'Proye-'+name,studentsSheet:'Estudiantes-'+name,financialRows:sheetRows,cells:{C17:1500000,C27:2300000,C28:800000,F27:1400000},unitFee:400000,cash:1500000,tuitionBase:2300000,feeBase:800000,donationBase:1300000,authorized:1400000,feeFinal:400000,balanceAfterApproval:400000,carteraTotal:500000,carteraCollected:100000,carteraPending:400000};}
const financial=[project('Grupo Falic','Grupo Falic',true),project('GWS','Grupo Falic',false),project('Reebok','Grupo Falic',false),project('Residere','Residere',true),project('Grupo Ventura','Grupo Ventura',true),project('Listos','Grupo Ventura',false)];
function person(key,group,company){return {key,row:3,name:'Estudiante '+key,group,company,type:'Antiguo',relation:'Empleado',role:'Analista',status:'Pre-aprobado',situation:'Continúa 2027-I',fund:'Activo',registered:true,preapproved:true,special:false,approved:false,paid:false,retired:false,graduated:false,notInscribed:false,notContinuing:false,financeAmount:1200000,paidFinal:null,approvalCompany:'',approvalEducation:'Pre aprobado educamás',finalStatus:''};}
const people=[person('GWS','Grupo Falic','GWS'),person('Reebok','Grupo Falic','Reebok'),person('Residere','Residere','Residere'),person('Listos','Grupo Ventura','Listos')];
const scopes=financial.map(f=>({name:f.name,hasStudents:true}));const data={rows:people,financialV34:{projections:financial},scopes,allRows:[],headers:[],updated:new Date().toISOString()};
ctx.mockData=data;vm.runInContext('base=mockData;view=base.rows;',ctx);
function commitScope(g,c){ctx.confirmG=g;ctx.confirmC=c;vm.runInContext('confirmedGroup=confirmG;confirmedCompany=confirmC;',ctx);}
// Filial: una sola compañía y proyección, jamás la filial hermana.
elem('group').value='Grupo Falic';elem('company').value='GWS';commitScope('Grupo Falic','GWS');
assert.deepEqual([...ctx.selectSource().map(x=>x.company)],['GWS']);
assert.deepEqual([...ctx.currentFinancial().map(x=>x.name)],['GWS']);
let doc=ctx.reportModel(ctx.selectSource(),ctx.currentFinancial(),'GWS',data,ctx.selectSource());
assert(!JSON.stringify(doc).includes('Reebok'),'El informe individual mezcló otra filial');
assert(!doc.pages.some(p=>/Desglose por empresa y filial/.test(p.title)),'No debe incluir desglose de filiales hermanas');
// Grupo: datos agrupados sólo de su grupo, con el fondo único (sin sumar GWS + Reebok en la portada).
elem('company').value='';commitScope('Grupo Falic','');
assert.equal(ctx.selectSource().length,2);
assert.deepEqual([...ctx.currentFinancial().map(x=>x.name)],['Grupo Falic']);
doc=ctx.reportModel(ctx.selectSource(),ctx.currentFinancial(),'Grupo Falic',data,ctx.selectSource());
assert(!JSON.stringify(doc).includes('Residere'),'Un grupo incluyó otra empresa independiente');
assert(doc.pages.some(p=>/Desglose por empresa y filial/.test(p.title)),'El grupo puede mostrar sus filiales');
// Sin grupo: empresa independiente, nunca otras empresas.
elem('group').value='Residere';elem('company').value='';commitScope('Residere','');
assert.deepEqual([...ctx.selectSource().map(x=>x.company)],['Residere']);
assert.deepEqual([...ctx.currentFinancial().map(x=>x.name)],['Residere']);
doc=ctx.reportModel(ctx.selectSource(),ctx.currentFinancial(),'Residere',data,ctx.selectSource());
assert(!doc.pages.some(p=>/Desglose por empresa y filial/.test(p.title)),'Empresa independiente recibió filiales');
assert(!JSON.stringify(doc).includes('Grupo Falic'));
// Validar descarga: un botón de "consolidado" NO puede ignorar selección de filial.
let exported=null,blob=null;ctx.mockScope={name:'GWS',scopeGroup:'Grupo Falic',scopeCompany:'GWS',rows:[people[0]],allRows:[]};
ctx.spyApi=async(action,params)=>{if(action==='data')return data;if(action==='scope')return ctx.mockScope;if(action==='export'){exported=params.payload;return {base64:Buffer.from('%PDF').toString('base64')};}throw Error('Unknown '+action);};
ctx.saveFile=(bytes,mime,filename)=>{blob={bytes,mime,filename}};
vm.runInContext('api=spyApi;fileBlob=saveFile;',ctx);
(async()=>{
  elem('group').value='Grupo Falic';elem('company').value='GWS';commitScope('Grupo Falic','GWS');await ctx.download('pdf',true);
  assert(exported,'No se envió informe');assert(blob,'No se guardó el archivo');
  assert(!JSON.stringify(exported).includes('Reebok'),'El botón consolidado ignoró la filial elegida');
  assert(exported.name.includes('GWS'),'Nombre incorrecto de informe');
  assert(!blob.filename.includes('Consolidado'),'Archivo individual mal etiquetado');
  // Filtro de estado debe impactar también el PDF de esa empresa.
  elem('studentStatus').value='Pagado';exported=null;await ctx.download('pdf',false);
  assert(exported);assert.equal(exported.pages.find(p=>p.title.includes('Resumen ejecutivo')).rows[1][1],0);
  // Empresa independiente como raíz sin filiales.
  elem('studentStatus').value='';elem('group').value='Residere';elem('company').value='';commitScope('Residere','');ctx.mockScope={name:'Residere',scopeGroup:'Residere',scopeCompany:'',rows:[people[2]],allRows:[]};exported=null;await ctx.download('pdf',true);
  assert(exported&&!JSON.stringify(exported).includes('Grupo Falic'));
  // Filial elegida, pero Google devolvió una persona ajena: debe bloquear la descarga.
  elem('group').value='Grupo Falic';elem('company').value='GWS';commitScope('Grupo Falic','GWS');ctx.mockScope={name:'GWS',scopeGroup:'Grupo Falic',scopeCompany:'GWS',rows:[people[1]],allRows:[]};
  exported=null;await ctx.download('pdf',true);assert.equal(exported,null,'Se exportaron estudiantes ajenos al alcance');
  // Verificación Apps Script con datos de origen F/G para root y filiales.
  const code=fs.readFileSync(path.join(root,'apps-script/Code.gs'),'utf8');
  const head=Array(84).fill('');Object.assign(head,{0:'Estado en el fondo',1:'Estado interno',4:'Estado',5:'Empresa',6:'Grupo',7:'Nombre',60:'Valor a Financiar',64:'Aprobación EducaMas',65:'Estado Aprobacion Empresa',66:'Status Final',72:'Vr. Final pago matricula'});
  const toSource=(p)=>{const r=Array(84).fill('');r[0]='Activo';r[4]=p.status;r[5]=p.group;r[6]=p.group===p.company?'':p.company;r[7]=p.name;r[11]=p.type;r[60]=p.financeAmount;return r;};
  class Sheet{constructor(name,source){this.name=name;this.source=source;}getName(){return this.name}getLastRow(){return this.source.length}getMaxRows(){return this.source.length}getLastColumn(){return this.name.startsWith('Proye-')?6:84}getRange(row,col,n,w){const out=Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>this.source[row+i-1]?.[col+j-1]??''));return {getValues:()=>out,getDisplayValues:()=>out.map(r=>r.map(v=>String(v??'')))}}}
  const sourceData=[Array(84).fill(''),head,...people.map(toSource)];const wrongInGws=[sourceData[0],head,toSource(people[0]),toSource(people[1])];
  const sheets=[new Sheet('Financiero2027-1',sourceData),new Sheet('Estudiantes-GWS',wrongInGws),new Sheet('Estudiantes-Residere',[sourceData[0],head,toSource(people[2])]),new Sheet('Proye-GWS',Array.from({length:46},()=>Array(6).fill(''))),new Sheet('Proye-Residere',Array.from({length:46},()=>Array(6).fill('')))];
  const ss={getSheetByName:(name)=>sheets.find(x=>x.name===name)||null,getSheets:()=>sheets};
  const sandbox={SpreadsheetApp:{openById:()=>ss},Utilities:{DigestAlgorithm:{SHA_256:'SHA256'},computeDigest:(_,x)=>[...crypto.createHash('sha256').update(x).digest()],base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url')},console};
  vm.createContext(sandbox);vm.runInContext(code,sandbox);
  const filial=sandbox.getScope_(ss,'GWS');assert.equal(filial.scopeGroup,'Grupo Falic');assert.equal(filial.scopeCompany,'GWS');assert.equal(filial.rows.length,1);assert.equal(filial.rows[0].company,'GWS');
  const independ=sandbox.getScope_(ss,'Residere');assert.equal(independ.scopeGroup,'Residere');assert.equal(independ.scopeCompany,'');assert.equal(independ.rows.length,1);
  console.log('V5.3.3 OK · filial aislada, grupo acotado, empresa sin grupo, descargas/CSV por alcance y verificación de fuente F/G');
})().catch(e=>{console.error(e);process.exitCode=1;});

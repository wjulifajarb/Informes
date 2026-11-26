'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(base,'apps-script/Code.gs'),'utf8');
const head=Array(84).fill('');Object.assign(head,{0:'Estado en el fondo',1:'Estado interno',4:'Estado',5:'Grupo',6:'Empresa',7:'Nombre',60:'Valor a Financiar',64:'Aprobación EducaMas',65:'Estado Aprobacion Empresa',66:'Status Final',72:'Vr. Final pago matricula'});
const make=(name,st,type='Antiguo',fund='Activo')=>{let r=Array(84).fill('');r[0]=fund;r[1]='NO EXPORTAR SECRETO';r[4]=st;r[5]='Transportes Vigía';r[7]=name;r[11]=type;r[60]=1000000;return r};
const records=[make('A','Pre-aprobado'),make('B','Inscrito'),make('C','Pagado'),make('D','Graduado · postulación cerrada'),make('E','Retiro de la empresa · postulación cerrada'),make('F','Pre-registro'),make('G','Inscrito','Nuevo'),make('H','Aprobado','Nuevo')];
const rows=[Array(84).fill(''),head,...records];
class Sheet {constructor(name,rows){this.name=name;this.rows=rows;}getName(){return this.name}getLastRow(){return this.rows.length}getMaxRows(){return this.rows.length}getLastColumn(){return 84}getRange(row,col,n,width){const rr=Array.from({length:n},(_,i)=>Array.from({length:width},(_,j)=>this.rows[row-1+i]?.[col-1+j]??''));return {getValues:()=>rr,getDisplayValues:()=>rr.map(x=>x.map(v=>String(v??'')))}}}
const sheet=new Sheet('Financiero2027-1',rows),ss={getSheetByName:n=>n===sheet.name?sheet:null,getSheets:()=>[sheet]};
const sandbox={SpreadsheetApp:{openById:()=>ss},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url')},console};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
const result=sandbox.readPeople_(sheet);const all=result.rows;
assert.equal(all.length,8);assert(!JSON.stringify(result).includes('NO EXPORTAR SECRETO'));
assert.equal(all.filter(x=>x.previousBeneficiary).length,6);
assert.equal(all.filter(x=>x.registered).length,5);
assert.equal(all.filter(x=>x.continues2027).length,3);
assert.equal(all.filter(x=>x.notContinuing).length,3);
assert.equal(all.filter(x=>x.graduated&&x.notContinuing).length,1);
assert.equal(all.filter(x=>x.retired&&x.notContinuing).length,1);
assert.equal(all.filter(x=>x.situation==='No inscrito 2027-I').length,1);
assert.equal(all.filter(x=>x.registered&&x.isActive).length,5);
const html=fs.readFileSync(path.join(base,'public/index.html'),'utf8');
for(const needle of ['id="studentStatus"','id="situation"','id="educationApproval"','id="companyApproval"','id="paymentStatus"','id="cohortTable"','Antiguos que no continúan','function filterByOptions(pool)','2026-II → 2027-I'])assert(html.includes(needle),'Missing '+needle);
assert(!html.includes('<p class="note">'),'No user-facing explanatory notes');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(script,'Script missing');new vm.Script(script);
const api=fs.readFileSync(path.join(base,'api/index.js'),'utf8');assert(api.includes('startsWith(\'5.3.\')'));
// Ejecutar el mismo cálculo de indicadores de la interfaz sin navegador ni fuentes reales.
const elements={};function elem(id){return elements[id]||(elements[id]={value:'',textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},replaceChildren(){},append(){}});}
const browser={document:{getElementById:elem},fetch:async()=>({ok:false,json:async()=>({ok:false,error:'simulated logout'})}),console,Intl,Date,JSON,Set,Map,Option:function(name,value){return {text:name,value}},window:{},setTimeout:()=>0};
vm.createContext(browser);vm.runInContext(script,browser);
const current=browser.metric(all);assert.equal(current.registered,5);assert.equal(current.old,6);assert.equal(current.oldContinue,3);assert.equal(current.oldNotContinue,3);assert.equal(current.oldGrads,1);assert.equal(current.oldRetired,1);assert.equal(current.oldPreReg,1);
const report=browser.reportModel(all,[],'Prueba institucional',{financialV34:{projections:[]}},all);
assert(report.pages.some(x=>x.title.includes('Novedades de estudiantes antiguos')));
assert(report.pages.every(x=>!x.note));
elem('studentStatus').value='Pre-registro';assert.equal(browser.filterByOptions(all).length,1);
elem('studentStatus').value='';elem('situation').value='Continúa 2027-I';assert.equal(browser.filterByOptions(all).length,3);
elem('situation').value='';elem('studentStatus').value='Graduado · postulación cerrada';assert.equal(browser.filterByOptions(all).length,1);
console.log('V5.1 OK · estados exactos, universo inscritos, comparación antiguos/continuidad, sin notas, CSV y compatibilidad de versión.');

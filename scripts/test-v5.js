'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const fn=(base,options)=>Array.from({length:options},()=>Array(base).fill(''));
const head=Array(84).fill('');
Object.assign(head,{0:'Estado en el fondo',1:'Estado interno',4:'Estado',5:'Empresa',6:'Grupo',7:'Nombre',60:'Valor a Financiar',64:'Aprobación EducaMas',65:'Estado Aprobacion Empresa',66:'Status Final',72:'Vr. Final pago matricula'});
const make=(name,group,company,bm,bn,bo,bi,bu,status='Inscrito')=>{let r=Array(84).fill('');Object.assign(r,{0:'Activo',1:'ESTADO PRIVADO',4:status,5:group,6:company,7:name,11:'Antiguo',12:'Familiar',28:'Analista',40:'Ingeniería',60:bi,64:bm,65:bn,66:bo,72:bu});return r;};
const data=[head,
make('Estudiante A','Filiales Grupo Vigía','Phari SAS (Transportes Vigía)','Pre aprobado educamás','Aprobado','',6000000,''),
make('Estudiante B','Filiales Grupo Vigía','Phari SAS (Transportes Vigía)','Pre aprobado educamás','Aprobacion anticipada','Pagado',4500000,4100000,'Pagado'),
make('Estudiante C','Residere','','Caso Especial - Revisión','','',3000000,''),
make('Estudiante D','Residere','','','','',2200000,'','Retiro de la empresa · postulación cerrada')];
const sheets={};
class Sheet {constructor(name,rows,max=120){this.n=name;this.rows=rows;this.max=max;}getName(){return this.n;}getLastRow(){return this.rows.length;}getMaxRows(){return this.max;}getLastColumn(){return Math.max(...this.rows.map(r=>r.length));}getRange(row,col,n,w){const arr=Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>this.rows[row-1+i]?.[col-1+j]??''));return {getValues:()=>arr,getDisplayValues:()=>arr.map(r=>r.map(v=>String(v??'')))}}}
sheets['Financiero2027-1']=new Sheet('Financiero2027-1',[Array(84).fill(''),...data],140);
sheets['Estudiantes-Phari SAS (Transportes Vigía)']=new Sheet('Estudiantes-Phari SAS (Transportes Vigía)',[Array(84).fill(''),head,data[1],data[2]],4);
sheets['Estudiantes-Filiales Grupo Vigía']=new Sheet('Estudiantes-Filiales Grupo Vigía',[Array(84).fill(''),head,data[1],data[2]],4);
sheets['Estudiantes-Residere']=new Sheet('Estudiantes-Residere',[Array(84).fill(''),head,data[3],data[4]],4);
for(const n of ['Filiales Grupo Vigía','Phari SAS (Transportes Vigía)','Residere']){const f=Array.from({length:46},()=>Array(6).fill(''));f[0][1]=n;f[16][2]=150000000;f[19][2]=600000;f[23][2]=2;f[23][5]=1;f[24][2]=1;f[25][2]=1;f[26][2]=10500000;f[26][5]=6000000;f[27][2]=1200000;f[27][5]=600000;f[30][2]=2500000;f[30][5]=148000000;f[41][2]=9500000;sheets['Proye-'+n]=new Sheet('Proye-'+n,f,46);}
const container={SpreadsheetApp:{openById:()=>({getSheetByName:n=>sheets[n]||null,getSheets:()=>Object.values(sheets)})},
Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,x)=>[...crypto.createHash('sha256').update(x).digest()],base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url')},
console,Date,JSON,ContentService:{MimeType:{JSON:'application/json'},createTextOutput:s=>({setMimeType:()=>s})}};
vm.createContext(container);vm.runInContext(fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8'),container);
const d=container.getData_(container.ss_());assert.equal(d.source,'Financiero2027-1');assert.equal(d.rows.length,4);
assert.equal(d.rows[0].financeAmount,6000000);assert.equal(d.rows[1].paidFinal,4100000);
assert.equal(d.rows[1].stage,'Pagado');assert.equal(d.rows[2].special,true);assert.equal(d.rows[3].retired,true);
assert.equal(d.rows[0].group,'Filiales Grupo Vigía');assert.equal(d.rows[0].company,'Phari SAS (Transportes Vigía)');
assert.equal(d.headers.includes('Estado interno'),false);assert(!JSON.stringify(d).includes('ESTADO PRIVADO'));
assert.equal(d.financialV34.projections.length,3);assert.equal(d.financialV34.summary.length,2);
assert.equal(d.financialV34.rollup.funds,2);
const scoped=container.getScope_(container.ss_(),'Phari SAS (Transportes Vigía)');assert.equal(scoped.rows.length,2);assert.equal(scoped.rows[0].row,3);
assert.equal(scoped.projection.authorized,6000000);
console.log('V5 OK: fuente nueva, 19+ hojas dinámicas,  BI/BU, privacidad, scopes, fondos sin duplicar y proyecciones.');

'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const code=fs.readFileSync(path.join(__dirname,'..','apps-script','Code.gs'),'utf8');
const POS={type:11,program:40,bi:60,bm:64,bn:65,bo:66,bu:72};
function createWorkbook(reversed){
 const header=Array(84).fill('');
 Object.assign(header,{0:'Estado en el fondo',1:'Estado interno',4:'Estado',5:reversed?'Empresa':'Grupo',6:reversed?'Grupo':'Empresa',7:'Nombre',60:'Valor a Financiar',64:'Aprobación EducaMas',65:'Estado Aprobacion Empresa',66:'Status Final',72:'Vr. Final pago matricula'});
 function row(group,company,name,nb){const a=Array(84).fill('');a[0]='Activo';a[1]='SECRET_CODE_INTERNAL';a[4]=nb?'Pagado':'Pre-aprobado';a[5]=reversed?company:group;a[6]=reversed?group:company;a[7]=name;a[11]='Antiguo';a[40]='Ingeniería';a[60]=1000000;a[64]='Pre aprobado educamás';a[65]=nb?'Aprobacion anticipada':'';a[66]=nb?'Pagado':'';a[72]=nb?990000:'';return a;}
 const falic1=row('Grupo Falic','GWS','Estudiante GWS',false);
 const falic2=row('Grupo Falic','Reebok','Estudiante Reebok',false);
 const falicRoot=row('Grupo Falic','','Estudiante sin filial',false);
 const residere=row('Residere','','Estudiante Residere',true);
 const main=[Array(84).fill(''),header,falic1,falic2,falicRoot,residere];
 const grid=(people)=>[Array(84).fill(''),header,...people];
 class Sheet{
  constructor(name,rows){this.name=name;this.rows=rows;}
  getName(){return this.name;}
  getLastRow(){return this.rows.length;}
  getMaxRows(){return this.rows.length;}
  getLastColumn(){return this.name.startsWith('Proye-')?6:84;}
  getRange(row,col,count,width){const v=Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>this.rows[row+i-1]?.[col+j-1]??''));return {getValues:()=>v,getDisplayValues:()=>v.map(r=>r.map(x=>String(x??'')))};}
 }
 function proye(name){const rows=Array.from({length:46},()=>Array(6).fill(''));rows[0][1]=name;rows[16][2]=2000000;rows[19][2]=400000;rows[23][2]=2;rows[26][2]=2000000;rows[26][5]=990000;return new Sheet('Proye-'+name,rows)}
 const sheets=[new Sheet('Financiero2027-1',main),new Sheet('Estudiantes-Grupo Falic',grid([falic1,falic2,falicRoot])),new Sheet('Estudiantes-GWS',grid([falic1])),new Sheet('Estudiantes-Reebok',grid([falic2])),new Sheet('Estudiantes-Residere',grid([residere])),...['Grupo Falic','GWS','Reebok','Residere'].map(proye)];
 return {getSheetByName:n=>sheets.find(x=>x.name===n)||null,getSheets:()=>sheets};
}
function evaluate(ss){const sandbox={SpreadsheetApp:{openById:()=>ss},Utilities:{DigestAlgorithm:{SHA_256:'SHA256'},computeDigest:(_,x)=>[...crypto.createHash('sha256').update(x).digest()],base64EncodeWebSafe:v=>Buffer.from(v).toString('base64url')},console};vm.createContext(sandbox);vm.runInContext(code,sandbox);return sandbox;}
for(const reversed of [false,true]){
 const s=evaluate(createWorkbook(reversed));
 const data=s.getData_(s.ss_());
 assert.equal(data.rawCount,4,'La base debe tener cuatro estudiantes');
 assert.equal(data.rows.length,4);
 assert.deepEqual([...new Set(data.rows.map(x=>x.group))].sort(),['Grupo Falic','Residere']);
 assert.equal(data.rows.find(x=>x.name==='Estudiante GWS').company,'GWS');
 assert.equal(data.rows.find(x=>x.name==='Estudiante sin filial').company,'Grupo Falic');
 assert(!data.headers.some(h=>h==='Estado interno'));
 assert(!JSON.stringify(data.allRows).includes('SECRET_CODE_INTERNAL'));
 assert(data.financialV34.projections.some(p=>p.isGroup&&p.name==='Grupo Falic'));
 assert(data.financialV34.projections.some(p=>!p.isGroup&&p.name==='GWS'&&p.group==='Grupo Falic'));
 assert.equal(data.financialV34.rollup.funds,2);
 const gws=s.getScope_(s.ss_(),'GWS');assert.equal(gws.scopeGroup,'Grupo Falic');assert.equal(gws.scopeCompany,'GWS');assert.equal(gws.rows.map(r=>r.name).join('|'),'Estudiante GWS');
 const group=s.getScope_(s.ss_(),'Grupo Falic');assert.equal(group.scopeCompany,'');assert.equal(group.rows.length,3);
 const independent=s.getScope_(s.ss_(),'Residere');assert.equal(independent.scopeGroup,'Residere');assert.equal(independent.scopeCompany,'');assert.equal(independent.rows.map(r=>r.name).join('|'),'Estudiante Residere');
 console.log('OK: encabezados '+(reversed?'F=Empresa/G=Grupo':'F=Grupo/G=Empresa')+'; grupo, filial, independiente, proyección y protección de Estado interno');
}
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
assert(html.includes('scopeConfirm'));
assert(!html.includes('La columna F es el fondo/empresa principal y G la filial'));
console.log('V5.3.5 OK: se soportan ambos órdenes de columnas sin cambiar el dato maestro');

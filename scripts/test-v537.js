'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const gs=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
const sandbox={Utilities:{DigestAlgorithm:{SHA_256:'SHA256'},computeDigest:(_,x)=>[...crypto.createHash('sha256').update(x).digest()],base64EncodeWebSafe:x=>Buffer.from(x).toString('base64url')},console};
vm.createContext(sandbox);vm.runInContext(gs,sandbox);
const header=Array(84).fill('');
Object.assign(header,{0:'Estado en el fondo',1:'Estado interno',4:'Estado',5:'Grupo',6:'Empresa',7:'Nombre',11:'Tipo de estudiante Antiguo/Nuevo',60:'Categoría de cargo laboral',61:'Valor a Financiar',62:'Simulación Cuota',63:'Numero de Cuotas',64:'Capacidad de endeudamiento',65:'Aprobación EducaMas ',66:'Estado Aprobacion Empresa',67:'Status Final',68:'Fecha de Pago',69:'Vr. Inicial pago Matricula (sin descuentos)',70:'Tipo de descuento',71:'% de descuento',72:'Vr descuento',73:'Vr. Final pago matricula'});
function person(group,company,name,paid){const r=Array(84).fill('');r[0]='Activo';r[1]='NUNCA ENVIAR';r[4]=paid?'Pagado':'Pre-aprobado';r[5]=group;r[6]=company;r[7]=name;r[11]='Antiguo';r[60]='Administración';r[61]=paid?1900000:1800000;r[62]=420000;r[63]=6;r[64]=.0697;r[65]='Pre aprobado educamás';r[66]=paid?'Aprobacion anticipada':'';r[67]=paid?'Pagado':'';r[69]=paid?2100000:'';r[73]=paid?1950000:'';return r;}
const rows=[Array(84).fill(''),header,person('Residere','Residere','Estudiante pagado',true),person('Grupo Falic','GWS','Estudiante pendiente',false)];
const sheet={getName:()=> 'Financiero2027-1',getLastRow:()=>rows.length,getMaxRows:()=>rows.length,getLastColumn:()=>84,getRange(start,col,count,width){const grid=Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>rows[start+i-1]?.[col+j-1]??''));return{getValues:()=>grid,getDisplayValues:()=>grid.map(r=>r.map(x=>String(x??'')))}}};
let data=sandbox.readPeople_(sheet);assert.equal(data.rawCount,2);
let paid=data.rows.find(x=>x.paid);let pending=data.rows.find(x=>!x.paid);
assert.equal(paid.financeAmount,1900000);assert.equal(paid.approvalEducation,'Pre aprobado educamás');assert.equal(paid.approvalCompany,'Aprobacion anticipada');assert.equal(paid.finalStatus,'Pagado');assert.equal(paid.paidFinal,1950000);assert.equal(paid.paidInitial,2100000);assert.equal(paid.paidAmount,1950000);assert.equal(paid.debtCapacity,.0697);
assert.equal(pending.financeAmount,1800000);assert.equal(pending.paidFinal,null);assert.equal(pending.approvalCompany,'');assert.equal(pending.preapproved,true);assert.equal(pending.group,'Grupo Falic');assert.equal(pending.company,'GWS');
assert(!JSON.stringify(data).includes('NUNCA ENVIAR'));
assert.equal(sandbox.ensureColumns_(header).approvalEducation,65);assert.equal(sandbox.ensureColumns_(header).finalStatus,67);assert.equal(sandbox.ensureColumns_(header).paidFinal,73);
const moved=header.slice();moved.splice(61,0,'Columna adicional');assert.equal(sandbox.ensureColumns_(moved).financeAmount,62);assert.equal(sandbox.ensureColumns_(moved).approvalEducation,66);assert.equal(sandbox.ensureColumns_(moved).paidFinal,74);
const wrong=header.slice();wrong[65]='Otra cosa';assert.throws(()=>sandbox.ensureColumns_(wrong),/Aprobación EducaMas/);
assert.equal(sandbox.API_VERSION,undefined); // V8 const lives lexically, not on sandbox global
assert(gs.includes("const API_VERSION = '5.3.7'"));
console.log('V5.3.7 OK: headers dinámicos con desplazamiento, 2 estudiantes, pagos, aprobación, porcentaje, confidencialidad y simulador.');

'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert(html.includes('id="scopeConfirm"'),'Debe existir botón de confirmación explícita');
assert(html.includes('Todo el grupo'),'Debe existir opción de grupo completo');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(script);
const elems={};
function el(id){return elems[id]??(elems[id]={value:'',textContent:'',innerHTML:'',disabled:false,checked:false,classList:{add(){},remove(){},toggle(){}},closest(){return {classList:{toggle(){}}}},addEventListener(){},replaceChildren(...children){this.options=children;},append(){}})}
const ctx={document:{getElementById:el},console,Intl,Date,Map,Set,JSON,Option:function(text,value){return {text,value}},setTimeout(){},atob};
vm.createContext(ctx);vm.runInContext(script,ctx);
const labels=[{row:21,b:'Preaprobación Educamás',e:'Simulación con aprobación final empresa'}];
function project(name,group,isGroup){return {name,group,isGroup,company:isGroup?'':name,sheet:'Proye-'+name,studentsSheet:'Estudiantes-'+name,financialRows:labels,unitFee:300000,cash:8000000,tuitionBase:500000,feeBase:300000,authorized:500000,feeFinal:300000,balanceAfterApproval:7200000,carteraTotal:500000,carteraCollected:100000,carteraPending:400000};}
function person(name,group,company){return {key:name,row:4,name,group,company,type:'Nuevo',relation:'Empleado',role:'Analista',status:'Inscrito',situation:'Continúa 2027-I',fund:'Activo',registered:true,preapproved:false,special:false,approved:false,paid:false,retired:false,graduated:false,notInscribed:false,notContinuing:false,financeAmount:1200000,paidFinal:null,finalStatus:''};}
const rows=[person('Alumno GWS','Grupo Falic','GWS'),person('Alumno Reebok','Grupo Falic','Reebok'),person('Alumno Residere','Residere','Residere'),person('Alumno Listos','Grupo Ventura','Listos')];
const projections=[project('Grupo Falic','Grupo Falic',true),project('GWS','Grupo Falic',false),project('Reebok','Grupo Falic',false),project('Residere','Residere',true),project('Grupo Ventura','Grupo Ventura',true),project('Listos','Grupo Ventura',false)];
const data={apiVersion:'5.3.3',rows,financialV34:{projections},scopes:projections.map(p=>({name:p.name,hasStudents:true})),allRows:[],headers:[],updated:new Date().toISOString()};
ctx.fixture=data;vm.runInContext('base=fixture;view=base.rows;',ctx);
// Las listas contienen la raíz y sus empresas hijas, sin asignar un grupo artificial a Residere.
ctx.prepareSelects();
assert.equal(ctx.groups().includes('Residere'),true);
assert.equal(ctx.currentGroup(),'');assert.equal(ctx.currentCompany(),'');
assert.equal(ctx.selectSource().length,4);
el('group').value='Grupo Falic';ctx.buildCompany();el('company').value='GWS';
ctx.updateScopeStatus();
assert.equal(ctx.hasPendingScope(),true);assert.equal(ctx.selectSource().length,4,'Cambiar selector no debe cambiar todavía el informe');
assert.equal(el('quickPdf').disabled,true,'Bloquear exportar antes de confirmar');
assert(el('scopeStatus').textContent.includes('sin confirmar'));
ctx.renderN=0;ctx.mockApi=async(action,args)=>{if(action==='scope'){
const name=args.scope,p=projections.find(p=>p.name===name);return {name,scopeGroup:p.group,scopeCompany:p.isGroup?'':p.name,rows:rows.filter(r=>r.group===p.group&&(p.isGroup||r.company===p.name))};}
if(action==='data')return data;
throw Error('Mock API '+action);
};
vm.runInContext('api=mockApi;render=()=>{renderN++}',ctx);
(async()=>{
 await ctx.confirmScope();
 assert.equal(ctx.currentGroup(),'Grupo Falic');assert.equal(ctx.currentCompany(),'GWS');
 assert.deepEqual(ctx.selectSource().map(r=>r.company),['GWS']);
 assert.deepEqual(ctx.currentFinancial().map(r=>r.name),['GWS']);
 assert.equal(el('quickPdf').disabled,false);
 assert(el('scopeStatus').textContent.includes('Alcance confirmado'));
 // Elegir Todo el grupo no hace efecto hasta pulsar Confirmar.
 el('company').value='';ctx.updateScopeStatus();
 assert.deepEqual(ctx.selectSource().map(r=>r.company),['GWS']);
 await ctx.confirmScope();
 assert.equal(ctx.currentCompany(),'');assert.equal(ctx.selectSource().length,2);
 assert.deepEqual(ctx.currentFinancial().map(r=>r.name),['Grupo Falic']);
 // Empresa sin grupo se maneja de forma independiente.
 el('group').value='Residere';ctx.buildCompany();assert.equal(el('company').disabled,true);await ctx.confirmScope();
 assert.deepEqual(ctx.selectSource().map(r=>r.company),['Residere']);
 assert.deepEqual(ctx.currentFinancial().map(r=>r.name),['Residere']);
 // Vuelta a global únicamente tras confirmar o Restablecer filtros.
 el('group').value='';ctx.buildCompany();assert.equal(ctx.currentGroup(),'Residere');await ctx.confirmScope();
 assert.equal(ctx.currentGroup(),'');assert.equal(ctx.selectSource().length,4);
 assert.deepEqual(ctx.currentFinancial().map(r=>r.name).sort(),['Grupo Falic','Grupo Ventura','Residere']);
 assert(ctx.renderN>=4);
 // Restablecer filtros retorna a la vista global, sin esperar otra confirmación.
 el('group').value='Grupo Ventura';ctx.buildCompany();el('company').value='Listos';await ctx.confirmScope();
 await el('clearFilters').onclick();assert.equal(ctx.currentGroup(),'');assert.equal(ctx.currentCompany(),'');assert.equal(ctx.selectSource().length,4);
 console.log('V5.3.4 OK · seleccionar, confirmar, todo el grupo, filial, empresa independiente y global sincronizados');
})().catch(e=>{console.error(e);process.exitCode=1});

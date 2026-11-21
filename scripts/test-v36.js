'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/index.html','utf8');
const js=src.split('<script>')[1].split('</script>')[0];
const cut=js.indexOf("$('kpis').addEventListener");
const extra=js.indexOf('// V3.5 | Informe financiero');
const end=js.indexOf("$('loginForm').onsubmit",extra);
assert(cut>0&&extra>cut&&end>extra);
const dom={fields:new Map(),getElementById(id){if(!this.fields.has(id))this.fields.set(id,{value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},querySelector(){return null},querySelectorAll(){return []}});return this.fields.get(id)}};
const ctx=vm.createContext({document:dom,console,Intl,Date,Set,Map});
vm.runInContext(js.slice(0,cut)+js.slice(extra,end),ctx);
const base=[
 {row:3,key:'k1',group:'Filiales Grupo Vigía',company:'Pharitech',isActive:true,fund:'Activo',status:'Pre-aprobado',stage:'Preaprobado',paid:false,name:'Persona A',doc:'111',type:'Antiguo',relation:'Empleado',role:'Analista',motivation:'crecimiento_profesional',tuition:3000000,program:'Tecnología',university:'IES A'},
 {row:4,key:'k2',group:'Filiales Grupo Vigía',company:'Pharitech',isActive:true,fund:'Activo',status:'Inscrito',stage:'Inscrito',paid:false,name:'Persona B',doc:'222',type:'Nuevo',relation:'Empleado',role:'Auxiliar',motivation:'calidad_vida',tuition:2000000,program:'Técnico',university:'IES B'},
 {row:5,key:'k3',group:'Filiales Grupo Vigía',company:'Phari SAS',isActive:true,fund:'Activo',status:'Registro',stage:'Registro / pre-registro',paid:false,name:'Persona C',doc:'333',type:'Nuevo',relation:'Sin dato',role:'Sin dato',motivation:'Sin dato',tuition:0},
 {row:6,key:'k4',group:'Filiales Grupo Vigía',company:'Phari SAS',isActive:false,fund:'Graduación',status:'Graduado',stage:'Cerrado',paid:false,name:'Persona D',doc:'444',type:'Antiguo',relation:'Empleado',role:'Analista',motivation:'Sin dato',tuition:1000000},
 {row:7,key:'k5',group:'Residere',company:'Residere',isActive:true,fund:'Activo',status:'Aprobado',stage:'Aprobado',paid:false,name:'Persona E',doc:'555',type:'Nuevo',relation:'Familiar',role:'Coordinador',motivation:'nuevas_habilidades',tuition:4000000}
];
const summaries=[
 {group:'Filiales Grupo Vigía',base:1,review:1,tuitionBase:3000000,tuitionReview:2000000,feeBase:782995,cash:null,donationBase:null,invalidTuitionCount:0,unitFee:782995,donationExpanded:null,validation:'Pendiente'},
 {group:'Residere',base:1,review:0,tuitionBase:4000000,tuitionReview:0,feeBase:782995,cash:2500000,donationBase:2282995,invalidTuitionCount:0,unitFee:782995,donationExpanded:null,validation:'Pendiente'}
];
// El consolidado oficial V3.8 requiere los siete fondos; este mock completa
// los otros cinco con histórico sin diligenciar para probar esa regla.
for (const group of ['Transportes Vigía','Grupo Falic','Grupo Ventura','Grupo Bergé Colombia','EducaMás']) {
  summaries.push({group,base:0,review:0,tuitionBase:0,tuitionReview:0,feeBase:0,cash:null,donationBase:null,invalidTuitionCount:0,unitFee:782995,donationExpanded:null,historyDataLoaded:false,validation:'Pendiente de diligenciar'});
}
const file={rows:base,headers:['Estado en el fondo','Estado','Empresa','Grupo','Nombre'],allRows:[],source:'JULI-2027-1',updated:'2026-11-21T12:00:00.000Z',finance:[],cartera:[],cuotas:[],novedades:[],duplicates:[],financialV34:{summary:summaries,history:[{group:'Residere',initial:3000000,donation2026:1000000,cash:2500000},{group:'Filiales Grupo Vigía',cash:null}],companies:[{group:'Filiales Grupo Vigía',company:'Pharitech',records:2,base:3000000,review:2000000},{group:'Residere',company:'Residere',records:1,base:4000000,review:0}],detail:[{group:'Filiales Grupo Vigía',company:'Pharitech',name:'Persona A',status:'Pre-aprobado',program:'Tecnología',tuition:3000000,base:3000000,review:0,note:'Valor utilizable'}],quotas:[]}};
vm.runInContext(`data=${JSON.stringify(file)};`,ctx);
assert.equal(vm.runInContext('metric(scoped()).f.length',ctx),3);
assert.equal(vm.runInContext('metric(scoped()).review.length',ctx),1);
assert.equal(vm.runInContext('segmentDefs.some(x=>x[0]==="review")',ctx),false);
assert.equal(src.includes('data-segment="review"'),false);
const all=vm.runInContext('buildExportReport("all")',ctx);
assert(all.pages.some(p=>p.title.includes('Estado actual del fondo · Residere')));
assert(all.pages.some(p=>p.title.includes('Estado actual del fondo · Filiales Grupo Vigía')));
assert(!JSON.stringify(all).includes('Estado interno (B)'));
assert(!JSON.stringify(all).includes('En revisión'));
assert(all.pages.some(p=>p.title.includes('detalle por grupo y empresa')));
dom.getElementById('group').value='Filiales Grupo Vigía';
const grp=vm.runInContext('buildExportReport("selected")',ctx);
assert(grp.pages.some(p=>p.title.includes('Caracterización de beneficiarios')));
assert(grp.pages.some(p=>p.title.includes('Pharitech · Detalle')));
assert(!grp.pages.some(p=>p.title.includes('Estado actual del fondo · Residere')));
dom.getElementById('company').value='Pharitech';
const emp=vm.runInContext('buildExportReport("selected")',ctx);
assert(emp.pages.some(p=>p.title.includes('Programas académicos y matrículas')));
assert(emp.pages.some(p=>p.title.includes('Datos académicos')||p.title.includes('Detalle de postulaciones')));
assert(!emp.pages.some(p=>p.title.includes('Estado actual del fondo · Residere')));
assert.equal(dom.getElementById('company').value,'Pharitech');
console.log('V3.6 verificada: definición de formalizados, privacidad, informe por grupo/filial y consolidado completo.');
Promise.all(['pdf','pptx'].map(async format=>{
  const result=await require('../api/report.js').exportReport(all,format);
  assert(result.base64.length>1000);
  assert(result.name.endsWith('.'+format));
})).then(()=>console.log('Informe consolidado V3.6 exportado a PDF y PPTX con datos ficticios.'))
  .catch(error=>{console.error(error);process.exitCode=1;});

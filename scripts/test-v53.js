'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(base,'public/index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(source,'No se encontró JavaScript de HTML');new vm.Script(source);
const elements={};function el(id){return elements[id]??(elements[id]={value:'',textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},replaceChildren(){},append(){}});}
const ctx={document:{getElementById:el},console,Intl,Date,Map,Set,JSON,Option:function(){},fetch:async()=>({ok:false,json:async()=>({ok:false})}),setTimeout:()=>0};
vm.createContext(ctx);vm.runInContext(source,ctx);
const labelB={6:'(+) Total Disponible 2026-I',17:'Disponible para convocatoria 2027-I',20:'Tarifa administrativa por persona (editable)',21:'Preaprobación Educamás',24:'Preaprobados Educamás pendientes (BM/BO)',25:'Casos especiales (BM)',26:'Pagados (BO)',27:'(+) Matrículas BI: pendientes y pagados',28:'(+) Gastos administrativos',31:'Solicitud de donación 2027-I sin proyección del diciembrel del 2026-2',38:'(-) Pago de matrículas 2026-II',45:'Indicador de cartera recuperada'};
const labelE={21:'Simulación con aprobación final empresa',24:'Aprobados empresa pendientes (BN/BO)',25:'Casos especiales aprobados (BM/BN)',26:'Pagados anticipadamente (BN/BO)',27:'(+) Matrículas autorizadas (BI + BU)',28:'(+) Gastos administrativos',31:'Saldo neto del fondo (disponible - compromisos)'};
const rows=[6,17,20,21,24,25,26,27,28,31,38,45].map(row=>({row,b:labelB[row]||'',e:labelE[row]||'',c:row===45?0.5:row===17?10000000:row===20?500000:row===27?8000000:row===28?1000000:row===24?3:row===25?1:row===26?1:null,f:row===27?3500000:row===28?1000000:row===24?1:row===25?0:row===26?1:row===31?5500000:null,cDisplay:row===45?'50%':'',fDisplay:''}));
const cells=Object.fromEntries(rows.flatMap(r=>[['C'+r.row,r.c],['F'+r.row,r.f]]));
const pro={name:'Residere',group:'Residere',company:'',isGroup:true,sheet:'Proye-Residere',studentsSheet:'Estudiantes-Residere',unitFee:500000,cash:10000000,base:3,special:1,paidCount:1,tuitionBase:8000000,feeBase:1000000,finalApproved:1,specialApproved:0,paidEarly:1,authorized:3500000,feeFinal:1000000,balanceAfterApproval:5500000,carteraRecoveredPct:.5,labels:{...Object.fromEntries(Object.entries(labelB).map(([k,v])=>['B'+k,v])),...Object.fromEntries(Object.entries(labelE).map(([k,v])=>['E'+k,v]))},cells,financialRows:rows};
const item=(key,name,extras)=>({key,name,group:'Residere',company:'Residere',status:'Pre-aprobado',type:'Antiguo',relation:'Empleado',role:'Profesional',registered:true,financeAmount:2400000,paidFinal:null,preapproved:false,special:false,approved:false,paid:false,finalStatus:'',approvalCompany:'',approvalEducation:'',situation:'Continúa 2027-I',fund:'Activo',...extras});
const people=[
 item('k1','Preaprobada',{preapproved:true,approvalEducation:'Pre aprobado educamás',financeAmount:2500000}),
 item('k2','Caso especial',{special:true,approvalEducation:'Caso Especial - Revisión',financeAmount:3000000}),
 item('k3','Anticipado pagado',{preapproved:true,approved:true,paid:true,approvalCompany:'Aprobacion anticipada',finalStatus:'Pagado',paidFinal:1900000,financeAmount:2500000,status:'Pagado'}),
 item('k4','Aprobada pendiente',{approved:true,approvalCompany:'Aprobado',financeAmount:1600000}),
 item('k5','Sin pago final',{paid:true,approved:true,finalStatus:'Pagado',paidFinal:null,financeAmount:2500000,status:'Pagado'})
];
ctx.__fixture={rows:people,financialV34:{projections:[pro]},scopes:[],headers:[],allRows:[]};vm.runInContext('base=__fixture;view=base.rows;',ctx);
let candidates=ctx.simCandidates();assert.equal(candidates.length,5,'Incluye pagados, casos especiales y preaprobados');
const keys=new Set(['k1','k2','k3','k4']);
const scenario=ctx.simulateSelection(candidates,keys,{fee:null,cash:null});
assert.equal(scenario.selected.length,4);assert.equal(scenario.paid,1);assert.equal(scenario.special,1);assert.equal(scenario.early,1);
assert.equal(scenario.tuition,9000000,'BI para tres pendientes + BU para un pagado');
assert.equal(scenario.fees,2000000,'Una tarifa por persona sin duplicaciones');assert.equal(scenario.net,-1000000);
const missing=ctx.simulateSelection(candidates,new Set(['k5']),{fee:null,cash:null});
assert.equal(missing.missingTuition.length,1);assert.equal(missing.tuition,null);assert.equal(missing.net,null);
assert.equal(ctx.financeLabel(pro,21,'E'),'Simulación con aprobación final empresa');
assert.equal(ctx.financeLabel(pro,24),'Preaprobados Educamás pendientes');
assert(!ctx.financeLabel(pro,27,'E').includes('BU'));
ctx.renderFinance();assert(el('financePanels').innerHTML.includes('Simulación con aprobación final empresa'));
assert(!el('allFinancialCells').innerHTML.includes('C24'));
assert(el('financePanels').innerHTML.includes('Matrículas autorizadas'));
ctx.renderSim();assert(el('simPeople').innerHTML.includes('Anticipado pagado'));
assert(el('simPeople').innerHTML.includes('Vr. Final pago matricula'));
const model=ctx.reportModel(people,[pro],'Residere',ctx.__fixture,people,keys);
assert(model.pages.some(p=>p.kind==='comparison'&&p.rightTitle==='Simulación con aprobación final empresa'));
assert(!model.pages.some(p=>p.title.includes('Detalle financiero completo')));
assert(!model.pages.some(p=>p.title.includes('Selección de estudiantes · escenario local')));
const comp=model.pages.find(p=>p.kind==='comparison');assert(comp.leftRows.some(r=>r[0]==='Preaprobados Educamás pendientes'));assert(comp.rightRows.some(r=>r[0].includes('Matrículas autorizadas')));
assert(!comp.rightRows.some(r=>r[0].includes('F27')));
const {layout}=require('../api/report');const drawn=layout(model);assert(drawn.length>=7);assert(drawn.every(p=>p.length>0));
const cartera=model.pages.find(p=>p.kind==='portfolio');
assert(cartera.leftRows.some(r=>r[0]==='Indicador de cartera recuperada'&&r[1]==='50%'));
assert(!cartera.rightTitle,'Sin panel de acuerdos en el archivo exportado');
const raw=fs.readFileSync(path.join(base,'apps-script/Code.gs'),'utf8');
assert(/const API_VERSION = '5\.3\.[01]';/.test(raw));assert(raw.includes('financialRows'));assert(raw.includes('getDisplayValues'));
const server=fs.readFileSync(path.join(base,'api/index.js'),'utf8');assert(server.includes("startsWith('5.3.')"));
console.log('V5.3 OK: etiquetas de Sheets, cifras financieras completas, simulación BI/BU incl. pagados, falta de valores, desglose por empresa, descarga nominal.');

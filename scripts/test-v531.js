'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script);new vm.Script(script);
const elements={};
function el(id){return elements[id]??(elements[id]={value:'',textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},replaceChildren(){},append(){}})}
const context={document:{getElementById:el},console,Intl,Date,Map,Set,JSON,Option:function(){},fetch:async()=>({ok:false,json:async()=>({ok:false})}),setTimeout:()=>0};
vm.createContext(context);vm.runInContext(script,context);
const people=[
 {key:'pre',name:'Preaprobado',group:'Transportes Vigía',company:'Transportes Vigía',preapproved:true,special:false,approved:false,paid:false,approvalEducation:'Pre aprobado educamás',approvalCompany:'',finalStatus:'',financeAmount:500,debtCapacity:900},
 {key:'esp',name:'Caso especial',group:'Transportes Vigía',company:'Transportes Vigía',preapproved:false,special:true,approved:false,paid:false,approvalEducation:'Caso Especial - Revisión',approvalCompany:'',finalStatus:'',financeAmount:450,debtCapacity:800},
 {key:'paid1',name:'Pago anticipado',group:'Transportes Vigía',company:'Transportes Vigía',preapproved:true,special:false,approved:true,paid:true,approvalEducation:'Pre aprobado educamás',approvalCompany:'Aprobacion anticipada',finalStatus:'Pagado',financeAmount:400,paidFinal:100,debtCapacity:750},
 {key:'paid2',name:'Pago final',group:'Transportes Vigía',company:'Transportes Vigía',preapproved:false,special:false,approved:true,paid:true,approvalEducation:'',approvalCompany:'Aprobado',finalStatus:'Pagado',financeAmount:400,paidFinal:200,debtCapacity:700}
];
const projection={name:'Transportes Vigía',group:'Transportes Vigía',company:'',isGroup:true,unitFee:50,cash:10000};
context.fixture={rows:people,financialV34:{projections:[projection]},scopes:[],headers:[],allRows:[]};
vm.runInContext('base=fixture;view=fixture.rows;selection=new Set();',context);
// Incluso con un filtro por etapa, los pagados de este fondo NO desaparecen del simulador.
el('studentStatus').value='Pre-aprobado';
context.renderSim();
assert.equal(context.simCandidates().length,4);
assert.equal(vm.runInContext('selection.size',context),2);
assert(vm.runInContext('selection.has("paid1") && selection.has("paid2")',context));
assert(!vm.runInContext('selection.has("pre") || selection.has("esp")',context));
const markup=el('simPeople').innerHTML;
for(const name of ['Nombre del estudiante','Aprobación EducaMas','Estado Aprobacion Empresa','Status Final','Valor a Financiar','Capacidad de endeudamiento','Vr. Final pago matricula','Tarifa administrativa'])assert(markup.includes(name),name);
assert(markup.includes('disabled title="Pagado incluido automáticamente"'));
assert(markup.includes('900') && markup.includes('750'));
assert(markup.includes('Preaprobado') && markup.includes('Caso especial') && markup.includes('Pago anticipado'));
const auto=context.simulateSelection(context.simCandidates(),new Set(['paid1','paid2']),{fee:null,cash:null});
assert.equal(auto.tuition,300,'El pagado usa BU, no BI');assert.equal(auto.fees,100,'Fee por los dos pagados');assert.equal(auto.total,400);
// El botón de limpiar conserva pagados y permite seguir escogiendo BM.
el('selectNone').onclick();assert.equal(vm.runInContext('selection.size',context),2);
vm.runInContext('selection.add("pre");selection.add("esp")',context);context.renderSim();
const complete=context.simulateSelection(context.simCandidates(),new Set(['paid1','paid2','pre','esp']),{fee:null,cash:null});
assert.equal(complete.tuition,1250);assert.equal(complete.fees,200);assert.equal(complete.total,1450);
// El Apps Script extrae BL por columna 64 (índice 63), sin editar el libro.
const gs=fs.readFileSync(path.join(root,'apps-script/Code.gs'),'utf8');
assert(gs.includes('capacityDebt:63'));
assert(gs.includes('debtCapacity:n(POS.capacityDebt)'));
assert(gs.includes("const API_VERSION = '5.3.1'"));
const api=fs.readFileSync(path.join(root,'api/index.js'),'utf8');assert(api.includes("startsWith('5.3.')"));
console.log('V5.3.1 OK: preaprobados/casos con checkbox, pagos BI/BU + fee automáticos, BL visible, estados BM BN BO, sin cambios al resto.');

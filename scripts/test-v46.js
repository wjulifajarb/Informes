'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {layout,exportReport}=require('../api/report');
const html=fs.readFileSync('public/index.html','utf8');
const begin=html.indexOf('function paidCostsV46(');
const end=html.indexOf('function renderFinV34(){',begin);
assert(begin>=0&&end>begin);
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const context={norm,data:{financialV34:{summary:[
 {group:'Transportes Vigía',unitFee:782995},
 {group:'Grupo Bergé Colombia',unitFee:614835}
]}}};
vm.createContext(context);
vm.runInContext(html.slice(begin,end),context);
function evalC(expr){return vm.runInContext(expr,context)};
const transport=[
 {group:'Transportes Vigía',company:'Vigía Central',name:'A',paidAmount:2700000,tuitionReference:3000000},
 {group:'Transportes Vigía',company:'Vigía Central',name:'B',paidAmount:2400000,tuitionReference:2600000}
];
const berge=[{group:'Grupo Bergé Colombia',company:'Bergé',name:'C',paidAmount:null,tuitionReference:4000000}];
context.paid=transport.concat(berge);
let a=evalC('paidCostsV46(paid.filter(x=>x.group===\'Transportes Vigía\'),782995)');
assert.equal(a.count,2);
assert.equal(a.fee,1565990);
assert.equal(a.tuitionReported,5100000);
assert.equal(a.totalToReconcile,6665990);
assert.equal(a.estimatedProvision,7165990);
assert.equal(a.missingPaid,0);
let b=evalC('paidCostsV46(paid.filter(x=>x.group===\'Grupo Bergé Colombia\'),614835)');
assert.equal(b.fee,614835);
assert.equal(b.totalToReconcile,null,'Sin pago BH no afirmar descuento completo');
assert.equal(b.estimatedProvision,4614835);
assert.equal(b.missingPaid,1);
let scope=evalC('paidCostsScopeV46(paid,data.financialV34.summary)');
assert.equal(scope.fee,2180825);
assert.equal(scope.totalToReconcile,null,'Una empresa sin BH deja el total consolidado pendiente');
assert.equal(scope.estimatedProvision,11780825);
context.paid=transport;
scope=evalC('paidCostsScopeV46(paid,data.financialV34.summary)');
assert.equal(scope.fee,1565990,'Grupo sin pagados no agrega gastos');
assert.equal(scope.totalToReconcile,6665990);
assert.equal(evalC('paidCostsV46([],null)').fee,0);
assert.equal(evalC('paidCostsV46([{paidAmount:0,tuitionReference:4000000}],782995)').totalToReconcile,null);
for (const term of [
 'Fee de las matrículas pagadas (tarifa por fondo)',
 'Total pagado + fee para conciliar/descontar',
 'Provisión estimada matrícula + fee',
 'Matrículas pagadas y fee por grupo · 2027-I',
 'Matrículas, pagos y administración por empresa',
 'Total pagado + fee a conciliar con el fondo'
]) assert(html.includes(term),'Falta bloque en UI / informe: '+term);
assert(html.includes('data.financialV34'),'Mantiene fuente Apps Script financiera');
assert(!html.includes("['review','En revisión']"));
const model={name:'Vigía (ejemplo ficticio)',pages:[
 {cover:true,title:'Convocatoria 2027-I'},
 {title:'Pagos reportados 2027-I',section:'05 / PAGOS REGISTRADOS',
  metrics:[['Estudiantes con matrícula marcada como pagada',3],
   ['Matrículas pagadas confirmadas (Finanzas)','$ 5.100.000'],
   ['Fee administrativo de estas matrículas','$ 2.180.825'],
   ['Total pagado + fee a conciliar con el fondo','Pendiente de conciliar'],
   ['Provisión estimada matrícula + fee','$ 11.780.825'],
   ['Pagados sin monto confirmado',1]],
  headers:['Fondo','Fee de pagados','Total'],rows:[['Vigía','$ 1.565.990','$ 6.665.990']]}
]};
(async()=>{
  const pp=layout(model);
  assert(pp.length>=2);
  const e=await exportReport(model,'pdf');
  const ppt=await exportReport(model,'pptx');
  assert(Buffer.from(e.base64,'base64').slice(0,4).toString()==='%PDF');
  assert(Buffer.from(ppt.base64,'base64').slice(0,2).toString()==='PK');
  console.log('V4.6 OK: fee por fondo, BH confirmado, provisión AY, empresa/grupo/consolidado, PDF/PPT y cifra larga.');
})().catch(e=>{console.error(e);process.exitCode=1});

'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../public/index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(source,'script found');new vm.Script(source);
const elements={},getElementById=id=>elements[id]??(elements[id]={value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},replaceChildren(){},append(){}});
const ctx={document:{getElementById},fetch:async()=>({ok:false,json:async()=>({ok:false})}),console,Intl,Date,JSON,Set,Map,Option:function(){},window:{},setTimeout:()=>0};
vm.createContext(ctx);vm.runInContext(source,ctx);
const raw=(name,state,extra={})=>({name,doc:name,group:'Residere',company:'Residere',type:'Antiguo',relation:'Familiar',role:'Auxiliar',status:state,situation:state,caseStatus:'',fund:'Activo',motivation:'Crecimiento',registered:true,preapproved:false,approved:false,paid:false,graduated:false,retired:false,notInscribed:false,notContinuing:false,...extra});
const rows=[
 raw('Alumno 1','Pre-aprobado',{preapproved:true,financeAmount:3500000}),
 raw('Alumno 2','Pagado',{paid:true,paidFinal:3450000,discountValue:50000,paidInitial:3500000,financeAmount:3500000,finalStatus:'Pagado'}),
 raw('Alumno 3','Graduado · postulación cerrada',{registered:false,graduated:true,notContinuing:true}),
 raw('Alumno 4','Inscrito',{type:'Nuevo',relation:'Empleado',role:'Administrativo'}),
];
const baseCells=Object.fromEntries([6,7,8,10,11,12,14,16,17,20,24,25,26,27,28,29,30,31,32,33,38,39,40,41,42,44,45,46].flatMap(n=>[['C'+n,null],['F'+n,null]]));
const financial={name:'Residere',group:'Residere',isGroup:true,sheet:'Proye-Residere',cells:baseCells,base:2,special:1,paidCount:1,tuitionBase:4500000,unitFee:782995,feeBase:2348985,finalApproved:1,specialApproved:0,paidEarly:1,authorized:3450000,feeFinal:1565990,carteraTotal:null,carteraCollected:null,carteraPending:null};
const model=ctx.reportModel(rows,[financial],'Residere',{financialV34:{projections:[financial]}},rows);
const pages=model.pages;
assert(pages.some(p=>p.title.includes('Caracterización de beneficiarios')&&p.headers[0]==='Dimensión'));
assert(pages.some(p=>p.title.includes('más valoran del beneficio')&&p.bars.length));
assert(pages.some(p=>p.title.includes('Embudo de convocatoria')&&p.bars.length===4));
assert(pages.some(p=>p.title.includes('Novedades de estudiantes antiguos')));
assert(pages.some(p=>p.kind==='fundSummary'));
assert(pages.some(p=>p.kind==='comparison'));
assert(pages.some(p=>p.kind==='portfolio'));
assert(pages.some(p=>p.title.includes('Pagos reportados')));
assert(!pages.some(p=>p.title.includes('ANEXO · Estudiantes y estado actual')));
assert(pages.every(p=>p.note===undefined));
const report=require('../api/report');const layout=report.layout(model);
assert(layout.length>=8);
assert(layout.every(p=>p.length>0));
const text=layout.map(p=>p.filter(o=>o.t==='t').map(o=>o.s).join(' '));
assert(text.some(t=>t.includes('CARACTERIZACIÓN')));
assert(text.some(t=>t.includes('PROYECCIÓN')));
assert(!text.some(t=>t.includes('JULI-2027-1')));
const pagesMoney=pages.find(p=>p.kind==='comparison');assert(pagesMoney.rightTitle==='Sin concepto'||pagesMoney.rightTitle==='Simulación con aprobación final empresa');
console.log(`V5.2 OK: ${pages.length} secciones, ${layout.length} páginas renderizadas, comparativa, cartera, sin notas ni fuentes antiguas.`);

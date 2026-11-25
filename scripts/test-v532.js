'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(script);new vm.Script(script);
const els={};function el(id){return els[id]??(els[id]={value:'',textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},replaceChildren(){},append(){}});}
const ctx={document:{getElementById:el},console,Intl,Date,Map,Set,JSON,Option:function(){},fetch:async()=>({ok:false,json:async()=>({ok:false})}),setTimeout:()=>0};vm.createContext(ctx);vm.runInContext(script,ctx);
const person={key:'1',row:3,name:'Estudiante demostrativo',group:'Transportes Vigía',company:'Transportes Vigía',type:'Antiguo',relation:'Empleado',role:'Auxiliar',status:'Pre-aprobado',situation:'Continúa 2027-I',fund:'Activo',registered:true,preapproved:true,special:false,approved:false,paid:false,graduated:false,retired:false,notInscribed:false,notContinuing:false,financeAmount:2500000,paidFinal:null,debtCapacity:0.06969696969696969,approvalEducation:'Pre aprobado educamás',approvalCompany:'',finalStatus:''};
const financial={name:'Transportes Vigía',group:'Transportes Vigía',company:'',sheet:'Proye-Transportes Vigía',isGroup:true,unitFee:782995,cash:30000000,tuitionBase:2500000,feeBase:782995,financialRows:[],cells:{C17:30000000,C24:1,C27:2500000,C28:782995,C38:1000000,C39:200000,C40:800000,C41:0,C42:800000,C44:500000,C45:0.625,C46:300000}};
ctx.fixture={rows:[person],financialV34:{projections:[financial]},scopes:[],headers:[],allRows:[]};vm.runInContext('base=fixture;view=fixture.rows;selection=new Set();',ctx);ctx.renderSim();
assert(el('simPeople').innerHTML.includes('6,97'));
assert(el('simPeople').innerHTML.includes('Capacidad de endeudamiento'));
const model=ctx.reportModel([person],[financial],'Transportes Vigía',ctx.fixture,[person],new Set(['1']));
const titles=model.pages.map(x=>x.title);
for(const banned of ['Cuotas y acuerdos 2027-I','Detalle financiero completo','Selección de estudiantes · escenario local','Acuerdos de pago 2027-I','ANEXO · Estudiantes y estado actual'])assert(!titles.some(x=>x.includes(banned)),banned);
const cartera=model.pages.find(x=>x.kind==='portfolio');assert(cartera);assert(!cartera.rightTitle);
for(const retained of ['Resumen ejecutivo','Caracterización','Embudo','Proyección Fondo Educativo','Estado de cartera','Pagos reportados'])assert(titles.some(x=>x.includes(retained)),retained);
// The removed content is only removed from exports, not from HTML render functions:
for(const marker of ['function renderSim(){','function renderFinance(){','function renderPortfolio(){','function renderPeople(){'])assert(html.includes(marker),marker);
const {layout}=require('../api/report.js');const shapes=layout(model);assert(shapes.length>0);
const text=shapes.flatMap(sh=>sh.filter(x=>x.t==='t').map(x=>x.s)).join(' ');
for(const banned of ['Cuotas y acuerdos 2027-I','Detalle financiero completo','Selección de estudiantes · escenario local','Acuerdos de pago 2027-I','ANEXO · Estudiantes y estado actual'])assert(!text.includes(banned),banned);
console.log('V5.3.2 OK: BL en %, exportaciones depuradas, tablas y simulador HTML preservados.');

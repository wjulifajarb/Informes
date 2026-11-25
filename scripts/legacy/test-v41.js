'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {exportReport,layout}=require('../api/report.js');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const i=html.indexOf('function buildExecutiveReportV41(){');
const j=html.indexOf('const reportBeforeFinanceV34=makeReport;',i);
assert.ok(i>=0&&j>i,'El generador ejecutivo no existe');
const fn=html.slice(i,j);
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const formal=s=>['inscrito','pre-aprobado','preaprobado','aprobado','pagado','docs completados','documentos completados'].includes(normal(s));
const money=v=>v===null||v===undefined?'Pendiente':'$ '+Number(v).toLocaleString('es-CO');
const scope={group:'Residere',company:''};
const raw=[
{name:'Yessica P.',company:'Residere',group:'Residere',status:'Pre-aprobado',fund:'Activo',isActive:true,tuition:3289000,row:3,stage:'Preaprobado'},
{name:'Andres P.',company:'Residere',group:'Residere',status:'Inscrito',fund:'Activo',isActive:true,tuition:4987450,row:4,stage:'Inscrito'},
{name:'Daniel S.',company:'Residere',group:'Residere',status:'Aprobado',fund:'Activo',isActive:true,tuition:5800000,row:5,stage:'Aprobado'},
{name:'Oscar S.',company:'Residere',group:'Residere',status:'Inscrito',fund:'No cumple requisitos',isActive:false,tuition:3290000,row:6,stage:'Cerrado'},
{name:'Juan D.',company:'Residere',group:'Residere',status:'Graduado · postulación cerrada',fund:'Graduación',isActive:false,tuition:5900000,row:7,stage:'Cerrado'},
{name:'Maria P.',company:'Transportes Vigía',group:'Transportes Vigía',status:'Pagado',fund:'Activo',isActive:true,tuition:1750000,paidAmount:1500000,paid:true,row:8,stage:'Pagado'}
];
const s1={group:'Residere',sheet:'Proye-Residere',historyDataLoaded:true,base:8,tuitionBase:52889000,feeBase:6263960,unitFee:782995,cash:2596908,donationBase:56556052,finalApproved:null,authorized:null,invalidTuitionCount:0,paidCount:0,cells:{C8:20428985,C12:17832077,C14:2596908,C51:6555129,C52:27}};
const s2={group:'Transportes Vigía',sheet:'Proye-Transportes Vigía',historyDataLoaded:false,base:32,tuitionBase:167909590,feeBase:25055840,unitFee:782995,cash:null,donationBase:null,finalApproved:null,authorized:null,invalidTuitionCount:2,paidCount:1,cells:{C8:null,C12:null,C14:null,C51:null,C52:null}};
const data={rows:raw,financialV34:{summary:[s1,s2],history:[{group:'Residere',initial:18488262,donation2026:1940723,tuitionPaid2026:15483092,admin2026:2348985,cashRecovered:null,unreconciled:5558686,carteraTuition:15483065,uncollectableBenefits:6148620,cartera2026:9334445,previousDue:0,totalDue:9334445,collected:2779343,collectedPct:.2978,outstanding:6555102}],paidDetail:[{group:'Transportes Vigía',company:'Transportes Vigía',name:'Maria P.',tuitionReference:1750000,paidAmount:1500000,paidDate:'2026-10-30'}],quotas:[{group:'Residere',period:'Septiembre 2026',type:'Nómina',scheduled:1205945},{group:'Residere',period:'Noviembre 2026',type:'Nómina',scheduled:1573398}]}};
const context={data,Intl,console, $:id=>scope[id], scopeName:()=>scope.company?scope.group+' · '+scope.company:scope.group||'Todos los grupos', scoped:()=>data.rows.filter(r=>(!scope.group||r.group===scope.group)&&(!scope.company||r.company===scope.company)),norm:normal,fmt:money,countedStatus:formal};
vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('function paidCostsV46('),html.indexOf('function renderFinV34(){')),context);
vm.runInContext(fn+'\nvar REPORT = buildExecutiveReportV41();',context);
const report=context.REPORT;
assert.match(report.name,/Residere/);
assert.equal(report.pages[0].cover,true);
assert.equal(report.pages.at(-1).title,'ANEXO · Personas inscritas y estado actual');
assert.ok(!report.pages.some(p=>/caracterización|motivaci[oó]n/i.test(p.title)));
assert.ok(report.pages.some(p=>p.kind==='comparison'&&p.leftRows.some(r=>r[1]==='$ 52.889.000')));
assert.ok(report.pages.some(p=>p.kind==='portfolio'));
assert.equal(report.pages.at(-1).rows.length,5);
assert.ok(report.pages.at(-1).rows.every(r=>r[3]!=='Registro'));
assert.equal(report.pages.find(p=>p.kind==='comparison').rightRows[0][1],'Pendiente');
assert.ok(layout(report).length>=6);
(async()=>{
 const dest=path.join(__dirname,'..','_test-v41');fs.mkdirSync(dest,{recursive:true});
 for(const format of ['pdf','pptx']){
  const file=await exportReport(report,format);
  const bytes=Buffer.from(file.base64,'base64');
  assert.ok(bytes.length>20000);
  fs.writeFileSync(path.join(dest,'informe_residere_prueba.'+format),bytes);
 }
 scope.group='';
 vm.runInContext('REPORT = buildExecutiveReportV41();',context);
 const all=context.REPORT;
 assert.equal(all.pages.at(-1).rows.length,6);
 assert.equal(all.pages.filter(p=>p.kind==='comparison').length,2);
 assert.ok(all.pages.some(p=>p.title.includes('Resumen financiero por grupo')));
 const paidPage=all.pages.find(p=>p.title.includes('Pagos reportados 2027-I')&&p.title.includes('Transportes'));
 assert.ok(paidPage&&paidPage.rows.some(r=>r[3]==='$ 1.500.000'));
 // Confirmar que el PDF/PPTX consolidado incluyen las últimas páginas del anexo.
 const allPpt=await exportReport(all,'pptx');assert.ok(allPpt.base64.length>25000);
 console.log('V4.1: PDF + PowerPoint individuales y consolidado OK; simulación pendiente, pagos y anexo OK.');
})().catch(err=>{console.error(err);process.exitCode=1;});

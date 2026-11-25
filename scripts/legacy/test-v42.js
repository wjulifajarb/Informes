'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {layout,exportReport}=require('../api/report.js');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const cut=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i,`No se encuentra ${a}`);return html.slice(i,j)};
const financialFn=cut('function buildExecutiveReportV41(){','const reportBeforeFinanceV34=makeReport;');
const whole=financialFn.slice(0,financialFn.indexOf('/**\n * V4.2 | Restaurar'));
const restored=cut('function buildIntegralReportV42(){','const reportBeforeFinanceV34=makeReport;');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const stages=['inscrito','pre-aprobado','preaprobado','aprobado','pagado','docs completados','documentos completados'];
const isFormal=s=>stages.includes(norm(s));
const pct=(n,d)=>d?Number(n*100/d).toLocaleString('es-CO',{maximumFractionDigits:1})+'%':'No aplica';
const money=n=>n===null||n===undefined?'Pendiente':'$ '+Number(n).toLocaleString('es-CO');
const sr=(name,status, fund, type,relation,role,motivation,company='Residere', group='Residere')=>({name,status,fund,type,relation,role,motivation,company,group,isActive:norm(fund)==='activo',paid:norm(status)==='pagado',stage:norm(status)==='inscrito'?'Inscrito':/preaprobado|pre-aprobado/.test(norm(status))?'Preaprobado':norm(status)==='aprobado'?'Aprobado':'Cerrado',row:3,tuition:3000000});
const records=[
 sr('Elena 1','Pre-aprobado','Activo','Nuevo','Empleado','Asesora comercial','crecimiento_profesional'),
 sr('Elena 2','Pre-aprobado','Activo','Nuevo','Familiar','Coordinadora comercial','calidad_vida'),
 sr('Elena 3','Pre-aprobado','Activo','Nuevo','Familiar','Conductor','crecimiento_profesional'),
 sr('Elena 4','Pre-aprobado','Activo','Nuevo','Familiar','Conductor mensajero','crecimiento_profesional'),
 sr('Elena 5','Pre-aprobado','Activo','Nuevo','Familiar','Oficial de construcción','crecimiento_profesional'),
 sr('Elena 6','Pre-aprobado','Activo','Nuevo','Empleado','Asistente Comercial','calidad_vida'),
 sr('Elena 7','Pre-aprobado','Activo','Antiguo','Familiar','AUXILIAR CONTABLE','crecimiento_profesional'),
 sr('Elena 8','Aprobado','Activo','Antiguo','Familiar','Coordinadora de Costos y Presupuestos','crecimiento_profesional'),
 sr('Elena 9','Inscrito','Activo','Nuevo','Familiar','Residente administrativa','nuevas_habilidades'),
 sr('Elena 10','Graduado · postulación cerrada','Graduación','Antiguo','Familiar','Asistente comercial',''),
 sr('Elena 11','Inscrito','No cumple requisitos','Nuevo','Familiar','Coordinadora','')
];
const summaries=[{group:'Residere',sheet:'Proye-Residere',historyDataLoaded:true,base:8,tuitionBase:52889000,feeBase:6263960,unitFee:782995,cash:2596908,donationBase:56556052,finalApproved:null,authorized:null,invalidTuitionCount:0,paidCount:0,cells:{C8:20428985,C12:17832077,C14:2596908,C51:6555129,C52:27}}];
const data={rows:records,source:'JULI-2027-1',updated:'2026-11-21T21:00:00Z',financialV34:{summary:summaries,history:[{group:'Residere',initial:18488262,donation2026:1940723,tuitionPaid2026:15483092,admin2026:2348985,cashRecovered:null,unreconciled:5558686,carteraTuition:15483065,uncollectableBenefits:6148620,cartera2026:9334445,previousDue:0,totalDue:9334445,collected:2779343,collectedPct:.2978,outstanding:6555102}],paidDetail:[],quotas:[{group:'Residere',period:'Septiembre 2026',type:'Nómina',scheduled:1205945},{group:'Residere',period:'Noviembre 2026',type:'Nómina',scheduled:1573398}]}};
const freq=(rows,fn)=>{const m=new Map();for(const r of rows){const k=fn(r)||'Sin dato';m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1]);};
const metric=rows=>{const active=rows.filter(r=>r.isActive),f=rows.filter(r=>r.isActive&&isFormal(r.status)),olds=rows.filter(r=>norm(r.type)==='antiguo');return {rows,active,f,olds,continuing:olds.filter(r=>r.isActive&&isFormal(r.status)),graduated:olds.filter(r=>norm(r.fund)==='graduacion'),pre:f.filter(r=>r.stage==='Preaprobado'),approved:f.filter(r=>r.stage==='Aprobado'),paid:f.filter(r=>r.paid),review:f.filter(r=>r.stage==='Inscrito'),register:active.filter(r=>!isFormal(r.status)),noReq:rows.filter(r=>norm(r.fund)==='no cumple requisitos'),retired:[],recon:{total:f.length+1}};};
const ui={group:'Residere',company:''};const context={data,$:key=>({value:ui[key]}),scopeName:()=>ui.group||'Todos los grupos',scoped:()=>data.rows.filter(r=>(!ui.group||r.group===ui.group)&&(!ui.company||r.company===ui.company)),norm,countedStatus:isFormal,fmt:money,Intl,console,metric,frequencies:freq,pct,unique:a=>[...new Set(a)].sort(),motive:s=>({calidad_vida:'Mejora en la calidad de vida',crecimiento_profesional:'Oportunidades de crecimiento',nuevas_habilidades:'Desarrollo de habilidades'}[norm(s)]||s||'Sin dato'),oldStatus:r=>r.isActive?'Continúa / formalizado':r.fund,showCount:n=>n};
vm.createContext(context);vm.runInContext(html.slice(html.indexOf('function paidCostsV46('),html.indexOf('function renderFinV34(){')),context);vm.runInContext(whole+'\n'+restored+'\nvar reportV42=buildIntegralReportV42();',context);
const report=context.reportV42;
assert.equal(report.pages[0].cover,true);
const titles=report.pages.map(x=>x.title);
const at=term=>titles.findIndex(x=>x.includes(term));
assert.ok(at('Caracterización de beneficiarios')>0);
assert.ok(at('¿Qué es lo que más valoran')>at('Caracterización de beneficiarios'));
assert.ok(at('Novedades de estudiantes antiguos')>at('¿Qué es lo que más valoran'));
assert.ok(at('Embudo de convocatoria')>at('Novedades de estudiantes antiguos'));
assert.ok(at('Estado actual del fondo')>at('Embudo de convocatoria'));
assert.ok(at('Proyección 2027-I + simulador')>at('Estado actual del fondo'));
assert.ok(at('Estado de cartera')>at('Proyección 2027-I + simulador'));
assert.match(titles.at(-1),/ANEXO/);
const ch=report.pages.find(x=>x.title.startsWith('Caracterización de beneficiarios'));
assert.equal(ch.rows.filter(r=>r[0]==='Beneficiario').reduce((n,r)=>n+r[2],0),9);
assert.equal(ch.rows.filter(r=>r[0]==='Estudiante').reduce((n,r)=>n+r[2],0),9);
assert.ok(ch.rows.some(r=>r[0]==='Estudiante'&&r[1]==='Antiguo'&&r[2]===2));
assert.ok(ch.rows.some(r=>r[0]==='Estudiante'&&r[1]==='Nuevo'&&r[2]===7));
assert.ok(report.pages.find(x=>x.title.startsWith('Novedades de estudiantes antiguos')).metrics[0][1]===3);
assert.ok(report.pages.find(x=>x.kind==='comparison').leftRows.some(r=>r[1]==='$ 52.889.000'));
assert.ok(report.pages.find(x=>x.kind==='portfolio'));
assert.equal(report.pages.at(-1).rows.length,11);
assert.ok(layout(report).length>=11);
// Un mismo grupo con varias filiales genera tanto el desglose como una ficha
// nominal para cada empresa, manteniendo las cifras financieras en el grupo.
records[0].company='Filial A';
records[1].company='Filial B';
vm.runInContext('var byFilial = buildIntegralReportV42();',context);
assert.ok(context.byFilial.pages.some(p=>p.title.includes('Caracterización por empresa / filial')));
assert.ok(context.byFilial.pages.some(p=>p.title.includes('Detalle de postulaciones · Filial A')));
assert.ok(context.byFilial.pages.some(p=>p.title.includes('Detalle de postulaciones · Filial B')));
assert.ok(context.byFilial.pages.some(p=>p.kind==='comparison'));
records[0].company='Residere';records[1].company='Residere';
(async()=>{let dest=path.join(__dirname,'..','_test-v42');fs.mkdirSync(dest,{recursive:true});for(const type of ['pdf','pptx']){const f=await exportReport(report,type);const bytes=Buffer.from(f.base64,'base64');assert.ok(bytes.length>20000);fs.writeFileSync(path.join(dest,'Informe_Residere_V4_2_DEMO.'+type),bytes);}console.log('V4.2 OK: caracterización, antiguos/nuevos, motivaciones, novedades, finanzas base+simulador, cartera, anexo, PDF/PPTX.');})().catch(e=>{console.error(e);process.exitCode=1;});

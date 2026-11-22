'use strict';
// Pruebas específicas para: (1) conteo de inscritos, (2) descarga por empresa
// o grupo sin alterar los filtros de pantalla, (3) exclusión de columna interna.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/index.html','utf8');
const between=(a,b)=>{const x=html.indexOf(a),y=html.indexOf(b,x);assert(x>=0&&y>x);return html.slice(x,y)};
assert(html.includes('id="pdfCompany"')&&html.includes('id="pdf"'));
assert(html.includes('id="pptxCompany"')&&html.includes('id="pptx"'));
assert(!html.includes("['review','En revisión']"),'No debe aparecer tarjeta interna en revisión');
const n=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const records=[
 {row:3,key:'1',name:'A',group:'Residere',company:'Residere',fund:'Activo',status:'Inscrito',isActive:true},
 {row:4,key:'2',name:'B',group:'Residere',company:'Residere',fund:'Activo',status:'Pre-aprobado',isActive:true},
 {row:5,key:'3',name:'C',group:'Residere',company:'Residere',fund:'No cumple requisitos',status:'Inscrito',isActive:false},
 {row:6,key:'4',name:'D',group:'Residere',company:'Residere',fund:'Activo',status:'Registro',isActive:true},
 {row:7,key:'5',name:'E',group:'Residere',company:'Residere',fund:'Graduación',status:'Graduado',isActive:false}
];
const c={norm:n,formal:r=>r.isActive&&['inscrito','pre-aprobado','aprobado','docs completados','pagado'].includes(n(r.status)),records,data:{headers:[],rows:records}};
vm.createContext(c);
vm.runInContext(between('const countedStatus=', 'function metric(rows)'),c);
let r=vm.runInContext('reconcile(records)',c);
assert.equal(r.total,3);assert.equal(r.rawCount,5);assert.equal(r.onlySheet.length,1);assert.equal(r.delta,1);
assert.equal(r.approximate,true);
c.data.headers=['Estado en el fondo','Estado','Nombre'];
c.data.allRows=records.map(z=>({row:z.row,key:z.key,group:z.group,company:z.company,values:[z.fund,z.status,z.name]}));
r=vm.runInContext('reconcile(records)',c);
assert.equal(r.total,3);assert.equal(r.rawCount,5);assert.equal(r.onlySheet.length,1);assert.equal(r.approximate,undefined);
const ui={group:{value:'Residere'},company:{value:'Subempresa'}};
const seven=['Residere','Transportes Vigía','Filiales Grupo Vigía','Grupo Falic','Grupo Ventura','Grupo Bergé Colombia','EducaMás'];
const env={$:key=>ui[key],data:{financialV34:{summary:seven.map(group=>({group}))}},norm:n,activeSegment:'paid',makeReport:()=>({name:'fixture',pages:[]}),scopeName:()=>ui.group.value+' · '+ui.company.value};
vm.createContext(env);
vm.runInContext(between('function buildExportReport(mode){','function download(format'),env);
let x=vm.runInContext('buildExportReport("group")',env);assert.match(x.name,/Grupo_Residere/);assert.equal(ui.company.value,'Subempresa');assert.equal(env.activeSegment,'paid');
x=vm.runInContext('buildExportReport("company")',env);assert.match(x.name,/Empresa_Subempresa/);assert.equal(ui.company.value,'Subempresa');
x=vm.runInContext('buildExportReport("all")',env);assert.match(x.name,/Todos_los_grupos/);assert.equal(ui.group.value,'Residere');
ui.company.value='';assert.throws(()=>vm.runInContext('buildExportReport("company")',env),/Selecciona una empresa/);
console.log('V4.3 OK: conteo de inscritos con y sin detalle fuente; elección PDF por grupo/empresa/todos; filtros intactos.');

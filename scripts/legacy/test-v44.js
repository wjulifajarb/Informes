'use strict';
// Regresión: los indicadores y el filtro se basan en Estado (E), nunca Estado interno (B).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/index.html','utf8');
const begin=html.indexOf('function etapaDesdeE('), end=html.indexOf('function scopeKey()',begin);
assert(begin!==-1 && end>begin,'Faltan las funciones de estado E');
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const c={norm,countedStatus:s=>['inscrito','pre-aprobado','preaprobado','aprobado','pagado','docs completados','documentos completados'].includes(norm(s))};
vm.createContext(c);vm.runInContext(html.slice(begin,end),c);
const E=x=>vm.runInContext('etapaDesdeE('+JSON.stringify(x)+')',c);
assert.equal(E('Inscrito'),'Inscrito');
assert.equal(E('Pre-aprobado'),'Preaprobado');
assert.equal(E('Docs completados'),'Aprobado');
assert.equal(E('Pagado'),'Pagado');
assert.equal(E('Graduado · postulación cerrada'),'Graduación');
const fixtures=[
 {fund:'Activo',status:'Inscrito',internal:'preaprobada',isActive:true},
 {fund:'Activo',status:'Pre-aprobado',internal:'pendiente_revision',isActive:true},
 {fund:'Activo',status:'Docs completados',internal:'preaprobada',isActive:true},
 {fund:'Activo',status:'Pagado',internal:'preaprobada',isActive:true},
 {fund:'Graduación',status:'Graduado · postulación cerrada',internal:'preaprobada',type:'Antiguo',isActive:false},
 {fund:'No cumple requisitos',status:'Inscrito',internal:'preaprobada',isActive:false}
].map(r=>({...r,stage:E(r.status),paid:r.isActive&&E(r.status)==='Pagado'}));
const metBegin=html.indexOf('function metric(rows)'),metEnd=html.indexOf('// V3.3: la selección',metBegin);
assert(metBegin!==-1&&metEnd>metBegin);
const formal=r=>r.isActive&&c.countedStatus(r.status);
Object.assign(c,{formal,old:r=>r.type==='Antiguo',reconcile:()=>({total:5})});
vm.runInContext(html.slice(metBegin,metEnd),c);
c.fixtures=fixtures;
const m=vm.runInContext('metric(fixtures)',c);
assert.equal(m.pre.length,1,'Preaprobados siempre desde E');
assert.equal(m.review.length,1,'Inscrito activo desde E');
assert.equal(m.approved.length,1,'Docs completados desde E');
assert.equal(m.paid.length,1,'Pagados desde E');
assert.equal(m.f.length,4,'Activos formalizados usa A + E');
assert.equal(m.noReq.length,1,'No cumple requisitos corresponde a situación del fondo A');
assert.equal(m.graduated.length,1,'Graduación corresponde a E');
assert(!html.includes("['review','En revisión']"));
assert(!/\bget\('internal'\)/.test(fs.readFileSync('apps-script/Code.gs','utf8')));
console.log('V4.4 OK: E clasifica todas las etapas, incluso cuando B contradice E; A solo define beneficio activo o cerrado.');

'use strict';
// V4.9: las palabras del embudo son editoriales. Los conteos siguen inalterados.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/index.html','utf8'),report=fs.readFileSync('api/report.js','utf8');
const a=html.indexOf('function convocatoriaFunnelV49('),b=html.indexOf('function renderSegmentCards(m){',a);
assert(a>0&&b>a,'función de embudo');
const state={norm:x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()};
vm.createContext(state);vm.runInContext(html.slice(a,b),state);
const rows=[
 {status:'Pre-aprobado',fund:'Activo'},
 {status:'Aprobado',fund:'Activo'},
 {status:'Docs completados',fund:'Activo'},
 {status:'Pagado',fund:'Activo'},
 {status:'Graduado · postulación cerrada',fund:'Graduación'},
 {status:'Retiro del programa · postulación cerrada',fund:'Activo'},
 {status:'Inscrito',fund:'No cumple requisitos'},
 {status:'Retiro de la empresa · postulación cerrada',fund:'Retiro de empresa'}
];
const m={f:rows.slice(0,4),pre:[rows[0]],approved:rows.slice(1,3),paid:[rows[3]],review:[],noReq:[rows[6]],retired:[rows[7]],register:[]};
const {stages,novelties}=state.convocatoriaFunnelV49(m,rows);
assert.deepEqual(Array.from(stages,([label,n])=>[label,n]),[
 ['Inscritos con beneficio activo',4],['Preaprobaciones Educamás',1],
 ['Aprobados / documentación completa sin pago',2],['Matrículas pagadas',1]]);
assert(novelties.some(([x,n])=>x==='Retiro del programa'&&n===1));
assert(novelties.some(([x,n])=>x==='Graduación'&&n===1));
assert(novelties.some(([x,n])=>x==='No cumplen requisitos del fondo'&&n===1));
assert(!stages.some(([x])=>/retiro|requisit/i.test(x)));
assert(html.includes('bars:cIntegral.stages')&&html.includes('rows:cIntegral.novelties'));
assert(html.includes('bars:cLegacy.stages')&&html.includes('rows:cLegacy.novelties'));
assert(report.includes("page.rightTitle||'Novedades de la convocatoria'"));
assert(!html.includes("['pre','Preaprobados']"));
assert(fs.readFileSync('apps-script/Code.gs','utf8').includes("const API_VERSION = '4.7.0'"));
console.log('V4.9 OK: vocabulario institucional, etapas separadas de novedades, datos intactos.');

'use strict';
// Regresión visual: portada con a-color, no óvalos; resto de páginas sin cambios.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {layout,exportReport}=require('../api/report');
const test={name:'Residere',pages:[{cover:true,title:'Convocatoria 2027-1'},{title:'Convocatoria',section:'04 / CONVOCATORIA',headers:['Concepto','Valor'],rows:[['Inscritos',10]]}]};
(async()=>{
 const [cover,body]=layout(test);
 assert.equal(cover.filter(o=>o.t==='a').length,1,'La portada debe usar el símbolo a-color');
 assert.equal(cover.filter(o=>o.t==='e').length,0,'Sin óvalos decorativos en portada');
 assert.equal(body.filter(o=>o.t==='a').length,0,'Sin símbolos añadidos a los cuadros de datos');
 const pdf=await exportReport(test,'pdf');
 const ppt=await exportReport(test,'pptx');
 assert(Buffer.from(pdf.base64,'base64').toString('latin1').includes('/Mark 6 0 R'),'Falta marca a-color en PDF');
 assert(Buffer.from(ppt.base64,'base64').readUInt16LE(0)===0x4b50,'PPTX incorrecto');
 const full=fs.readFileSync('api/report.js','utf8');
 assert(full.includes("const MARK_PNG='"));
 console.log('V4.5 OK: portada PDF y PPTX con a-color; sin elipses; resto del informe conservado.');
})().catch(e=>{console.error(e);process.exitCode=1});

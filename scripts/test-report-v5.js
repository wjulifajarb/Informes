'use strict';
const assert=require('node:assert/strict');
const report=require('../api/report.js');
(async()=>{
 const fixture={name:'EDUCAMÁS · informe de prueba',pages:[
  {title:'Convocatoria 2027-I',cover:true,subtitle:'Prueba de integración'},
  {title:'Resumen ejecutivo',headers:['Indicador','Valor'],rows:[['Preaprobados',8],['Valor autorizado BI + BU','$ 100.000']]},
  {title:'Cartera',headers:['Fondo','Cartera'],rows:[['Grupo de prueba','$ 15.000']]}
 ]};
 for(const f of ['pdf','pptx']){
  const result=await report.exportReport(fixture,f),buf=Buffer.from(result.base64,'base64');
  assert(buf.length>1000);assert(buf.subarray(0,f==='pdf'?4:2).equals(Buffer.from(f==='pdf'?'%PDF':'PK')));
 }
 console.log('Exportaciones PDF y PPTX: OK.');
})().catch(e=>{console.error(e);process.exitCode=1});

'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {exportReport}=require('../api/report');
(async()=>{
 const payload={name:'Ejemplo de visualización V4.6',pages:[
  {cover:true,title:'Convocatoria 2027-I'},
  {title:'Pagos reportados 2027-I · grupo de ejemplo',section:'05 / PAGOS REGISTRADOS',
   metrics:[['Estudiantes con matrícula marcada como pagada',5],
    ['Matrículas pagadas confirmadas (Finanzas)','Pendiente'],
    ['Fee administrativo de estas matrículas','$ 3.578.655'],
    ['Total pagado + fee a conciliar con el fondo','Pendiente de conciliar'],
    ['Matrículas aproximadas de pagados (AY)','$ 32.103.195'],
    ['Provisión estimada matrícula + fee','$ 35.681.850'],
    ['Pagados sin monto confirmado',5]],
   headers:['Estudiante','Empresa / filial','Matrícula estimada','Pago informado','Fee administrativo','Total pago + fee'],
   rows:[['Estudiante de prueba 1','Grupo de prueba','$ 7.500.000','Pendiente','$ 782.995','Pendiente']],
   note:'Importes ficticios para revisar legibilidad. No se aplican descuentos al saldo hasta conciliación por Finanzas.'}
 ]};
 for(const fmt of ['pdf','pptx']){const res=await exportReport(payload,fmt);fs.writeFileSync(path.join(__dirname,'..',`_ejemplo_visual_v46.${fmt}`),Buffer.from(res.base64,'base64'));}
})();

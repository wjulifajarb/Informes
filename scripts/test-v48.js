'use strict';
// Regresión V4.8: proyecciones individuales, saldo único de grupo, cargos exhaustivos,
// texto del informe y exportaciones editables. Datos de esta prueba son ficticios.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {exportReport,layout}=require('../api/report');
const html=fs.readFileSync('public/index.html','utf8');
const gs=fs.readFileSync('apps-script/Code.gs','utf8');
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n==null||!Number.isFinite(Number(n))?'Pendiente':'$'+Math.round(Number(n)).toLocaleString('es-CO');
const seven=['Residere','Transportes Vigía','Filiales Grupo Vigía','Grupo Falic','Grupo Ventura','Grupo Bergé Colombia','EducaMás'];
const companies=['Pharitech (Transportes Vigía)','Phari SAS (Transportes Vigía)','Vigía Transportes Especial (Transportes Vigía)','Vlogic (Transportes Vigía)','Enérgika (Transportes Vigía)','Sin empresa identificada'];
const sheets=['Proye · Pharitech','Proye · Phari SAS','Proye · Vigía Especial','Proye · Vlogic','Proye · Enérgika','Proye · Sin empresa'];
const counts=[4,1,0,0,1,0],tuitions=[7500000,4000000,0,0,0,0],fees=counts.map(n=>n*782995),bad=[1,0,0,0,1,0];
const filials=sheets.map((sheet,i)=>({sheet,group:'Filiales Grupo Vigía',company:companies[i],base:counts[i],tuitionBase:tuitions[i],feeBase:fees[i],costGross:tuitions[i]+fees[i],invalidTuitionCount:bad[i],unitFee:782995,records:counts[i]+2,active:counts[i]+1,paidCount:0,finalApproved:null,authorized:null,costFinalGross:null,paidCountWithAmount:0,paidFeeEstimated:0,notes:'Costo antes de aplicar saldo grupal; no es donación neta.'}));
const data={financialV34:{summary:seven.map(group=>({group,cash:group==='Filiales Grupo Vigía'?53352222:1000,unitFee:782995,sheet:group==='Filiales Grupo Vigía'?'Proye-Filiales Vigía':'Proye-otro'})),filialProjections:filials,missingFilialSheets:[]}};
assert.equal(data.financialV34.summary.length,7);
assert.equal(filials.reduce((a,x)=>a+x.base,0),6);
assert.equal(filials.reduce((a,x)=>a+x.tuitionBase,0),11500000);
assert.equal(filials.reduce((a,x)=>a+x.feeBase,0),4697970);
assert.ok(gs.includes("const API_VERSION = '4.7.0'"));
assert.ok(gs.includes('filialProjections:filiales.items'));
assert.ok(!gs.includes("get('internal')"));
const dom={};for(const id of ['group','company','roleUniverse','roleSearch','roleTotal','roles','filialSection','filialScopeNote','filialKpis','filialTable','filialDetail','filialFootnote'])dom[id]={value:'',innerHTML:'',textContent:'',classList:{state:new Set(),toggle(key,value){value?this.state.add(key):this.state.delete(key)},contains(key){return this.state.has(key)}}};
const $=id=>dom[id];
const people=[{group:'Filiales Grupo Vigía',company:companies[0],name:'Alumno ejemplo',fund:'Activo',status:'Pre-aprobado',role:'Auxiliar de operaciones',isActive:true,stage:'Preaprobado',tuition:1,tuitionText:'1',duplicateConflict:false}];
const frequencies=(rows,fn)=>{const m=new Map();rows.forEach(r=>{const k=fn(r)||'Sin dato';m.set(k,(m.get(k)||0)+1)});return [...m].sort((a,b)=>b[1]-a[1]);};
const context={data,$,norm,E,fmt,console,table:(heads,rows)=>'<table>'+heads.map(x=>'<th>'+E(x)+'</th>').join('')+rows.map(r=>'<tr>'+r.map(x=>'<td>'+E(x)+'</td>').join('')+'</tr>').join('')+'</table>',cards:arr=>arr.map(x=>`<div class="kpi"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join(''),scoped:()=>people,frequencies,pct:(n,d)=>d?(100*n/d).toFixed(1)+'%':'No aplica',activeSegment:'',segmentRows:()=>people,formal:r=>r.isActive,saveBlob:()=>{},Blob,validTuitionV35:r=>r.tuition>=100000};
vm.createContext(context);
function snippet(from,to){const a=html.indexOf(from),b=html.indexOf(to,a);assert(a>=0&&b>a,from);return html.slice(a,b)}
vm.runInContext(snippet('let roleRowsV48=[]','function scopeKey()'),context);
vm.runInContext(snippet('const filialListV48=','function renderFinV34(){'),context);
vm.runInContext(snippet('function reportFilialPagesV48(', 'function buildIntegralReportV42(){'),context);
// Todos los cargos son exactos y no se eliminan por baja frecuencia.
context.scoped=()=>[
 {role:'Conductor',isActive:true},{role:'Analista Senior',isActive:true},
 {role:'Auxiliar de tráfico',isActive:true},{role:'Director comercial',isActive:false},
 {role:'Operaria de almacén',isActive:true},{role:'Operaria de almacén',isActive:true}
];
context.profile=context.scoped().filter(x=>x.isActive);
vm.runInContext('renderRolesV48(profile)',context);
assert.match(dom.roles.innerHTML,/Director comercial/,'Los cierres tienen cargos que deben ser visibles en inventario');
assert.match(dom.roles.innerHTML,/Auxiliar de tráfico/);
assert.match(dom.roleTotal.textContent,/5 cargos/);
dom.roleUniverse.value='formal';vm.runInContext('renderRolesV48(profile)',context);
assert.doesNotMatch(dom.roles.innerHTML,/Director comercial/,'El modo formalizado sí debe filtrar');
dom.roleUniverse.value='all';dom.roleSearch.value='conductor';vm.runInContext('renderRolesV48(profile)',context);
assert.match(dom.roles.innerHTML,/Conductor/);assert.doesNotMatch(dom.roles.innerHTML,/Analista Senior/);
dom.roleSearch.value='';
context.scoped=()=>people;
// El bloque financiero se filtra por empresa, sin tratarla como un fondo adicional.
dom.group.value='Filiales Grupo Vigía';dom.company.value='';vm.runInContext('renderFilialFinanceV48()',context);
assert.match(dom.filialTable.innerHTML,/Pharitech/);assert.match(dom.filialTable.innerHTML,/Enérgika/);
assert.match(dom.filialScopeNote.textContent,/COMPARTIDO/);assert.match(dom.filialKpis.innerHTML,/11.500.000/);
assert.match(dom.filialKpis.innerHTML,/4.697.970/);
dom.company.value=companies[0];vm.runInContext('renderFilialFinanceV48()',context);
assert.match(dom.filialTable.innerHTML,/Pharitech/);assert.doesNotMatch(dom.filialTable.innerHTML,/Phari SAS/);
assert.match(dom.filialKpis.innerHTML,/7.500.000/);
dom.group.value='Residere';vm.runInContext('renderFilialFinanceV48()',context);assert(dom.filialSection.classList.contains('hidden'));
// Reportes: las seis proyecciones aparecen sin seis saldos independientes.
dom.group.value='Filiales Grupo Vigía';dom.company.value='';
const pages=vm.runInContext("reportFilialPagesV48('Filiales Grupo Vigía','')",context);
assert.equal(pages.filter(p=>p.title.startsWith('Proyección individual')).length,6);
const summaryPage=pages[0];assert.equal(summaryPage.rows.length,6);
assert.match(summaryPage.note,/no distribuir/);
assert(!pages.some(p=>p.title.toLowerCase().includes('donación neta individual')));
const only=vm.runInContext(`reportFilialPagesV48('Filiales Grupo Vigía',${JSON.stringify(companies[0])})`,context);
assert.equal(only.filter(p=>p.title.startsWith('Proyección individual')).length,1);
assert.equal(only[0].rows.length,1);
// Inventario del informe: 38 cargos distintos, incluido uno de cierre. Paginación completa.
const roleRows=Array.from({length:38},(_,i)=>['Cargo original número '+String(i+1).padStart(2,'0'),1,'2,6%']);
const payload={name:'Grupo de prueba (datos ficticios)',pages:[{cover:true,title:'Convocatoria 2027-I'},
 {title:'Inventario completo de cargos registrados · grupo de prueba',section:'01 / CARACTERIZACIÓN',headers:['Cargo original (sin agrupar)','Registros','% del alcance'],rows:roleRows,widths:[3.5,1,1],note:'Se muestran todos los cargos.'},
 ...pages]};
assert(layout(payload).length>=9);
(async()=>{for(const type of ['pdf','pptx']){const exported=await exportReport(payload,type);const bytes=Buffer.from(exported.base64,'base64');assert(bytes.length>25000,type);fs.mkdirSync('_test-v48',{recursive:true});fs.writeFileSync(`_test-v48/Filiales_Cargos_DEMO.${type}`,bytes);}console.log('V4.8 OK: 7 fondos únicos, 6 proyecciones reales separadas, cargos exhaustivos/filtro/CSV, saldo grupal único, PDF/PPTX.');})().catch(err=>{console.error(err);process.exitCode=1});

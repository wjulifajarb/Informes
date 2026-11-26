/**
 * EDUCAMÁS 2027-I · API privada V5.0
 * Fuente única: Financiero2027-1 (encabezados fila 2).
 * Desgloses: Estudiantes-[Empresa] y Proye-[Empresa].
 * SOLO LECTURA. Nunca modifica los datos ni las fórmulas del libro.
 * El token permanece en las Propiedades del script: API_TOKEN.
 */
const API_VERSION = '5.3.7';
const CFG = {
  id:'1TkVBmU6NOCVpPkSdAUpXeUREAclVdWQnquJNh7y-bZE',
  sheet:'Financiero2027-1', period:'2027-1', refresh:60
};
const POS = Object.freeze({fund:0,internal:1,created:3,status:4,
  name:7,relationScope:10,type:11,relation:12,age:14,sex:15,doc:17,
  residence:19,motivation:20,requirements:21,guardianRole:28,role:31,
  level:38,university:39,program:40,periods:46,firstGenSource:49,
  approximateTuition:50,abono:55,cesantias:56,prima:57,
  caseStatus:58,continues:59});
function json_(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function err_(x){return json_({ok:false,error:String(x&&x.message||x).slice(0,500)});}
function norm_(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function val_(x){return String(x==null?'':x).trim();}
function num_(x){if(typeof x==='number'&&Number.isFinite(x))return x;if(x===null||x===undefined||x==='')return null;let s=String(x).trim().replace(/(?:COP|\$|\s)/gi,'');if(/^\(?\d{1,3}(?:\.\d{3})+(?:,\d+)?\)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^\(?\d{1,3}(?:,\d{3})+(?:\.\d+)?\)?$/.test(s))s=s.replace(/,/g,'');else if(/^-?\d+,\d+$/.test(s))s=s.replace(',','.');if(/^\(.*\)$/.test(s))s='-'+s.slice(1,-1);let n=Number(s);return s!==''&&Number.isFinite(n)?n:null;}
function tokenOk_(a,b){if(!b||b.length<32||typeof a!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<b.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function ss_(){return SpreadsheetApp.openById(CFG.id);}
function doGet(){return json_({ok:true,service:'Educamás · informe 2027-I',version:API_VERSION,message:'API privada; las consultas requieren POST autenticado'});}
function doPost(e){try{
  const p=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
  const secret=PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if(!tokenOk_(p.token,secret))return json_({ok:false,error:'No autorizado'});
  const ss=ss_();
  if(p.action==='data')return json_({ok:true,version:API_VERSION,data:getData_(ss)});
  if(p.action==='scope')return json_({ok:true,version:API_VERSION,data:getScope_(ss,p.scope)});
  if(p.action==='finance'){
    const d=getData_(ss);return json_({ok:true,version:API_VERSION,data:{apiVersion:API_VERSION,
       financialV34:d.financialV34,financialSimple:d.financialSimple,
       finance:d.finance,cartera:d.cartera,cuotas:d.cuotas}});
  }
  if(p.action==='diagnostic'){
    const s=discover_(ss);return json_({ok:true,version:API_VERSION,data:{version:API_VERSION,
      mainSheet:CFG.sheet,studentSheets:s.filter(x=>x.hasStudents).length,projectionSheets:s.filter(x=>x.hasProjection).length,
      missingPairs:s.filter(x=>!x.hasStudents||!x.hasProjection).map(x=>x.name)}});
  }
  return json_({ok:false,error:'Acción no válida'});
}catch(e){return err_(e);}}
function headers_(a){return (a||[]).filter((v,i)=>i!==POS.internal).map(v=>val_(v).replace(/\s+/g,' '));}
/**
 * Resuelve los campos críticos POR ENCABEZADO en vez de letras de columna.
 * La fuente oficial insertó una columna: el antiguo BI/BM/BN/BO/BU se
 * desplazó a BJ/BN/BO/BP/BV. La validación nunca debe depender del orden.
 */
function ensureColumns_(head){
  const names={
    fund:'Estado en el fondo',status:'Estado',name:'Nombre',group:'Grupo',company:'Empresa',
    financeAmount:'Valor a Financiar',simulation:'Simulación Cuota',
    installments:'Numero de Cuotas',capacityDebt:'Capacidad de endeudamiento',
    approvalEducation:'Aprobación EducaMas',approvalCompany:'Estado Aprobacion Empresa',
    finalStatus:'Status Final',paidDate:'Fecha de Pago',
    paidInitial:'Vr. Inicial pago Matricula (sin descuentos)',
    discountType:'Tipo de descuento',discountPct:'% de descuento',
    discountValue:'Vr descuento',paidFinal:'Vr. Final pago matricula'
  };
  const required=['fund','status','name','group','company','financeAmount',
    'approvalEducation','approvalCompany','finalStatus','paidFinal'];
  const normalized=(head||[]).map(norm_),found={},missing=[];
  for(const key of Object.keys(names)){
    const at=normalized.findIndex(h=>h===norm_(names[key]));
    // Un campo opcional ausente no debe ocasionar una lectura de otra columna.
    found[key]=at<0?null:at;
    if(at<0&&required.includes(key))missing.push(names[key]);
  }
  if(missing.length)throw Error('Faltan encabezados en '+CFG.sheet+': '+missing.join(', '));
  if(found.group===found.company)throw Error('Grupo y Empresa no están diferenciados');
  return found;
}
function readPeople_(sh){
  if(!sh)throw Error('No existe la hoja de estudiantes solicitada');
  const main=sh.getName()===CFG.sheet, start=2, last=main?sh.getLastRow():sh.getMaxRows();
  const count=Math.max(0,last-start+1), width=Math.min(Math.max(sh.getLastColumn(),75),120);
  if(!count)return {rows:[],allRows:[],headers:[],rawCount:0};
  const grid=sh.getRange(start,1,count,width);
  const raw=grid.getValues(),disp=grid.getDisplayValues(),head=disp[0];
  const columns=ensureColumns_(head);const rows=[],allRows=[],seen={},duplicates=[];
  for(let i=1;i<raw.length;i++){
    const r=raw[i],d=disp[i],pick=n=>val_(d[n]),n=n=>num_(r[n]);
    const name=pick(columns.name);if(!name)continue;
    const group=pick(columns.group),company=pick(columns.company)||group;
    const fund=pick(columns.fund),status=pick(columns.status),bm=pick(columns.approvalEducation),bn=pick(columns.approvalCompany),bo=pick(columns.finalStatus);
    const paid=norm_(bo)==='pagado';
    const approved=['aprobado','aprobacion anticipada'].includes(norm_(bn));
    const preapproved=norm_(bm)==='pre aprobado educamas';
    const special=norm_(bm)==='caso especial - revision';
    const active=norm_(fund)==='activo';
    const retired=/reti(r|ro|rada|rado)|desvincul|cancel/i.test(norm_(status+' '+pick(POS.caseStatus)));
    const notInscribed=/no inscri|no contactabilidad|no continua/i.test(norm_(status+' '+pick(POS.caseStatus)));
    const graduated=/graduad/i.test(norm_(status));
    // Universo inscrito 2027-I: SOLO etapas E de inscripción o posteriores.
    // Mantener A=Activo separado: hay inscritos que aún no están formalizados activos.
    const registered=['inscrito','pre-aprobado','preaprobado','docs completados','documentos completados','aprobado','pagado'].includes(norm_(status));
    const previousBeneficiary=norm_(pick(POS.type)).includes('antiguo');
    const continues2027=previousBeneficiary&&registered;
    const notContinuing=previousBeneficiary&&!registered;
    const situation=previousBeneficiary?(graduated?'Graduado 2026-II':retired?'Retirado':registered?'Continúa 2027-I':notInscribed||/pre-registro/i.test(status)?'No inscrito 2027-I':'No continúa 2027-I'):(registered?'Nuevo inscrito 2027-I':'En registro 2027-I');
    const stage=paid?'Pagado':approved?'Aprobado':preapproved?'Preaprobado':special?'Caso especial':
      graduated?'Graduado':retired?'Retirado':notInscribed?'No inscrito':norm_(status)==='inscrito'?'Inscrito':status||'Registro';
    const relation=pick(POS.relation)||'Sin dato';
    const role=norm_(relation)==='familiar'?(pick(POS.guardianRole)||pick(POS.role)):(pick(POS.role)||pick(POS.guardianRole));
    const doc=pick(POS.doc),keyRaw=[group,company,doc||name,pick(POS.program)].map(norm_).join('|');
    const key=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,keyRaw)).slice(0,24);
    const obj={key,row:i+start,group,company,doc,name,fund,status,stage,
      type:pick(POS.type)||'Sin dato',relation,role:role||'Sin dato',motivation:pick(POS.motivation)||'Sin dato',
      program:pick(POS.program),level:pick(POS.level),university:pick(POS.university),
      periods:pick(POS.periods),created:pick(POS.created),caseStatus:pick(POS.caseStatus),
      requirements:pick(POS.requirements),firstGenSource:pick(POS.firstGenSource),
      continues:pick(POS.continues),abono:n(POS.abono),cesantias:n(POS.cesantias),prima:n(POS.prima),
      tuition:n(POS.approximateTuition),tuitionText:pick(POS.approximateTuition),
      financeAmount:n(columns.financeAmount),simulationCuota:n(columns.simulation),numeroCuotas:n(columns.installments),debtCapacity:n(columns.capacityDebt),approvalEducation:bm,approvalCompany:bn,finalStatus:bo,
      paidAmount:paid?n(columns.paidFinal):null,paidDate:pick(columns.paidDate),paidInitial:n(columns.paidInitial),
      paidFinal:n(columns.paidFinal),discountType:pick(columns.discountType),discountPct:n(columns.discountPct),
      discountValue:n(columns.discountValue),paymentSource:'Financiero2027-1 · Vr. Final pago matricula (no prueba de conciliación bancaria)',
      paidSupport:'', earlyReference:null,earlyReferenceFlag:bn&&norm_(bn)==='aprobacion anticipada',
      companyInferred:!pick(columns.company),isActive:active,paid,registered,preapproved,special,approved,retired,graduated,previousBeneficiary,continues2027,notContinuing,situation,formalizedActive:active&&registered,
      eligible:active&&!paid&&!retired,notInscribed,validTuition:n(columns.financeAmount)!==null,duplicateConflict:false};
    // La columna B / Estado interno JAMÁS sale al navegador ni al CSV.
    allRows.push({row:obj.row,key,group,company,stage,values:d.filter((_,j)=>j!==POS.internal)});
    if(seen[key]){let prev=seen[key],conflict=prev.stage!==obj.stage||prev.financeAmount!==obj.financeAmount;
      prev.duplicateConflict=prev.duplicateConflict||conflict;duplicates.push({group,company,rows:[prev.row,obj.row],conflict});continue;}
    seen[key]=obj;rows.push(obj);
  }
  return {rows,allRows,headers:headers_(head),rawCount:allRows.length,duplicates};
}
function discover_(ss){const names=ss.getSheets().map(x=>x.getName()),lookup={};names.forEach(n=>lookup[n]=true);
 return names.filter(n=>n.indexOf('Proye-')===0).map(n=>({name:n.slice(6),projection:n,
   students:'Estudiantes-'+n.slice(6),hasStudents:!!lookup['Estudiantes-'+n.slice(6)],hasProjection:true}));}
function readProjection_(ss,cfg){
 const sh=ss.getSheetByName(cfg.projection);if(!sh)return null;
 // B:F, 46 filas reales del modelo: rótulos, importes, fórmulas evaluadas, fechas y porcentajes.
 // No usar getFormulas para calcular de nuevo: respetar lo que Sheets ya calculó.
 const height=Math.min(Math.max(sh.getLastRow(),46),46);
 const range=sh.getRange(1,2,height,5),data=range.getValues(),shown=range.getDisplayValues();
 const at=(r,c)=>data[r-1]&&data[r-1][c==='F'?4:c==='E'?3:c==='D'?2:c==='B'?0:1];
 const textAt=(r,c)=>val_(shown[r-1]&&shown[r-1][c==='F'?4:c==='E'?3:c==='D'?2:c==='B'?0:1]);
 const n=(r,c='C')=>num_(at(r,c));const t=(r,c='B')=>val_(at(r,c));
 const cells={},labels={},financialRows=[];
 for(let r=1;r<=height;r++){
   const b=textAt(r,'B'),e=textAt(r,'E'),cShow=textAt(r,'C'),fShow=textAt(r,'F');
   if(b||e||cShow||fShow){financialRows.push({row:r,b,c:n(r),cDisplay:cShow,
     d:textAt(r,'D'),e,f:n(r,'F'),fDisplay:fShow});}
   cells['C'+r]=n(r);cells['F'+r]=n(r,'F');
   labels['B'+r]=b;labels['E'+r]=e;
 }
 const filled=[6,7,10,11].filter(r=>n(r)!==null).length;
 const validation=filled===4?'Datos cargados · pendientes de validación de Finanzas':filled?
   'Parcial: '+filled+'/4 datos históricos':'Pendiente de diligenciar';
 return {group:'',company:'',name:cfg.name,sheet:cfg.projection,studentsSheet:cfg.students,
   cells,labels,financialRows,financeStatus:textAt(2,'F'),financeStatusLabel:textAt(2,'E'),
   historyDataLoaded:filled>0,validation,unitFee:n(20),
   initial:n(6),donation2026:n(7),tuitionPaid2026:n(10),admin2026:n(11),
   cashRecovered:n(16),cash:n(17),cashPotential:null,
   base:n(24),special:n(25),paidCount:n(26),tuitionBase:n(27),feeBase:n(28),
   costCall:n(29),donationBase:n(31),donationWithDecember:n(33),
   finalApproved:n(24,'F'),specialApproved:n(25,'F'),paidEarly:n(26,'F'),
   authorized:n(27,'F'),feeFinal:n(28,'F'),balanceAfterApproval:n(31,'F'),
   decemberForecast:n(32),decemberFinal:n(33,'F'),
   carteraTuition:n(38),carteraBenefits:n(39),carteraRecoverable:n(40),
   carteraPrevious:n(41),carteraTotal:n(42),carteraCollected:n(44),
   carteraRecoveredPct:n(45),carteraPending:n(46)};
}

function mapProjections_(ss,people){
 const groups={},companyGroup={},p=people||[];
 p.forEach(x=>{groups[norm_(x.group)]=x.group;if(norm_(x.company)!==norm_(x.group))companyGroup[norm_(x.company)]=x.group;});
 const entries=discover_(ss),items=[],missing=[];
 entries.forEach(cfg=>{if(!cfg.hasStudents){missing.push(cfg.students);return;}
  const item=readProjection_(ss,cfg);if(!item){missing.push(cfg.projection);return;}
  item.group=groups[norm_(cfg.name)]||companyGroup[norm_(cfg.name)]||cfg.name;
  item.company=norm_(cfg.name)===norm_(item.group)?'':cfg.name;
  item.isGroup=!item.company;items.push(item);
 });
 return {items,missing};
}
function rollup_(items){const field=(list,key)=>{if(!list.length||list.some(i=>i[key]===null||i[key]===undefined))return null;return list.reduce((a,i)=>a+i[key],0);};
 const top=items.filter(x=>x.isGroup),ks=['cash','tuitionBase','feeBase','donationBase','finalApproved','authorized','feeFinal','carteraTotal','carteraCollected','carteraPending'];
 const a={funds:top.length,missingHistoric:top.filter(x=>!x.historyDataLoaded).map(x=>x.group)};
 ks.forEach(k=>a[k]=field(top,k));return a;
}
function finance_(ss,people){const {items,missing}=mapProjections_(ss,people);
 const roots=items.filter(x=>x.isGroup),leaves=items.filter(x=>!x.isGroup);
 const details=(people||[]).filter(x=>x.preapproved||x.special||x.approved||x.paid).map(x=>({
   group:x.group,company:x.company,name:x.name,doc:x.doc,status:x.status,stage:x.stage,
   program:x.program,tuition:x.financeAmount,tuitionReference:x.financeAmount,base:x.preapproved&&!x.paid?x.financeAmount:null,
   review:x.special&&!x.paid?x.financeAmount:null,approval:x.approvalCompany,authorized:x.approved&&!x.paid?x.financeAmount:x.paid?x.paidFinal:null,
   paid:x.paidAmount,paidAmount:x.paidAmount,paidDate:x.paidDate,paidSupport:'',paymentSource:x.paymentSource,
   note:'Monto Valor a Financiar para pendientes y Vr. Final pago matricula para pagados; fuente Financiero2027-1',sourceRow:x.row,sourceTab:CFG.sheet
 }));
 const paidDetail=details.filter(x=>x.paidAmount!==null||x.stage==='Pagado');
 const summary=roots.map(x=>({group:x.group,company:'',sheet:x.sheet,studentsSheet:x.studentsSheet,
    base:x.base,review:x.special,tuitionBase:x.tuitionBase,tuitionReview:null,unitFee:x.unitFee,feeBase:x.feeBase,
    cash:x.cash,donationBase:x.donationBase,donationFinal:x.donationWithDecember,
    finalApproved:x.finalApproved,specialApproved:x.specialApproved,authorized:x.authorized,
    feeFinal:x.feeFinal,paidCount:x.paidCount,paidEarly:x.paidEarly,
    paidAmountReported:null,paidToConfirm:null,paidCountWithAmount:null,
    paidTuitionReference:null,paidApprovalReference:null,
    invalidTuitionCount:null,validation:x.validation,historyDataLoaded:x.historyDataLoaded,
    cells:x.cells,labels:x.labels,projection:x}));
 const history=roots.map(x=>({group:x.group,initial:x.initial,donation2026:x.donation2026,
    tuitionPaid2026:x.tuitionPaid2026,admin2026:x.admin2026,cashRecovered:x.cashRecovered,
    cash:x.cash,carteraTuition:x.carteraTuition,uncollectableBenefits:x.carteraBenefits,
    cartera2026:x.carteraRecoverable,previousDue:x.carteraPrevious,totalDue:x.carteraTotal,
    collected:x.carteraCollected,collectedPct:x.carteraRecoveredPct,outstanding:x.carteraPending,
    historyDataLoaded:x.historyDataLoaded,validated:x.validation}));
 const companies=items.map(x=>({group:x.group,company:x.company||x.group,
   records:(people||[]).filter(r=>norm_(r.group)===norm_(x.group)&&(!x.company||norm_(r.company)===norm_(x.company))).length,
   base:x.tuitionBase,review:x.special,paidCount:x.paidCount,paidAmountReported:null,
   paidTuitionReference:null,projection:x,tuitionBase:x.tuitionBase,authorized:x.authorized,feeBase:x.feeBase}));
 const legacyFinance=roots.map(x=>({group:x.group,company:'',cutoff:'2026-II',
    balance:x.cash,fee:x.unitFee,cost:x.tuitionBase,recovery:x.carteraCollected,
    collected:x.carteraCollected,outstanding:x.carteraPending,
    notes:'Valores oficiales de '+x.sheet+', sin distribuir saldos grupales.',donations:x.donation2026,
    paidTuition:x.tuitionPaid2026,paidFee:x.admin2026}));
 const legacyCartera=roots.map(x=>({group:x.group,company:'',cells:['2026-II',x.carteraTotal,x.carteraCollected,x.carteraPending],numbers:[x.carteraTotal,x.carteraCollected,x.carteraPending]}));
 const warning='El campo Valor a Financiar se aplica a matrículas pendientes y Vr. Final pago matricula a pagadas; este último no certifica conciliación bancaria. Los vacíos se muestran como pendientes; no se imputan cifras. Los fondos de grupos y filiales no se suman dos veces.';
 return {financialV34:{summary,history,companies,quotas:[],detail:details,paidDetail,
    filialProjections:leaves,projections:items,rollup:rollup_(items),missingSheets:missing,missingFilialSheets:missing,
    source:CFG.sheet+' + Estudiantes-[Empresa] + Proye-[Empresa]',warning},
   financialSimple:{groups:roots,filials:leaves,projections:items,rollup:rollup_(items),missingSheets:missing,warning},
   finance:legacyFinance,cartera:legacyCartera,cuotas:[]};
}
function getData_(ss){const source=ss.getSheetByName(CFG.sheet);if(!source)throw Error('Falta hoja '+CFG.sheet);
 const base=readPeople_(source),f=finance_(ss,base.rows);const result={
  apiVersion:API_VERSION,rows:base.rows,allRows:base.allRows,headers:base.headers,
  rawCount:base.rawCount,duplicates:base.duplicates,conflicts:base.duplicates.filter(x=>x.conflict).length,
  source:CFG.sheet,period:CFG.period,refresh:CFG.refresh,updated:new Date().toISOString(),
  scopes:discover_(ss),novedades:base.rows.filter(x=>x.retired||x.graduated||x.caseStatus).map(x=>({group:x.group,company:x.company,name:x.name,status:x.status,caseStatus:x.caseStatus})),
  ...f};
 return result;
}
function getScope_(ss,name){const cfg=discover_(ss).find(x=>norm_(x.name)===norm_(name));if(!cfg||!cfg.hasStudents)throw Error('La empresa no tiene hoja Estudiantes-* vinculada');
 const all=readPeople_(ss.getSheetByName(CFG.sheet)).rows;
 // Grupo/Empresa se obtienen por encabezados, incluso si intercambian columnas.
 const childParents=[...new Set(all.filter(r=>norm_(r.company)===norm_(cfg.name)&&norm_(r.group)!==norm_(cfg.name)).map(r=>r.group))];
 if(childParents.length>1)throw Error('Filial asociada a varios grupos: '+cfg.name);
 const scopeGroup=childParents[0]||cfg.name,scopeCompany=childParents.length?cfg.name:'';
 const belongs=r=>norm_(r.group)===norm_(scopeGroup)&&(!scopeCompany||norm_(r.company)===norm_(scopeCompany));
 const sh=ss.getSheetByName(cfg.students),p=readPeople_(sh),projection=readProjection_(ss,cfg);
 // Si la hoja derivada mezcla empresas, no incluirlas en la API ni en los CSV.
 const validKeys=new Set(all.filter(belongs).map(r=>r.key));
 const rows=p.rows.filter(r=>belongs(r)&&validKeys.has(r.key));
 const kept=new Set(rows.map(r=>r.key));
 const allRows=p.allRows.filter(r=>kept.has(r.key));
 return {name:cfg.name,scopeGroup,scopeCompany,scopeType:scopeCompany?'filial':'empresa-o-fondo',
  studentsSheet:cfg.students,projectionSheet:cfg.projection,
  rows,allRows,headers:p.headers,rawCount:allRows.length,duplicates:p.duplicates.filter(d=>belongs(d)),
  projection,updated:new Date().toISOString()};
}
function testConnection(){const ss=ss_(),d=getData_(ss);console.log(JSON.stringify({version:d.apiVersion,source:d.source,
  rows:d.rawCount,projections:d.financialV34.projections.length,missing:d.financialV34.missingSheets}));return d.rawCount;}
function testFinance(){const d=getData_(ss_());console.log(JSON.stringify(d.financialV34.projections.map(x=>({sheet:x.sheet,base:x.base,authorized:x.authorized,cash:x.cash})),null,2));return d.financialV34.rollup;}
function testScopes(){const ss=ss_(),scopes=discover_(ss);const bad=scopes.filter(x=>!x.hasStudents||!x.hasProjection);if(bad.length)throw Error('Hojas sin pareja: '+bad.map(x=>x.name).join(', '));console.log('OK · '+scopes.length+' pares');return scopes.length;}

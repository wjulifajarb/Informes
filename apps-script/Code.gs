/** EDUCAMÁS · API privada para la aplicación de VS Code. */
const API_VERSION = '4.7.0';
const CFG = { id:'1TkVBmU6NOCVpPkSdAUpXeUREAclVdWQnquJNh7y-bZE', sheet:'JULI-2027-1', period:'2027-1', refresh:60, minTuition:1000 };
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return json_({ok:true,service:'Educamas 2027-1',version:API_VERSION,message:'API activa. Los datos requieren una solicitud POST autenticada.'});}
function tokenOk_(provided,expected){if(!expected||expected.length<32||typeof provided!=='string'||provided.length!==expected.length)return false;let diff=0;for(let i=0;i<expected.length;i++)diff|=provided.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}
function doPost(e){
  try{
    const p=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    const secret=PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if(!tokenOk_(p.token,secret))return json_({ok:false,error:'No autorizado'});
    if(p.action==='data')return json_({ok:true,version:API_VERSION,data:getData_()});
    if(p.action==='finance'){
      // Respuesta separada para recuperar el bloque financiero ante versiones
      // previas de la interfaz. Incluye conteos de pagados y detalle nominal.
      const d=getData_();
      return json_({ok:true,version:API_VERSION,data:{apiVersion:API_VERSION,
        financialV34:d.financialV34,financialSimple:d.financialSimple,
        finance:d.finance,cartera:d.cartera,cuotas:d.cuotas}});
    }
    if(p.action==='diagnostic'){
      const f=readFinancialSimple_(ss_(),[]).financialV34;
      const r=f.summary.find(x=>x.group==='Residere');
      return json_({ok:true,version:API_VERSION,data:{version:API_VERSION,
        funds:f.summary.length,missingSheets:f.missingSheets,
        residere:{loaded:!!r?.historyDataLoaded,hasCash:r?.cash!==null&&r?.cash!==undefined,
          hasTuition:r?.tuitionBase!==null&&r?.tuitionBase!==undefined,
          hasDonation:r?.donationBase!==null&&r?.donationBase!==undefined}}});
    }
    return json_({ok:false,error:'Acción no válida'});
  }catch(err){return json_({ok:false,error:String(err.message||err).slice(0,500)});}
}
function norm_(x){return String(x==null?'':x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function val_(x){return String(x==null?'':x).trim();}
function money_(raw,display){if(typeof raw==='number'&&Number.isFinite(raw))return raw; let t=val_(display||raw).replace(/COP|\$|\s/gi,'');if(!t)return null;if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))t=t.replace(/\./g,'').replace(',','.');else if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t))t=t.replace(/,/g,'');else if(/^-?\d+,\d+$/.test(t))t=t.replace(',','.');if(!/^-?\d+(\.\d+)?$/.test(t))return null; const n=Number(t);return Number.isFinite(n)?n:null;}
function ss_(){return SpreadsheetApp.openById(CFG.id);}

/** Referencias de matrículas anticipadas: no equivalen a importes conciliados por banco. */
function referenciasAnticipadas_(ss){
  const sh=ss.getSheetByName('Aprobación anticipada');
  const map={};
  if(!sh)return map;
  const a=sh.getDataRange().getDisplayValues();
  for(let i=0;i<a.length;i++)for(let j=0;j<(a[i]||[]).length;j++){
    if(norm_(a[i][j])!=='aprobacion pago matricula anticipada')continue;
    const flagged=norm_(a[i][j-1]||'').includes('ok aprobada y pagada');
    const stop=Math.min(a.length,i+20);
    const record={nombre:'',empresa:'',importe:null,fecha:'',reportadoPagado:flagged};
    for(let k=i+1;k<stop;k++){
      if(k>i+1&&norm_(a[k]?.[j])==='aprobacion pago matricula anticipada')break;
      const label=norm_(a[k]?.[j]||''), v=val_(a[k]?.[j+1]||'');
      if(label==='nombre beneficiario - estudiante')record.nombre=v;
      else if(label==='empresa')record.empresa=v;
      else if(label==='precio de matricula')record.importe=money_(v,v);
      else if(label==='fecha pago matricula')record.fecha=v;
    }
    if(!record.nombre)continue;
    const key=norm_(record.nombre);
    const prev=map[key];
    if(!prev||(record.reportadoPagado&&!prev.reportadoPagado))map[key]=record;
  }
  return map;
}

function getData_(){
  const ss=ss_(), sh=ss.getSheetByName(CFG.sheet);if(!sh)throw Error('No existe la pestaña '+CFG.sheet);
  const n=sh.getLastRow(), w=sh.getLastColumn();if(n<2)throw Error('No se encontró la fila 2 de encabezados.');
  const range=sh.getRange(2,1,n-1,w), raw=range.getValues(), disp=range.getDisplayValues(), headers=disp[0].map(norm_), refs=referenciasAnticipadas_(ss);
  const idx=(...names)=>{for(const name of names){let i=headers.indexOf(norm_(name));if(i>=0)return i;}return -1};
  const col={group:idx('Grupo'),company:idx('Empresa'),name:idx('Nombre'),doc:idx('Número de documento'),fund:idx('Estado en el fondo'),internal:idx('Estado interno'),status:idx('Estado'),type:idx('Tipo de estudiante Antiguo/Nuevo'),relation:idx('Empleado/Familiar'),apply:idx('¿Para quién aplica?'),role:idx('Cargo actual'),guardianRole:idx('Acudiente (cargo)'),motivation:idx('Motivación'),tuition:idx('Valor aproximado de la matrícula (COP)'),program:idx('Programa / carrera a estudiar'),level:idx('Tipo de programa'),university:idx('Universidad'),requirements:idx('Cumple requisitos'),periods:idx('Periodos a pagar (2027-I)'),created:idx('Fecha de creación'),paidAmount:idx('Monto efectivamente pagado 2027-I (COP)'),paidDate:idx('Fecha de pago 2027-I'),paidSupport:idx('Soporte o referencia de pago 2027-I')};
  const required=['group','company','name','fund','status','type','relation','role','guardianRole','motivation','tuition']; const missing=required.filter(k=>col[k]<0);if(missing.length)throw Error('Encabezados no encontrados: '+missing.join(', '));
  let rows=[], allRows=[], seen=new Map(), duplicates=[], conflicts=0;
  for(let i=1;i<disp.length;i++){
    const d=disp[i],v=raw[i],get=k=>col[k]<0?'':val_(d[col[k]]); if(!get('name'))continue;
    const group=get('group')||'Sin grupo identificado';const original=get('company');const standalone=['transportes vigia','residere','educamas'].includes(norm_(group));const company=original||(standalone?group:'Sin empresa identificada');
    const relation=get('relation')||'Sin dato';const role=norm_(relation)==='familiar'?(get('guardianRole')||get('role')):(get('role')||get('guardianRole'));
    const doc=get('doc'); const identity=doc?norm_(doc):norm_(get('name'));const program=get('program');const keyRaw=[norm_(group),norm_(company),identity,norm_(program)].join('|');const key=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,keyRaw)).slice(0,24);
    const tuition=money_(v[col.tuition],d[col.tuition]);const fund=get('fund'),status=get('status');const isActive=norm_(fund)==='activo';const st=norm_(status);const paid=isActive&&st==='pagado';const stage=!isActive?'Cerrado':paid?'Pagado':st==='pre-aprobado'||st==='preaprobado'?'Preaprobado':st==='aprobado'||st==='docs completados'||st==='documentos completados'?'Aprobado':st==='inscrito'?'Inscrito':'Registro / pre-registro';
    const candidato=refs[norm_(get('name'))]||null;
    const empresaRef=norm_(candidato?.empresa||'');
    const avance=candidato&&(!empresaRef||norm_(group).includes(empresaRef)||norm_(company).includes(empresaRef)||empresaRef.includes(norm_(group))||empresaRef.includes(norm_(company)))?candidato:null;
    const pagoManual=col.paidAmount>=0?money_(v[col.paidAmount],d[col.paidAmount]):null;
    const pagoReportado=paid&&pagoManual!==null&&pagoManual>0?pagoManual:null;
    const fechaManual=get('paidDate'), soporte=get('paidSupport');
    const r={key,row:i+2,group,company,doc,paidAmount:pagoReportado,
      paidDate:fechaManual||(avance?.fecha||''),paidSupport:soporte,
      earlyReference:avance?.importe??null,earlyReferenceFlag:Boolean(avance?.reportadoPagado),
      paymentSource:pagoReportado!==null?'JULI (Finanzas)':avance?.reportadoPagado?'Aprobación anticipada (por conciliar)':'Pendiente de conciliación',
      companyInferred:!original&&standalone,name:get('name'),fund,status,stage,type:get('type')||'Sin dato',relation,apply:get('apply'),role:role||'Sin dato',motivation:get('motivation')||'Sin dato',tuition,validTuition:tuition!==null&&tuition>=CFG.minTuition,tuitionText:get('tuition'),program,level:get('level'),university:get('university'),requirements:get('requirements'),periods:get('periods'),created:get('created'),isActive,paid,duplicateConflict:false};
    allRows.push({row:i+2,key,group,company,stage:stage==='Cerrado'?(fund||status||'Cerrado'):stage,values:d.filter((x,j)=>j!==col.internal)});
    if(seen.has(key)){const prev=seen.get(key);const same=prev.stage===r.stage&&norm_(prev.fund)===norm_(r.fund)&&prev.tuition===r.tuition;duplicates.push({group,company,name:r.name,rows:[prev.row,r.row],conflict:!same});if(!same){prev.duplicateConflict=true;conflicts++;}continue;}seen.set(key,r);rows.push(r);
  }
  // Privacidad: 'Estado interno' (columna B) no sale por la API, CSV o reportes.
  // La etapa pública se calcula únicamente con A ('Estado en el fondo') y E ('Estado').
  // La API conserva las claves históricas utilizadas por la app V3.3
  // y agrega financialV34 para la vista financiera de la V3.4.
  const financial=readFinancialSimple_(ss,rows);
  return {
    apiVersion:API_VERSION,rows,allRows,
    headers:disp[0].map((h,i)=>({h,i})).filter(x=>x.i!==col.internal).map(x=>val_(x.h).replace(/\s+/g,' ')||('Columna '+(x.i+1))),
    duplicates,conflicts,rawCount:allRows.length,
    finance:financial.legacyFinance,
    cartera:financial.legacyCartera,
    cuotas:financial.legacyCuotas,
    novedades:[],
    financialV34:financial.financialV34,
    financialSimple:financial.financialSimple,
    source:CFG.sheet,period:CFG.period,minTuition:CFG.minTuition,
    refresh:CFG.refresh,updated:new Date().toISOString()
  };
}


/**
 * EDUCAMÁS | Integración financiera SIMPLE V3.8
 *
 * Lee: JULI-2027-1 (en getData_) y las 7 pestañas Proye-... existentes.
 * NO crea, borra ni modifica hojas. NO ejecuta setupFinance.
 * C24/C25/C26/C27/C28 son resultados FORMULADOS en Google Sheets.
 * Las cifras de 2026-II en amarillo son registros manuales de Finanzas.
 * Las matrículas bajo C18 están fuera de C25: la base sigue incluyendo
 * al estudiante; solo se depura provisionalmente el importe.
 *
 * Compatibilidad:
 *   data.finance, data.cartera y data.cuotas: app V3.3
 *   data.financialV34: app V3.4 (resumen, detalle, cartera e informes)
 *   data.financialSimple: objeto explícito para versiones posteriores.
 */
const PROYE_HOJAS = [
  {group:'Residere',sheet:'Proye-Residere'},
  {group:'Transportes Vigía',sheet:'Proye-Transportes Vigía'},
  {group:'Filiales Grupo Vigía',sheet:'Proye-Filiales Vigía'},
  {group:'Grupo Falic',sheet:'Proye-Grupo Falic'},
  {group:'Grupo Ventura',sheet:'Proye-Grupo Ventura'},
  {group:'Grupo Bergé Colombia',sheet:'Proye-Grupo Bergé'},
  {group:'EducaMás',sheet:'Proye-EducaMás'}
];

/**
 * V4.7 · Proyecciones INDIVIDUALES del grupo Filiales Grupo Vigía.
 * El fondo financiero del grupo continúa en PROYE_HOJAS / summary (7 fondos).
 * Estas proyecciones son DESGLOSES de costo: no tienen saldo ni donación neta propia.
 * Leer exclusivamente. Nunca cambia datos ni fórmulas de Sheets.
 */
const PROYE_FILIALES = [
  {group:'Filiales Grupo Vigía',company:'Pharitech (Transportes Vigía)',sheet:'Proye · Pharitech',peopleSheet:'Filial · Pharitech'},
  {group:'Filiales Grupo Vigía',company:'Phari SAS (Transportes Vigía)',sheet:'Proye · Phari SAS',peopleSheet:'Filial · Phari SAS'},
  {group:'Filiales Grupo Vigía',company:'Vigía Transportes Especial (Transportes Vigía)',sheet:'Proye · Vigía Especial',peopleSheet:'Filial · Vigía Especial'},
  {group:'Filiales Grupo Vigía',company:'Vlogic (Transportes Vigía)',sheet:'Proye · Vlogic',peopleSheet:'Filial · Vlogic'},
  {group:'Filiales Grupo Vigía',company:'Enérgika (Transportes Vigía)',sheet:'Proye · Enérgika',peopleSheet:'Filial · Enérgika'},
  {group:'Filiales Grupo Vigía',company:'Sin empresa identificada',sheet:'Proye · Sin empresa',peopleSheet:'Filial · Sin empresa'}
];

/** Convierte valores de B1:H130 en proyecciones utilizables por la web V4.7. */
function readFilialProjections_(ss,people){
  const result=[],missing=[];
  // Solo agregado global. Se muestra como referencia para evitar repartirlo o duplicarlo.
  const master=ss.getSheetByName('Proye-Filiales Vigía');
  const commonCash=master?numFinance_(master.getRange('C17').getValue()):null;
  PROYE_FILIALES.forEach(function(cfg){
    const sh=ss.getSheetByName(cfg.sheet);
    const personSheet=ss.getSheetByName(cfg.peopleSheet);
    if(!sh){missing.push(cfg.sheet);return;}
    if(!personSheet)missing.push(cfg.peopleSheet);
    const grid=sh.getRange('B1:H130').getValues();
    const col={B:0,C:1,D:2,E:3,F:4,G:5,H:6};
    const raw=function(row,letter){const i=col[letter||'C'];return grid[row-1]?.[i];};
    const n=function(row,letter){return numFinance_(raw(row,letter));};
    const isSameCompany=r=>norm_(r.group)===norm_(cfg.group)&&norm_(r.company)===norm_(cfg.company);
    const ppl=(people||[]).filter(isSameCompany);
    const active=ppl.filter(r=>r.isActive);
    const paid=active.filter(r=>norm_(r.status)==='pagado');
    const confirmedPaid=paid.filter(r=>r.paidAmount!==null&&r.paidAmount>0);
    const invalid=n(29)||0;
    const gross=n(28); // COSTO BRUTO individual (matrícula + fee), NO donación neta.
    const paidTuition=confirmedPaid.length?sumValid_(confirmedPaid.map(r=>r.paidAmount)):null;
    const feePaid=n(20)!==null?paid.length*n(20):null;
    const referencePaid=paid.filter(r=>r.tuition!==null);
    result.push({
      group:cfg.group,company:cfg.company,sheet:cfg.sheet,peopleSheet:cfg.peopleSheet,
      // Diferenciar origen y alcance del dinero para que nunca se descuente dos veces.
      scope:'individual',fundSheet:'Proye-Filiales Vigía',sharedFund:true,
      sharedCash:commonCash!==null?commonCash:n(17),allocatedCash:null,
      donationBase:null,donationFinal:null,
      records:ppl.length,active:active.length,
      universe:ppl.filter(isUniverseFinancial_).length,
      paidCount:paid.length,paidAmountReported:paidTuition,
      paidCountWithAmount:confirmedPaid.length,
      paidToConfirm:paid.length-confirmedPaid.length,
      paidTuitionReference:referencePaid.length?sumValid_(referencePaid.map(r=>r.tuition)):null,
      paidFeeEstimated:feePaid,
      paidProvisionReference:referencePaid.length&&feePaid!==null?
        sumValid_(referencePaid.map(r=>r.tuition))+feePaid:null,
      paidAmountPlusFeeConfirmed:paid.length&&confirmedPaid.length===paid.length&&feePaid!==null?
        paidTuition+feePaid:null,
      // Importes individuales provenientes de sus propias fórmulas C24:C29.
      base:n(24),tuitionBase:n(25),feeBase:n(26),costGross:gross,
      unitFee:n(20),threshold:n(18),invalidTuitionCount:invalid,
      finalApproved:n(24,'F'),authorized:n(25,'F'),feeFinal:n(26,'F'),costFinalGross:n(28,'F'),
      validation:invalid>0?'Revisar '+invalid+' matrícula(s) antes de validar el costo':
        'Proyección de filial sin alertas de matrícula',
      // C33:C52 son HISTÓRICOS DEL GRUPO, mostrados solo como referencia.
      portfolioScope:'grupo',portfolioShared:{
        totalRecoverable:n(37),collected:n(39),recoveredPercent:n(40),pending:n(41),
        scheduled:n(51),difference:n(52)
      },
      cells:{C17:n(17),C18:n(18),C20:n(20),C24:n(24),C25:n(25),
        C26:n(26),C28:gross,C29:n(29),F24:n(24,'F'),F25:n(25,'F'),
        F26:n(26,'F'),F28:n(28,'F'),C124:n(124),E124:n(124,'E'),
        C125:n(125),E125:n(125,'E')},
      notes:'Costo de esta empresa antes de distribuir el fondo del grupo. '+
        'El saldo de 2027-I y la cartera son compartidos; la donación NETA '+
        'se calcula una sola vez en Proye-Filiales Vigía. '+
        (invalid>0?'Hay matrículas sin valor válido: el subtotal de la filial está incompleto.':'')
    });
  });
  return {items:result,missingSheets:missing};
}

function numFinance_(x){
  if(x===null||x===undefined||x==='')return null;
  return money_(x,x);
}
function sumValid_(arr){return arr.reduce((n,x)=>n+(x||0),0);}
function isBaseFinancial_(r){
  return norm_(r.fund)==='activo'&&[
    'pre-aprobado','aprobado','docs completados'
  ].indexOf(norm_(r.status))>=0;
}
function isReviewFinancial_(r){
  return norm_(r.fund)==='activo'&&norm_(r.status)==='inscrito';
}
function isUniverseFinancial_(r){
  return ['inscrito','pre-aprobado','aprobado','pagado','docs completados']
    .indexOf(norm_(r.status))>=0;
}
function readFinancialSimple_(ss,people){
  const missing=[],summary=[],history=[],companies=[],quotas=[],detail=[],paidDetail=[];
  const legacyFinance=[],legacyCartera=[],legacyCuotas=[],models=[];
  if(!ss.getSheetByName('Consolidado'))missing.push('Consolidado');
  if(!ss.getSheetByName(CFG.sheet))missing.push(CFG.sheet);

  PROYE_HOJAS.forEach(function(cfg){
    const sh=ss.getSheetByName(cfg.sheet);
    if(!sh){missing.push(cfg.sheet);return;}
    // El modelo creado tiene las cifras y entradas manuales en B:G.
    // Basta leer esas 54 filas, no los 400 registros de cada empresa.
    const t=sh.getRange('B1:G54').getValues();
    const raw=function(row,column){
      const index={B:0,C:1,D:2,E:3,F:4,G:5}[column||'C'];
      return t[row-1]&&t[row-1][index];
    };
    const n=function(row,column){return numFinance_(raw(row,column));};
    const txt=function(row,column){return val_(raw(row,column));};
    const group=cfg.group;
    const groupSheet=ss.getSheetByName(group);
    if(!groupSheet)missing.push(group);
    if(norm_(txt(1,'B'))!==norm_(group))missing.push(cfg.sheet+' (nombre de fondo inesperado)');

    const gPeople=(people||[]).filter(r=>norm_(r.group)===norm_(group));
    const threshold=n(18)===null?100000:n(18);
    const unitFee=n(20);
    const basePeople=gPeople.filter(isBaseFinancial_);
    const reviewPeople=gPeople.filter(isReviewFinancial_);
    const paidPeople=gPeople.filter(r=>r.paid);
    const paidConfirmed=paidPeople.filter(r=>r.paidAmount!==null);
    const paidEstimated=paidPeople.filter(r=>typeof r.tuition==='number'&&r.tuition>0);
    const paidApproval=paidPeople.filter(r=>r.earlyReferenceFlag&&r.earlyReference!==null);
    const paidAmountReported=paidConfirmed.length?sumValid_(paidConfirmed.map(r=>r.paidAmount)):null;
    const paidTuitionReference=paidEstimated.length?sumValid_(paidEstimated.map(r=>r.tuition)):null;
    const paidApprovalReference=paidApproval.length?sumValid_(paidApproval.map(r=>r.earlyReference)):null;
    const amountOk=r=>typeof r.tuition==='number'&&r.tuition>=threshold&&!r.duplicateConflict;
    const reviewTuition=sumValid_(reviewPeople.filter(amountOk).map(r=>r.tuition));
    const tuitionBase=n(25);     // resultado calculado por fórmula en la hoja
    const tuitionReview=people&&people.length?reviewTuition:null;
    const countBase=n(24);      // incluye casos con matrículas no utilizables
    const feeBase=n(26);       // C24 x tarifa C20, igual que en Sheets
    const cash=n(17);          // fondo disponible EFECTIVO, no F16
    const recoveredPending=n(16,'F');  // aún no confirmado, NO caja
    const feeExpanded=unitFee===null||countBase===null||!people||!people.length?
      null:(countBase+reviewPeople.length)*unitFee;
    const donationExpanded=cash===null||tuitionBase===null||tuitionReview===null||feeExpanded===null?
      null:Math.max(0,tuitionBase+tuitionReview+feeExpanded-cash);
    // V3.8: F2 NO es un campo de validación. Antes se leía F2 (vacía)
    // y todas las empresas aparecían como «Pendiente» aunque C6:C17
    // incluyeran datos, como sucede en Residere.
    // Distinguir 'datos cargados' de 'certificación por Finanzas':
    // el sistema NO puede certificar por sí mismo un valor ingresado.
    const historicInputs=[
      {cell:'C6',label:'Disponible 2026-I',value:n(6)},
      {cell:'C7',label:'Donación 2026-II',value:n(7)},
      {cell:'C10',label:'Matrículas pagadas 2026-II',value:n(10)},
      {cell:'C11',label:'Administración 2026-II',value:n(11)}
    ];
    const filled=historicInputs.filter(x=>x.value!==null);
    const pendingFields=historicInputs.filter(x=>x.value===null).map(x=>x.cell+' '+x.label);
    const validation=filled.length===0?'Pendiente de diligenciar':
      pendingFields.length?'Parcial: '+filled.length+'/4 datos históricos':
      'Datos cargados · sujetos a validación de Finanzas';
    const historyDataLoaded=filled.length>0;
    const nInvalid=n(29);
    const info='Datos financieros del modelo '+cfg.sheet+
      '. Tarifa y cifras 2026-II editables por Finanzas. '+
      'No se deducen abonos, prima ni cesantías no confirmados.';

    const item={
      group,company:'',sheet:cfg.sheet,
      universe:people&&people.length?gPeople.filter(isUniverseFinancial_).length:null,
      review:people&&people.length?reviewPeople.length:null,
      base:countBase,tuitionBase,tuitionReview,unitFee,feeBase,
      feeExpanded,cash,cashPotential:cash!==null&&recoveredPending!==null?cash+recoveredPending:null,
      donationBase:n(28),donationExpanded,
      finalApproved:n(24,'F'),authorized:n(25,'F'),paid:paidAmountReported,
      paidCount:paidPeople.length,paidAmountReported,
      paidTuitionReference,paidApprovalReference,
      paidCountWithAmount:paidConfirmed.length,paidToConfirm:paidPeople.length-paidConfirmed.length,
      invalidTuitionCount:nInvalid,threshold,
      deltaCartera:n(52),validation,historyDataLoaded,pendingFields,
      cells:{C6:n(6),C7:n(7),C8:n(8),C10:n(10),C11:n(11),C12:n(12),C14:n(14),C16:n(16),C17:n(17),C18:n(18),C20:n(20),C24:n(24),C25:n(25),C26:n(26),C27:n(27),C28:n(28),C29:n(29),C33:n(33),C34:n(34),C35:n(35),C36:n(36),C37:n(37),C39:n(39),C40:n(40),C41:n(41),C51:n(51),C52:n(52)},
      notes:info
    };
    summary.push(item);

    const h={
      group,initial:n(6),donation2026:n(7),
      tuitionPaid2026:n(10),admin2026:n(11),
      cashRecovered:n(16),unreconciled:recoveredPending,
      cash, cashPotential:item.cashPotential,
      carteraTuition:n(33),uncollectableBenefits:n(34),
      cartera2026:n(35),previousDue:n(36),totalDue:n(37),
      collected:n(39),collectedPct:n(40),outstanding:n(41),
      unitFee,cutoff:'2026-II',owner:'',validated:validation,historyDataLoaded,pendingFields,
      notes:txt(16,'D')||'Histórico pendiente de validar con Finanzas.'
    };
    history.push(h);

    // Formato histórico: preserva la interfaz financiera actual (V3.3).
    legacyFinance.push({
      group,company:'',cutoff:'2026-II',
      balance:cash,fee:unitFee,cost:null,recovery:null,
      collected:n(39),outstanding:n(41),
      portfolio:'Histórico 2026-II. '+validation,
      news:nInvalid&&nInvalid>0?nInvalid+' matrículas por revisar':'Sin alertas de importe',
      notes:info,donations:n(7),paidTuition:n(10),paidFee:n(11)
    });
    legacyCartera.push({
      group,company:'',cells:['2026-II',n(33),n(34),n(36),n(39)],
      numbers:[null,null,null,n(33),n(34),n(36),n(39)]
    });

    // Cuotas manuales en la sección 3 de la hoja Proye-...
    for(let r=45;r<=50;r++){
      const value=n(r),label=txt(r,'B'),obs=txt(r,'D');
      if(value===null&&!obs)continue;
      const kind=/prima/i.test(label)?'Prima':/cesant/i.test(label)?'Cesantías':'Nómina / cuota';
      quotas.push({group,reference:group,type:kind,period:label,
        scheduled:value,collected:null,pending:value,expected:'',status:'Pendiente de conciliar',notes:obs,support:''});
      legacyCuotas.push({group,company:'',cells:[label,value],numbers:[null,null,null,value]});
    }

    // Detalle y desglose se generan desde los MISMOS registros de JULI que usa
    // la pantalla, sin requerir que las personas se digiten de nuevo.
    const byCompany={};
    gPeople.forEach(function(p){
      const comp=p.company||'Sin empresa identificada';
      if(!byCompany[comp])byCompany[comp]={group,company:comp,records:0,base:0,review:0,paidCount:0,paidAmountReported:null,paidTuitionReference:null};
      const row=byCompany[comp];
      if(p.doc)row.records++;
      const isBase=isBaseFinancial_(p),isRev=isReviewFinancial_(p);
      const valid=amountOk(p),fee=valid?p.tuition:null;
      if(isBase&&fee!==null)row.base+=fee;
      if(isRev&&fee!==null)row.review+=fee;
      if(p.paid){
        row.paidCount++;
        if(p.paidAmount!==null)row.paidAmountReported=(row.paidAmountReported||0)+p.paidAmount;
        if(typeof p.tuition==='number'&&p.tuition>0)row.paidTuitionReference=(row.paidTuitionReference||0)+p.tuition;
        paidDetail.push({group,company:comp,name:p.name,status:p.status,
          tuitionReference:p.tuition,earlyReference:p.earlyReference,
          earlyReferenceFlag:p.earlyReferenceFlag,paidAmount:p.paidAmount,
          paidDate:p.paidDate,paymentSupport:p.paidSupport,
          paymentSource:p.paymentSource,sourceRow:p.row});
      }
      if(!(isBase||isRev||p.paid))return;
      let stage=isBase?'Base':isRev?'Revisión':'Pagado';
      let reason=stage==='Pagado'?'Matrícula ya pagada: no sumar de nuevo':
        valid?'Valor aproximado pendiente de validación':
        'Revisar matrícula en JULI: vacía, menor al umbral o posible duplicado';
      detail.push({
        group,company:comp,name:p.name,doc:p.doc||'',type:p.type,
        status:p.status,stage,program:p.program,tuition:p.tuition,
        abono:null,cesantias:null,prima:null,
        approval:'Pendiente de aprobación final empresa',authorized:null,paid:p.paidAmount,paidReference:p.earlyReference,paidDate:p.paidDate,paymentSupport:p.paidSupport,
        base:isBase&&fee!==null?fee:0,
        review:isRev&&fee!==null?fee:0,note:reason,
        sourceRow:p.row,sourceTab:CFG.sheet
      });
    });
    Object.keys(byCompany).sort().forEach(k=>companies.push(byCompany[k]));
    models.push({group,sheet:cfg.sheet,
      original:'JULI-2027-1 → Consolidado → '+group+' → '+cfg.sheet,
      historyDataLoaded,pendingFields,
      fund2026:{initial:n(6),donation:n(7),paid:n(10),administrative:n(11),availableBeforeRecovery:n(14),recoveredConfirmed:n(16),unreconciled:recoveredPending,availableFor2027:cash},
      paid2027:{count:paidPeople.length,montoReportado:paidAmountReported,montoReferencialMatricula:paidTuitionReference,montoReferenciaAnticipada:paidApprovalReference,confirmadosEnJuli:paidConfirmed.length,porConfirmar:paidPeople.length-paidConfirmed.length},
      projection2027:{tuitionBase,peopleBase:countBase,adminFeeUnit:unitFee,adminTotal:feeBase,donationNeeded:n(28),approvedByCompany:n(24,'F'),authorizedByCompany:n(25,'F'),donationAfterApproval:n(28,'F'),invalidTuitionCount:nInvalid,minimumTuition:threshold},
      portfolio2026:{tuition:n(33),benefits:n(34),recoverable:n(35),previous:n(36),total:n(37),recovered:n(39),recoveredPct:n(40),pending:n(41),installmentsPending:n(51),difference:n(52)},
      validation
    });
  });

  // V4.7: proyecciones adicionales; NO se agregan a summary, history ni a
  // los 7 fondos originales. Los costos de las filiales ya están dentro del grupo.
  const filiales=readFilialProjections_(ss,people);

  const warning='Cifras 2026-II manuales y sujetas a validación de Finanzas. '+
    'C25 excluye provisionalmente matrículas por debajo de C18. '+
    'Los pagos con Estado=Pagado se listan por separado. Solo BH de JULI es monto efectivamente reportado por Finanzas; el precio de matrícula anticipada es referencia, no un importe bancario conciliado. '+
    'El saldo 2026-II no se descuenta nuevamente por pagos 2027-I sin conciliación contable. '+
    'Recaudos por conciliar (F16) NO son efectivo disponible.';
  return {
    legacyFinance,legacyCartera,legacyCuotas,
    financialV34:{summary,history,companies,quotas,detail,paidDetail,
      filialProjections:filiales.items,missingFilialSheets:filiales.missingSheets,
      source:'JULI-2027-1 + Aprobación anticipada (referencia) + Consolidado + hojas Proye-...',
      missingSheets:missing,warning},
    financialSimple:{groups:models,filials:filiales.items,
      missingFilialSheets:filiales.missingSheets,missingSheets:missing,warning}
  };
}

/** Probar desde el editor: no modifica Google Sheets ni revela datos personales. */
function testConnection(){
  const d=getData_();
  console.log('Conexión: '+d.rawCount+' postulaciones en '+d.source);
  console.log('Fondos financieros: '+d.financialV34.summary.length);
  console.log('Hojas no encontradas: '+JSON.stringify(d.financialV34.missingSheets));
  return d.rawCount;
}
function testFinance(){
  const f=readFinancialSimple_(ss_(),[]);
  const s=f.financialV34.summary.map(x=>({
    group:x.group,base:x.base,tuitionBase:x.tuitionBase,
    feeBase:x.feeBase,cash:x.cash,donationBase:x.donationBase,
    invalidTuitionCount:x.invalidTuitionCount,paidCount:x.paidCount,paidAmountReported:x.paidAmountReported,validation:x.validation
  }));
  console.log(JSON.stringify(s,null,2));
  console.log('Hojas faltantes: '+JSON.stringify(f.financialV34.missingSheets));
  return s;
}

/** Diagnóstico puntual: no modifica el libro ni reescribe fórmulas. */
function testResidereFinance(){
  const ss=ss_(),sh=ss.getSheetByName('Proye-Residere');
  if(!sh)throw Error('Falta Proye-Residere');
  const f=readFinancialSimple_(ss,[]);
  const r=f.financialV34.summary.find(x=>x.group==='Residere');
  if(!r)throw Error('No se generó el fondo Residere');
  const diagnostic={source:r.sheet,loaded:r.historyDataLoaded,
    validation:r.validation,missing:r.pendingFields,cells:r.cells,
    missingSheets:f.financialV34.missingSheets};
  console.log(JSON.stringify(diagnostic,null,2));
  if(r.cells.C17===null)console.warn('C17 no devolvió saldo: revisar fórmula o entradas de Residere.');
  if(r.cells.C28===null)console.warn('C28 no devolvió donación: revisar saldo y proyección.');
  return diagnostic;
}

/** Prueba adicional V3.9: verifica que la API expone todos los fondos. */
function testV39(){
  const d=getData_();
  const f=d.financialV34;
  const r=f.summary.find(x=>x.group==='Residere');
  const result={version:API_VERSION,rows:d.rawCount,
    funds:f.summary.length,missingSheets:f.missingSheets,
    residere:r?{historyLoaded:r.historyDataLoaded,cash:r.cash,
      tuition:r.tuitionBase,donation:r.donationBase}:null};
  console.log(JSON.stringify(result,null,2));
  if(f.summary.length!==7)throw Error('No se encontraron los 7 fondos: revisar hojas Proye-*');
  if(!r||r.cash===null||r.donationBase===null)throw Error('Residere no trae C17/C28');
  return result;
}


/**
 * Prueba V4.7: lectura de las seis proyecciones y conciliación con el grupo.
 * No escribe ni cambia nada en Google Sheets, no incluye datos personales.
 */
function testFilialesV47(){
  const d=getData_();
  const f=d.financialV34;
  const g=f.summary.find(x=>norm_(x.group)==='filiales grupo vigia');
  const items=f.filialProjections||[];
  if(items.length!==PROYE_FILIALES.length)
    throw Error('Faltan proyecciones de filiales: '+JSON.stringify(f.missingFilialSheets));
  if(!g)throw Error('No se encontró el fondo financiero consolidado de Filiales');
  const sum=function(field){return sumValid_(items.map(x=>x[field]));};
  const result={version:API_VERSION,funds:f.summary.length,
    filials:items.length,missingFilialSheets:f.missingFilialSheets,
    grupo:{base:g.base,tuition:g.tuitionBase,fee:g.feeBase,cash:g.cash},
    filiales:{base:sum('base'),tuition:sum('tuitionBase'),fee:sum('feeBase')},
    detalle:items.map(x=>({company:x.company,base:x.base,
      tuition:x.tuitionBase,fee:x.feeBase,costGross:x.costGross,
      invalid:x.invalidTuitionCount,allocatedCash:x.allocatedCash}))};
  console.log(JSON.stringify(result,null,2));
  if(f.summary.length!==7)throw Error('Se alteró el conteo de los 7 fondos originales');
  if(result.grupo.base!==result.filiales.base||
     Math.abs(result.grupo.tuition-result.filiales.tuition)>0.01||
     Math.abs(result.grupo.fee-result.filiales.fee)>0.01)
    throw Error('Los subtotales de filiales no coinciden con el fondo grupal');
  return result;
}

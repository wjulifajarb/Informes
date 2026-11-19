/** EDUCAMÁS · API privada para la aplicación de VS Code. */
const CFG = { id:'1TkVBmU6NOCVpPkSdAUpXeUREAclVdWQnquJNh7y-bZE', sheet:'JULI-2027-1', finance:'FONDOS-2027-1', period:'2027-1', refresh:60, minTuition:1000 };
const FIN = ['Grupo','Empresa','Corte','Saldo neto disponible','Fee por estudiante','Costo convocatoria pendiente','Recuperación adicional proyectada','Cartera recuperada','Cartera pendiente','Observaciones cartera','Novedades cartera','Notas del fondo','Donaciones recibidas','Matrículas pagadas descontadas','Fee pagado descontado'];
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return json_({ok:true,service:'Educamas 2027-1 V3',message:'API activa. Los datos requieren una solicitud POST autenticada.'});}
function tokenOk_(provided,expected){if(!expected||expected.length<32||typeof provided!=='string'||provided.length!==expected.length)return false;let diff=0;for(let i=0;i<expected.length;i++)diff|=provided.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}
function doPost(e){
  try{
    const p=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    const secret=PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if(!tokenOk_(p.token,secret))return json_({ok:false,error:'No autorizado'});
    if(p.action==='data')return json_({ok:true,data:getData_()});
    return json_({ok:false,error:'Acción no válida'});
  }catch(err){return json_({ok:false,error:String(err.message||err).slice(0,500)});}
}
function norm_(x){return String(x==null?'':x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function val_(x){return String(x==null?'':x).trim();}
function money_(raw,display){if(typeof raw==='number'&&Number.isFinite(raw))return raw; let t=val_(display||raw).replace(/COP|\$|\s/gi,'');if(!t)return null;if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))t=t.replace(/\./g,'').replace(',','.');else if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t))t=t.replace(/,/g,'');else if(/^-?\d+,\d+$/.test(t))t=t.replace(',','.');if(!/^-?\d+(\.\d+)?$/.test(t))return null; const n=Number(t);return Number.isFinite(n)?n:null;}
function ss_(){return SpreadsheetApp.openById(CFG.id);}
function getData_(){
  const ss=ss_(), sh=ss.getSheetByName(CFG.sheet);if(!sh)throw Error('No existe la pestaña '+CFG.sheet);
  const n=sh.getLastRow(), w=sh.getLastColumn();if(n<2)throw Error('No se encontró la fila 2 de encabezados.');
  const range=sh.getRange(2,1,n-1,w), raw=range.getValues(), disp=range.getDisplayValues(), headers=disp[0].map(norm_);
  const idx=(...names)=>{for(const name of names){let i=headers.indexOf(norm_(name));if(i>=0)return i;}return -1};
  const col={group:idx('Grupo'),company:idx('Empresa'),name:idx('Nombre'),doc:idx('Número de documento'),fund:idx('Estado en el fondo'),internal:idx('Estado interno'),status:idx('Estado'),type:idx('Tipo de estudiante Antiguo/Nuevo'),relation:idx('Empleado/Familiar'),apply:idx('¿Para quién aplica?'),role:idx('Cargo actual'),guardianRole:idx('Acudiente (cargo)'),motivation:idx('Motivación'),tuition:idx('Valor aproximado de la matrícula (COP)'),program:idx('Programa / carrera a estudiar'),level:idx('Tipo de programa'),university:idx('Universidad'),requirements:idx('Cumple requisitos'),periods:idx('Periodos a pagar (2027-I)'),created:idx('Fecha de creación')};
  const required=['group','company','name','fund','internal','status','type','relation','role','guardianRole','motivation','tuition']; const missing=required.filter(k=>col[k]<0);if(missing.length)throw Error('Encabezados no encontrados: '+missing.join(', '));
  let rows=[], allRows=[], seen=new Map(), duplicates=[], conflicts=0;
  for(let i=1;i<disp.length;i++){
    const d=disp[i],v=raw[i],get=k=>col[k]<0?'':val_(d[col[k]]); if(!get('name'))continue;
    const group=get('group')||'Sin grupo identificado';const original=get('company');const standalone=['transportes vigia','residere','educamas'].includes(norm_(group));const company=original||(standalone?group:'Sin empresa identificada');
    const relation=get('relation')||'Sin dato';const role=norm_(relation)==='familiar'?(get('guardianRole')||get('role')):(get('role')||get('guardianRole'));
    const doc=get('doc'); const identity=doc?norm_(doc):norm_(get('name'));const program=get('program');const keyRaw=[norm_(group),norm_(company),identity,norm_(program)].join('|');const key=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,keyRaw)).slice(0,24);
    const tuition=money_(v[col.tuition],d[col.tuition]);const fund=get('fund'),internal=get('internal'),status=get('status');const isActive=norm_(fund)==='activo'; const paid=isActive&&norm_(status)==='pagado'; const stage=!isActive?'Cerrado':paid?'Pagado':norm_(internal)==='aprobada'?'Aprobado':norm_(internal)==='preaprobada'?'Preaprobado':norm_(internal)==='pendiente_revision'||(!internal&&norm_(status)==='inscrito')?'En revisión':'Registro / pre-registro';
    const r={key,row:i+2,group,company,companyInferred:!original&&standalone,name:get('name'),fund,internal,status,stage,type:get('type')||'Sin dato',relation,apply:get('apply'),role:role||'Sin dato',motivation:get('motivation')||'Sin dato',tuition,validTuition:tuition!==null&&tuition>=CFG.minTuition,tuitionText:get('tuition'),program,level:get('level'),university:get('university'),requirements:get('requirements'),periods:get('periods'),created:get('created'),isActive,paid,duplicateConflict:false};
    allRows.push({row:i+2,key,group,company,stage:stage==='Cerrado'?(fund||status||'Cerrado'):stage,values:d});
    if(seen.has(key)){const prev=seen.get(key);const same=prev.stage===r.stage&&norm_(prev.fund)===norm_(r.fund)&&prev.tuition===r.tuition;duplicates.push({group,company,name:r.name,rows:[prev.row,r.row],conflict:!same});if(!same){prev.duplicateConflict=true;conflicts++;}continue;}seen.set(key,r);rows.push(r);
  }
  return {rows,allRows,headers:disp[0].map((h,i)=>val_(h).replace(/\s+/g,' ')||('Columna '+(i+1))),duplicates,conflicts,rawCount:allRows.length,finance:readFinance_(ss),cartera:readExtra_(ss,'CARTERA-2027-1',CARTERA),cuotas:readExtra_(ss,'CUOTAS-CARTERA-2027-1',CUOTAS),novedades:readExtra_(ss,'NOVEDADES-CARTERA-2027-1',NOVEDADES),source:CFG.sheet,period:CFG.period,minTuition:CFG.minTuition,refresh:CFG.refresh,updated:new Date().toISOString()};
}
function readFinance_(ss){const sh=ss.getSheetByName(CFG.finance);if(!sh)return [];const vals=sh.getDataRange().getValues(),d=sh.getDataRange().getDisplayValues();if(!vals.length||FIN.some((h,i)=>norm_(vals[0][i])!==norm_(h)))throw Error('Revisa encabezados de '+CFG.finance+'; usa setupFinance para una hoja nueva.');return vals.slice(1).map((r,i)=>({group:val_(r[0]),company:val_(r[1]),cutoff:val_(d[i+1][2]),balance:money_(r[3],d[i+1][3]),fee:money_(r[4],d[i+1][4]),cost:money_(r[5],d[i+1][5]),recovery:money_(r[6],d[i+1][6]),collected:money_(r[7],d[i+1][7]),outstanding:money_(r[8],d[i+1][8]),portfolio:val_(r[9]),news:val_(r[10]),notes:val_(r[11]),donations:money_(r[12],d[i+1][12]),paidTuition:money_(r[13],d[i+1][13]),paidFee:money_(r[14],d[i+1][14])})).filter(r=>r.group);}
/** Ejecutar manualmente una vez desde el editor. No toca JULI-2027-1. */
function setupBaseFinance_(){const ss=ss_();if(ss.getSheetByName(CFG.finance))return 'La hoja ya existe; no se cambió.';const sh=ss.insertSheet(CFG.finance);sh.getRange(1,1,1,FIN.length).setValues([FIN]).setBackground('#202020').setFontColor('#FFD000').setFontWeight('bold').setWrap(true);sh.setFrozenRows(1);sh.setRowHeight(1,48);sh.setColumnWidths(1,FIN.length,170);sh.setColumnWidths(10,3,300);sh.getRange('D2:I1000').setNumberFormat('#,##0.00');sh.getRange('M2:O1000').setNumberFormat('#,##0.00');sh.getRange(2,1,1,FIN.length).setValues([['Transportes Vigía','','',151099193,782995,'','','','','','','Saldo calculado de las donaciones informadas; validar corte y demás movimientos.',180045303,26597125,2348985]]);return 'Hoja financiera creada. Completa los valores por grupo o empresa.';}

const CARTERA=['Grupo','Empresa','Corte','Pago matrículas 2026-2','Becas aprobadas','Vigencias anteriores','Recuperado'];
const CUOTAS=['Grupo','Empresa','Rubro','Valor pendiente'];
const NOVEDADES=['Grupo','Empresa','Nombre / referencia','Vigencia','Saldo','Probabilidad de recuperación','Observaciones'];
function readExtra_(ss,name,headers){const sh=ss.getSheetByName(name);if(!sh)return [];const data=sh.getDataRange().getValues(),d=sh.getDataRange().getDisplayValues();if(headers.some((h,i)=>norm_(data[0][i])!==norm_(h)))throw Error('Encabezados incorrectos en '+name);return data.slice(1).map((r,i)=>({group:val_(r[0]),company:val_(r[1]),cells:d[i+1].slice(2,headers.length),numbers:r.map((v,j)=>money_(v,d[i+1][j]))})).filter(r=>r.group);}
function setupFinance(){const ss=ss_();setupBaseFinance_();[[ 'CARTERA-2027-1',CARTERA],['CUOTAS-CARTERA-2027-1',CUOTAS],['NOVEDADES-CARTERA-2027-1',NOVEDADES]].forEach(([name,h])=>{if(ss.getSheetByName(name))return;const sh=ss.insertSheet(name);sh.getRange(1,1,1,h.length).setValues([h]).setBackground('#202020').setFontColor('#FFD000').setFontWeight('bold').setWrap(true);sh.setFrozenRows(1);sh.setColumnWidths(1,h.length,190);});return 'Hojas financieras listas; JULI-2027-1 no se modificó.';}
function testConnection(){const data=getData_();console.log('Conexión correcta. Filas: '+data.rawCount+' / '+data.source);return data.rawCount;}

'use strict';
const crypto = require('node:crypto');
const TTL = 8 * 60 * 60;
const COOKIE = 'educamas_session';
function eq(a,b){const x=crypto.createHash('sha256').update(String(a)).digest(),y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y)}
function sign(value){return crypto.createHmac('sha256',process.env.SESSION_SECRET||process.env.APPS_SCRIPT_TOKEN).update(value).digest('base64url')}
function session(){const body=`${Math.floor(Date.now()/1000)+TTL}.${crypto.randomBytes(18).toString('base64url')}`;return `${body}.${sign(body)}`}
function authorized(req){const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!value)return false;const [expiry,nonce,sig,...rest]=value.split('.');return rest.length===0&&!!nonce&&!!sig&&Number(expiry)>Math.floor(Date.now()/1000)&&eq(sig,sign(`${expiry}.${nonce}`))}
function cookie(req,value,maxAge){return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.VERCEL||req.headers['x-forwarded-proto']==='https'?'; Secure':''}`}
function send(res,status,obj){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(obj))}
async function body(req){if(req.body&&typeof req.body==='object')return req.body;if(typeof req.body==='string')return JSON.parse(req.body);let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>1_000_000)throw Error('Solicitud demasiado grande');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}
function configured(){return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(process.env.APPS_SCRIPT_URL||'')&&(process.env.APPS_SCRIPT_TOKEN||'').length>=32&&(process.env.APP_PASSWORD||'').length>=14&&(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length>=32)}
// Best-effort local throttle only. For public production use organizational SSO or a managed rate limiter.
const attempts=new Map();
function rateLimited(req){const key=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);const v=attempts.get(key)||{count:0,until:now+60_000};v.count++;attempts.set(key,v);return v.count>8}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{ok:false,error:'Método no permitido'});
  if(!configured())return send(res,503,{ok:false,error:'Falta configurar las variables de entorno del servidor. Revisa el README.'});
  // Same-origin only. No CORS, token never reaches browser.
  const origin=req.headers.origin;const host=req.headers.host;try{if(origin&&new URL(origin).host!==host)return send(res,403,{ok:false,error:'Origen no autorizado'});}catch{return send(res,403,{ok:false,error:'Origen no autorizado'})}
  let p;try{p=await body(req)}catch{return send(res,400,{ok:false,error:'Solicitud inválida'})}
  if(!p||typeof p!=='object')return send(res,400,{ok:false,error:'Solicitud inválida'});
  if(p.action==='login'){
    if(rateLimited(req))return send(res,429,{ok:false,error:'Demasiados intentos. Intenta más tarde.'});
    if(typeof p.password!=='string'||!eq(p.password,process.env.APP_PASSWORD))return send(res,401,{ok:false,error:'Contraseña incorrecta'});
    res.setHeader('Set-Cookie',cookie(req,session(),TTL));return send(res,200,{ok:true});
  }
  if(p.action==='logout'){res.setHeader('Set-Cookie',cookie(req,'',0));return send(res,200,{ok:true})}
  if(!authorized(req))return send(res,401,{ok:false,error:'Inicia sesión de nuevo'});
  if(p.action==='session')return send(res,200,{ok:true});
  if(!['data','scope','finance','diagnostic','export'].includes(p.action))return send(res,400,{ok:false,error:'Acción no válida'});
  if(p.action==='export'&&(!['pptx','pdf'].includes(p.format)||!Array.isArray(p.payload?.pages)||p.payload.pages.length>250))return send(res,400,{ok:false,error:'Informe inválido'});
  if(p.action==='export'){try {const out=await require('./report.js').exportReport(p.payload,p.format);return send(res,200,{ok:true,data:out});}catch(err){return send(res,500,{ok:false,error:'No se pudo generar el informe: '+String(err.message).slice(0,200)});}}
  const payload={action:p.action,token:process.env.APPS_SCRIPT_TOKEN};if(p.action==='scope'){if(typeof p.scope!=='string'||p.scope.length>150)return send(res,400,{ok:false,error:'Alcance inválido'});payload.scope=p.scope;}if(p.action==='export'){payload.format=p.format;payload.payload=p.payload;}
  try{
    const upstream=await fetch(process.env.APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(105_000)});
    if(!upstream.ok)return send(res,502,{ok:false,error:`Apps Script respondió con HTTP ${upstream.status}. Verifica la nueva URL /exec y acceso de la implementación; 401/403 ocurre antes de validar el token.`});
    const j=await upstream.json().catch(()=>null);
    if(!j)return send(res,502,{ok:false,error:'Apps Script no respondió JSON. Verifica que la URL termina en /exec y que la implementación permite solicitudes del servidor.'});
    if(!j.ok)return send(res,502,{ok:false,error:j.error||'Error en Apps Script'});
    if(p.action==='data' && j.data && typeof j.data==='object') {
      const d=j.data;
      const ok=Array.isArray(d.financialV34?.summary)&&d.financialV34.summary.length>0;
      if(!ok){
        // Consulta de respaldo, útil si el bloque no vino en `data`.
        // Solo aceptamos el formato V3.9, con datos de pagos y cartera.
        try{
          const alternate=await fetch(process.env.APPS_SCRIPT_URL,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({action:'finance',token:process.env.APPS_SCRIPT_TOKEN}),
            redirect:'follow',signal:AbortSignal.timeout(20_000)
          });
          if(alternate.ok){
            const fj=await alternate.json();
            if(fj?.ok && String(fj.data?.apiVersion||'').startsWith('3.9.') &&
              Array.isArray(fj.data.financialV34?.summary)){
              for(const field of ['financialV34','financialSimple','finance','cartera','cuotas'])
                if(fj.data[field]!==undefined)d[field]=fj.data[field];
              d.apiVersion=fj.data.apiVersion;
            }
          }
        }catch(_err){ /* Preservar los registros y reportar el diagnóstico. */ }
      }
      if(!Array.isArray(d.financialV34?.summary)||!d.financialV34.summary.length){
        d.financialIssue='Tu Apps Script aún no envía las proyecciones Proye-*. Publica la nueva versión y pulsa Actualizar.';
      }else d.financialIssue='';
    }
    return send(res,200,{ok:true,data:j.data});
  }catch{return send(res,502,{ok:false,error:'No se pudo comunicar con Apps Script. Revisa la URL, permisos y tiempo de ejecución.'})}
};

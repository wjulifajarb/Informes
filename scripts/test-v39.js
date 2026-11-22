'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const gs=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');
new vm.Script(gs);
assert(gs.includes("const API_VERSION = '4.7.0'"));
assert(gs.includes("p.action==='finance'"));
assert(gs.includes("p.action==='diagnostic'"));
assert(gs.includes('financialV34:d.financialV34'));
assert(bridge.includes('financialIssue'));
assert(bridge.includes("p.action==='data'"));
assert(html.includes('data.financialIssue'));
assert(html.includes('Code.gs V3.9'));
assert(html.includes('const summaries=data?.financialV34?.summary'));

async function main(){
  process.env.APPS_SCRIPT_URL='https://script.google.com/macros/s/test-v39/exec';
  process.env.APPS_SCRIPT_TOKEN='T'.repeat(40);
  process.env.APP_PASSWORD='locally_generated_test_password';
  process.env.SESSION_SECRET='S'.repeat(40);
  const handler=require('../api/index.js');
  const run=async(body,auth)=>{
    const headers={'host':'localhost:3000','origin':'http://localhost:3000'};
    if(auth)headers.cookie=auth;
    const req={method:'POST',headers,body};
    const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},end(v){this.body=JSON.parse(v)}};
    await handler(req,response);
    return response;
  };
  const login=await run({action:'login',password:process.env.APP_PASSWORD});
  assert.equal(login.body.ok,true);
  const cookie=login.headers['set-cookie'].split(';')[0];
  const stub=(val)=>({ok:true,async json(){return val}});
  let calls=[];
  global.fetch=async(_url,opts)=>{
    const action=JSON.parse(opts.body).action;
    calls.push(action);
    if(action==='data')return stub({ok:true,data:{rows:[{group:'Residere',status:'Pagado'}],rawCount:192}});
    if(action==='finance')return stub({ok:true,data:{apiVersion:'3.9.0',financialV34:{summary:[{group:'Residere',cash:2596908,donationBase:56556052},...Array.from({length:6},(_,i)=>({group:'Fondo '+i}))],detail:[],paidDetail:[]},finance:[],cartera:[],cuotas:[]}});
    throw Error('Unexpected request');
  };
  const fallback=await run({action:'data'},cookie);
  assert.equal(fallback.body.ok,true);
  assert.equal(fallback.body.data.financialV34.summary.length,7);
  assert.equal(fallback.body.data.financialV34.summary[0].cash,2596908);
  assert.equal(fallback.body.data.financialIssue,'');
  assert.deepEqual(calls,['data','finance']);
  calls=[];
  global.fetch=async(_url,opts)=>{
    calls.push(JSON.parse(opts.body).action);
    return stub({ok:true,data:{rows:[],financialV34:{summary:[{group:'Residere'}]},apiVersion:'3.9.0'}});
  };
  const normal=await run({action:'data'},cookie);
  assert.equal(normal.body.ok,true);
  assert.equal(normal.body.data.financialV34.summary.length,1);
  assert.match(normal.body.data.financialIssue,/1 de los 7 fondos/);
  assert.deepEqual(calls,['data']);
  calls=[];
  global.fetch=async(_url,opts)=>{
    const action=JSON.parse(opts.body).action;
    calls.push(action);
    if(action==='data')return stub({ok:true,data:{rows:[],rawCount:192}});
    return stub({ok:false,error:'Acción no válida'});
  };
  const outdated=await run({action:'data'},cookie);
  assert.equal(outdated.body.ok,true);
  assert.match(outdated.body.data.financialIssue,/Code.gs V4.7/);
  assert.equal(outdated.body.data.financialV34,undefined);
  assert.deepEqual(calls,['data','finance']);
  console.log('V3.9: API actualizada, fallback financiero, fondo parcial y mensaje de implementación antigua: OK');
}
main().catch(e=>{console.error(e);process.exitCode=1});

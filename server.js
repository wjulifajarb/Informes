'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const envFile=path.join(__dirname,'.env.local');
if(fs.existsSync(envFile))process.loadEnvFile(envFile);
const handler=require('./api/index.js');
const html=path.join(__dirname,'public','index.html');
http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/index')return handler(req,res);if(url.pathname==='/'||url.pathname==='/index.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');return fs.createReadStream(html).pipe(res)}res.statusCode=404;res.end('No encontrado')}).listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Educamás → http://localhost:'+(process.env.PORT||3000)));

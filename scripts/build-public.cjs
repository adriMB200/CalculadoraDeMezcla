/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

'use strict';
/** Crea dist exclusivamente con recursos destinados al navegador.
 * Falla si faltan archivos estáticos básicos; nunca copia carpetas privadas.
 */
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const dist=path.join(root,'dist');
const dirs=['css','js','imagen','imagenes','img','images','assets','manuales','fonts','media','static','public','vendor','lib'];
const allowed=new Set(['.html','.htm','.css','.js','.mjs','.png','.jpg','.jpeg','.gif','.webp','.avif','.svg','.ico','.pdf','.woff','.woff2','.ttf','.otf','.webmanifest','.mp4','.webm','.mp3','.ogg','.wav','.vtt','.txt','.xml']);
const banned=/^(?:\.env(?:\..*)?|\.git.*|.*(?:secret|credential|private|backup|respaldo|token|password|\.map)(?:[._-].*)?)$/i;
function assertSafe(rel){
 if(rel.split(path.sep).some(part=>banned.test(part) || part.startsWith('.')))return false;
 const ext=path.extname(rel).toLowerCase();
 return allowed.has(ext);
}
function copyFile(rel){
 if(!assertSafe(rel))return;
 const src=path.join(root,rel);
 if(!fs.statSync(src,{throwIfNoEntry:false})?.isFile())return;
 const target=path.join(dist,rel);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(src,target);
}
function copyTree(rel){
 const src=path.join(root,rel);
 if(!fs.existsSync(src) || !fs.lstatSync(src).isDirectory())return;
 for(const entry of fs.readdirSync(src,{withFileTypes:true})){
  const next=path.join(rel,entry.name);
  if(entry.isSymbolicLink())continue;
  if(entry.isDirectory()) {if(!entry.name.startsWith('.') && !banned.test(entry.name))copyTree(next);}
  else if(entry.isFile())copyFile(next);
 }
}
if(!fs.existsSync(path.join(root,'index.html')))throw Error('Falta index.html en la raíz');
if(fs.existsSync(dist)&&fs.lstatSync(dist).isSymbolicLink())throw Error('dist no puede ser un enlace simbólico');
// EN16: regenerar sitemap antes de copiar recursos públicos.
require('./generar-sitemap.cjs');
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const e of fs.readdirSync(root,{withFileTypes:true})){
 if(e.isFile() && (e.name.toLowerCase().endsWith('.html') || ['favicon.ico','robots.txt','sitemap.xml','site.webmanifest','manifest.webmanifest','sw.js','service-worker.js'].includes(e.name)))copyFile(e.name);
}
for(const d of dirs)copyTree(d);
for(const special of ['_headers','_redirects']){
 const source=path.join(root,special);
 if(fs.existsSync(source) && fs.lstatSync(source).isFile())fs.copyFileSync(source,path.join(dist,special));
}
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('La compilación pública no tiene index.html');
for(const forbidden of ['netlify.toml','package.json','migrations','netlify','tests','.env']){
 if(fs.existsSync(path.join(dist,forbidden)))throw Error('Carpeta dist contiene material privado: '+forbidden);
}
console.log('Compilación pública completada en dist/ (sin SQL, funciones, variables ni scripts de instalación).');

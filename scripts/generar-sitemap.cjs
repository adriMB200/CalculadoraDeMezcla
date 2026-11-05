'use strict';
/** Generador conservador: solo páginas incluidas en la lista pública. */
const fs=require('node:fs');
const path=require('node:path');
const {BASE,pages,privatePages,publicURL}=require('./seo-config.cjs');
const root=path.resolve(__dirname,'..');
const escapeXML=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const contents=[];
for(const file of Object.keys(pages)){
 const location=path.join(root,file);
 if(privatePages.has(file)||!fs.existsSync(location))continue;
 const html=fs.readFileSync(location,'utf8');
 if(/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html))continue;
 if(!/<head(?:\s[^>]*)?>/i.test(html))continue;
 contents.push(publicURL(file));
}
if(!contents.includes(BASE+'/'))throw new Error('No se puede generar un sitemap sin index.html público');
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
 contents.map(url=>`  <url><loc>${escapeXML(url)}</loc></url>`).join('\n')+'\n</urlset>\n';
const target=path.join(root,'sitemap.xml');
if(fs.existsSync(target)){
 const existing=fs.readFileSync(target,'utf8');
 if(existing===xml){console.log(`Sitemap: ${contents.length} URLs, sin cambios`);module.exports={count:contents.length};}else if(!existing.includes('www.sitemaps.org/schemas/sitemap/0.9'))throw new Error('sitemap.xml previo incompatible. Revisarlo antes de sobrescribir.');else {fs.writeFileSync(target,xml,'utf8');console.log(`Sitemap actualizado: ${contents.length} URLs públicas — ${target}`);module.exports={count:contents.length};}
}else {fs.writeFileSync(target,xml,'utf8');console.log(`Sitemap creado: ${contents.length} URLs públicas — ${target}`);}

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.join(__dirname,'..'),read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
test('Todos los archivos TypeScript de la fase se pueden analizar',()=>{
 for(const rel of ['netlify/functions/login.ts','netlify/functions/singUp.ts','netlify/functions/tienda.ts','netlify/functions/tiendaWebhook.ts','netlify/functions/fotosClub.ts','netlify/functions/mediaClub.ts','netlify/functions/fotoPerfil.ts','netlify/shared/fase13Images.ts','netlify/shared/fase13Mail.ts','netlify/shared/fase13Rate.ts','netlify/shared/accountSecurity.ts']){
  const f=ts.createSourceFile(rel,read(rel),ts.ScriptTarget.ESNext,true,ts.ScriptKind.TS);
  assert.equal(f.parseDiagnostics.length,0,rel+' '+f.parseDiagnostics.map(d=>d.messageText).join('; '));
 }
});
test('Solo JPG en subida publica y perfil',()=>{const s=read('netlify/shared/fase13Images.ts');assert.match(s,/\.jpg\$/);assert.match(s,/info\.format!=='jpeg'/);assert.match(s,/\.rotate\(\)\.resize/);});
test('La galería exige moderación y los recursos pendientes no son públicos',()=>{assert.match(read('netlify/functions/fotosClub.ts'),/estado='pendiente'/);assert.match(read('netlify/functions/mediaClub.ts'),/isAdmin\(uid\)/);});
test('No se firma token durante el registro sin verificar',()=>{const s=read('netlify/functions/singUp.ts');assert.doesNotMatch(s,/signToken/);assert.match(s,/email_verificado,?password_hash|email_verificado,password_hash/);});
test('La pasarela no permite cobro real sin activacion',()=>{const s=read('netlify/functions/tienda.ts');assert.match(s,/sk_test_/);assert.match(s,/ENDURO_ENABLE_LIVE_PAYMENTS/);assert.match(read('netlify/functions/tiendaWebhook.ts'),/timingSafeEqual/);});
test('Navegación pública y documentos de seguridad presentes',()=>{assert.match(read('tienda.html'),/id="shop-products"/);assert.match(read('verificar-cuenta.html'),/id="f13-resend"/);assert.match(read('docs/SEGURIDAD_Y_LANZAMIENTO.md'),/producción/);});

/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { requireMethod,readBody,stringField,json,handleError,signToken } from '../shared/security';
import { guardRequest,guardAccount } from '../shared/fase13Rate';
const bcrypt=require('bcryptjs');
export const handler:Handler=async event=>{
 try{
  requireMethod(event,'POST');const body=readBody(event);
  const identificador=stringField(body.username,'Usuario o correo',254).toLowerCase();
  await guardRequest(event,'login',35,{minuteMax:12,perMinutes:10});
  await guardAccount('login',identificador,12,30);
  const password=body.password;
  if(typeof password!=='string'||!password.length||password.length>256)return json(400,{error:'Contraseña no válida'});
  const sql=neon();
  const [u]=await sql`SELECT id,username,password_hash,estado_cuenta,auth_version,email,email_verificado
    FROM public.usuarios WHERE lower(username)=${identificador} OR (lower(email)=${identificador} AND email_verificado=TRUE) LIMIT 1`;
  if(!u||!(await bcrypt.compare(password,u.password_hash))||u.estado_cuenta!=='activo')
    return json(401,{error:'Usuario o contraseña incorrectos'});
  if(u.email&&u.email_verificado!==true)return json(403,{error:'Debes verificar el correo electrónico antes de acceder. Revisa tu bandeja de entrada.'});
  return json(200,{token:signToken(Number(u.id),String(u.username),Number(u.auth_version)),username:u.username});
 }catch(e){return handleError(e);}
};

/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

import { ApiError } from './security';

export function mailDisponible(): boolean {
 return Boolean(process.env.ENDURO_GMAIL_APP_PASSWORD && process.env.ENDURO_GMAIL_USER === 'enduronalon@gmail.com');
}
export async function enviarCorreoEnduro(to:string, subject:string, body:string): Promise<void> {
 if(!mailDisponible())throw new ApiError(503,'Correo de verificación no configurado todavía');
 const nodemailer = require('nodemailer');
 const transport=nodemailer.createTransport({
  host:'smtp.gmail.com',port:465,secure:true,connectionTimeout:9000,greetingTimeout:9000,socketTimeout:12000,
  auth:{user:'enduronalon@gmail.com',pass:process.env.ENDURO_GMAIL_APP_PASSWORD},
  tls:{minVersion:'TLSv1.2'},pool:false
 });
 try{
  await transport.sendMail({from:'Enduro Nalón <enduronalon@gmail.com>',to,subject,text:body});
 }catch(err){console.error('Error al enviar correo de verificación',err instanceof Error?err.name:'desconocido');
  throw new ApiError(503,'El servicio de correo no ha podido enviar el mensaje. Prueba más tarde.');
 }finally{transport.close();}
}

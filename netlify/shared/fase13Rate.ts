import type { HandlerEvent } from '@netlify/functions';
import { limit } from './accountSecurity';
function clientKey(event:HandlerEvent):string{
 const ip=event.headers?.['x-nf-client-connection-ip']||event.headers?.['X-Nf-Client-Connection-Ip'];
 return typeof ip==='string'&&/^[0-9a-f:.]{2,45}$/i.test(ip)?ip:'sin-atribucion';
}
export async function guardRequest(event:HandlerEvent,area:string,hourMax:number,opts?:{minuteMax:number;perMinutes:number}):Promise<void>{
 const key=clientKey(event);await limit(`f13:${area}:${key}:hora`,hourMax,60);
 if(opts)await limit(`f13:${area}:${key}:corto`,opts.minuteMax,opts.perMinutes);
}
export async function guardAccount(area:string,id:string,max:number,minutes:number):Promise<void>{
 await limit(`f13:${area}:cuenta:${id.toLowerCase().slice(0,150)}`,max,minutes);
}

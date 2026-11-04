import { ApiError } from './security';
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const fotosStore = () => getStore('enduro-nalon-fotografias');
export function fotoKey(tipo: 'galeria'|'avatar'): string { return `${tipo}/${randomUUID()}.jpg`; }
export function decodeJpeg(body: unknown, maxBytes: number): Buffer {
  if (typeof body !== 'object' || !body) throw new ApiError(400,'Formulario incorrecto');
  const data = (body as Record<string, unknown>);
  const filename=data.nombreArchivo, contents=data.imagenBase64;
  if (typeof filename!=='string'||filename.length>160||!/\.jpg$/i.test(filename)||filename.includes('/')||filename.includes('\\'))
    throw new ApiError(400,'Solo se admiten archivos con extensión .jpg');
  if (typeof contents!=='string'||contents.length>Math.ceil(maxBytes*4/3)+8||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contents))
    throw new ApiError(400,'Imagen no válida o demasiado grande');
  const buffer=Buffer.from(contents,'base64');
  if (buffer.length<100||buffer.length>maxBytes||buffer[0]!==0xff||buffer[1]!==0xd8||buffer[2]!==0xff)
    throw new ApiError(400,'El archivo no es una fotografía JPEG válida');
  return buffer;
}
export async function normalizarJpg(data: Buffer, maxDimension: number): Promise<Buffer> {
  try {
    const foto=sharp(data,{limitInputPixels:16000000,failOn:'error'});
    const info=await foto.metadata();
    if(info.format!=='jpeg'||!info.width||!info.height)throw Error('Formato');
    // Re-encode sin metadatos EXIF (incluidas coordenadas GPS).
    return await foto.rotate().resize({width:maxDimension,height:maxDimension,fit:'inside',withoutEnlargement:true})
      .jpeg({quality:82,mozjpeg:true}).toBuffer();
  } catch {throw new ApiError(400,'No se ha podido validar la fotografía JPG');}
}
export function readImageBody(raw:string|null): Record<string,unknown>{
 if(!raw||raw.length>4_000_000)throw new ApiError(413,'Foto demasiado grande');
 try {const result=JSON.parse(raw);if(result&&typeof result==='object'&&!Array.isArray(result))return result;}catch{}
 throw new ApiError(400,'Datos de imagen incorrectos');
}

import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink,readFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {IPhotoStorage} from '../../../application/ports/IPhotoStorage';
import {DomainError} from '../../../domain/errors/DomainError';
export const photoDirectory=()=>path.resolve(process.env.REPORT_PHOTO_DIR || path.join(process.cwd(),'storage','reports'));
export class LocalPhotoStorage implements IPhotoStorage {
 async save(bytes:Buffer):Promise<string>{
  if(!bytes.length || bytes.length>8*1024*1024)throw new DomainError('La foto debe pesar como máximo 8 MB');
  let output:Buffer;
  try {
   const metadata=await sharp(bytes,{limitInputPixels:40000000,animated:false}).metadata();
   if(!['jpeg','png','webp'].includes(metadata.format||''))throw new Error('format');
   output=await sharp(bytes,{limitInputPixels:40000000,animated:false}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:82,mozjpeg:true}).toBuffer();
   if(output.length>2*1024*1024)throw new Error('size');
  }catch{throw new DomainError('No pudimos procesar esa foto. Elige una imagen JPG, PNG o WEBP de hasta 8 MB');}
  await mkdir(photoDirectory(),{recursive:true});
  const filename=`${randomUUID()}.jpg`;
  await writeFile(path.join(photoDirectory(),filename),output,{flag:'wx',mode:0o640});
  return `/media/reports/${filename}`;
 }
 async remove(url:string):Promise<void>{const name=photoFilename(url);if(name)await unlink(path.join(photoDirectory(),name)).catch(()=>{});}
}
export const photoFilename=(url:unknown):string|undefined => typeof url==='string'&&/^\/media\/reports\/[0-9a-f-]{36}\.jpg$/.test(url)?url.split('/').pop():undefined;
export async function dispatchPhoto(url:unknown):Promise<{data:string;mimeType:string;fileName:string}|undefined>{
 const name=photoFilename(url);if(!name)return undefined;
 try {const bytes=await readFile(path.join(photoDirectory(),name));if(bytes.length>2*1024*1024)return undefined;return {data:bytes.toString('base64'),mimeType:'image/jpeg',fileName:'reporte.jpg'};}catch{return undefined;}
}

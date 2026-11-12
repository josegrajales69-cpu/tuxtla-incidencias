import {validatePassword} from './AccountPassword';
import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import {IAccountRepository,AccountInput} from '../ports/IAccountRepository';
import {DomainError} from '../../domain/errors/DomainError';
export class ManageAccounts {
 constructor(private readonly accounts:IAccountRepository){}
 private clean(input:AccountInput,creating=false):AccountInput {
  if(typeof input.name!=='string'||input.name.trim().length<2||input.name.trim().length>100)throw new DomainError('Escribe un nombre de entre 2 y 100 caracteres.');
  if(!['ADMIN','BRIGADISTA','CIUDADANO'].includes(input.role)||creating&&input.role==='CIUDADANO')throw new DomainError('Selecciona un perfil de personal válido.');
  const username=typeof input.username==='string'?input.username.trim().toLowerCase():undefined;
  if((creating&&!username)||(username&&!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)))throw new DomainError('El usuario debe tener de 3 a 32 caracteres: letras, números, punto, guion o guion bajo.');
  if(input.phone!=null&&(typeof input.phone!=='string'||input.phone.length>25))throw new DomainError('Revisa el teléfono.');
  if(input.isActive!==undefined&&typeof input.isActive!=='boolean')throw new DomainError('Estado de cuenta no válido.');
  return {name:input.name.trim(),username:username||undefined,phone:input.phone?.trim()||undefined,role:input.role,...(input.isActive===undefined?{}:{isActive:input.isActive})};
 }
 list(){return this.accounts.list();}
 async create(actorId:string,input:AccountInput & {password?:unknown}){const clean=this.clean(input,true);const password=input.password===undefined||input.password===''?randomBytes(18).toString('base64url'):input.password;validatePassword(password);const account=await this.accounts.create(actorId,clean,await bcrypt.hash(password,12));return {account,temporaryPassword:password};}
 update(actorId:string,id:string,input:AccountInput){return this.accounts.update(actorId,id,this.clean(input));}
 async reset(actorId:string,id:string){const password=randomBytes(18).toString('base64url');await this.accounts.resetPassword(actorId,id,await bcrypt.hash(password,12));return {temporaryPassword:password};}
 unlink(actorId:string,id:string){return this.accounts.unlinkTelegram(actorId,id);}
}

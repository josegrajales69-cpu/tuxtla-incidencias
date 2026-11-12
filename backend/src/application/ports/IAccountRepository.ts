export interface Account {id:string;name:string;username?:string;email?:string;phone?:string;role:'ADMIN'|'BRIGADISTA'|'CIUDADANO';isActive:boolean;mustChangePassword:boolean;telegramLinked:boolean;activeReports:number;resolvedReports:number;createdAt:string;}
export interface AccountInput {name:string;username?:string;phone?:string;role:Account['role'];isActive?:boolean;}
export interface IAccountRepository {
 list():Promise<Account[]>;
 create(actorId:string,input:AccountInput,passwordHash:string):Promise<Account>;
 update(actorId:string,targetId:string,input:AccountInput):Promise<Account>;
 resetPassword(actorId:string,targetId:string,hash:string):Promise<void>;
 unlinkTelegram(actorId:string,targetId:string):Promise<void>;
}

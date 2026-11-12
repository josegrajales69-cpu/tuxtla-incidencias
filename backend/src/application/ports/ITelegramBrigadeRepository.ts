export interface LinkedBrigadist {id:string;name:string;}
export interface ITelegramBrigadeRepository {
 getLink(userId:string):Promise<{linked:boolean;linkedAt?:string}>;
 issueCode(userId:string):Promise<string>;
 consumeCode(code:string,telegramUserId:string):Promise<LinkedBrigadist|null>;
 unlink(userId:string):Promise<void>;
 findBrigadist(telegramUserId:string):Promise<LinkedBrigadist|null>;
 isDispatchMessage(reportId:string,messageId:number):Promise<boolean>;
}

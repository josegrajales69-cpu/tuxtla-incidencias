
export class N8nReportQuery {
 private readonly lastRequest=new Map<string,number>();
 constructor(private readonly url:string,private readonly secret:string){}
 async execute(message:{text?:string;chat:{id:number};from?:{id:number}}):Promise<void>{
  const id=String(message.from?.id);const now=Date.now();
  if(now-(this.lastRequest.get(id)||0)<5000)throw new Error('Espera unos segundos antes de consultar de nuevo.');
  if(this.lastRequest.size>=1000)for(const [key,time] of this.lastRequest)if(now-time>60000)this.lastRequest.delete(key);
  if(this.lastRequest.size>=1000)throw new Error('Intenta de nuevo en un momento.');
  this.lastRequest.set(id,now);
  try {
   const response=await fetch(this.url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','X-Tuxtla-Webhook-Secret':this.secret},body:JSON.stringify({schemaVersion:1,telegramUserId:id,chatId:String(message.chat.id),text:message.text?.slice(0,128)}),signal:AbortSignal.timeout(35000)});
   if(!response.ok)throw new Error();
   const ack=await response.json() as {ok?:boolean;mode?:string;messageId?:number};
   if(!ack.ok||ack.mode!=='delivered'||!ack.messageId)throw new Error();
  }catch{throw new Error('La consulta no está disponible en este momento. Intenta de nuevo en unos minutos.');}
 }
}

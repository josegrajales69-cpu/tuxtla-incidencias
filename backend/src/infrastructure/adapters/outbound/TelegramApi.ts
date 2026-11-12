export interface TelegramApi {call<T=any>(method:string,body?:Record<string,unknown>):Promise<T>;}
export class TelegramHttpApi implements TelegramApi {
 constructor(private readonly token:string){}
 async call<T=any>(method:string,body:Record<string,unknown>={}):Promise<T>{
  const response=await fetch(`https://api.telegram.org/bot${this.token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(method==='getUpdates'?35000:12000)});
  const data=await response.json() as {ok:boolean;result:T;error_code?:number};

  if(!data.ok)throw new Error(`Telegram API ${data.error_code||response.status}`);return data.result;
 }
}

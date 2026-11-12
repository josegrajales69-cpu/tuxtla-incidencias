import {Pool,PoolClient} from 'pg';
import {ITelegramBrigadeRepository} from '../../../application/ports/ITelegramBrigadeRepository';
import {ClaimReportFromTelegram} from '../../../application/use-cases/ClaimReportFromTelegram';
import {TelegramApi} from '../outbound/TelegramApi';
export interface TelegramUpdate {update_id:number;message?:{text?:string;chat:{id:number;type:string};from?:{id:number;is_bot?:boolean}};callback_query?:{id:string;data?:string;from:{id:number;is_bot?:boolean};message?:{message_id:number;text?:string;chat:{id:number;type:string};from?:{id:number}}};}
export class TelegramBrigadeWorker {
 private running=false;
 private polling=false;
 private botId?:number;
 constructor(private readonly db:Pool,private readonly api:TelegramApi,private readonly links:ITelegramBrigadeRepository,private readonly claim:ClaimReportFromTelegram,private readonly groupId:string,private readonly queryReport?:{execute(message:NonNullable<TelegramUpdate['message']>):Promise<void>}){}
 get active(){return this.polling;}
 start(){if(this.running)return;this.running=true;void this.loop();}
 stop(){this.running=false;}
 private async loop(){
  while(this.running){let client:PoolClient|undefined;let locked=false;let leaseLost=false;
   const onLeaseError=()=>{leaseLost=true;this.polling=false;};
   try{
    client=await this.db.connect();client.on('error',onLeaseError);
    locked=!!(await client.query('SELECT pg_try_advisory_lock(647829133) locked')).rows[0].locked;
    if(!locked)throw new Error('Another poller owns the lock');
    const me=await this.api.call<{id:number}>('getMe');this.botId=me.id;
    const webhook=await this.api.call<{url:string}>('getWebhookInfo');if(webhook.url)throw new Error('Existing webhook prevents polling');
    await this.db.query('INSERT INTO telegram_bot_offsets(bot_id) VALUES($1) ON CONFLICT DO NOTHING',[me.id]);
    this.polling=true;console.log('[Telegram] Recepción de botones activa.');
    while(this.running&&!leaseLost){
     const state=await this.db.query('SELECT next_update_id FROM telegram_bot_offsets WHERE bot_id=$1',[me.id]);
     const updates=await this.api.call<TelegramUpdate[]>('getUpdates',{offset:Number(state.rows[0].next_update_id),timeout:25,allowed_updates:['message','callback_query']});
     for(const update of updates){await this.handleUpdate(update,me.id);await this.db.query('UPDATE telegram_bot_offsets SET next_update_id=GREATEST(next_update_id,$2) WHERE bot_id=$1',[me.id,update.update_id+1]);}
    }
   }catch{this.polling=false;console.warn('[Telegram] Recepción temporalmente no disponible; se reintentará.');}
   finally{this.polling=false;if(client){client.removeListener('error',onLeaseError);if(locked)await client.query('SELECT pg_advisory_unlock(647829133)').catch(()=>{});client.release(leaseLost);}}
   if(this.running)await new Promise(resolve=>setTimeout(resolve,5000));
  }
 }
 async handleUpdate(update:TelegramUpdate,botId:number):Promise<void>{
  const message=update.message;
  if(message?.chat.type==='private'&&message.from&&!message.from.is_bot&&message.chat.id===message.from.id){
   if(/^\/consultar(?:@[A-Za-z0-9_]+)?(?:\s|$)/i.test(message.text||'')){
    try{if(!this.queryReport)throw new Error('La consulta de folios aún no está configurada.');await this.queryReport.execute(message);}
    catch(error){await this.api.call('sendMessage',{chat_id:message.chat.id,text:error instanceof Error?error.message:'La consulta no está disponible.'});}
    return;
   }
   const match=message.text?.match(/^\/start(?:@[A-Za-z0-9_]+)? link_([A-Za-z0-9_-]{32})$/);
   if(match){const actor=await this.links.consumeCode(match[1],String(message.from.id))||await this.links.findBrigadist(String(message.from.id));await this.api.call('sendMessage',{chat_id:message.chat.id,text:actor?`✅ Telegram vinculado a ${actor.name}. Ya puedes tomar reportes con el botón del grupo.`:'Este enlace venció, ya se usó o la cuenta ya está vinculada. Genera uno nuevo desde tu cuenta de brigadista.'});}
   else if(/^\/start(?:@[A-Za-z0-9_]+)?$/.test(message.text||''))await this.api.call('sendMessage',{chat_id:message.chat.id,text:'Para tomar reportes, vincula tu Telegram una sola vez desde Operaciones de brigada → Vincular Telegram. Después usa «Tomar reporte» en las alertas del grupo. Para verificar un folio, escríbeme /consultar TX-000004 en este chat privado.'});
   return;
  }
  const callback=update.callback_query;if(!callback)return;
  const answer=async(text:string)=>{await this.api.call('answerCallbackQuery',{callback_query_id:callback.id,text:text.slice(0,195),show_alert:true}).catch(()=>{});};
  const origin=callback.message;
  if(!origin||String(origin.chat.id)!==this.groupId||origin.from?.id!==botId||callback.from.is_bot){await answer('Usa el aviso original del grupo de brigadas.');return;}
  if(callback.data==='test:claim'){await answer('✅ El botón funciona. Es una prueba; no se asignó ningún reporte.');return;}
  const match=callback.data?.match(/^claim:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if(!match){await answer('Este botón no está disponible.');return;}
  const result=await this.claim.execute(match[1],String(callback.from.id),origin.message_id);
  await answer(result.text);
  if(result.report){
   const report=result.report;const label=report.status==='RESUELTO'?'✅ Reporte resuelto':report.assignedBrigadeName?`👷 ${report.assignedBrigadeName}`:'Tomar reporte';

   await this.api.call('editMessageReplyMarkup',{chat_id:origin.chat.id,message_id:origin.message_id,reply_markup:{inline_keyboard:[[ {text:label.slice(0,64),callback_data:`claim:${report.id}`} ]]}}).catch(()=>{});
  }
 }
}

import {Pool} from 'pg';
import {randomBytes,createHash} from 'node:crypto';
import {ITelegramBrigadeRepository,LinkedBrigadist} from '../../../application/ports/ITelegramBrigadeRepository';
export class PostgresTelegramBrigadeRepository implements ITelegramBrigadeRepository {
 constructor(private readonly db:Pool){}
 async getLink(userId:string){const result=await this.db.query('SELECT linked_at FROM telegram_brigade_links WHERE user_id=$1',[userId]);return {linked:!!result.rowCount,...(result.rowCount?{linkedAt:new Date(result.rows[0].linked_at).toISOString()}:{} )};}
 async issueCode(userId:string):Promise<string>{
  const code=randomBytes(24).toString('base64url');const hash=createHash('sha256').update(code).digest('hex');
  await this.db.query("INSERT INTO telegram_link_codes(user_id,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET code_hash=$2,expires_at=now()+interval '10 minutes',created_at=now()",[userId,hash]);return code;
 }
 async consumeCode(code:string,telegramUserId:string):Promise<LinkedBrigadist|null>{
  if(!/^[A-Za-z0-9_-]{32}$/.test(code)||!/^\d{1,20}$/.test(telegramUserId))return null;
  const client=await this.db.connect();try{await client.query('BEGIN');
   const result=await client.query("SELECT c.user_id,u.name FROM telegram_link_codes c JOIN users u ON u.id=c.user_id WHERE c.code_hash=$1 AND c.expires_at>now() AND u.role='BRIGADISTA' AND u.is_active=true AND u.must_change_password=false FOR UPDATE OF c,u",[createHash('sha256').update(code).digest('hex')]);
   if(!result.rowCount){await client.query('ROLLBACK');return null;}
   const row=result.rows[0];

   const existing=await client.query('SELECT user_id,telegram_user_id::text FROM telegram_brigade_links WHERE user_id=$1 OR telegram_user_id=$2 FOR UPDATE',[row.user_id,telegramUserId]);
   if(existing.rows.some(link=>link.user_id!==row.user_id||link.telegram_user_id!==telegramUserId)){await client.query('ROLLBACK');return null;}
   await client.query('INSERT INTO telegram_brigade_links(user_id,telegram_user_id) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING',[row.user_id,telegramUserId]);
   await client.query('DELETE FROM telegram_link_codes WHERE user_id=$1',[row.user_id]);await client.query('COMMIT');return {id:row.user_id,name:row.name};
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 }
 async unlink(userId:string){const client=await this.db.connect();try{await client.query('BEGIN');await client.query('DELETE FROM telegram_link_codes WHERE user_id=$1',[userId]);await client.query('DELETE FROM telegram_brigade_links WHERE user_id=$1',[userId]);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
 async findBrigadist(telegramUserId:string):Promise<LinkedBrigadist|null>{const result=await this.db.query("SELECT u.id,u.name FROM telegram_brigade_links t JOIN users u ON u.id=t.user_id WHERE t.telegram_user_id=$1 AND u.role='BRIGADISTA' AND u.is_active=true AND u.must_change_password=false",[telegramUserId]);return result.rows[0]||null;}
 async isDispatchMessage(reportId:string,messageId:number){const result=await this.db.query('SELECT 1 FROM dispatch_outbox WHERE report_id=$1 AND telegram_message_id=$2',[reportId,String(messageId)]);return !!result.rowCount;}
}

import {dispatchPhoto} from './LocalPhotoStorage';
import { Pool } from 'pg';

export class DispatchWorker {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private readonly enabled = process.env.DISPATCH_ENABLED === 'true';
  private readonly url = process.env.N8N_DISPATCH_URL;
  private readonly secret = process.env.N8N_DISPATCH_SECRET;
  constructor(private readonly db: Pool) {}

  start(): void {
    if (!this.enabled) { console.log('[Dispatch] Envío pausado; los reportes quedan en la cola.'); return; }
    if (!this.url || !this.secret) throw new Error('DISPATCH_ENABLED requiere N8N_DISPATCH_URL y N8N_DISPATCH_SECRET');
    const url = new URL(this.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Protocolo de n8n inválido');
    this.timer = setInterval(() => { void this.tick(); }, 5000);
    this.timer.unref();
    void this.tick();
  }
  stop(): void { if (this.timer) clearInterval(this.timer); }

  async tick(): Promise<void> {
    if (this.busy || !this.enabled || !this.url || !this.secret) return;
    this.busy = true;
    try {

      await this.db.query(`UPDATE dispatch_outbox SET status='failed',locked_until=NULL,last_error='Revisar entrega del último intento antes de reenviar' WHERE status='sending' AND locked_until<now() AND attempts>=8`);
      const { rows } = await this.db.query(`
        WITH candidate AS (
          SELECT event_id FROM dispatch_outbox
          WHERE ((status='pending' AND next_attempt_at<=now()) OR (status='sending' AND locked_until<now()))
          AND attempts<8 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
        ) UPDATE dispatch_outbox d SET status='sending', attempts=attempts+1, locked_until=now()+interval '90 seconds'
          FROM candidate c WHERE d.event_id=c.event_id RETURNING d.*`);
      const row = rows[0];
      if (!row) return;
      const photo=await dispatchPhoto(row.payload.photoUrl);
      const event = { schemaVersion:1, event:'REPORT_CREATED', eventId:row.event_id,
        timestamp:new Date(row.created_at).toISOString(),
        data:{...row.payload,reportUrl:new URL(`/?report=${row.report_id}`,process.env.PUBLIC_APP_URL||'http://localhost:5173').href,...(photo?{photo}:{}),folio:`TX-${String(row.folio).padStart(6,'0')}`} };
      try {
        const response = await fetch(this.url, {method:'POST',redirect:'error',
          headers:{'Content-Type':'application/json','X-Tuxtla-Webhook-Secret':this.secret,'Idempotency-Key':row.event_id},
          body:JSON.stringify(event),signal:AbortSignal.timeout(45000)});
        if (!response.ok) throw new Error(`n8n HTTP ${response.status}`);
        const ack = await response.json() as {ok?:boolean;mode?:string;eventId?:string;messageId?:number|string};
        if (ack.ok !== true || ack.mode !== 'delivered' || ack.eventId !== row.event_id || !ack.messageId) throw new Error('n8n no confirmó entrega de este evento a Telegram');
        await this.db.query(`UPDATE dispatch_outbox SET status='sent',sent_at=now(),telegram_message_id=$2,locked_until=NULL,last_error=NULL WHERE event_id=$1`,[row.event_id,String(ack.messageId)]);
        console.log(`[Dispatch] Evento ${row.event_id} entregado.`);
      } catch (error) {
        const terminal = row.attempts >= 8;
        const delay = Math.min(3600, 15 * 2 ** (row.attempts - 1));

        const message = error instanceof Error && /^(n8n HTTP \d{3}|n8n no confirmó)/.test(error.message)
          ? error.message : 'Error de conexión o respuesta no válida';
        await this.db.query(`UPDATE dispatch_outbox SET status=$2,next_attempt_at=now()+($3::int*interval '1 second'),locked_until=NULL,last_error=$4 WHERE event_id=$1`,
          [row.event_id,terminal?'failed':'pending',delay,message]);
        console.warn(`[Dispatch] Evento ${row.event_id}: ${terminal?'requiere revisión':'reintento programado'}.`);
      }
    } catch (error) {
      console.error('[Dispatch] No se pudo procesar la cola; se conserva para el próximo intento.');
    } finally { this.busy = false; }
  }
}

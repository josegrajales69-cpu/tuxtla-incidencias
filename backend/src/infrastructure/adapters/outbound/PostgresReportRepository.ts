import {DomainError} from '../../../domain/errors/DomainError';
import { Pool } from 'pg';
import { Report, ReportCategory, ReportStatus } from '../../../domain/entities/Report';
import { IReportRepository, DuplicateCheckResult, UpvoteResult } from '../../../application/ports/IReportRepository';

export class PostgresReportRepository implements IReportRepository {
  constructor(private readonly db: Pool) {}

  async findNearby(category:ReportCategory,lat:number,lng:number,situation?:string,radius=75):Promise<(Report & {distanceMeters:number})[]> {
   const {rows}=await this.db.query(`SELECT id,ST_Distance(location::geography,ST_SetSRID(ST_MakePoint($3,$2),4326)::geography) distance FROM reports WHERE category=$1 AND withdrawn_at IS NULL AND status<>'RESUELTO' AND ($5::text IS NULL OR situation IS NULL OR situation=$5 OR situation='NO_SE' OR $5='NO_SE') AND ST_DWithin(location::geography,ST_SetSRID(ST_MakePoint($3,$2),4326)::geography,$4) ORDER BY distance LIMIT 3`,[category,lat,lng,radius,situation||null]);
   const results=[];for(const row of rows){const report=await this.findById(row.id);if(report)results.push(Object.assign(report,{distanceMeters:Math.round(Number(row.distance))}));}return results;
  }
  async claim(id:string,actorId:string):Promise<Report|null>{
   const result=await this.db.query(`UPDATE reports SET assigned_to=$2,status='EN_ATENCION',updated_at=now() WHERE id=$1 AND withdrawn_at IS NULL AND status<>'RESUELTO' AND (assigned_to IS NULL OR assigned_to=$2) AND EXISTS(SELECT 1 FROM users WHERE users.id=$2 AND users.role='BRIGADISTA' AND users.is_active=true AND users.must_change_password=false) RETURNING id`,[id,actorId]);
   return result.rowCount?this.findById(id):null;
  }
  async withdraw(id:string,actorId:string):Promise<boolean>{
   const result=await this.db.query(`WITH withdrawn AS (UPDATE reports SET withdrawn_at=now(),withdrawn_by=$2,updated_at=now() WHERE id=$1 AND citizen_id=$2 AND withdrawn_at IS NULL RETURNING id) UPDATE dispatch_outbox SET status='failed',locked_until=NULL,last_error='Retirado por su autor; no reenviar' WHERE report_id IN(SELECT id FROM withdrawn) AND status='pending' RETURNING report_id`,[id,actorId]);

   const check=await this.db.query('SELECT id FROM reports WHERE id=$1 AND citizen_id=$2 AND withdrawn_at IS NOT NULL',[id,actorId]);return !!check.rowCount;
  }
  async support(id:string,actorId:string):Promise<UpvoteResult>{
   const client=await this.db.connect();try{await client.query('BEGIN');
    const report=await client.query('SELECT id FROM reports WHERE id=$1 AND withdrawn_at IS NULL FOR UPDATE',[id]);if(!report.rowCount)throw new Error('El reporte ya no está disponible');
    const existing=await client.query('SELECT id FROM report_upvotes WHERE report_id=$1 AND user_id=$2',[id,actorId]);
    if(!existing.rowCount){await client.query('INSERT INTO report_upvotes(report_id,user_id) VALUES($1,$2)',[id,actorId]);await client.query('UPDATE reports SET upvotes_count=COALESCE(upvotes_count,0)+1 WHERE id=$1',[id]);}
    const count=await client.query('SELECT upvotes_count FROM reports WHERE id=$1',[id]);await client.query('COMMIT');return {upvotesCount:Number(count.rows[0].upvotes_count),hasUpvoted:true};
   }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  async create(report: Report): Promise<Report> {
    const query = `
      INSERT INTO reports (
        title, description, category, status, location, address, photo_url, citizen_id, situation, situation_label, priority, priority_reason
      )
      VALUES (
        $1, $2, $3, $4,
        ST_SetSRID(ST_MakePoint($5, $6), 4326),
        $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING
        id, title, description, category, status,
        ST_Y(location) as lat, ST_X(location) as lng,
        address, photo_url, citizen_id, situation, situation_label, priority, priority_reason, COALESCE(upvotes_count, 0) as upvotes_count, created_at, updated_at;
    `;

    const values = [
      report.title,
      report.description,
      report.category,
      report.status,
      report.lng,
      report.lat,
      report.address || null,
      report.photoUrl || null,
      report.citizenId || null,
      report.situation || null, report.situationLabel || null, report.priority || null, report.priorityReason || null,
    ];

    const ownsTransaction=this.db instanceof Pool;
    const client=ownsTransaction?await this.db.connect():this.db;
    try {
    if(ownsTransaction)await client.query('BEGIN');
    const { rows } = await client.query(query, values);
    const r = rows[0];
    const dispatch = await client.query('SELECT folio FROM dispatch_outbox WHERE report_id=$1',[r.id]);
    const folio = dispatch.rows[0]?.folio;

    const created=new Report({
      folio: folio ? `TX-${String(folio).padStart(6,'0')}` : undefined,
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as ReportCategory,
      status: r.status as ReportStatus,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      address: r.address,
      photoUrl: r.photo_url,
      situation:r.situation, situationLabel:r.situation_label, priority:r.priority, priorityReason:r.priority_reason,
      citizenId: r.citizen_id,
      upvotesCount: parseInt(r.upvotes_count, 10) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
    if(ownsTransaction)await client.query('COMMIT');
    return created;
    }catch(error){if(ownsTransaction)await client.query('ROLLBACK');throw error;}
    finally{if(ownsTransaction)(client as import('pg').PoolClient).release();}
  }

  async findAll(filters?: { category?: ReportCategory; status?: string }): Promise<Report[]> {
    let query = `
      SELECT
        r.id, r.title, r.description, r.category, r.status,
        CASE WHEN d.folio IS NOT NULL THEN 'TX-' || lpad(d.folio::text,greatest(6,length(d.folio::text)),'0') END AS dispatch_folio,
        ST_Y(r.location) as lat, ST_X(r.location) as lng,
        r.address, r.photo_url, r.citizen_id, r.assigned_to, r.situation, r.situation_label, r.priority, r.priority_reason,
        u.name as assigned_brigade_name,
        r.resolution_photo_url,r.resolution_notes,r.resolved_by,r.resolved_at,ru.name AS resolved_by_name,
        COALESCE(r.upvotes_count, 0) as upvotes_count,
        r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN users ru ON r.resolved_by=ru.id
      LEFT JOIN dispatch_outbox d ON d.report_id = r.id
      WHERE r.withdrawn_at IS NULL
    `;
    const values: any[] = [];

    if (filters?.category) {
      values.push(filters.category);
      query += ` AND r.category = $${values.length}`;
    }
    if (filters?.status) {
      values.push(filters.status);
      query += ` AND r.status = $${values.length}`;
    }

    query += ` ORDER BY r.created_at DESC;`;

    const { rows } = await this.db.query(query, values);

    return rows.map((r) => new Report({
      id: r.id,
      folio: r.dispatch_folio,
      title: r.title,
      description: r.description,
      category: r.category as ReportCategory,
      status: r.status as ReportStatus,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      address: r.address,
      photoUrl: r.photo_url,
      situation:r.situation, situationLabel:r.situation_label, priority:r.priority, priorityReason:r.priority_reason,
      citizenId: r.citizen_id,
      assignedTo: r.assigned_to,
      assignedBrigadeName: r.assigned_brigade_name,
      resolutionPhotoUrl:r.resolution_photo_url||undefined,resolutionNotes:r.resolution_notes||undefined,resolvedBy:r.resolved_by||undefined,resolvedByName:r.resolved_by_name||undefined,resolvedAt:r.resolved_at||undefined,
      upvotesCount: parseInt(r.upvotes_count, 10) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string): Promise<Report | null> {
    const query = `
      SELECT
        r.id, r.title, r.description, r.category, r.status,
        CASE WHEN d.folio IS NOT NULL THEN 'TX-' || lpad(d.folio::text,greatest(6,length(d.folio::text)),'0') END AS dispatch_folio,
        ST_Y(r.location) as lat, ST_X(r.location) as lng,
        r.address, r.photo_url, r.citizen_id, r.assigned_to, r.situation, r.situation_label, r.priority, r.priority_reason,
        u.name as assigned_brigade_name,
        r.resolution_photo_url,r.resolution_notes,r.resolved_by,r.resolved_at,ru.name AS resolved_by_name,
        COALESCE(r.upvotes_count, 0) as upvotes_count,
        r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN users ru ON r.resolved_by=ru.id
      LEFT JOIN dispatch_outbox d ON d.report_id = r.id
      WHERE r.id = $1 AND r.withdrawn_at IS NULL;
    `;
    const { rows } = await this.db.query(query, [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new Report({
      id: r.id,
      folio: r.dispatch_folio,
      title: r.title,
      description: r.description,
      category: r.category as ReportCategory,
      status: r.status as ReportStatus,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      address: r.address,
      photoUrl: r.photo_url,
      situation:r.situation, situationLabel:r.situation_label, priority:r.priority, priorityReason:r.priority_reason,
      citizenId: r.citizen_id,
      assignedTo: r.assigned_to,
      assignedBrigadeName: r.assigned_brigade_name,
      resolutionPhotoUrl:r.resolution_photo_url||undefined,resolutionNotes:r.resolution_notes||undefined,resolvedBy:r.resolved_by||undefined,resolvedByName:r.resolved_by_name||undefined,resolvedAt:r.resolved_at||undefined,
      upvotesCount: parseInt(r.upvotes_count, 10) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }

  async resolveWithEvidence(id:string,actorId:string,photoUrl:string,notes?:string):Promise<Report|null>{
   const result=await this.db.query(`UPDATE reports r SET status='RESUELTO',resolution_photo_url=$3,resolution_notes=$4,resolved_by=$2,resolved_at=now(),updated_at=now() WHERE r.id=$1 AND r.withdrawn_at IS NULL AND r.status='EN_ATENCION' AND EXISTS(SELECT 1 FROM users u WHERE u.id=$2 AND u.is_active=true AND u.must_change_password=false AND (u.role='ADMIN' OR (u.role='BRIGADISTA' AND r.assigned_to=u.id))) RETURNING r.id`,[id,actorId,photoUrl,notes||null]);return result.rowCount?this.findById(id):null;
  }
  async updateStatusForActor(id:string,status:ReportStatus,actorId:string,isAdmin:boolean):Promise<Report|null>{
   if(status==='RESUELTO')throw new DomainError('Adjunta la foto de solución para cerrar el reporte.');
   const result=await this.db.query('UPDATE reports SET status=$2,updated_at=now() WHERE id=$1 AND withdrawn_at IS NULL AND ($4::boolean OR assigned_to=$3) RETURNING id',[id,status,actorId,isAdmin]);return result.rowCount?this.findById(id):null;
  }
  async updateStatus(id: string, status: ReportStatus): Promise<Report | null> {
    if(status==='RESUELTO')throw new DomainError('Adjunta la foto de solución para cerrar el reporte.');
    await this.db.query(
      `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2 AND withdrawn_at IS NULL;`,
      [status, id]
    );
    return this.findById(id);
  }

  async assignBrigade(id: string, brigadeId: string | null): Promise<Report | null> {
    await this.db.query(
      `UPDATE reports
       SET assigned_to = $1,
           status = CASE WHEN $1 IS NOT NULL AND status = 'RECIBIDO' THEN 'EN_ATENCION' ELSE status END,
           updated_at = NOW()
       WHERE id = $2 AND withdrawn_at IS NULL;`,
      [brigadeId, id]
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM reports WHERE id = $1;`;
    const result = await this.db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async checkDuplicate(category: ReportCategory, lat: number, lng: number, radiusMeters: number = 30.0): Promise<DuplicateCheckResult> {
    const query = `SELECT id,ST_Distance(location::geography,ST_SetSRID(ST_MakePoint($3,$2),4326)::geography) distance_meters FROM reports WHERE category=$1 AND status<>'RESUELTO' AND withdrawn_at IS NULL AND ST_DWithin(location::geography,ST_SetSRID(ST_MakePoint($3,$2),4326)::geography,$4) ORDER BY distance_meters LIMIT 1`;
    const { rows } = await this.db.query(query, [category, lat, lng, radiusMeters]);
    if (rows.length > 0) {
      return {
        isDuplicate: true,
        existingId: rows[0].id,
        distanceMeters: parseFloat(rows[0].distance_meters),
      };
    }
    return { isDuplicate: false };
  }

  async toggleUpvote(reportId: string, userId?: string, fingerprint?: string): Promise<UpvoteResult> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const active=await client.query('SELECT id FROM reports WHERE id=$1 AND withdrawn_at IS NULL FOR UPDATE',[reportId]);if(!active.rowCount)throw new Error('El reporte ya no está disponible');
      let existing;
      if (userId) {
        existing = await client.query(
          'SELECT id FROM report_upvotes WHERE report_id = $1 AND user_id = $2;',
          [reportId, userId]
        );
      } else if (fingerprint) {
        existing = await client.query(
          'SELECT id FROM report_upvotes WHERE report_id = $1 AND fingerprint = $2 AND user_id IS NULL;',
          [reportId, fingerprint]
        );
      } else {
        throw new Error('Identificador de usuario o dispositivo requerido para respaldar el reporte');
      }

      let hasUpvoted = false;
      if (existing.rows.length > 0) {

        await client.query('DELETE FROM report_upvotes WHERE id = $1;', [existing.rows[0].id]);
        await client.query(
          'UPDATE reports SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1) WHERE id = $1;',
          [reportId]
        );
        hasUpvoted = false;
      } else {

        if (userId) {
          await client.query(
            'INSERT INTO report_upvotes (report_id, user_id) VALUES ($1, $2);',
            [reportId, userId]
          );
        } else {
          await client.query(
            'INSERT INTO report_upvotes (report_id, fingerprint) VALUES ($1, $2);',
            [reportId, fingerprint]
          );
        }
        await client.query(
          'UPDATE reports SET upvotes_count = COALESCE(upvotes_count, 0) + 1 WHERE id = $1;',
          [reportId]
        );
        hasUpvoted = true;
      }

      const countRes = await client.query(
        'SELECT COALESCE(upvotes_count, 0) as upvotes_count FROM reports WHERE id = $1;',
        [reportId]
      );
      await client.query('COMMIT');

      const count = countRes.rows.length > 0 ? parseInt(countRes.rows[0].upvotes_count, 10) : 0;
      return { upvotesCount: count, hasUpvoted };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserUpvotes(userId?: string, fingerprint?: string): Promise<string[]> {
    if (userId) {
      const { rows } = await this.db.query(
        'SELECT report_id FROM report_upvotes WHERE user_id = $1;',
        [userId]
      );
      return rows.map((r: any) => r.report_id);
    } else if (fingerprint) {
      const { rows } = await this.db.query(
        'SELECT report_id FROM report_upvotes WHERE fingerprint = $1 AND user_id IS NULL;',
        [fingerprint]
      );
      return rows.map((r: any) => r.report_id);
    }
    return [];
  }
}

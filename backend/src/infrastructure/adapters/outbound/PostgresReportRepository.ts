import { Pool } from 'pg';
import { Report, ReportCategory, ReportStatus } from '../../../domain/entities/Report';
import { IReportRepository, DuplicateCheckResult, UpvoteResult } from '../../../application/ports/IReportRepository';

export class PostgresReportRepository implements IReportRepository {
  constructor(private readonly db: Pool) {}

  async create(report: Report): Promise<Report> {
    const query = `
      INSERT INTO reports (
        title, description, category, status, location, address, photo_url, citizen_id
      )
      VALUES (
        $1, $2, $3, $4, 
        ST_SetSRID(ST_MakePoint($5, $6), 4326), 
        $7, $8, $9
      )
      RETURNING 
        id, title, description, category, status, 
        ST_Y(location) as lat, ST_X(location) as lng, 
        address, photo_url, citizen_id, COALESCE(upvotes_count, 0) as upvotes_count, created_at, updated_at;
    `;

    const values = [
      report.title,
      report.description,
      report.category,
      report.status,
      report.lng, // ST_MakePoint(X, Y) -> (lng, lat)
      report.lat,
      report.address || null,
      report.photoUrl || null,
      report.citizenId || null,
    ];

    const { rows } = await this.db.query(query, values);
    const r = rows[0];

    return new Report({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as ReportCategory,
      status: r.status as ReportStatus,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      address: r.address,
      photoUrl: r.photo_url,
      citizenId: r.citizen_id,
      upvotesCount: parseInt(r.upvotes_count, 10) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }

  async findAll(filters?: { category?: ReportCategory; status?: string }): Promise<Report[]> {
    let query = `
      SELECT 
        r.id, r.title, r.description, r.category, r.status, 
        ST_Y(r.location) as lat, ST_X(r.location) as lng, 
        r.address, r.photo_url, r.citizen_id, r.assigned_to,
        u.name as assigned_brigade_name,
        COALESCE(r.upvotes_count, 0) as upvotes_count,
        r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN users u ON r.assigned_to = u.id
      WHERE 1=1
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
      title: r.title,
      description: r.description,
      category: r.category as ReportCategory,
      status: r.status as ReportStatus,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      address: r.address,
      photoUrl: r.photo_url,
      citizenId: r.citizen_id,
      assignedTo: r.assigned_to,
      assignedBrigadeName: r.assigned_brigade_name,
      upvotesCount: parseInt(r.upvotes_count, 10) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string): Promise<Report | null> {
    const query = `
      SELECT 
        r.id, r.title, r.description, r.category, r.status, 
        ST_Y(r.location) as lat, ST_X(r.location) as lng, 
        r.address, r.photo_url, r.citizen_id, r.assigned_to,
        u.name as assigned_brigade_name,
        COALESCE(r.upvotes_count, 0) as upvotes_count,
        r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN users u ON r.assigned_to = u.id
      WHERE r.id = $1;
    `;
    const { rows } = await this.db.query(query, [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new Report({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as ReportCategory,
      status: r.status as ReportStatus,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      address: r.address,
      photoUrl: r.photo_url,
      citizenId: r.citizen_id,
      assignedTo: r.assigned_to,
      assignedBrigadeName: r.assigned_brigade_name,
      upvotesCount: parseInt(r.upvotes_count, 10) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }

  async updateStatus(id: string, status: ReportStatus): Promise<Report | null> {
    await this.db.query(
      `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2;`,
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
       WHERE id = $2;`,
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
    const query = `SELECT * FROM check_duplicate_report($1, $2, $3, $4);`;
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
        // Toggle OFF (Quitar voto vecinal)
        await client.query('DELETE FROM report_upvotes WHERE id = $1;', [existing.rows[0].id]);
        await client.query(
          'UPDATE reports SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1) WHERE id = $1;',
          [reportId]
        );
        hasUpvoted = false;
      } else {
        // Toggle ON (Agregar voto vecinal)
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


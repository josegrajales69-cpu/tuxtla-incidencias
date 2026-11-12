import { Pool } from 'pg';
import { User, UserRole } from '../../../domain/entities/User';
import { IUserRepository, CreateUserDTO } from '../../../application/ports/IUserRepository';

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: Pool) {}

  async findByLogin(identifier:string):Promise<User|null>{
   const result=await this.db.query('SELECT * FROM users WHERE lower(username)=lower($1) OR lower(email)=lower($1)',[identifier.trim()]);
   if(!result.rowCount)return null;const row=result.rows[0];return new User({id:row.id,name:row.name,email:row.email,passwordHash:row.password_hash,role:row.role,phone:row.phone,username:row.username,isActive:row.is_active,mustChangePassword:row.must_change_password,sessionVersion:row.session_version});
  }
  async changePassword(id:string,hash:string):Promise<void>{await this.db.query('UPDATE users SET password_hash=$2,must_change_password=false,session_version=session_version+1 WHERE id=$1 AND is_active=true',[id,hash]);}
  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT id, name, email, password_hash, role, phone, created_at, username, is_active, must_change_password, session_version FROM users WHERE LOWER(email) = LOWER($1);`;
    const { rows } = await this.db.query(query, [email.trim()]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User({
      id: r.id,
      name: r.name,
      email: r.email,
      username:r.username,isActive:r.is_active,mustChangePassword:r.must_change_password,sessionVersion:r.session_version,
      passwordHash: r.password_hash,
      role: r.role as UserRole,
      phone: r.phone,
      createdAt: r.created_at,
    });
  }

  async findById(id: string): Promise<User | null> {
    const query = `SELECT id, name, email, password_hash, role, phone, created_at, username, is_active, must_change_password, session_version FROM users WHERE id = $1;`;
    const { rows } = await this.db.query(query, [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User({
      id: r.id,
      name: r.name,
      email: r.email,
      username:r.username,isActive:r.is_active,mustChangePassword:r.must_change_password,sessionVersion:r.session_version,
      passwordHash: r.password_hash,
      role: r.role as UserRole,
      phone: r.phone,
      createdAt: r.created_at,
    });
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const query = `
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, password_hash, role, phone, created_at, username, is_active, must_change_password, session_version;
    `;
    const values = [dto.name, dto.email.toLowerCase().trim(), dto.passwordHash, dto.role || 'CIUDADANO', dto.phone || null];
    const { rows } = await this.db.query(query, values);
    const r = rows[0];
    return new User({
      id: r.id,
      name: r.name,
      email: r.email,
      username:r.username,isActive:r.is_active,mustChangePassword:r.must_change_password,sessionVersion:r.session_version,
      passwordHash: r.password_hash,
      role: r.role as UserRole,
      phone: r.phone,
      createdAt: r.created_at,
    });
  }

  async findAll(): Promise<User[]> {
    const query = `SELECT id, name, email, password_hash, role, phone, created_at, username, is_active, must_change_password, session_version FROM users ORDER BY created_at DESC;`;
    const { rows } = await this.db.query(query);
    return rows.map((r) => new User({
      id: r.id,
      name: r.name,
      email: r.email,
      username:r.username,isActive:r.is_active,mustChangePassword:r.must_change_password,sessionVersion:r.session_version,
      passwordHash: r.password_hash,
      role: r.role as UserRole,
      phone: r.phone,
      createdAt: r.created_at,
    }));
  }

  async updateRole(id: string, role: UserRole): Promise<void> {
    const query = `UPDATE users SET role = $1 WHERE id = $2;`;
    await this.db.query(query, [role, id]);
  }
}

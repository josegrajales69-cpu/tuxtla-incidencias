import bcrypt from 'bcryptjs';
import { pool } from './infrastructure/config/db';

async function seedUsers() {
  const passwordHash = await bcrypt.hash('tuxtla123', 10);

  const users = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Ing. Carlos Mendoza',
      email: 'admin@tuxtla.gob.mx',
      role: 'ADMIN',
      phone: '9611234567',
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      name: 'Brigada Obras Públicas 04',
      email: 'brigada@tuxtla.gob.mx',
      role: 'BRIGADISTA',
      phone: '9617654321',
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      name: 'María Elena Solís',
      email: 'ciudadana@tuxtla.gob.mx',
      role: 'CIUDADANO',
      phone: '9619876543',
    },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET 
         name = EXCLUDED.name, 
         password_hash = EXCLUDED.password_hash, 
         role = EXCLUDED.role;`,
      [u.id, u.name, u.email, passwordHash, u.role, u.phone]
    );
  }

  console.log('[Seed] 3 usuarios creados con éxito: ADMIN, BRIGADISTA y CIUDADANO (password: tuxtla123)');
  await pool.end();
}

seedUsers().catch(console.error);

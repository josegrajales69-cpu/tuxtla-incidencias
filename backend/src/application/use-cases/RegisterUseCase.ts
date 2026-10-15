import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../ports/IUserRepository';
import { UserRole } from '../../domain/entities/User';
import { AuthResponse } from './LoginUseCase';

export interface RegisterDTO {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  phone?: string;
}

export class RegisterUseCase {
  private readonly jwtSecret: string;

  constructor(private readonly userRepo: IUserRepository) {
    this.jwtSecret = process.env.JWT_SECRET || 'tuxtla_secret_key_super_segura';
  }

  async execute(dto: RegisterDTO): Promise<AuthResponse> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error('Ya existe una cuenta con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password || 'tuxtla123', 10);
    const user = await this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role || 'CIUDADANO',
      phone: dto.phone,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id || '',
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };
  }
}

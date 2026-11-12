import {sessionFor} from './LoginUseCase';
import {validatePassword} from './AccountPassword';
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
    if(typeof dto.name!=='string'||dto.name.trim().length<2||dto.name.length>100||typeof dto.email!=='string'||!/^\S+@\S+\.\S+$/.test(dto.email)||dto.email.length>200)throw new Error('Escribe tu nombre y un correo válido.');
    validatePassword(dto.password);
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error('Ya existe una cuenta con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'CIUDADANO',
      phone: dto.phone,
    });

    return sessionFor(user);
  }
}

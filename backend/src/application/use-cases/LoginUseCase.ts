import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../ports/IUserRepository';
import { UserRole } from '../../domain/entities/User';

export interface LoginDTO {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
  };
}

export class LoginUseCase {
  private readonly jwtSecret: string;

  constructor(private readonly userRepo: IUserRepository) {
    this.jwtSecret = process.env.JWT_SECRET || 'tuxtla_secret_key_super_segura';
  }

  async execute(dto: LoginDTO): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new Error('Credenciales inválidas: usuario no encontrado');
    }

    if (dto.password) {
      const match = await bcrypt.compare(dto.password, user.passwordHash);
      if (!match) {
        throw new Error('Credenciales inválidas: contraseña incorrecta');
      }
    }

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

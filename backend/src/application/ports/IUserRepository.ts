import { User, UserRole } from '../../domain/entities/User';

export interface CreateUserDTO {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  phone?: string;
}

export interface IUserRepository {
  findByLogin(identifier:string):Promise<User|null>;
  changePassword(id:string,hash:string):Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(dto: CreateUserDTO): Promise<User>;
  findAll(): Promise<User[]>;
  updateRole(id: string, role: UserRole): Promise<void>;
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {IUserRepository} from '../ports/IUserRepository';
import {User} from '../../domain/entities/User';
import {UserRole} from '../../domain/entities/User';
export interface LoginDTO {email:string;password?:string;}
export interface AuthResponse {token:string;user:{id:string;name:string;email:string;role:UserRole;phone?:string;username?:string;mustChangePassword?:boolean;};}
export function sessionFor(user:User):AuthResponse {
 return {token:jwt.sign({id:user.id,ver:user.sessionVersion},process.env.JWT_SECRET!,{expiresIn:'12h'}),user:{id:user.id||'',name:user.name,email:user.email,username:user.username,role:user.role,phone:user.phone,mustChangePassword:user.mustChangePassword}};
}
export class LoginUseCase {
 constructor(private readonly userRepo:IUserRepository){}
 async execute(dto:LoginDTO):Promise<AuthResponse>{
  const user=await this.userRepo.findByLogin(dto.email);
  if(!user||!user.isActive||!dto.password||!await bcrypt.compare(dto.password,user.passwordHash))throw new Error('Usuario o contraseña incorrectos.');
  return sessionFor(user);
 }
}

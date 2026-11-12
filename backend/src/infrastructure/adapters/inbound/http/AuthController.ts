import bcrypt from 'bcryptjs';
import {sessionFor} from '../../../../application/use-cases/LoginUseCase';
import {validatePassword} from '../../../../application/use-cases/AccountPassword';
import { Request, Response } from 'express';
import { LoginUseCase } from '../../../../application/use-cases/LoginUseCase';
import { RegisterUseCase } from '../../../../application/use-cases/RegisterUseCase';
import { IUserRepository } from '../../../../application/ports/IUserRepository';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly userRepo: IUserRepository
  ) {}

  async me(req:Request,res:Response):Promise<void>{const user=await this.userRepo.findById(req.actor!.id);if(!user){res.status(401).json({error:'Sesión no disponible'});return;}res.setHeader('Cache-Control','no-store');res.json(sessionFor(user).user);}
  async password(req:Request,res:Response):Promise<void>{try{const {currentPassword,newPassword}=req.body;validatePassword(newPassword);const user=await this.userRepo.findById(req.actor!.id);if(!user||typeof currentPassword!=='string'||!await bcrypt.compare(currentPassword,user.passwordHash)){res.status(400).json({error:'La contraseña actual no coincide.'});return;}if(await bcrypt.compare(newPassword,user.passwordHash)){res.status(400).json({error:'Elige una contraseña diferente de la temporal o anterior.'});return;}await this.userRepo.changePassword(user.id!,await bcrypt.hash(newPassword,12));const updated=await this.userRepo.findById(user.id!);res.setHeader('Cache-Control','no-store');res.json(sessionFor(updated!));}catch(error:any){res.status(400).json({error:error.message||'No pudimos cambiar tu contraseña.'});}}
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { password }=req.body;const email=req.body.identifier||req.body.email;
      if (typeof email!=='string'||email.length>200) {
        res.status(400).json({ error: 'Escribe tu usuario o correo electrónico.' });
        return;
      }
      const result = await this.loginUseCase.execute({ email, password });
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Error de autenticación' });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role, phone } = req.body;
      if (!name || !email) {
        res.status(400).json({ error: 'Nombre y email son obligatorios' });
        return;
      }
      const result = await this.registerUseCase.execute({ name, email, password, role: 'CIUDADANO', phone });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error en registro' });
    }
  }

  async getDemoUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userRepo.findAll();
      const sanitized = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
      }));
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al listar usuarios demo' });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) {
        res.status(400).json({ error: 'El rol es obligatorio' });
        return;
      }
      await this.userRepo.updateRole(id, role);
      res.json({ success: true, id, role });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al actualizar rol de usuario' });
    }
  }
}

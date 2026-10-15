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

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email) {
        res.status(400).json({ error: 'El email es obligatorio' });
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
      const result = await this.registerUseCase.execute({ name, email, password, role, phone });
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

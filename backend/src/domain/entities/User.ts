export type UserRole = 'CIUDADANO' | 'BRIGADISTA' | 'ADMIN';

export interface UserProps {
  id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  phone?: string;
  createdAt?: Date;
}

export class User {
  public readonly id?: string;
  public readonly name: string;
  public readonly email: string;
  public readonly passwordHash: string;
  public readonly role: UserRole;
  public readonly phone?: string;
  public readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role || 'CIUDADANO';
    this.phone = props.phone;
    this.createdAt = props.createdAt || new Date();
  }
}

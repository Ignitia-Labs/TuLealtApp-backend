/**
 * DTO de response para registrar un usuario
 */
export class RegisterUserResponse {
  id: number;
  email: string;
  name: string;
  createdAt: Date;

  constructor(id: number, email: string, name: string, createdAt: Date) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
  }
}

/**
 * DTO de response para crear un usuario
 */
export class CreateUserResponse {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    roles: string[],
    isActive: boolean,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.roles = roles;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}

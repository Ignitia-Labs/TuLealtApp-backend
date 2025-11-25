/**
 * DTO de response para obtener el perfil de un usuario
 */
export class GetUserProfileResponse {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    roles: string[],
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.roles = roles;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

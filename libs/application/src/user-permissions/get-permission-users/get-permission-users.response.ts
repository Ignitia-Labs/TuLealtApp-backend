import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un usuario con un permiso específico asignado
 */
export class PermissionUserDto {
  @ApiProperty({
    description: 'ID único de la asignación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario',
    example: 10,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
    type: String,
  })
  userEmail: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
    type: String,
  })
  userName: string;

  @ApiProperty({
    description: 'ID del usuario que asignó el permiso',
    example: 1,
    type: Number,
  })
  assignedBy: number;

  @ApiProperty({
    description: 'Fecha de asignación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  assignedAt: Date;

  @ApiProperty({
    description: 'Indica si la asignación está activa',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  constructor(
    id: number,
    userId: number,
    userEmail: string,
    userName: string,
    assignedBy: number,
    assignedAt: Date,
    isActive: boolean,
  ) {
    this.id = id;
    this.userId = userId;
    this.userEmail = userEmail;
    this.userName = userName;
    this.assignedBy = assignedBy;
    this.assignedAt = assignedAt;
    this.isActive = isActive;
  }
}

/**
 * DTO de response para obtener usuarios con un permiso específico
 */
export class GetPermissionUsersResponse {
  @ApiProperty({
    description: 'Lista de usuarios con el permiso asignado',
    type: PermissionUserDto,
    isArray: true,
  })
  users: PermissionUserDto[];

  @ApiProperty({
    description: 'Total de usuarios con el permiso',
    example: 2,
    type: Number,
  })
  total: number;

  constructor(users: PermissionUserDto[], total: number) {
    this.users = users;
    this.total = total;
  }
}

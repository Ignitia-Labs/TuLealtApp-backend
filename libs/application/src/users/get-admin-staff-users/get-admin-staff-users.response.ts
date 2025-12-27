import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de usuario para respuesta
 */
export class AdminStaffUserDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Primer nombre',
    example: 'John',
    type: String,
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido',
    example: 'Doe',
    type: String,
  })
  lastName: string;

  @ApiProperty({
    description: 'Teléfono',
    example: '+502 1234-5678',
    type: String,
  })
  phone: string;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['ADMIN', 'STAFF'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    phone: string,
    roles: string[],
    isActive: boolean,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.roles = roles;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}

/**
 * Response DTO para obtener usuarios con roles ADMIN o STAFF
 */
export class GetAdminStaffUsersResponse {
  @ApiProperty({
    description: 'Lista de usuarios con roles ADMIN o STAFF',
    type: AdminStaffUserDto,
    isArray: true,
  })
  users: AdminStaffUserDto[];

  @ApiProperty({
    description: 'Total de usuarios encontrados',
    example: 10,
    type: Number,
  })
  total: number;

  constructor(users: AdminStaffUserDto[], total: number) {
    this.users = users;
    this.total = total;
  }
}

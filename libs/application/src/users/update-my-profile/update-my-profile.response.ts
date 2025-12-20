import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar el perfil del usuario autenticado
 */
export class UpdateMyProfileResponse {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'updated@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+9876543210',
  })
  phone: string;

  @ApiProperty({
    description: 'Perfil adicional del usuario',
    example: { preferences: { language: 'en', theme: 'dark' } },
    nullable: true,
  })
  profile: Record<string, any> | null;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['ADMIN'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    phone: string,
    profile: Record<string, any> | null,
    roles: string[],
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.profile = profile;
    this.roles = roles;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}


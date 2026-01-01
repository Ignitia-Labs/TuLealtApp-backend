import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un usuario de partner en la respuesta
 */
export class PartnerUserDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'partner@example.com',
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
    example: ['PARTNER'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'ID del partner al que pertenece',
    example: 1,
    type: Number,
  })
  partnerId: number | null;

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
    partnerId: number | null,
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
    this.partnerId = partnerId;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}

/**
 * DTO de response para obtener usuarios de un partner
 */
export class GetPartnerUsersResponse {
  @ApiProperty({
    description: 'Lista de usuarios del partner',
    type: PartnerUserDto,
    isArray: true,
  })
  users: PartnerUserDto[];

  @ApiProperty({
    description: 'Total de usuarios del partner',
    example: 5,
    type: Number,
  })
  total: number;

  constructor(users: PartnerUserDto[], total: number) {
    this.users = users;
    this.total = total;
  }
}


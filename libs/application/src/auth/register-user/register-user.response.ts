import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para registrar un usuario
 */
export class RegisterUserResponse {
  @ApiProperty({
    description: 'ID del usuario creado',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'customer@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(id: number, email: string, name: string, createdAt: Date) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
  }
}

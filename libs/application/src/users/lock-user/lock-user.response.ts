import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para bloquear un usuario
 */
export class LockUserResponse {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Indica si el usuario está activo (false = bloqueado)',
    example: false,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(id: number, isActive: boolean, updatedAt: Date) {
    this.id = id;
    this.isActive = isActive;
    this.updatedAt = updatedAt;
  }
}

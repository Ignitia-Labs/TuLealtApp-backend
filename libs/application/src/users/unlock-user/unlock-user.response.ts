import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para desbloquear un usuario
 */
export class UnlockUserResponse {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Indica si el usuario está activo (true = desbloqueado)',
    example: true,
    type: Boolean,
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

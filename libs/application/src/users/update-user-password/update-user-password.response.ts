import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar la contraseña de un usuario
 */
export class UpdateUserPasswordResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación de actualización exitosa',
    example: 'Contraseña actualizada exitosamente',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del usuario cuya contraseña fue actualizada',
    example: 1,
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
    description: 'Fecha y hora de la actualización',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(userId: number, userEmail: string, updatedAt: Date) {
    this.message = 'Contraseña actualizada exitosamente';
    this.userId = userId;
    this.userEmail = userEmail;
    this.updatedAt = updatedAt;
  }
}

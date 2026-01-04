import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para remover una asignación de permiso directo a usuario
 */
export class RemovePermissionFromUserResponse {
  @ApiProperty({
    description: 'ID de la asignación removida',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Profile assignment removed successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}


import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un usuario
 */
export class DeleteUserResponse {
  @ApiProperty({
    description: 'ID del usuario eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'User deleted successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string = 'User deleted successfully') {
    this.id = id;
    this.message = message;
  }
}


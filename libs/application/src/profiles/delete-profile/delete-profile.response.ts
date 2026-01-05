import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un perfil
 */
export class DeleteProfileResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Profile deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del perfil eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}

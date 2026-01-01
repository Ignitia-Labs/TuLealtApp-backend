import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para remover una asignación de perfil a usuario
 */
export class RemoveProfileFromUserResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Profile assignment removed successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID de la asignación removida',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}


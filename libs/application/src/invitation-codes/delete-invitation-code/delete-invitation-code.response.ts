import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un código de invitación
 */
export class DeleteInvitationCodeResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Invitation code deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del código eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un código de invitación
 */
export class DeleteInvitationCodeRequest {
  @ApiProperty({
    description: 'ID del código de invitación a eliminar',
    example: 1,
    type: Number,
  })
  id: number;
}

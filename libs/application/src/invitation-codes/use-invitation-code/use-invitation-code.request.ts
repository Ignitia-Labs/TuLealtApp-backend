import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para registrar uso de un código de invitación
 */
export class UseInvitationCodeRequest {
  @ApiProperty({
    description: 'ID del código de invitación',
    example: 1,
    type: Number,
  })
  id: number;
}

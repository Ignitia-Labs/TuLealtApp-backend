import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un código de invitación por ID
 */
export class GetInvitationCodeRequest {
  @ApiProperty({
    description: 'ID del código de invitación',
    example: 1,
    type: Number,
  })
  id: number;
}

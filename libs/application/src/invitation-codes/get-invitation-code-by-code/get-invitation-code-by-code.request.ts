import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un código de invitación por su valor
 */
export class GetInvitationCodeByCodeRequest {
  @ApiProperty({
    description: 'Código de invitación a buscar',
    example: 'INV-ABC23456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

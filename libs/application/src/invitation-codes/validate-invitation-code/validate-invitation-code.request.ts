import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para validar un código de invitación
 */
export class ValidateInvitationCodeRequest {
  @ApiProperty({
    description: 'Código de invitación a validar',
    example: 'INV-ABC23456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

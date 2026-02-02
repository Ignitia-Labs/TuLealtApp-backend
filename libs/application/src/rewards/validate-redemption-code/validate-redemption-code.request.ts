import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de request para validar un código de canje
 */
export class ValidateRedemptionCodeRequest {
  @ApiProperty({
    description: 'Código de canje a validar',
    example: 'REWARD-ABC123-XYZ789',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

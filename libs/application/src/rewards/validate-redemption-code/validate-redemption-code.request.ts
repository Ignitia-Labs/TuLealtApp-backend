import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiProperty({
    description: 'ID del tenant (se obtiene automáticamente de la ruta)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @ApiPropertyOptional({
    description: 'ID de la sucursal donde se valida el código (opcional)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number | null;
}

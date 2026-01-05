import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request DTO para obtener desembolsos pendientes
 */
export class GetPendingDisbursementsRequest {
  @ApiProperty({
    description: 'ID del usuario staff (opcional)',
    example: 5,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  staffUserId?: number;

  @ApiProperty({
    description: 'ID del partner (opcional)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  partnerId?: number;

  @ApiProperty({
    description: 'Monto mínimo de comisiones pendientes',
    example: 100.0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @ApiProperty({
    description: 'Número de página',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Límite de resultados por página',
    example: 50,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

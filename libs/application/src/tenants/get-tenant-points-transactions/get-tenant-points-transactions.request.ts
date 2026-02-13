import { IsInt, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type PointsTransactionTypeFilter =
  | 'EARNING'
  | 'REDEEM'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'EXPIRATION'
  | 'all';

export class GetTenantPointsTransactionsRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    example: 'EARNING',
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'],
    description: 'Tipo de transacción a filtrar',
    required: false,
  })
  @IsOptional()
  @IsEnum(['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'])
  type?: PointsTransactionTypeFilter;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Fecha de inicio (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    example: '2025-01-31T23:59:59Z',
    description: 'Fecha de fin (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ example: 1, description: 'Número de página', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    example: 20,
    description: 'Límite de resultados por página',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

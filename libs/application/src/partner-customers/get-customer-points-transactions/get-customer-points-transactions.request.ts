import { IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PointsTransactionType } from '@libs/domain';

export type PartnerTransactionTypeFilter = PointsTransactionType | 'all';

export class GetCustomerPointsTransactionsRequest {
  @ApiProperty({ example: 100, description: 'ID de la membership' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId: number;

  @ApiProperty({
    example: 'EARNING',
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'],
    required: false,
    description: 'Filtrar por tipo de transacción',
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'])
  type?: PartnerTransactionTypeFilter;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    required: false,
    description: 'Fecha de inicio (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    example: '2025-01-31T23:59:59Z',
    required: false,
    description: 'Fecha de fin (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
